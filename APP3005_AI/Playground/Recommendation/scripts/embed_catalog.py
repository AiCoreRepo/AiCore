from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Tuple

import open_clip  # type: ignore
import torch
from PIL import Image


def load_model(model_name: str, pretrained: str, device: str):
    """Load OpenCLIP model and preprocessing pipeline."""
    model, _, preprocess = open_clip.create_model_and_transforms(model_name, pretrained=pretrained)
    tokenizer = open_clip.get_tokenizer(model_name)
    model.eval().to(device)
    return model, preprocess, tokenizer


def embed_image(path: Path, model, preprocess, device: str) -> List[float]:
    """Encode a single image into a normalized embedding."""
    image = preprocess(Image.open(path).convert("RGB")).unsqueeze(0).to(device)
    with torch.no_grad():
        feat = model.encode_image(image)
    feat = feat / feat.norm(dim=-1, keepdim=True)
    return feat[0].cpu().tolist()


def embed_text(text: str, model, tokenizer, device: str) -> List[float]:
    """Encode a text description as a fallback embedding."""
    tokens = tokenizer([text]).to(device)
    with torch.no_grad():
        feat = model.encode_text(tokens)
    feat = feat / feat.norm(dim=-1, keepdim=True)
    return feat[0].cpu().tolist()


def _text_from_item(item: Dict[str, Any]) -> str:
    fields = ["title", "name", "description", "category", "fit_type", "pattern", "fabric_type"]
    parts: List[str] = []
    for f in fields:
        val = item.get(f)
        if isinstance(val, str):
            parts.append(val)
    return " ".join(parts)


def embed_catalog(
    catalog: List[Dict[str, Any]],
    image_root: Path,
    model,
    preprocess,
    tokenizer,
    device: str,
    use_text_fallback: bool = True,
) -> Tuple[List[Dict[str, Any]], Dict[str, int], List[str]]:
    """Embed each catalog item (image first, optional text fallback)."""
    updated: List[Dict[str, Any]] = []
    stats = {"image_embeddings": 0, "text_fallbacks": 0, "failures": 0}
    errors: List[str] = []

    for item in catalog:
        item_out = dict(item)
        image_path_val = item.get("image_path")
        embedding_added = False

        if image_path_val:
            image_path = image_root / image_path_val
            if image_path.exists():
                try:
                    item_out["vector_embedding"] = embed_image(image_path, model, preprocess, device)
                    embedding_added = True
                    stats["image_embeddings"] += 1
                except Exception as exc:  # pragma: no cover - runtime safety
                    errors.append(f"{item.get('item_id', '<unknown>')}: image embed failed ({exc})")
            else:
                errors.append(f"{item.get('item_id', '<unknown>')}: missing image {image_path}")

        if not embedding_added and use_text_fallback:
            text = _text_from_item(item_out)
            if text.strip():
                try:
                    item_out["vector_embedding"] = embed_text(text, model, tokenizer, device)
                    embedding_added = True
                    stats["text_fallbacks"] += 1
                except Exception as exc:  # pragma: no cover - runtime safety
                    errors.append(f"{item.get('item_id', '<unknown>')}: text embed failed ({exc})")

        if not embedding_added:
            stats["failures"] += 1
        updated.append(item_out)

    return updated, stats, errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Embed catalog items with OpenCLIP.")
    parser.add_argument("--catalog", type=Path, default=Path("data/catalog_sample.json"), help="Input catalog JSON.")
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output JSON. Defaults to overwriting input when not set.",
    )
    parser.add_argument(
        "--image-root",
        type=Path,
        default=Path("data/images"),
        help="Root directory where item image files live.",
    )
    parser.add_argument("--model", default="ViT-H-14", help="OpenCLIP model name.")
    parser.add_argument("--pretrained", default="laion2b_s32b_b79k", help="OpenCLIP checkpoint tag.")
    parser.add_argument(
        "--device",
        default="cuda" if torch.cuda.is_available() else "cpu",
        help="Device to run inference on (cuda/cpu).",
    )
    parser.add_argument(
        "--no-text-fallback",
        action="store_true",
        help="Disable text fallback when images are missing.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_path = args.output or args.catalog

    catalog_data = json.loads(args.catalog.read_text())
    if not isinstance(catalog_data, list):
        raise ValueError("Catalog JSON must be a list of item objects.")

    model, preprocess, tokenizer = load_model(args.model, args.pretrained, args.device)

    updated, stats, errors = embed_catalog(
        catalog=catalog_data,
        image_root=args.image_root,
        model=model,
        preprocess=preprocess,
        tokenizer=tokenizer,
        device=args.device,
        use_text_fallback=not args.no_text_fallback,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(updated, indent=2))

    print(f"Saved embeddings to {output_path}")
    print(f"Image embeddings: {stats['image_embeddings']} | Text fallbacks: {stats['text_fallbacks']} | Failures: {stats['failures']}")
    if errors:
        print("Warnings:")
        for err in errors:
            print(f"- {err}")


if __name__ == "__main__":
    main()

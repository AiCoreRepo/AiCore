import argparse
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import torch
import clip
import cv2
import numpy as np
from PIL import Image
from sklearn.cluster import KMeans

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
SILHOUETTE_SIZE = (64, 128)

_MODEL_CACHE = {}
_TEXT_FEATURE_CACHE: Dict[Tuple[str, Tuple[str, ...]], torch.Tensor] = {}

_ATTRIBUTE_PROMPTS = {
    "length": {
        "maxi": "a photo of a maxi dress",
        "midi": "a photo of a midi dress",
        "knee": "a photo of a knee-length dress",
        "mini": "a photo of a mini dress",
        "short": "a photo of a short dress",
        "long": "a photo of a long dress",
    },
    "neckline": {
        "v_neck": "a photo of a v-neck top",
        "off_shoulder": "a photo of an off-shoulder top",
        "strapless": "a photo of a strapless dress",
        "halter": "a photo of a halter neck top",
    },
    "silhouette": {
        "a_line": "a photo of an a-line dress",
        "mermaid": "a photo of a mermaid dress",
        "bodycon": "a photo of a bodycon dress",
        "wrap": "a photo of a wrap dress",
        "peplum": "a photo of a peplum dress",
        "empire": "a photo of an empire waist dress",
    },
    "tags": {
        "belted": "a photo of a belted dress",
        "high_waist": "a photo of a high-waisted outfit",
        "ruffle": "a photo of a ruffled dress",
        "lace": "a photo of a lace dress",
        "floral": "a photo of a floral dress",
        "slit": "a photo of a dress with a slit",
        "crop": "a photo of a crop top outfit",
        "blazer": "a photo of a blazer",
        "saree": "a photo of a saree",
        "anarkali": "a photo of an anarkali suit",
        "kurta": "a photo of a kurta",
        "gown": "a photo of a gown",
        "jumpsuit": "a photo of a jumpsuit",
        "flowy": "a photo of a flowy dress",
        "classic": "a photo of a classic formal outfit",
        "bold": "a photo of a bold outfit",
        "puff_sleeve": "a photo of a dress with puff sleeves",
        "off_shoulder": "a photo of an off-shoulder top",
        "strapless": "a photo of a strapless dress",
        "halter": "a photo of a halter neck top",
        "v_neck": "a photo of a v-neck top",
        "wrap": "a photo of a wrap dress",
        "a_line": "a photo of an a-line dress",
        "bodycon": "a photo of a bodycon dress",
        "mermaid": "a photo of a mermaid dress",
        "peplum": "a photo of a peplum dress",
        "empire": "a photo of an empire waist dress",
    },
}



def get_model_and_preprocess(model_name):
    cache_key = (model_name, DEVICE)
    cached = _MODEL_CACHE.get(cache_key)
    if cached:
        return cached

    model, preprocess = clip.load(model_name, device=DEVICE)
    model.eval()
    _MODEL_CACHE[cache_key] = (model, preprocess)
    return model, preprocess


def _get_text_features(model, model_name: str, prompt_map: Dict[str, str]) -> Tuple[List[str], torch.Tensor]:
    items = sorted(prompt_map.items())
    labels = [label for label, _ in items]
    prompts = [prompt for _, prompt in items]
    cache_key = (model_name, tuple(prompts))
    cached = _TEXT_FEATURE_CACHE.get(cache_key)
    if cached is None:
        tokens = clip.tokenize(prompts).to(DEVICE)
        with torch.no_grad():
            text_features = model.encode_text(tokens)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        _TEXT_FEATURE_CACHE[cache_key] = text_features
        cached = text_features
    return labels, cached


def _encode_image_features(image_path, model, preprocess) -> torch.Tensor:
    image = preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        image_features = model.encode_image(image)
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
    return image_features


def _select_best_label(
    image_features: torch.Tensor,
    model,
    model_name: str,
    prompt_map: Dict[str, str],
    min_score: float,
) -> Optional[str]:
    labels, text_features = _get_text_features(model, model_name, prompt_map)
    scores = (image_features @ text_features.T).squeeze(0)
    best_idx = int(torch.argmax(scores).item())
    best_score = float(scores[best_idx].item())
    if best_score < min_score:
        return None
    return labels[best_idx]


def _select_multi_labels(
    image_features: torch.Tensor,
    model,
    model_name: str,
    prompt_map: Dict[str, str],
    min_score: float,
    max_labels: int = 6,
) -> List[str]:
    labels, text_features = _get_text_features(model, model_name, prompt_map)
    scores = (image_features @ text_features.T).squeeze(0)
    sorted_idx = torch.argsort(scores, descending=True).tolist()
    selected = []
    for idx in sorted_idx:
        if len(selected) >= max_labels:
            break
        if float(scores[idx].item()) >= min_score:
            selected.append(labels[idx])
    return selected


def infer_attributes(
    image_path,
    *,
    model_name: str = "ViT-B/32",
    min_score: float = 0.24,
    tag_score: float = 0.22,
) -> Dict[str, object]:
    model, preprocess = get_model_and_preprocess(model_name)
    image_features = _encode_image_features(image_path, model, preprocess)

    length = _select_best_label(
        image_features, model, model_name, _ATTRIBUTE_PROMPTS["length"], min_score
    )
    neckline = _select_best_label(
        image_features, model, model_name, _ATTRIBUTE_PROMPTS["neckline"], min_score
    )
    silhouette = _select_best_label(
        image_features, model, model_name, _ATTRIBUTE_PROMPTS["silhouette"], min_score
    )
    tags = _select_multi_labels(
        image_features, model, model_name, _ATTRIBUTE_PROMPTS["tags"], tag_score
    )

    sleeve = "puff" if "puff_sleeve" in tags else None
    waist_focus = any(tag in tags for tag in ("belted", "wrap", "high_waist", "peplum", "empire"))

    attributes: Dict[str, object] = {"tags": sorted(set(tags))}
    if length:
        attributes["length"] = length
    if neckline:
        attributes["neckline"] = neckline
    if silhouette:
        attributes["silhouette"] = silhouette
    if sleeve:
        attributes["sleeve"] = sleeve
    if waist_focus:
        attributes["waist_focus"] = True

    return attributes


# ---------- STYLE EMBEDDING ----------
def get_style_embedding(image_path, model_name="ViT-B/32"):
    model, preprocess = get_model_and_preprocess(model_name)
    image = preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        emb = model.encode_image(image)
        emb = emb / emb.norm(dim=-1, keepdim=True)
    return emb.cpu().numpy()[0].tolist()


def read_image_bgr(image_path):
    img = cv2.imread(str(image_path))
    if img is None:
        pil_img = Image.open(image_path).convert("RGB")
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    return img


def _lab_to_hex(lab_color):
    lab = np.array([[lab_color]], dtype=np.float32)
    lab = np.clip(lab, 0, 255).astype(np.uint8)
    rgb = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)[0, 0]
    return f"#{int(rgb[0]):02x}{int(rgb[1]):02x}{int(rgb[2]):02x}"


# ---------- SILHOUETTE EMBEDDING ----------
def get_silhouette_embedding(image_path):
    img = read_image_bgr(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Edge detection to capture outline
    edges = cv2.Canny(gray, 100, 200)

    # Resize to fixed shape
    edges = cv2.resize(edges, SILHOUETTE_SIZE)

    # Flatten & normalize
    vec = edges.flatten().astype(np.float32)
    vec = vec / (np.linalg.norm(vec) + 1e-8)

    return vec.tolist()


# ---------- COLOR FEATURES ----------
def get_color_features(image_path, k=3):
    img = read_image_bgr(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    pixels = img.reshape(-1, 3)

    kmeans = KMeans(n_clusters=k, n_init=5).fit(pixels)
    centers = kmeans.cluster_centers_
    labels = kmeans.labels_
    counts = np.bincount(labels, minlength=k)
    order = counts.argsort()[::-1]
    centers = centers[order]
    counts = counts[order]
    weights = counts / max(counts.sum(), 1)

    weighted = (centers * weights[:, None]).sum(axis=0)
    L, A, B = weighted

    return {
        "warmth": float(A),        # +A = warm, -A = cool
        "brightness": float(L),    # lightness
        "palette_lab": centers.tolist(),
        "palette_hex": [_lab_to_hex(color) for color in centers],
        "palette_weight": weights.tolist(),
    }


# ---------- MAIN PIPELINE ----------
def resolve_image_path(image_path, catalog_dir, image_root=None):
    path = Path(image_path)
    if path.is_absolute():
        return path
    base_dir = Path(image_root) if image_root else catalog_dir
    candidate = (base_dir / path).resolve()
    if candidate.exists():
        return candidate
    if "women fashion" in path.parts:
        alt_parts = [("val" if part == "women fashion" else part) for part in path.parts]
        alt_candidate = (base_dir / Path(*alt_parts)).resolve()
        if alt_candidate.exists():
            return alt_candidate
    val_fallback = (catalog_dir.parent / "val" / path.name).resolve()
    if val_fallback.exists():
        return val_fallback
    return candidate


def build_embedded_catalog(
    catalog_path="catalog.json",
    output_path="embedded_catalog.json",
    image_root=None,
    model_name="ViT-B/32",
):
    catalog_path = Path(catalog_path)
    with catalog_path.open("r", encoding="utf-8") as f:
        catalog = json.load(f)

    catalog_dir = catalog_path.parent
    embedded_catalog = []

    for item in catalog:
        item_id = item.get("item_id", "UNKNOWN")
        image_path = item.get("image_path")
        if not image_path:
            raise ValueError(f"Missing image_path for item {item_id}")

        resolved_path = resolve_image_path(image_path, catalog_dir, image_root=image_root)
        if not resolved_path.exists():
            raise FileNotFoundError(f"Image not found for item {item_id}: {resolved_path}")

        print(f"Embedding {item_id}")

        style_emb = get_style_embedding(resolved_path, model_name=model_name)
        silhouette_emb = get_silhouette_embedding(resolved_path)
        color_vec = get_color_features(resolved_path)
        attributes = item.get("attributes") or infer_attributes(
            resolved_path,
            model_name=model_name,
        )

        embedded_catalog.append({
            "item_id": item_id,
            "category": item.get("category", ""),
            "gender": item.get("gender", ""),
            "attributes": attributes,

            "style_embedding": style_emb,
            "silhouette_embedding": silhouette_emb,
            "color_vector": color_vec
        })

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(embedded_catalog, f, indent=2)

    print(f"✅ {output_path} written successfully")


def parse_args():
    parser = argparse.ArgumentParser(description="Build embeddings from a catalog JSON file.")
    parser.add_argument("--input-json", default="catalog.json", help="Path to the input catalog JSON.")
    parser.add_argument("--output-json", default="embedded_catalog.json", help="Path to write embedded JSON.")
    parser.add_argument("--model", default="ViT-B/32", help="CLIP model name, e.g. ViT-B/32.")
    parser.add_argument(
        "--image-root",
        default=None,
        help="Optional base directory for relative image paths (defaults to input JSON directory).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    build_embedded_catalog(
        catalog_path=args.input_json,
        output_path=args.output_json,
        image_root=args.image_root,
        model_name=args.model,
    )

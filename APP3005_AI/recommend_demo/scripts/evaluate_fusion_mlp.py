#!/usr/bin/env python3
"""
Evaluate a trained fusion MLP on a labeled CSV or JSON file.

The dataset can be the fusion training format or main_train_data.csv.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from scripts import train_fusion_mlp as fusion_mlp


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate a trained fusion MLP checkpoint.")
    parser.add_argument("--data", type=Path, default=Path("training_main_test.csv"))
    parser.add_argument("--model", type=Path, default=Path("artifacts/fusion_mlp.pt"))
    parser.add_argument(
        "--preprocess",
        type=Path,
        default=None,
        help="Path to fusion_preprocess.json (defaults to model dir).",
    )
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument(
        "--metrics-output",
        type=Path,
        default=None,
        help="Optional path to write metrics JSON.",
    )
    return parser.parse_args()


def _resolve_device() -> str:
    return "cuda" if torch.cuda.is_available() else "cpu"


def _load_checkpoint(path: Path, device: str):
    checkpoint = torch.load(path, map_location=device)
    config = checkpoint.get("config", {})
    hidden = tuple(int(v) for v in config.get("hidden", []) if str(v).strip())
    if not hidden:
        raise ValueError("Checkpoint is missing hidden layer config.")
    input_dim = int(config.get("input_dim", 0))
    if input_dim <= 0:
        raise ValueError("Checkpoint is missing input_dim.")
    dropout = float(config.get("dropout", 0.0))
    model = fusion_mlp.FusionMLP(input_dim=input_dim, hidden=hidden, dropout=dropout)
    model.load_state_dict(checkpoint["state_dict"])
    model.to(device)
    model.eval()
    return model, config


def _build_features(
    df,
    spec,
    config,
    *,
    device: str,
    batch_size: int,
    base_dir: Path,
):
    tabular, unknowns = fusion_mlp.build_tabular_from_spec(df, spec)
    text_model = str(config.get("text_model") or "all-MiniLM-L6-v2")
    text_max_length = int(config.get("text_max_length") or 128)
    clip_model = str(config.get("clip_model") or "ViT-B-32")
    clip_pretrained = str(config.get("clip_pretrained") or "laion2b_s34b_b79k")

    text_values = df[fusion_mlp.TEXT_COL].tolist()
    image_values = df[fusion_mlp.IMAGE_COL].tolist()

    text_embs = fusion_mlp.embed_texts(
        text_values,
        model_name=text_model,
        device=device,
        batch_size=batch_size,
        max_length=text_max_length,
    )
    image_embs, image_dim, missing_images = fusion_mlp.embed_images(
        image_values,
        clip_model_name=clip_model,
        clip_pretrained=clip_pretrained,
        device=device,
        base_dir=base_dir,
    )

    text_feats = np.stack([text_embs[text] for text in text_values]).astype("float32")
    zero_image = np.zeros(image_dim, dtype="float32")
    image_feats = np.stack(
        [image_embs.get(path, zero_image) for path in image_values]
    ).astype("float32")

    features = np.concatenate([image_feats, text_feats, tabular], axis=1).astype("float32")
    labels = df[fusion_mlp.LABEL_COL].astype("float32").to_numpy()
    return features, labels, unknowns, missing_images


def _evaluate(model, features: np.ndarray, labels: np.ndarray, *, device: str, batch_size: int):
    dataset = torch.utils.data.TensorDataset(
        torch.from_numpy(features), torch.from_numpy(labels)
    )
    loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size)
    preds_list = []
    labels_list = []
    with torch.no_grad():
        for feats, batch_labels in loader:
            preds = model(feats.to(device))
            preds_list.append(preds.cpu().numpy())
            labels_list.append(batch_labels.numpy())
    preds = np.concatenate(preds_list)
    labels = np.concatenate(labels_list)
    return {
        "mae": float(mean_absolute_error(labels, preds)),
        "mse": float(mean_squared_error(labels, preds)),
        "r2": float(r2_score(labels, preds)),
        "rows": int(len(labels)),
    }


def main() -> None:
    args = parse_args()
    if args.batch_size <= 0:
        raise ValueError("batch-size must be > 0.")
    device = _resolve_device()

    if not args.model.exists():
        raise FileNotFoundError(f"Model not found: {args.model}")
    preprocess_path = args.preprocess or (args.model.parent / "fusion_preprocess.json")
    if not preprocess_path.exists():
        raise FileNotFoundError(f"Preprocess spec not found: {preprocess_path}")

    df = fusion_mlp.load_data(args.data)
    spec = fusion_mlp.load_preprocess_spec(preprocess_path)
    model, config = _load_checkpoint(args.model, device=device)
    features, labels, unknowns, missing_images = _build_features(
        df,
        spec,
        config,
        device=device,
        batch_size=args.batch_size,
        base_dir=args.data.parent,
    )
    metrics = _evaluate(model, features, labels, device=device, batch_size=args.batch_size)

    if unknowns:
        for key, values in unknowns.items():
            preview = ", ".join(values[:5])
            suffix = "..." if len(values) > 5 else ""
            print(f"Warning: {key} has {len(values)} unknown values: {preview}{suffix}")
    if missing_images:
        preview = ", ".join(missing_images[:5])
        print(
            f"Warning: {len(missing_images)} image paths not found. Examples: {preview}"
        )

    print(f"Metrics: {metrics}")
    if args.metrics_output:
        with args.metrics_output.open("w", encoding="utf-8") as f:
            json.dump(metrics, f, indent=2)
        print(f"Saved metrics to {args.metrics_output}")


if __name__ == "__main__":
    main()

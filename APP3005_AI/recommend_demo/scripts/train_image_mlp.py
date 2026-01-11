"""
Train a single-image MLP regressor on top of frozen CLIP embeddings.

Input can be CSV or JSON.
Required fields:
- image_path: path to image
- label: float in [0, 1] (use --label-max to scale if your labels are 1-5)
Optional fields: id, height_bucket, body_shape, skin_tone, age_bucket, occasion, clothing_description

Outputs (written to artifacts/):
- image_mlp.pt           : trained MLP weights
- image_embs.npy         : image embeddings (aligned with image_ids.npy)
- image_ids.npy          : item ids (string)
- image_meta.json        : metadata dicts per item
- image_mlp_metrics.json : validation metrics
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split


try:
    import clip  # type: ignore
except ImportError as exc:  # pragma: no cover
    raise RuntimeError("Install dependencies first (torch + clip).") from exc


def parse_args():
    parser = argparse.ArgumentParser(description="Train an MLP on single-image embeddings.")
    parser.add_argument("--data", type=Path, default=Path("data/pairs.json"))
    parser.add_argument("--artifacts", type=Path, default=Path("artifacts"))
    parser.add_argument("--clip-model", type=str, default="ViT-B/32")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--val-size", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--hidden", type=int, default=512)
    parser.add_argument("--dropout", type=float, default=0.1)
    parser.add_argument("--label-max", type=float, default=1.0)
    parser.add_argument("--image-key", type=str, default="image_path")
    parser.add_argument("--label-key", type=str, default="label")
    parser.add_argument("--id-key", type=str, default="id")
    return parser.parse_args()


def _progress(iterable, desc: str):
    try:
        import tqdm  # type: ignore

        return tqdm.tqdm(iterable, desc=desc)
    except Exception:
        return iterable


def _load_records(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            if "data" in data and isinstance(data["data"], list):
                data = data["data"]
            elif "records" in data and isinstance(data["records"], list):
                data = data["records"]
        if not isinstance(data, list):
            raise ValueError("JSON data must be a list of objects.")
        return pd.DataFrame(data)
    if suffix in {".jsonl", ".ndjson"}:
        rows = []
        with path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                rows.append(json.loads(line))
        return pd.DataFrame(rows)
    return pd.read_csv(path)


def load_dataset(
    path: Path, image_key: str, label_key: str, id_key: str, label_max: float
) -> pd.DataFrame:
    df = _load_records(path)
    rename = {}
    if image_key in df.columns and "image_path" not in df.columns:
        rename[image_key] = "image_path"
    if label_key in df.columns and "label" not in df.columns:
        rename[label_key] = "label"
    if id_key in df.columns and "id" not in df.columns:
        rename[id_key] = "id"
    if rename:
        df = df.rename(columns=rename)
    required = {"image_path", "label"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    df = df.copy()
    if df["image_path"].isna().any():
        raise ValueError("image_path column contains missing values.")
    df["image_path"] = df["image_path"].astype(str)
    df["label"] = pd.to_numeric(df["label"], errors="coerce")
    if df["label"].isna().any():
        raise ValueError("Label column contains non-numeric values.")
    if label_max <= 0:
        raise ValueError("label-max must be > 0.")
    if label_max != 1.0:
        df["label"] = df["label"] / float(label_max)
    if (df["label"] < 0).any() or (df["label"] > 1).any():
        raise ValueError("Label values must be in [0, 1]. Use --label-max to scale.")
    if len(df) < 2:
        raise ValueError("Need at least 2 rows to train.")
    return df


def preprocess_image(path: str, preprocess):
    from PIL import Image

    img = Image.open(path).convert("RGB")
    return preprocess(img).unsqueeze(0)


def embed_images(
    paths: List[str], model, preprocess, device: str
) -> Dict[str, np.ndarray]:
    out: Dict[str, np.ndarray] = {}
    unique_paths = sorted(set(paths))
    for p in _progress(unique_paths, "Embedding images"):
        tensor = preprocess_image(p, preprocess)
        with torch.no_grad():
            emb = model.encode_image(tensor.to(device))
            emb = emb / emb.norm(dim=-1, keepdim=True)
        out[p] = emb.cpu().numpy().astype("float32")[0]
    return out


def build_metadata(df: pd.DataFrame) -> List[Dict]:
    meta = []
    seen = set()
    meta_cols = [c for c in df.columns if c not in {"label"}]
    for _, row in df.iterrows():
        item_id = str(row.get("id") or row["image_path"])
        if item_id in seen:
            continue
        record = {}
        for col in meta_cols:
            val = row.get(col)
            if pd.isna(val):
                continue
            record[col] = str(val) if col != "image_path" else str(val)
        if "id" not in record:
            record["id"] = item_id
        if "image_path" not in record:
            record["image_path"] = str(row["image_path"])
        meta.append(record)
        seen.add(item_id)
    return meta


def make_dataset(
    df: pd.DataFrame, image_embs: Dict[str, np.ndarray]
) -> Tuple[np.ndarray, np.ndarray]:
    feats = [image_embs[p] for p in df["image_path"].tolist()]
    labels = df["label"].astype(float).to_numpy()
    return np.stack(feats).astype("float32"), labels.astype("float32")


class ImageMLP(torch.nn.Module):
    def __init__(self, in_dim: int, hidden: int = 512, dropout: float = 0.1):
        super().__init__()
        self.net = torch.nn.Sequential(
            torch.nn.Linear(in_dim, hidden),
            torch.nn.ReLU(),
            torch.nn.Dropout(dropout),
            torch.nn.Linear(hidden, hidden // 2),
            torch.nn.ReLU(),
            torch.nn.Dropout(dropout),
            torch.nn.Linear(hidden // 2, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return torch.sigmoid(self.net(x)).squeeze(-1)


def train_loop(
    model: torch.nn.Module,
    train_x: torch.Tensor,
    train_y: torch.Tensor,
    val_x: torch.Tensor,
    val_y: torch.Tensor,
    epochs: int,
    lr: float,
    device: str,
):
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr)
    criterion = torch.nn.BCELoss()
    history = []
    for epoch in range(epochs):
        model.train()
        optimizer.zero_grad()
        logits = model(train_x.to(device))
        loss = criterion(logits, train_y.to(device))
        loss.backward()
        optimizer.step()

        model.eval()
        with torch.no_grad():
            val_logits = model(val_x.to(device))
            val_loss = criterion(val_logits, val_y.to(device)).item()
        history.append({"epoch": epoch + 1, "train_loss": float(loss.item()), "val_loss": val_loss})
        print(f"Epoch {epoch+1}/{epochs} - train_loss: {loss.item():.4f} val_loss: {val_loss:.4f}")
    return history


def run_training(
    data_path: Path,
    artifacts: Path,
    clip_model_name: str,
    epochs: int,
    lr: float,
    val_size: float,
    seed: int,
    hidden: int,
    dropout: float,
    label_max: float,
    image_key: str,
    label_key: str,
    id_key: str,
):
    torch.manual_seed(seed)
    df = load_dataset(
        data_path,
        image_key=image_key,
        label_key=label_key,
        id_key=id_key,
        label_max=label_max,
    )

    device = "cuda" if torch.cuda.is_available() else "cpu"
    clip_model, preprocess = clip.load(clip_model_name, device=device)
    clip_model.eval()

    image_embs = embed_images(df["image_path"].tolist(), clip_model, preprocess, device)
    feats, labels = make_dataset(df, image_embs)

    train_x, val_x, train_y, val_y = train_test_split(
        feats, labels, test_size=val_size, random_state=seed
    )

    mlp = ImageMLP(in_dim=feats.shape[1], hidden=hidden, dropout=dropout).to(device)
    history = train_loop(
        model=mlp,
        train_x=torch.from_numpy(train_x),
        train_y=torch.from_numpy(train_y),
        val_x=torch.from_numpy(val_x),
        val_y=torch.from_numpy(val_y),
        epochs=epochs,
        lr=lr,
        device=device,
    )

    with torch.no_grad():
        val_preds = mlp(torch.from_numpy(val_x).to(device)).cpu().numpy()
    metrics = {
        "mae": float(mean_absolute_error(val_y, val_preds)),
        "mse": float(mean_squared_error(val_y, val_preds)),
        "r2": float(r2_score(val_y, val_preds)),
        "rows": int(len(df)),
    }

    artifacts.mkdir(parents=True, exist_ok=True)
    torch.save(mlp.state_dict(), artifacts / "image_mlp.pt")
    meta = build_metadata(df)
    export_ids = [m["id"] for m in meta]
    export_embs = np.stack([image_embs[m["image_path"]] for m in meta]).astype("float32")
    np.save(artifacts / "image_embs.npy", export_embs)
    np.save(artifacts / "image_ids.npy", np.array(export_ids))
    with (artifacts / "image_meta.json").open("w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    with (artifacts / "image_mlp_metrics.json").open("w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    return {"history": history, "metrics": metrics, "artifacts": str(artifacts / "image_mlp.pt")}


def main():
    args = parse_args()
    result = run_training(
        data_path=args.data,
        artifacts=args.artifacts,
        clip_model_name=args.clip_model,
        epochs=args.epochs,
        lr=args.lr,
        val_size=args.val_size,
        seed=args.seed,
        hidden=args.hidden,
        dropout=args.dropout,
        label_max=args.label_max,
        image_key=args.image_key,
        label_key=args.label_key,
        id_key=args.id_key,
    )
    print(f"Saved model to {result['artifacts']}")
    print(f"Metrics: {result['metrics']}")


if __name__ == "__main__":
    main()
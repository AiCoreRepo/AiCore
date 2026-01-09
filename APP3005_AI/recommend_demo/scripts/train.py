"""
Train a lightweight compatibility MLP on top of frozen CLIP embeddings.

Input can be CSV or JSON.
Required fields:
- person_path: path to person image
- garment_path: path to garment image
- label: 1 for "looks good", 0 for "not good"
Optional fields: garment_id, age_group, gender, height, skin_tone, body_shape

Outputs (written to artifacts/):
- compat_mlp.pt          : trained MLP weights
- garment_embs.npy       : garment embeddings (aligned with garment_ids.npy)
- garment_ids.npy        : garment ids (string)
- garment_meta.json      : metadata dicts per garment
- garment_index.faiss    : FAISS index over garment embeddings
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple

import faiss
import numpy as np
import pandas as pd
import torch
import tqdm
from sklearn.model_selection import train_test_split

from app.recommender import CompatibilityMLP  # reuse the same architecture


try:
    import clip  # type: ignore
except ImportError as exc:  # pragma: no cover
    raise RuntimeError("Install dependencies first (uv sync).") from exc


def parse_args():
    parser = argparse.ArgumentParser(description="Train compatibility MLP on CLIP embeddings.")
    parser.add_argument("--data", type=Path, default=Path("data/pairs.csv"))
    parser.add_argument("--artifacts", type=Path, default=Path("artifacts"))
    parser.add_argument("--clip-model", type=str, default="ViT-B/32")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--val-size", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--person-key", type=str, default="person_path")
    parser.add_argument("--garment-key", type=str, default="garment_path")
    parser.add_argument("--label-key", type=str, default="label")
    return parser.parse_args()


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


def load_pairs(path: Path, person_key: str, garment_key: str, label_key: str) -> pd.DataFrame:
    df = _load_records(path)
    rename = {}
    if person_key in df.columns and "person_path" not in df.columns:
        rename[person_key] = "person_path"
    if garment_key in df.columns and "garment_path" not in df.columns:
        rename[garment_key] = "garment_path"
    if label_key in df.columns and "label" not in df.columns:
        rename[label_key] = "label"
    if rename:
        df = df.rename(columns=rename)
    required = {"person_path", "garment_path", "label"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    df = df.copy()
    df["label"] = pd.to_numeric(df["label"], errors="coerce")
    if df["label"].isna().any():
        raise ValueError("Label column contains non-numeric values.")
    if (df["label"] < 0).any() or (df["label"] > 1).any():
        raise ValueError("Label values must be in [0, 1].")
    return df


def embed_paths(
    paths: List[str], model, preprocess, device: str, desc: str
) -> Dict[str, np.ndarray]:
    out: Dict[str, np.ndarray] = {}
    unique_paths = sorted(set(paths))
    for p in tqdm.tqdm(unique_paths, desc=desc):
        image = preprocess_image(p, preprocess)
        with torch.no_grad():
            emb = model.encode_image(image.to(device))
            emb = emb / emb.norm(dim=-1, keepdim=True)
        out[p] = emb.cpu().numpy().astype("float32")[0]
    return out


def preprocess_image(path: str, preprocess):
    from PIL import Image

    img = Image.open(path).convert("RGB")
    return preprocess(img).unsqueeze(0)


def build_garment_metadata(df: pd.DataFrame) -> Dict[str, Dict]:
    meta: Dict[str, Dict] = {}
    for _, row in df.iterrows():
        g_id = str(row.get("garment_id") or row.garment_path)
        if g_id in meta:
            continue
        meta[g_id] = {
            "id": g_id,
            "image_path": row.garment_path,
        }
        for key in ["age_group", "gender", "height", "skin_tone", "body_shape"]:
            if key in row and not pd.isna(row[key]):
                meta[g_id][key] = str(row[key])
    return meta


def export_garment_index(
    garment_embs: Dict[str, np.ndarray], garment_meta: Dict[str, Dict], artifacts: Path
):
    artifacts.mkdir(parents=True, exist_ok=True)
    ids = sorted(garment_embs.keys())
    emb_array = np.stack([garment_embs[i] for i in ids]).astype("float32")

    index = faiss.IndexFlatIP(emb_array.shape[1])
    index.add(emb_array)

    np.save(artifacts / "garment_ids.npy", np.array(ids))
    np.save(artifacts / "garment_embs.npy", emb_array)
    with (artifacts / "garment_meta.json").open("w", encoding="utf-8") as f:
        json.dump([garment_meta[i] for i in ids], f, indent=2)
    faiss.write_index(index, str(artifacts / "garment_index.faiss"))


def make_dataset(
    df: pd.DataFrame, person_embs: Dict[str, np.ndarray], garment_embs: Dict[str, np.ndarray]
) -> Tuple[np.ndarray, np.ndarray]:
    feats = []
    labels = []
    for _, row in df.iterrows():
        person_vec = person_embs[row.person_path]
        garment_vec = garment_embs[row.garment_path]
        feats.append(np.concatenate([person_vec, garment_vec], axis=-1))
        labels.append(float(row.label))
    return np.stack(feats).astype("float32"), np.array(labels).astype("float32")


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
    clip_model_name: str = "ViT-B/32",
    epochs: int = 5,
    lr: float = 1e-3,
    val_size: float = 0.2,
    seed: int = 42,
    person_key: str = "person_path",
    garment_key: str = "garment_path",
    label_key: str = "label",
):
    torch.manual_seed(seed)

    df = load_pairs(data_path, person_key=person_key, garment_key=garment_key, label_key=label_key)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    clip_model, preprocess = clip.load(clip_model_name, device=device)
    clip_model.eval()

    person_embs = embed_paths(df.person_path.tolist(), clip_model, preprocess, device, "Person")
    garment_embs = embed_paths(df.garment_path.tolist(), clip_model, preprocess, device, "Garment")

    garment_meta = build_garment_metadata(df)
    export_garment_index(garment_embs, garment_meta, artifacts)

    feats, labels = make_dataset(df, person_embs, garment_embs)
    train_x, val_x, train_y, val_y = train_test_split(
        feats, labels, test_size=val_size, random_state=seed, stratify=labels
    )

    in_dim = feats.shape[1]
    mlp = CompatibilityMLP(in_dim=in_dim)
    mlp.to(device)

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

    artifacts.mkdir(parents=True, exist_ok=True)
    torch.save(mlp.state_dict(), artifacts / "compat_mlp.pt")
    return {"history": history, "artifacts": str(artifacts / 'compat_mlp.pt')}


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
        person_key=args.person_key,
        garment_key=args.garment_key,
        label_key=args.label_key,
    )
    print(f"Saved model to {result['artifacts']}")


if __name__ == "__main__":
    main()

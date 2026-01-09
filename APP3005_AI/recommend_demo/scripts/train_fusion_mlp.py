"""
Train a fusion MLP regressor on tabular + text + image features.

Expected CSV columns:
- age
- size
- body_shape
- skin_tone
- cloth_description
- image_path
- score (float in [0, 1])
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

try:
    import torch
    from torch.utils.data import DataLoader, TensorDataset
except ImportError as exc:  # pragma: no cover
    raise RuntimeError("Install torch to run fusion training.") from exc

try:
    import clip  # type: ignore
except ImportError as exc:  # pragma: no cover
    raise RuntimeError("Install openai-clip to run fusion training.") from exc

try:
    from transformers import AutoModel, AutoTokenizer
except ImportError as exc:  # pragma: no cover
    raise RuntimeError("Install transformers to run fusion training.") from exc

CAT_COLS = ["size", "body_shape", "skin_tone"]
NUM_COL = "age"
TEXT_COL = "cloth_description"
IMAGE_COL = "image_path"
LABEL_COL = "score"


def parse_args():
    parser = argparse.ArgumentParser(description="Train a fusion MLP on attributes + text + image.")
    parser.add_argument("--data", type=Path, default=Path("data/fusion_train.csv"))
    parser.add_argument("--artifacts", type=Path, default=Path("artifacts"))
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--val-size", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--embed-dim", type=int, default=128)
    parser.add_argument("--hidden", type=int, default=256)
    parser.add_argument("--dropout", type=float, default=0.1)
    parser.add_argument("--text-model", type=str, default="distilbert-base-uncased")
    parser.add_argument("--text-max-length", type=int, default=96)
    parser.add_argument("--clip-model", type=str, default="RN50")
    return parser.parse_args()


def load_data(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    required = set(CAT_COLS + [NUM_COL, TEXT_COL, IMAGE_COL, LABEL_COL])
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    df = df.copy()
    df[NUM_COL] = pd.to_numeric(df[NUM_COL], errors="coerce")
    if df[NUM_COL].isna().any():
        raise ValueError("Age column contains non-numeric values.")
    df[LABEL_COL] = pd.to_numeric(df[LABEL_COL], errors="coerce")
    if df[LABEL_COL].isna().any():
        raise ValueError("Score column contains non-numeric values.")
    if (df[LABEL_COL] < 0).any() or (df[LABEL_COL] > 1).any():
        raise ValueError("Score values must be in [0, 1].")
    for col in CAT_COLS:
        df[col] = df[col].fillna("unknown").astype(str)
    df[TEXT_COL] = df[TEXT_COL].fillna("").astype(str)
    df[IMAGE_COL] = df[IMAGE_COL].fillna("").astype(str)
    if (df[IMAGE_COL] == "").any():
        raise ValueError("image_path column contains missing values.")
    if len(df) < 2:
        raise ValueError("Need at least 2 rows to train.")
    return df


def build_tabular_features(df: pd.DataFrame) -> Tuple[np.ndarray, Dict[str, object]]:
    categories: Dict[str, List[str]] = {}
    for col in CAT_COLS:
        categories[col] = sorted(df[col].unique().tolist())
    age = df[NUM_COL].astype(float).to_numpy()
    age_min = float(age.min())
    age_max = float(age.max())
    denom = age_max - age_min
    if denom <= 0:
        age_norm = np.zeros_like(age, dtype="float32")
    else:
        age_norm = ((age - age_min) / denom).astype("float32")

    one_hot_parts = []
    for col in CAT_COLS:
        values = df[col].astype(str).to_numpy()
        mapping = {val: idx for idx, val in enumerate(categories[col])}
        indices = np.array([mapping[v] for v in values], dtype="int64")
        one_hot = np.zeros((len(df), len(categories[col])), dtype="float32")
        one_hot[np.arange(len(df)), indices] = 1.0
        one_hot_parts.append(one_hot)

    tabular = np.concatenate([age_norm[:, None]] + one_hot_parts, axis=1).astype("float32")
    spec = {"age_min": age_min, "age_max": age_max, "categories": categories}
    return tabular, spec


def load_preprocess_spec(path: Path) -> Dict[str, object]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def build_tabular_from_spec(
    df: pd.DataFrame, spec: Dict[str, object]
) -> Tuple[np.ndarray, Dict[str, List[str]]]:
    categories = spec.get("categories", {})
    age_min = float(spec.get("age_min", df[NUM_COL].min()))
    age_max = float(spec.get("age_max", df[NUM_COL].max()))
    age = df[NUM_COL].astype(float).to_numpy()
    denom = age_max - age_min
    if denom <= 0:
        age_norm = np.zeros_like(age, dtype="float32")
    else:
        age_norm = ((age - age_min) / denom).astype("float32")

    unknowns: Dict[str, List[str]] = {}
    one_hot_parts = []
    for col in CAT_COLS:
        values = df[col].astype(str).to_numpy()
        cat_list = [str(v) for v in categories.get(col, [])]
        mapping = {val: idx for idx, val in enumerate(cat_list)}
        one_hot = np.zeros((len(df), len(cat_list)), dtype="float32")
        for i, value in enumerate(values):
            idx = mapping.get(value)
            if idx is None:
                unknowns.setdefault(col, []).append(value)
            else:
                one_hot[i, idx] = 1.0
        one_hot_parts.append(one_hot)

    tabular = np.concatenate([age_norm[:, None]] + one_hot_parts, axis=1).astype("float32")
    return tabular, unknowns


def embed_texts(
    texts: List[str], model_name: str, device: str, batch_size: int, max_length: int
) -> Dict[str, np.ndarray]:
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name).to(device)
    model.eval()

    embeddings: Dict[str, np.ndarray] = {}
    unique_texts = sorted(set(texts))
    for start in range(0, len(unique_texts), batch_size):
        batch = unique_texts[start : start + batch_size]
        encoded = tokenizer(
            batch,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="pt",
        )
        encoded = {k: v.to(device) for k, v in encoded.items()}
        with torch.no_grad():
            output = model(**encoded)
        cls_vecs = output.last_hidden_state[:, 0, :].cpu().numpy().astype("float32")
        for text, vec in zip(batch, cls_vecs):
            embeddings[text] = vec
    return embeddings


def embed_images(paths: List[str], clip_model_name: str, device: str) -> Dict[str, np.ndarray]:
    model, preprocess = clip.load(clip_model_name, device=device)
    model.eval()

    from PIL import Image

    embeddings: Dict[str, np.ndarray] = {}
    unique_paths = sorted(set(paths))
    for path in unique_paths:
        image = Image.open(path).convert("RGB")
        tensor = preprocess(image).unsqueeze(0).to(device)
        with torch.no_grad():
            emb = model.encode_image(tensor)
            emb = emb / emb.norm(dim=-1, keepdim=True)
        embeddings[path] = emb.cpu().numpy().astype("float32")[0]
    return embeddings


class MLPBlock(torch.nn.Module):
    def __init__(self, in_dim: int, out_dim: int, hidden: int, dropout: float):
        super().__init__()
        self.net = torch.nn.Sequential(
            torch.nn.Linear(in_dim, hidden),
            torch.nn.ReLU(),
            torch.nn.Dropout(dropout),
            torch.nn.Linear(hidden, out_dim),
            torch.nn.ReLU(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class FusionMLP(torch.nn.Module):
    def __init__(
        self,
        tab_dim: int,
        text_dim: int,
        image_dim: int,
        embed_dim: int,
        hidden: int,
        dropout: float,
    ):
        super().__init__()
        self.tab_mlp = MLPBlock(tab_dim, embed_dim, hidden, dropout)
        self.text_mlp = MLPBlock(text_dim, embed_dim, hidden, dropout)
        self.image_mlp = MLPBlock(image_dim, embed_dim, hidden, dropout)
        self.fusion = torch.nn.Sequential(
            torch.nn.Linear(embed_dim * 3, hidden),
            torch.nn.ReLU(),
            torch.nn.Dropout(dropout),
            torch.nn.Linear(hidden, hidden // 2),
            torch.nn.ReLU(),
            torch.nn.Dropout(dropout),
            torch.nn.Linear(hidden // 2, 1),
        )

    def forward(
        self, tabular: torch.Tensor, text: torch.Tensor, image: torch.Tensor
    ) -> torch.Tensor:
        tab_vec = self.tab_mlp(tabular)
        text_vec = self.text_mlp(text)
        image_vec = self.image_mlp(image)
        fused = torch.cat([tab_vec, text_vec, image_vec], dim=1)
        return torch.sigmoid(self.fusion(fused)).squeeze(-1)


def train_loop(
    model: torch.nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    epochs: int,
    lr: float,
    device: str,
) -> Tuple[List[Dict[str, float]], Dict[str, float]]:
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr)
    criterion = torch.nn.MSELoss()
    history: List[Dict[str, float]] = []

    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        for tab, text, image, labels in train_loader:
            tab = tab.to(device)
            text = text.to(device)
            image = image.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            preds = model(tab, text, image)
            loss = criterion(preds, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(labels)
        train_loss /= len(train_loader.dataset)

        model.eval()
        val_loss = 0.0
        preds_list = []
        labels_list = []
        with torch.no_grad():
            for tab, text, image, labels in val_loader:
                tab = tab.to(device)
                text = text.to(device)
                image = image.to(device)
                labels = labels.to(device)
                preds = model(tab, text, image)
                loss = criterion(preds, labels)
                val_loss += loss.item() * len(labels)
                preds_list.append(preds.cpu().numpy())
                labels_list.append(labels.cpu().numpy())
        val_loss /= len(val_loader.dataset)
        history.append({"epoch": epoch + 1, "train_loss": train_loss, "val_loss": val_loss})
        print(f"Epoch {epoch+1}/{epochs} - train_loss: {train_loss:.4f} val_loss: {val_loss:.4f}")

    preds = np.concatenate(preds_list)
    labels = np.concatenate(labels_list)
    metrics = {
        "mae": float(mean_absolute_error(labels, preds)),
        "mse": float(mean_squared_error(labels, preds)),
        "r2": float(r2_score(labels, preds)),
        "rows": int(len(train_loader.dataset) + len(val_loader.dataset)),
    }
    return history, metrics


def run_training(
    data_path: Path,
    artifacts: Path,
    text_model: str,
    clip_model: str,
    epochs: int,
    lr: float,
    val_size: float,
    seed: int,
    batch_size: int,
    embed_dim: int,
    hidden: int,
    dropout: float,
    text_max_length: int,
):
    torch.manual_seed(seed)
    np.random.seed(seed)

    df = load_data(data_path)
    tabular, spec = build_tabular_features(df)
    device = "cuda" if torch.cuda.is_available() else "cpu"

    text_embs = embed_texts(
        df[TEXT_COL].tolist(),
        model_name=text_model,
        device=device,
        batch_size=batch_size,
        max_length=text_max_length,
    )
    image_embs = embed_images(df[IMAGE_COL].tolist(), clip_model, device)

    text_feats = np.stack([text_embs[text] for text in df[TEXT_COL].tolist()]).astype("float32")
    image_feats = np.stack([image_embs[path] for path in df[IMAGE_COL].tolist()]).astype(
        "float32"
    )
    labels = df[LABEL_COL].astype("float32").to_numpy()

    train_idx, val_idx = train_test_split(
        np.arange(len(df)), test_size=val_size, random_state=seed
    )

    train_set = TensorDataset(
        torch.from_numpy(tabular[train_idx]),
        torch.from_numpy(text_feats[train_idx]),
        torch.from_numpy(image_feats[train_idx]),
        torch.from_numpy(labels[train_idx]),
    )
    val_set = TensorDataset(
        torch.from_numpy(tabular[val_idx]),
        torch.from_numpy(text_feats[val_idx]),
        torch.from_numpy(image_feats[val_idx]),
        torch.from_numpy(labels[val_idx]),
    )
    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_set, batch_size=batch_size)

    model = FusionMLP(
        tab_dim=tabular.shape[1],
        text_dim=text_feats.shape[1],
        image_dim=image_feats.shape[1],
        embed_dim=embed_dim,
        hidden=hidden,
        dropout=dropout,
    ).to(device)

    history, metrics = train_loop(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        epochs=epochs,
        lr=lr,
        device=device,
    )

    artifacts.mkdir(parents=True, exist_ok=True)
    model_path = artifacts / "fusion_mlp.pt"
    torch.save(
        {
            "state_dict": model.state_dict(),
            "config": {
                "tab_dim": tabular.shape[1],
                "text_dim": text_feats.shape[1],
                "image_dim": image_feats.shape[1],
                "embed_dim": embed_dim,
                "hidden": hidden,
                "dropout": dropout,
                "text_model": text_model,
                "text_max_length": text_max_length,
                "clip_model": clip_model,
            },
        },
        model_path,
    )
    with (artifacts / "fusion_preprocess.json").open("w", encoding="utf-8") as f:
        json.dump(spec, f, indent=2)
    with (artifacts / "fusion_mlp_metrics.json").open("w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    return {"history": history, "metrics": metrics, "artifacts": str(model_path)}


def main():
    args = parse_args()
    result = run_training(
        data_path=args.data,
        artifacts=args.artifacts,
        text_model=args.text_model,
        clip_model=args.clip_model,
        epochs=args.epochs,
        lr=args.lr,
        val_size=args.val_size,
        seed=args.seed,
        batch_size=args.batch_size,
        embed_dim=args.embed_dim,
        hidden=args.hidden,
        dropout=args.dropout,
        text_max_length=args.text_max_length,
    )
    print(f"Saved model to {result['artifacts']}")
    print(f"Metrics: {result['metrics']}")


if __name__ == "__main__":
    main()

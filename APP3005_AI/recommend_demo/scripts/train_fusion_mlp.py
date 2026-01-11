"""
Train a fusion MLP regressor on attributes + Sentence-BERT text + OpenCLIP image embeddings.

Expected CSV columns:
- age
- size
- body_shape
- skin_tone
- occasion
- cloth_description (or clothing_description)
- image_path
- score (float in [0, 1])
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

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
    import open_clip  # type: ignore
except ImportError as exc:  # pragma: no cover
    raise RuntimeError("Install open_clip_torch to run fusion training.") from exc

try:
    from sentence_transformers import SentenceTransformer
except ImportError as exc:  # pragma: no cover
    raise RuntimeError("Install sentence-transformers to run fusion training.") from exc

AGE_COL = "age"
TEXT_COL = "cloth_description"
TEXT_COL_FALLBACK = "clothing_description"
IMAGE_COL = "image_path"
LABEL_COL = "score"

SIZE_ORDER = ["small", "medium", "large"]
BODY_SHAPE_ORDER = ["rectangle", "pear", "apple", "hourglass"]
SKIN_TONE_ORDER = ["light", "medium", "dusky", "deep"]
OCCASION_ORDER = ["party", "formal", "casual_luxury"]

CAT_COLS = ["size", "body_shape", "skin_tone", "occasion"]
AGE_DIVISOR_DEFAULT = 60.0

SIZE_ALIASES = {
    "xs": "small",
    "s": "small",
    "sm": "small",
    "m": "medium",
    "md": "medium",
    "l": "large",
    "lg": "large",
    "xl": "large",
}

ProgressCallback = Callable[[str], None]


def parse_args():
    parser = argparse.ArgumentParser(
        description="Train a fusion MLP on attributes + Sentence-BERT text + OpenCLIP images."
    )
    parser.add_argument("--data", type=Path, default=Path("training.csv"))
    parser.add_argument("--artifacts", type=Path, default=Path("artifacts"))
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--val-size", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--hidden", type=str, default="512,128")
    parser.add_argument("--dropout", type=float, default=0.1)
    parser.add_argument("--age-divisor", type=float, default=AGE_DIVISOR_DEFAULT)
    parser.add_argument("--text-model", type=str, default="all-MiniLM-L6-v2")
    parser.add_argument("--text-max-length", type=int, default=128)
    parser.add_argument("--clip-model", type=str, default="ViT-B-32")
    parser.add_argument("--clip-pretrained", type=str, default="laion2b_s34b_b79k")
    return parser.parse_args()


def parse_hidden(hidden: str) -> Tuple[int, ...]:
    parts = [p.strip() for p in hidden.split(",") if p.strip()]
    if not parts:
        raise ValueError("Hidden layer sizes must be a comma-separated list of ints.")
    return tuple(int(p) for p in parts)


def normalize_size(value: str) -> str:
    cleaned = value.strip().lower()
    return SIZE_ALIASES.get(cleaned, cleaned)


def normalize_category(value: str) -> str:
    return value.strip().lower()


def load_data(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    if TEXT_COL not in df.columns and TEXT_COL_FALLBACK in df.columns:
        df = df.rename(columns={TEXT_COL_FALLBACK: TEXT_COL})
    required = set(CAT_COLS + [AGE_COL, TEXT_COL, IMAGE_COL, LABEL_COL])
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    df = df.copy()
    df[AGE_COL] = pd.to_numeric(df[AGE_COL], errors="coerce")
    if df[AGE_COL].isna().any():
        raise ValueError("Age column contains non-numeric values.")
    df[LABEL_COL] = pd.to_numeric(df[LABEL_COL], errors="coerce")
    if df[LABEL_COL].isna().any():
        raise ValueError("Score column contains non-numeric values.")
    if (df[LABEL_COL] < 0).any() or (df[LABEL_COL] > 1).any():
        raise ValueError("Score values must be in [0, 1].")
    for col in CAT_COLS:
        df[col] = df[col].fillna("").astype(str)
    df["size"] = df["size"].map(normalize_size)
    for col in ["body_shape", "skin_tone", "occasion"]:
        df[col] = df[col].map(normalize_category)
    df[TEXT_COL] = df[TEXT_COL].fillna("").astype(str)
    df[IMAGE_COL] = df[IMAGE_COL].fillna("").astype(str)
    if (df[IMAGE_COL] == "").any():
        raise ValueError("image_path column contains missing values.")
    if len(df) < 2:
        raise ValueError("Need at least 2 rows to train.")
    return df


def _encode_one_hot(
    values: np.ndarray, categories: List[str], col_name: str, allow_unknown: bool
) -> Tuple[np.ndarray, List[str]]:
    mapping = {val: idx for idx, val in enumerate(categories)}
    one_hot = np.zeros((len(values), len(categories)), dtype="float32")
    unknowns = []
    for i, value in enumerate(values):
        key = normalize_category(str(value))
        idx = mapping.get(key)
        if idx is None:
            if not allow_unknown:
                unknowns.append(key)
        else:
            one_hot[i, idx] = 1.0
    if unknowns and not allow_unknown:
        unique = sorted(set(unknowns))
        raise ValueError(f"Unknown values for {col_name}: {unique}")
    return one_hot, sorted(set(unknowns))


def build_tabular_features(df: pd.DataFrame, age_divisor: float) -> Tuple[np.ndarray, Dict[str, object]]:
    if age_divisor <= 0:
        raise ValueError("age_divisor must be > 0.")
    age = df[AGE_COL].astype(float).to_numpy()
    age_norm = np.clip(age / age_divisor, 0.0, 1.0).astype("float32")
    categories = {
        "size": SIZE_ORDER,
        "body_shape": BODY_SHAPE_ORDER,
        "skin_tone": SKIN_TONE_ORDER,
        "occasion": OCCASION_ORDER,
    }

    one_hot_parts = []
    for col in CAT_COLS:
        values = df[col].astype(str).to_numpy()
        one_hot, _unknowns = _encode_one_hot(values, categories[col], col, allow_unknown=False)
        one_hot_parts.append(one_hot)

    tabular = np.concatenate([age_norm[:, None]] + one_hot_parts, axis=1).astype("float32")
    spec = {"age_divisor": age_divisor, "categories": categories}
    return tabular, spec


def load_preprocess_spec(path: Path) -> Dict[str, object]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def build_tabular_from_spec(
    df: pd.DataFrame, spec: Dict[str, object]
) -> Tuple[np.ndarray, Dict[str, List[str]]]:
    categories = spec.get("categories", {})
    age_divisor = float(spec.get("age_divisor", AGE_DIVISOR_DEFAULT))
    df = df.copy()
    df[AGE_COL] = pd.to_numeric(df[AGE_COL], errors="coerce")
    if df[AGE_COL].isna().any():
        raise ValueError("Age column contains non-numeric values.")
    df["size"] = df["size"].map(normalize_size)
    for col in ["body_shape", "skin_tone", "occasion"]:
        df[col] = df[col].map(normalize_category)

    age = df[AGE_COL].astype(float).to_numpy()
    age_norm = np.clip(age / age_divisor, 0.0, 1.0).astype("float32")

    unknowns: Dict[str, List[str]] = {}
    one_hot_parts = []
    for col in CAT_COLS:
        values = df[col].astype(str).to_numpy()
        cat_list = [str(v) for v in categories.get(col, [])]
        one_hot, unknown = _encode_one_hot(values, cat_list, col, allow_unknown=True)
        if unknown:
            unknowns[col] = unknown
        one_hot_parts.append(one_hot)

    tabular = np.concatenate([age_norm[:, None]] + one_hot_parts, axis=1).astype("float32")
    return tabular, unknowns


def embed_texts(
    texts: List[str], model_name: str, device: str, batch_size: int, max_length: int
) -> Dict[str, np.ndarray]:
    model = SentenceTransformer(model_name, device=device)
    if max_length:
        model.max_seq_length = max_length
    unique_texts = sorted(set(texts))
    vecs = model.encode(
        unique_texts,
        batch_size=batch_size,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    embeddings = {text: vec.astype("float32") for text, vec in zip(unique_texts, vecs)}
    return embeddings


def embed_images(
    paths: List[str], clip_model_name: str, clip_pretrained: str, device: str
) -> Dict[str, np.ndarray]:
    model, _, preprocess = open_clip.create_model_and_transforms(
        clip_model_name, pretrained=clip_pretrained
    )
    model = model.to(device)
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


class FusionMLP(torch.nn.Module):
    def __init__(self, input_dim: int, hidden: Tuple[int, ...], dropout: float):
        super().__init__()
        layers: List[torch.nn.Module] = []
        prev_dim = input_dim
        for idx, hidden_dim in enumerate(hidden):
            layers.append(torch.nn.Linear(prev_dim, hidden_dim))
            layers.append(torch.nn.ReLU())
            if dropout > 0:
                layers.append(torch.nn.Dropout(dropout))
            prev_dim = hidden_dim
        layers.append(torch.nn.Linear(prev_dim, 1))
        self.net = torch.nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return torch.sigmoid(self.net(x)).squeeze(-1)


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
        for feats, labels in train_loader:
            feats = feats.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            preds = model(feats)
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
            for feats, labels in val_loader:
                feats = feats.to(device)
                labels = labels.to(device)
                preds = model(feats)
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
    clip_pretrained: str,
    epochs: int,
    lr: float,
    val_size: float,
    seed: int,
    batch_size: int,
    hidden: Tuple[int, ...],
    dropout: float,
    text_max_length: int,
    age_divisor: float,
    progress_callback: Optional[ProgressCallback] = None,
):
    torch.manual_seed(seed)
    np.random.seed(seed)

    if progress_callback:
        progress_callback("loading_data")
    df = load_data(data_path)
    if progress_callback:
        progress_callback("building_attributes")
    tabular, spec = build_tabular_features(df, age_divisor=age_divisor)
    device = "cuda" if torch.cuda.is_available() else "cpu"

    if progress_callback:
        progress_callback("embedding_text")
    text_embs = embed_texts(
        df[TEXT_COL].tolist(),
        model_name=text_model,
        device=device,
        batch_size=batch_size,
        max_length=text_max_length,
    )
    if progress_callback:
        progress_callback("embedding_images")
    image_embs = embed_images(
        df[IMAGE_COL].tolist(), clip_model_name=clip_model, clip_pretrained=clip_pretrained, device=device
    )

    text_feats = np.stack([text_embs[text] for text in df[TEXT_COL].tolist()]).astype("float32")
    image_feats = np.stack([image_embs[path] for path in df[IMAGE_COL].tolist()]).astype(
        "float32"
    )
    labels = df[LABEL_COL].astype("float32").to_numpy()

    features = np.concatenate([image_feats, text_feats, tabular], axis=1).astype("float32")

    train_idx, val_idx = train_test_split(
        np.arange(len(df)), test_size=val_size, random_state=seed
    )

    train_set = TensorDataset(
        torch.from_numpy(features[train_idx]),
        torch.from_numpy(labels[train_idx]),
    )
    val_set = TensorDataset(
        torch.from_numpy(features[val_idx]),
        torch.from_numpy(labels[val_idx]),
    )
    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_set, batch_size=batch_size)

    model = FusionMLP(
        input_dim=features.shape[1],
        hidden=hidden,
        dropout=dropout,
    ).to(device)

    if progress_callback:
        progress_callback("training_mlp")
    history, metrics = train_loop(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        epochs=epochs,
        lr=lr,
        device=device,
    )

    if progress_callback:
        progress_callback("saving_artifacts")
    artifacts.mkdir(parents=True, exist_ok=True)
    model_path = artifacts / "fusion_mlp.pt"
    torch.save(
        {
            "state_dict": model.state_dict(),
            "config": {
                "input_dim": int(features.shape[1]),
                "image_dim": int(image_feats.shape[1]),
                "text_dim": int(text_feats.shape[1]),
                "attr_dim": int(tabular.shape[1]),
                "hidden": list(hidden),
                "dropout": dropout,
                "text_model": text_model,
                "text_max_length": text_max_length,
                "clip_model": clip_model,
                "clip_pretrained": clip_pretrained,
                "age_divisor": age_divisor,
                "feature_order": ["image", "text", "attributes"],
                "text_normalize": True,
                "image_normalize": True,
            },
        },
        model_path,
    )
    with (artifacts / "fusion_preprocess.json").open("w", encoding="utf-8") as f:
        json.dump(spec, f, indent=2)
    with (artifacts / "fusion_mlp_metrics.json").open("w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    if progress_callback:
        progress_callback("done")
    return {"history": history, "metrics": metrics, "artifacts": str(model_path)}


def main():
    args = parse_args()
    hidden = parse_hidden(args.hidden)
    result = run_training(
        data_path=args.data,
        artifacts=args.artifacts,
        text_model=args.text_model,
        clip_model=args.clip_model,
        clip_pretrained=args.clip_pretrained,
        epochs=args.epochs,
        lr=args.lr,
        val_size=args.val_size,
        seed=args.seed,
        batch_size=args.batch_size,
        hidden=hidden,
        dropout=args.dropout,
        text_max_length=args.text_max_length,
        age_divisor=args.age_divisor,
    )
    print(f"Saved model to {result['artifacts']}")
    print(f"Metrics: {result['metrics']}")


if __name__ == "__main__":
    main()

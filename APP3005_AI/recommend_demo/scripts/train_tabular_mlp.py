"""
Train a simple MLP regressor on tabular + text features from data/train.csv.

Expected columns:
- height_bucket
- body_shape
- skin_tone
- age_bucket
- occasion
- clothing_description
- label (float in [0, 1])
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Tuple

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

CAT_COLS = ["height_bucket", "body_shape", "skin_tone", "age_bucket", "occasion"]
TEXT_COL = "clothing_description"
LABEL_COL = "label"


def parse_args():
    parser = argparse.ArgumentParser(description="Train an MLP on tabular + text features.")
    parser.add_argument("--data", type=Path, default=Path("data/train.csv"))
    parser.add_argument("--artifacts", type=Path, default=Path("artifacts"))
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--hidden", type=str, default="256,128")
    parser.add_argument("--max-iter", type=int, default=500)
    parser.add_argument("--max-features", type=int, default=5000)
    return parser.parse_args()


def parse_hidden(hidden: str) -> Tuple[int, ...]:
    parts = [p.strip() for p in hidden.split(",") if p.strip()]
    if not parts:
        raise ValueError("Hidden layer sizes must be a comma-separated list of ints.")
    return tuple(int(p) for p in parts)


def load_data(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    required = set(CAT_COLS + [TEXT_COL, LABEL_COL])
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    df = df.copy()
    for col in CAT_COLS:
        df[col] = df[col].fillna("unknown").astype(str)
    df[TEXT_COL] = df[TEXT_COL].fillna("").astype(str)
    df[LABEL_COL] = pd.to_numeric(df[LABEL_COL], errors="coerce")
    if df[LABEL_COL].isna().any():
        raise ValueError("Label column contains non-numeric values.")
    return df


def build_pipeline(hidden: Tuple[int, ...], max_features: int, seed: int, max_iter: int) -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), CAT_COLS),
            ("text", TfidfVectorizer(max_features=max_features, ngram_range=(1, 2)), TEXT_COL),
        ],
        sparse_threshold=0.0,
    )
    model = MLPRegressor(
        hidden_layer_sizes=hidden,
        activation="relu",
        solver="adam",
        alpha=1e-4,
        max_iter=max_iter,
        random_state=seed,
    )
    return Pipeline([("preprocess", preprocessor), ("model", model)])


def train_model(
    df: pd.DataFrame,
    test_size: float,
    seed: int,
    hidden: Tuple[int, ...],
    max_features: int,
    max_iter: int,
):
    features = df[CAT_COLS + [TEXT_COL]]
    labels = df[LABEL_COL].astype(float)
    train_x, val_x, train_y, val_y = train_test_split(
        features, labels, test_size=test_size, random_state=seed
    )

    pipeline = build_pipeline(hidden=hidden, max_features=max_features, seed=seed, max_iter=max_iter)
    pipeline.fit(train_x, train_y)
    preds = pipeline.predict(val_x)

    metrics = {
        "mae": float(mean_absolute_error(val_y, preds)),
        "mse": float(mean_squared_error(val_y, preds)),
        "r2": float(r2_score(val_y, preds)),
        "rows": int(len(df)),
    }
    return pipeline, metrics


def main():
    args = parse_args()
    hidden = parse_hidden(args.hidden)
    df = load_data(args.data)

    pipeline, metrics = train_model(
        df=df,
        test_size=args.test_size,
        seed=args.seed,
        hidden=hidden,
        max_features=args.max_features,
        max_iter=args.max_iter,
    )

    args.artifacts.mkdir(parents=True, exist_ok=True)
    model_path = args.artifacts / "tabular_mlp.joblib"
    metrics_path = args.artifacts / "tabular_mlp_metrics.json"
    joblib.dump(pipeline, model_path)
    with metrics_path.open("w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Saved model to {model_path}")
    print(f"Saved metrics to {metrics_path}")
    print(f"Metrics: {metrics}")


if __name__ == "__main__":
    main()

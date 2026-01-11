from __future__ import annotations

from pathlib import Path
from typing import Dict, Tuple

import numpy as np
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split

from data_samples import CLOTHING_CATALOG, TRAINING_DATA
from matching import (
    PersonAttributes,
    build_person_encoder,
    combine_features,
    encode_person,
    load_embedder,
    save_artifacts,
    train_classifier,
)

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"


def _prepare_clothing_embeddings(embedder) -> Dict[str, np.ndarray]:
    return {
        cid: embedder.encode(item.as_text(), convert_to_numpy=True, normalize_embeddings=True)
        for cid, item in CLOTHING_CATALOG.items()
    }


def _build_training_matrix(encoder, embedder) -> Tuple[np.ndarray, np.ndarray]:
    clothing_embeddings = _prepare_clothing_embeddings(embedder)
    features = []
    labels = []
    for row in TRAINING_DATA:
        clothing_id = row["clothing_id"]
        person: PersonAttributes = row["person"]
        label = row["label"]
        person_vec = encode_person(person, encoder)
        clothing_vec = clothing_embeddings[clothing_id]
        features.append(combine_features(person_vec, clothing_vec))
        labels.append(label)
    return np.vstack(features), np.array(labels)


def train(artifact_dir: Path = ARTIFACT_DIR) -> dict:
    encoder = build_person_encoder()
    embedder = load_embedder()
    X, y = _build_training_matrix(encoder, embedder)

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    model = train_classifier(X_train, y_train)

    val_probs = model.predict_proba(X_val)[:, 1]
    val_preds = (val_probs >= 0.5).astype(int)
    metrics = {
        "val_accuracy": float(accuracy_score(y_val, val_preds)),
        "val_roc_auc": float(roc_auc_score(y_val, val_probs)),
        "train_samples": int(len(X_train)),
        "val_samples": int(len(X_val)),
    }

    save_artifacts(model, encoder, artifact_dir)
    return metrics


if __name__ == "__main__":
    metrics = train()
    print("Artifacts saved to", ARTIFACT_DIR)
    print("Validation metrics:", metrics)

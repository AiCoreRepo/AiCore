from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence

import joblib
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.base import ClassifierMixin
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

PERSON_FIELD_ORDER = ["height_bucket", "body_shape", "skin_tone", "event"]

PERSON_CATEGORIES = {
    "height_bucket": ["short", "average", "tall"],
    "body_shape": ["slim", "athletic", "curvy", "broad"],
    "skin_tone": ["light", "medium", "deep"],
    "event": ["wedding", "interview", "party", "casual", "beach"],
}

DEFAULT_MODEL_NAME = "all-MiniLM-L6-v2"
ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "mlp_classifier.joblib"
ENCODER_PATH = ARTIFACT_DIR / "person_encoder.joblib"


@dataclass(frozen=True)
class PersonAttributes:
    height_bucket: str
    body_shape: str
    skin_tone: str
    event: str


@dataclass(frozen=True)
class ClothingItem:
    id: str
    title: str
    description_lines: List[str]
    event_focus: str

    def as_text(self) -> str:
        return "\n".join(self.description_lines)


def _validate_person(person: PersonAttributes) -> None:
    for field in PERSON_FIELD_ORDER:
        value = getattr(person, field)
        if value not in PERSON_CATEGORIES[field]:
            allowed = ", ".join(PERSON_CATEGORIES[field])
            raise ValueError(f"Invalid value for {field}: {value}. Allowed: {allowed}")


def _person_to_row(person: PersonAttributes) -> List[str]:
    _validate_person(person)
    return [getattr(person, field) for field in PERSON_FIELD_ORDER]


def build_person_encoder() -> OneHotEncoder:
    encoder = OneHotEncoder(
        categories=[PERSON_CATEGORIES[field] for field in PERSON_FIELD_ORDER],
        handle_unknown="ignore",
        sparse_output=False,
    )
    # Fit on the cartesian product so encoding order is stable and exhaustive.
    fit_rows: List[List[str]] = []
    for h in PERSON_CATEGORIES["height_bucket"]:
        for b in PERSON_CATEGORIES["body_shape"]:
            for s in PERSON_CATEGORIES["skin_tone"]:
                for e in PERSON_CATEGORIES["event"]:
                    fit_rows.append([h, b, s, e])
    encoder.fit(fit_rows)
    return encoder


def encode_person(person: PersonAttributes, encoder: OneHotEncoder) -> np.ndarray:
    row = _person_to_row(person)
    encoded = encoder.transform([row])
    return encoded[0]


def load_embedder(model_name: str = DEFAULT_MODEL_NAME) -> SentenceTransformer:
    return SentenceTransformer(model_name, device="cpu")


def combine_features(person_vector: np.ndarray, clothing_vector: np.ndarray) -> np.ndarray:
    return np.concatenate([person_vector, clothing_vector], axis=0)


def train_classifier(features: np.ndarray, labels: np.ndarray) -> ClassifierMixin:
    clf = make_pipeline(
        StandardScaler(),
        MLPClassifier(
            hidden_layer_sizes=(96, 48),
            activation="relu",
            max_iter=180,
            random_state=42,
            learning_rate_init=0.0025,
            early_stopping=True,
        ),
    )
    clf.fit(features, labels)
    return clf


def score_match(model: ClassifierMixin, feature_vector: np.ndarray) -> float:
    proba = model.predict_proba([feature_vector])[0][1]
    return float(proba)


def rank_clothing_for_person(
    person: PersonAttributes,
    clothing_items: Iterable[ClothingItem],
    model: ClassifierMixin,
    encoder: OneHotEncoder,
    embedder: SentenceTransformer,
    top_n: int = 3,
) -> List[tuple[ClothingItem, float]]:
    person_vec = encode_person(person, encoder)
    scored: List[tuple[ClothingItem, float]] = []
    for item in clothing_items:
        clothing_vec = embedder.encode(item.as_text(), convert_to_numpy=True, normalize_embeddings=True)
        features = combine_features(person_vec, clothing_vec)
        scored.append((item, score_match(model, features)))
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:top_n]


def save_artifacts(model: MLPClassifier, encoder: OneHotEncoder, artifact_dir: Path | None = None) -> None:
    target_dir = artifact_dir or ARTIFACT_DIR
    target_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, target_dir / MODEL_PATH.name)
    joblib.dump(encoder, target_dir / ENCODER_PATH.name)


def load_artifacts(artifact_dir: Path | None = None) -> tuple[ClassifierMixin, OneHotEncoder]:
    target_dir = artifact_dir or ARTIFACT_DIR
    model = joblib.load(target_dir / MODEL_PATH.name)
    encoder = joblib.load(target_dir / ENCODER_PATH.name)
    return model, encoder

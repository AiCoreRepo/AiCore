from __future__ import annotations

import base64
import io
import json
import math
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional
from enum import Enum

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from PIL import Image

from scripts import train_fusion_mlp as fusion_mlp

BASE_DIR = Path(__file__).resolve().parent.parent
PRIORITY_WEIGHTS = {1: 1.0, 2: 0.8, 3: 0.6}
SIZE_ALIASES = {
    "xs": "xs",
    "x-small": "xs",
    "extra small": "xs",
    "s": "small",
    "sm": "small",
    "small": "small",
    "m": "medium",
    "md": "medium",
    "medium": "medium",
    "l": "large",
    "lg": "large",
    "large": "large",
    "xl": "xl",
    "extra large": "xl",
    "xxl": "xxl",
    "2xl": "xxl",
}
BODY_SHAPE_ALIASES = {
    "pear shape": "pear",
    "apple shape": "apple",
    "inverted triangle": "inverted_triangle",
}
OCCASION_ALIASES = {"casual luxury": "casual_luxury"}

app = FastAPI(title="Fusion MLP Recommender API")


class BodyShape(str, Enum):
    rectangle = "Rectangle"
    pear = "Pear Shape"
    hourglass = "Hourglass"
    apple = "Apple Shape"
    inverted_triangle = "Inverted Triangle"

class Size(str, Enum):
    xs = "XS"
    s = "S"
    m = "M"
    l = "L"
    xl = "XL"
    xxl = "XXL"


class SkinTone(str, Enum):
    light = "Light"
    medium = "Medium"
    dusky = "Dusky"
    deep = "Deep"


class Occasion(str, Enum):
    formal = "Formal"
    party = "Party"
    wedding = "Wedding"
    casual_luxury = "Casual luxury"
    resort = "Resort"


class RecommendationItem(BaseModel):
    id: str
    score: float
    final_score: float
    score_label: str
    description: Optional[str] = None


class RecommendResponse(BaseModel):
    perfect_for_you: List[RecommendationItem]
    good_for_you: List[RecommendationItem]
    you_can_also_try: List[RecommendationItem]
    count: int
    warnings: List[str] = []


class RecommendBase64Request(BaseModel):
    image_base64: str
    age: float
    size: Size
    body_shape: BodyShape
    skin_tone: SkinTone
    occasion: Occasion
    top_k: int = 0
    model_path: str = "artifacts/fusion_mlp.pt"
    preprocess_path: str = "artifacts/fusion_preprocess.json"
    collection_path: str = "collection2.json"
    desc_field: str = "description"
    id_field: str = "cloth_id"
    apply_priority_filter: bool = True
    apply_priority_weight: bool = True
    use_precomputed_embeddings: bool = False
    precomputed_embeddings_path: str = "artifacts/collection_embeddings.npz"


def _resolve_path(path: Path) -> Path:
    candidates = [
        path,
        BASE_DIR / path,
        BASE_DIR.parent / path,
        Path.cwd() / path,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return path


def _normalize_size_value(value: str) -> str:
    cleaned = value.strip().lower().replace(" ", "")
    return SIZE_ALIASES.get(cleaned, cleaned)


def _normalize_body_shape_value(value: str) -> str:
    cleaned = value.strip().lower().replace("_", " ").replace("-", " ")
    if cleaned in BODY_SHAPE_ALIASES:
        return BODY_SHAPE_ALIASES[cleaned]
    return cleaned.replace(" ", "_")


def _normalize_occasion_value(value: str) -> str:
    cleaned = value.strip().lower().replace("_", " ")
    cleaned = OCCASION_ALIASES.get(cleaned, cleaned)
    return cleaned.replace(" ", "_")


def _normalize_skin_tone_value(value: str) -> str:
    return value.strip().lower()


def _priority_weight(priority: int) -> float:
    if priority in PRIORITY_WEIGHTS:
        return PRIORITY_WEIGHTS[priority]
    return max(0.2, 1.0 - 0.2 * (priority - 1))


def _normalize_priority_list(values, normalizer):
    if values is None:
        return []
    if not isinstance(values, list):
        values = [values]
    normalized = []
    for idx, entry in enumerate(values):
        if isinstance(entry, dict):
            raw_value = entry.get("value", "")
            priority = entry.get("priority", idx + 1)
        else:
            raw_value = entry
            priority = idx + 1
        try:
            priority = int(priority)
        except (TypeError, ValueError):
            priority = idx + 1
        value = normalizer(str(raw_value)) if raw_value is not None else ""
        if value:
            normalized.append({"value": value, "priority": priority})
    return normalized


def _match_priority(values, target: str):
    if not target:
        return None
    for entry in values:
        if entry.get("value") == target:
            return entry.get("priority", 1)
    return None


def _load_collection(path: Path) -> List[Dict]:
    resolved = _resolve_path(path)
    if not resolved.exists():
        raise FileNotFoundError(f"Collection not found: {path}")
    raw = json.loads(resolved.read_text(encoding="utf-8"))
    if isinstance(raw, dict):
        raw = raw.get("data") or raw.get("records") or raw
    if not isinstance(raw, list):
        raise ValueError("Collection JSON must be a list of objects.")
    if not raw:
        raise ValueError("Collection JSON is empty.")
    return raw


@lru_cache(maxsize=4)
def _load_preprocess(path: str) -> Dict[str, object]:
    return fusion_mlp.load_preprocess_spec(Path(path))


@lru_cache(maxsize=4)
def _load_model(path: str):
    device = "cuda" if fusion_mlp.torch.cuda.is_available() else "cpu"
    state = fusion_mlp.torch.load(path, map_location=device)
    if "state_dict" not in state or "config" not in state:
        raise ValueError("Unsupported fusion model format.")
    config = state["config"]
    hidden_layers = tuple(int(v) for v in config.get("hidden", [512, 128]))
    model = fusion_mlp.FusionMLP(
        input_dim=int(config.get("input_dim", 0)),
        hidden=hidden_layers,
        dropout=float(config.get("dropout", 0.0)),
    ).to(device)
    model.load_state_dict(state["state_dict"])
    model.eval()
    return model, config, device


@lru_cache(maxsize=4)
def _load_clip(clip_model_name: str, clip_pretrained: str, device: str):
    model, _, preprocess = fusion_mlp.open_clip.create_model_and_transforms(
        clip_model_name, pretrained=clip_pretrained
    )
    model = model.to(device)
    model.eval()
    return model, preprocess


def _score_cuts(total: int) -> List[int]:
    if total <= 0:
        return [0, 0]
    first_cut = math.ceil(total / 3)
    second_cut = math.ceil(2 * total / 3)
    return [first_cut, second_cut]


def _build_items(df: pd.DataFrame, desc_field: str, label: str) -> List[RecommendationItem]:
    items: List[RecommendationItem] = []
    for _, row in df.iterrows():
        items.append(
            RecommendationItem(
                id=str(row["id"]),
                score=float(row["score"]),
                final_score=float(row["final_score"]),
                score_label=label,
                description=str(row[desc_field]) if desc_field in row else None,
            )
        )
    return items


def _load_precomputed_text_embeddings(
    path: Path,
    ids: List[str],
    texts: List[str],
) -> Optional[np.ndarray]:
    if not path.exists():
        return None
    cached = np.load(path, allow_pickle=True)
    if "text_embs" not in cached.files:
        return None
    text_embs = cached["text_embs"]
    if "ids" in cached.files:
        cached_ids = [str(val) for val in cached["ids"].tolist()]
        index = {val: idx for idx, val in enumerate(cached_ids)}
        indices = [index.get(val) for val in ids]
        if any(idx is None for idx in indices):
            return None
        return text_embs[indices].astype("float32")
    if "texts" in cached.files:
        cached_texts = [str(val) for val in cached["texts"].tolist()]
        index = {val: idx for idx, val in enumerate(cached_texts)}
        indices = [index.get(val) for val in texts]
        if any(idx is None for idx in indices):
            return None
        return text_embs[indices].astype("float32")
    return None


def _decode_base64_image(payload: str) -> Image.Image:
    raw = payload.strip()
    if "," in raw and raw.lower().startswith("data:"):
        raw = raw.split(",", 1)[1]
    raw = "".join(raw.split())
    data = base64.b64decode(raw, validate=True)
    if not data:
        raise ValueError("Base64 image is empty.")
    return Image.open(io.BytesIO(data)).convert("RGB")


def _run_recommendation(
    user_image: Image.Image,
    *,
    age: float,
    size: str,
    body_shape: str,
    skin_tone: str,
    occasion: str,
    top_k: int,
    model_path: str,
    preprocess_path: str,
    collection_path: str,
    desc_field: str,
    id_field: str,
    apply_priority_filter: bool,
    apply_priority_weight: bool,
    use_precomputed_embeddings: bool,
    precomputed_embeddings_path: str,
) -> RecommendResponse:
    warnings: List[str] = []
    try:
        model_path_resolved = _resolve_path(Path(model_path))
        preprocess_path_resolved = _resolve_path(Path(preprocess_path))
        if not model_path_resolved.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        if not preprocess_path_resolved.exists():
            raise FileNotFoundError(f"Preprocess not found: {preprocess_path}")

        model, config, device = _load_model(str(model_path_resolved))
        spec = _load_preprocess(str(preprocess_path_resolved))

        collection = _load_collection(Path(collection_path))
        if apply_priority_filter:
            user_filters = {
                "occasion": _normalize_occasion_value(str(occasion)),
                "body_shape": _normalize_body_shape_value(str(body_shape)),
                "skin_tone": _normalize_skin_tone_value(str(skin_tone)),
                "size": _normalize_size_value(str(size)),
            }
            filtered = []
            for item in collection:
                occasions = _normalize_priority_list(
                    item.get("occasions") or item.get("occasion"),
                    _normalize_occasion_value,
                )
                body_shapes = _normalize_priority_list(
                    item.get("body_shapes") or item.get("body_shape"),
                    _normalize_body_shape_value,
                )
                skin_tones = _normalize_priority_list(
                    item.get("skin_tones") or item.get("skin_tone"),
                    _normalize_skin_tone_value,
                )
                sizes = _normalize_priority_list(
                    item.get("sizes") or item.get("size"),
                    _normalize_size_value,
                )
                occ_priority = _match_priority(occasions, user_filters["occasion"])
                shape_priority = _match_priority(body_shapes, user_filters["body_shape"])
                tone_priority = _match_priority(skin_tones, user_filters["skin_tone"])
                size_priority = _match_priority(sizes, user_filters["size"])
                if None in (occ_priority, shape_priority, tone_priority, size_priority):
                    continue
                priority_score = (
                    0.4 * _priority_weight(int(occ_priority))
                    + 0.3 * _priority_weight(int(shape_priority))
                    + 0.2 * _priority_weight(int(tone_priority))
                    + 0.1 * _priority_weight(int(size_priority))
                )
                item_copy = dict(item)
                item_copy["_priority_score"] = priority_score
                filtered.append(item_copy)
            if filtered:
                collection = filtered
            else:
                warnings.append("No items matched attribute filter; using full collection.")

        df = pd.DataFrame(collection)
        if desc_field not in df.columns:
            raise ValueError(f"Missing description field: {desc_field}")
        if id_field in df.columns:
            df["id"] = df[id_field].astype(str)
        elif "id" not in df.columns:
            df["id"] = [f"item-{i+1:04d}" for i in range(len(df))]
        if "_priority_score" in df.columns:
            df["priority_score"] = df["_priority_score"].astype(float)

        user_df = pd.DataFrame(
            {
                "age": [age] * len(df),
                "size": [size] * len(df),
                "body_shape": [body_shape] * len(df),
                "skin_tone": [skin_tone] * len(df),
                "occasion": [occasion] * len(df),
            }
        )
        tabular, unknowns = fusion_mlp.build_tabular_from_spec(user_df, spec)
        if unknowns:
            summary = ", ".join(f"{key}={sorted(set(vals))}" for key, vals in unknowns.items())
            warnings.append(f"Unknown categories not seen in training: {summary}")

        texts = df[desc_field].astype(str).tolist()
        ids = df["id"].astype(str).tolist()
        text_feats = None
        if use_precomputed_embeddings:
            precomputed_path = _resolve_path(Path(precomputed_embeddings_path))
            text_feats = _load_precomputed_text_embeddings(precomputed_path, ids=ids, texts=texts)
            if text_feats is None:
                warnings.append("Precomputed embeddings not used; falling back to runtime embedding.")

        if text_feats is None:
            text_embs = fusion_mlp.embed_texts(
                texts=texts,
                model_name=config.get("text_model", "all-MiniLM-L6-v2"),
                device=device,
                batch_size=16,
                max_length=int(config.get("text_max_length", 128)),
            )
            text_feats = np.stack([text_embs[text] for text in texts]).astype("float32")

        clip_model_name = config.get("clip_model", "ViT-B-32")
        clip_pretrained = config.get("clip_pretrained", "laion2b_s34b_b79k")
        clip_model, preprocess = _load_clip(clip_model_name, clip_pretrained, device)
        with fusion_mlp.torch.no_grad():
            tensor = preprocess(user_image).unsqueeze(0).to(device)
            emb = clip_model.encode_image(tensor)
            emb = emb / emb.norm(dim=-1, keepdim=True)
        user_emb = emb.cpu().numpy().astype("float32")[0]
        image_feats = np.repeat(user_emb[None, :], len(df), axis=0)

        features = np.concatenate([image_feats, text_feats, tabular], axis=1).astype("float32")

        expected_input = int(config.get("input_dim", features.shape[1]))
        expected_text = int(config.get("text_dim", text_feats.shape[1]))
        expected_image = int(config.get("image_dim", image_feats.shape[1]))
        expected_attr = int(config.get("attr_dim", tabular.shape[1]))
        if features.shape[1] != expected_input:
            raise ValueError("Input feature size does not match the trained model.")
        if text_feats.shape[1] != expected_text:
            raise ValueError("Text embedding size does not match the trained model.")
        if image_feats.shape[1] != expected_image:
            raise ValueError("Image embedding size does not match the trained model.")
        if tabular.shape[1] != expected_attr:
            raise ValueError("Attribute feature size does not match the trained model.")

        with fusion_mlp.torch.no_grad():
            scores = model(fusion_mlp.torch.from_numpy(features).to(device)).cpu().numpy()

        df = df.copy()
        df["score"] = scores
        sort_col = "score"
        if "priority_score" in df.columns and apply_priority_weight:
            df["final_score"] = df["score"] * df["priority_score"]
            sort_col = "final_score"
        else:
            df["final_score"] = df["score"]

        df = df.sort_values(sort_col, ascending=False)
        total_rows = len(df)
        limit = int(top_k) if top_k is not None else 0
        if limit <= 0:
            limit = total_rows
        limit = max(1, min(limit, total_rows))
        top_df = df.head(limit).copy()

        first_cut, second_cut = _score_cuts(len(top_df))
        perfect_df = top_df.iloc[:first_cut]
        good_df = top_df.iloc[first_cut:second_cut]
        also_df = top_df.iloc[second_cut:]

        return RecommendResponse(
            perfect_for_you=_build_items(perfect_df, desc_field, "perfect for you"),
            good_for_you=_build_items(good_df, desc_field, "good for you"),
            you_can_also_try=_build_items(also_df, desc_field, "you can also try"),
            count=len(top_df),
            warnings=warnings,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/recommend", response_model=RecommendResponse)
def recommend(
    image: UploadFile = File(...),
    age: float = Form(...),
    size: Size = Form(...),
    body_shape: BodyShape = Form(...),
    skin_tone: SkinTone = Form(...),
    occasion: Occasion = Form(...),
    top_k: int = Form(0),
    model_path: str = Form("artifacts/fusion_mlp.pt"),
    preprocess_path: str = Form("artifacts/fusion_preprocess.json"),
    collection_path: str = Form("collection2.json"),
    desc_field: str = Form("description"),
    id_field: str = Form("cloth_id"),
    apply_priority_filter: bool = Form(True),
    apply_priority_weight: bool = Form(True),
    use_precomputed_embeddings: bool = Form(False),
    precomputed_embeddings_path: str = Form("artifacts/collection_embeddings.npz"),
):
    image_bytes = image.file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")
    try:
        user_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image: {exc}") from exc
    return _run_recommendation(
        user_image,
        age=age,
        size=size.value,
        body_shape=body_shape.value,
        skin_tone=skin_tone.value,
        occasion=occasion.value,
        top_k=top_k,
        model_path=model_path,
        preprocess_path=preprocess_path,
        collection_path=collection_path,
        desc_field=desc_field,
        id_field=id_field,
        apply_priority_filter=apply_priority_filter,
        apply_priority_weight=apply_priority_weight,
        use_precomputed_embeddings=use_precomputed_embeddings,
        precomputed_embeddings_path=precomputed_embeddings_path,
    )


@app.post("/recommend-base64", response_model=RecommendResponse)
def recommend_base64(payload: RecommendBase64Request):
    try:
        user_image = _decode_base64_image(payload.image_base64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {exc}") from exc
    return _run_recommendation(
        user_image,
        age=payload.age,
        size=payload.size.value,
        body_shape=payload.body_shape.value,
        skin_tone=payload.skin_tone.value,
        occasion=payload.occasion.value,
        top_k=payload.top_k,
        model_path=payload.model_path,
        preprocess_path=payload.preprocess_path,
        collection_path=payload.collection_path,
        desc_field=payload.desc_field,
        id_field=payload.id_field,
        apply_priority_filter=payload.apply_priority_filter,
        apply_priority_weight=payload.apply_priority_weight,
        use_precomputed_embeddings=payload.use_precomputed_embeddings,
        precomputed_embeddings_path=payload.precomputed_embeddings_path,
    )

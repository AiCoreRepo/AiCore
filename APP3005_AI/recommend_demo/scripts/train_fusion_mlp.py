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
import os
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

try:
    from pymilvus import Collection, CollectionSchema, DataType, FieldSchema, connections, utility

    _MILVUS_AVAILABLE = True
except ImportError:
    Collection = None
    CollectionSchema = None
    DataType = None
    FieldSchema = None
    connections = None
    utility = None
    _MILVUS_AVAILABLE = False

AGE_COL = "age"
TEXT_COL = "cloth_description"
TEXT_COL_FALLBACK = "clothing_description"
IMAGE_COL = "image_path"
LABEL_COL = "score"

SIZE_ORDER = ["xs", "small", "medium", "large", "xl", "xxl"]
BODY_SHAPE_ORDER = ["rectangle", "pear", "apple", "hourglass", "inverted_triangle"]
SKIN_TONE_ORDER = ["light", "medium", "dusky", "deep"]
OCCASION_ORDER = ["formal", "casual_luxury", "party", "wedding", "resort"]

CAT_COLS = ["size", "body_shape", "skin_tone", "occasion"]
AGE_DIVISOR_DEFAULT = 60.0
DEFAULT_AGE = 25.0
MAX_COMBOS_PER_ITEM = 50
MILVUS_TEXT_MAX_LEN = 4096
MILVUS_PATH_MAX_LEN = 512
MILVUS_SMALL_MAX_LEN = 32
MILVUS_ID_MAX_LEN = 128
MILVUS_DEFAULT_BATCH_SIZE = 256

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

OCCASION_ALIASES = {
    "casual luxury": "casual_luxury",
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
    parser.add_argument("--milvus-collection", type=str, default="")
    parser.add_argument("--milvus-host", type=str, default="")
    parser.add_argument("--milvus-port", type=str, default="")
    parser.add_argument("--milvus-uri", type=str, default="")
    parser.add_argument("--milvus-token", type=str, default="")
    parser.add_argument("--milvus-user", type=str, default="")
    parser.add_argument("--milvus-password", type=str, default="")
    parser.add_argument("--milvus-batch-size", type=int, default=MILVUS_DEFAULT_BATCH_SIZE)
    parser.add_argument("--milvus-reset", action="store_true")
    return parser.parse_args()


def parse_hidden(hidden: str) -> Tuple[int, ...]:
    parts = [p.strip() for p in hidden.split(",") if p.strip()]
    if not parts:
        raise ValueError("Hidden layer sizes must be a comma-separated list of ints.")
    return tuple(int(p) for p in parts)


def normalize_size(value: str) -> str:
    cleaned = value.strip().lower()
    cleaned = cleaned.replace(" ", "")
    return SIZE_ALIASES.get(cleaned, cleaned)


def normalize_category(value: str) -> str:
    return value.strip().lower().replace(" ", "_")


def normalize_body_shape(value: str) -> str:
    cleaned = value.strip().lower().replace("_", " ").replace("-", " ")
    if cleaned in BODY_SHAPE_ALIASES:
        return BODY_SHAPE_ALIASES[cleaned]
    return cleaned.replace(" ", "_")


def normalize_occasion(value: str) -> str:
    cleaned = value.strip().lower().replace("_", " ")
    cleaned = OCCASION_ALIASES.get(cleaned, cleaned)
    return cleaned.replace(" ", "_")


def normalize_skin_tone(value: str) -> str:
    return value.strip().lower()


def _priority_weight(priority: int) -> float:
    if priority in PRIORITY_WEIGHTS:
        return PRIORITY_WEIGHTS[priority]
    return max(0.2, 1.0 - 0.2 * (priority - 1))


def _coerce_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _normalize_priority_list(values, normalizer):
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


def _age_from_range(value: str) -> Optional[float]:
    cleaned = str(value).strip()
    if not cleaned:
        return None
    if "+" in cleaned:
        try:
            base = float(cleaned.replace("+", "").strip())
        except ValueError:
            return None
        return max(base, base + 4.0)
    if "-" in cleaned:
        parts = cleaned.replace("–", "-").split("-")
        if len(parts) != 2:
            return None
        try:
            low = float(parts[0].strip())
            high = float(parts[1].strip())
        except ValueError:
            return None
        return (low + high) / 2.0
    try:
        return float(cleaned)
    except ValueError:
        return None


def _resolve_age(age_ranges) -> float:
    for val in _coerce_list(age_ranges):
        age = _age_from_range(val)
        if age is not None:
            return age
    return DEFAULT_AGE


def _load_json_records(path: Path):
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        if isinstance(data.get("data"), list):
            data = data["data"]
        elif isinstance(data.get("records"), list):
            data = data["records"]
    if not isinstance(data, list):
        raise ValueError("JSON data must be a list of objects.")
    return data


def _expand_collection_records(records: List[Dict], base_dir: Path) -> pd.DataFrame:
    from itertools import islice, product

    rows: List[Dict[str, object]] = []
    for item in records:
        occasions = _normalize_priority_list(
            _coerce_list(item.get("occasions") or item.get("occasion")),
            normalize_occasion,
        )
        body_shapes = _normalize_priority_list(
            _coerce_list(item.get("body_shapes") or item.get("body_shape")),
            normalize_body_shape,
        )
        skin_tones = _normalize_priority_list(
            _coerce_list(item.get("skin_tones") or item.get("skin_tone")),
            normalize_skin_tone,
        )
        sizes = _normalize_priority_list(
            _coerce_list(item.get("sizes") or item.get("size")),
            normalize_size,
        )
        if not (occasions and body_shapes and skin_tones and sizes):
            continue

        image_path = item.get("image") or item.get("image_path") or ""
        if not image_path:
            continue
        img_path = Path(str(image_path))
        if not img_path.is_absolute():
            candidate = base_dir / img_path
            if candidate.exists():
                image_path = str(candidate)

        description = (
            item.get("description")
            or item.get("cloth_description")
            or item.get("clothing_description")
            or ""
        )

        age_value = _resolve_age(item.get("age_range"))

        combos = islice(product(occasions, body_shapes, skin_tones, sizes), MAX_COMBOS_PER_ITEM)
        for occ, shape, tone, size in combos:
            score = (
                0.4 * _priority_weight(occ["priority"])
                + 0.3 * _priority_weight(shape["priority"])
                + 0.2 * _priority_weight(tone["priority"])
                + 0.1 * _priority_weight(size["priority"])
            )
            rows.append(
                {
                    AGE_COL: age_value,
                    "size": size["value"],
                    "body_shape": shape["value"],
                    "skin_tone": tone["value"],
                    "occasion": occ["value"],
                    TEXT_COL: description,
                    IMAGE_COL: image_path,
                    LABEL_COL: score,
                }
            )
    return pd.DataFrame(rows)


def _normalize_training_df(df: pd.DataFrame) -> pd.DataFrame:
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
    df["body_shape"] = df["body_shape"].map(normalize_body_shape)
    df["skin_tone"] = df["skin_tone"].map(normalize_skin_tone)
    df["occasion"] = df["occasion"].map(normalize_occasion)
    df[TEXT_COL] = df[TEXT_COL].fillna("").astype(str)
    df[IMAGE_COL] = df[IMAGE_COL].fillna("").astype(str)
    if len(df) < 2:
        raise ValueError("Need at least 2 rows to train.")
    return df


def load_data(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == ".json":
        records = _load_json_records(path)
        if records and isinstance(records[0], dict) and LABEL_COL in records[0]:
            df = pd.DataFrame(records)
        else:
            df = _expand_collection_records(records, base_dir=path.parent)
        return _normalize_training_df(df)

    df = pd.read_csv(path)
    return _normalize_training_df(df)


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
    df["body_shape"] = df["body_shape"].map(normalize_body_shape)
    df["skin_tone"] = df["skin_tone"].map(normalize_skin_tone)
    df["occasion"] = df["occasion"].map(normalize_occasion)

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
    paths: List[str],
    clip_model_name: str,
    clip_pretrained: str,
    device: str,
    base_dir: Optional[Path] = None,
) -> Tuple[Dict[str, np.ndarray], int, List[str]]:
    model, _, preprocess = open_clip.create_model_and_transforms(
        clip_model_name, pretrained=clip_pretrained
    )
    model = model.to(device)
    model.eval()

    from PIL import Image

    embeddings: Dict[str, np.ndarray] = {}
    missing: List[str] = []
    unique_paths = sorted(set(paths))
    for path_str in unique_paths:
        if not path_str:
            missing.append(path_str)
            continue
        path = Path(path_str)
        if not path.is_absolute() and base_dir is not None:
            candidate = base_dir / path
            if candidate.exists():
                path = candidate
        if not path.exists():
            missing.append(path_str)
            continue
        image = Image.open(path).convert("RGB")
        tensor = preprocess(image).unsqueeze(0).to(device)
        with torch.no_grad():
            emb = model.encode_image(tensor)
            emb = emb / emb.norm(dim=-1, keepdim=True)
        embeddings[path_str] = emb.cpu().numpy().astype("float32")[0]

    if embeddings:
        image_dim = next(iter(embeddings.values())).shape[0]
    else:
        dummy = Image.new("RGB", (224, 224), color=(0, 0, 0))
        tensor = preprocess(dummy).unsqueeze(0).to(device)
        with torch.no_grad():
            emb = model.encode_image(tensor)
            emb = emb / emb.norm(dim=-1, keepdim=True)
        image_dim = int(emb.shape[-1])

    return embeddings, image_dim, missing


def _env_flag(name: str) -> bool:
    return os.getenv(name, "").strip().lower() in {"1", "true", "yes", "y"}


def _finalize_milvus_config(config: Dict[str, object]) -> Optional[Dict[str, object]]:
    collection = str(config.get("collection", "")).strip()
    if not collection:
        return None
    config = dict(config)
    config["collection"] = collection
    config["uri"] = str(config.get("uri", "")).strip()
    config["host"] = str(config.get("host", "")).strip()
    config["port"] = str(config.get("port", "")).strip()
    config["token"] = str(config.get("token", "")).strip()
    config["username"] = str(config.get("username", "")).strip()
    config["password"] = str(config.get("password", "")).strip()
    config["batch_size"] = int(config.get("batch_size") or MILVUS_DEFAULT_BATCH_SIZE)
    config["reset"] = bool(config.get("reset"))

    if not config["uri"]:
        if not config["host"]:
            config["host"] = os.getenv("MILVUS_HOST", "").strip() or "localhost"
        if not config["port"]:
            config["port"] = os.getenv("MILVUS_PORT", "").strip() or "19530"
    if not config["token"]:
        config["token"] = os.getenv("MILVUS_TOKEN", "").strip()
    if not config["username"]:
        config["username"] = os.getenv("MILVUS_USER", "").strip()
    if not config["password"]:
        config["password"] = os.getenv("MILVUS_PASSWORD", "").strip()
    return config


def _resolve_milvus_config(
    config: Optional[Dict[str, object]]
) -> Optional[Dict[str, object]]:
    if config is not None:
        return _finalize_milvus_config(config)
    collection = os.getenv("MILVUS_COLLECTION", "").strip()
    if not collection:
        return None
    env_config = {
        "collection": collection,
        "uri": os.getenv("MILVUS_URI", "").strip(),
        "host": os.getenv("MILVUS_HOST", "").strip(),
        "port": os.getenv("MILVUS_PORT", "").strip(),
        "token": os.getenv("MILVUS_TOKEN", "").strip(),
        "username": os.getenv("MILVUS_USER", "").strip(),
        "password": os.getenv("MILVUS_PASSWORD", "").strip(),
        "batch_size": int(os.getenv("MILVUS_BATCH_SIZE", MILVUS_DEFAULT_BATCH_SIZE)),
        "reset": _env_flag("MILVUS_RESET"),
    }
    return _finalize_milvus_config(env_config)


def _milvus_config_from_args(args) -> Optional[Dict[str, object]]:
    if not args.milvus_collection:
        return None
    return {
        "collection": args.milvus_collection,
        "uri": args.milvus_uri,
        "host": args.milvus_host,
        "port": args.milvus_port,
        "token": args.milvus_token,
        "username": args.milvus_user,
        "password": args.milvus_password,
        "batch_size": args.milvus_batch_size,
        "reset": args.milvus_reset,
    }


def _connect_milvus(config: Dict[str, object]) -> None:
    if not _MILVUS_AVAILABLE:
        raise RuntimeError("Install pymilvus to store embeddings in Milvus.")
    connect_kwargs = {"alias": "default"}
    uri = str(config.get("uri", "")).strip()
    if uri:
        connect_kwargs["uri"] = uri
    else:
        connect_kwargs["host"] = str(config.get("host", "")).strip()
        connect_kwargs["port"] = str(config.get("port", "")).strip()
    token = str(config.get("token", "")).strip()
    if token:
        connect_kwargs["token"] = token
    username = str(config.get("username", "")).strip()
    password = str(config.get("password", "")).strip()
    if username or password:
        connect_kwargs["user"] = username
        connect_kwargs["password"] = password
    connections.connect(**connect_kwargs)


def _get_field_dim(collection, field_name: str) -> int:
    for field in collection.schema.fields:
        if field.name == field_name:
            return int(field.params.get("dim", 0))
    return 0


def _prepare_milvus_collection(
    name: str, *, text_dim: int, image_dim: int, reset: bool
):
    if utility.has_collection(name):
        if reset:
            utility.drop_collection(name)
        else:
            collection = Collection(name)
            required_fields = {
                "row_index",
                "cloth_id",
                "age",
                "size",
                "body_shape",
                "skin_tone",
                "occasion",
                "score",
                "text",
                "image_path",
                "text_embedding",
                "image_embedding",
            }
            existing_fields = {field.name for field in collection.schema.fields}
            missing = required_fields - existing_fields
            if missing:
                raise ValueError(
                    "Milvus collection schema missing fields. "
                    f"Missing: {sorted(missing)}. Use --milvus-reset to recreate the collection."
                )
            existing_text = _get_field_dim(collection, "text_embedding")
            existing_image = _get_field_dim(collection, "image_embedding")
            if existing_text != text_dim or existing_image != image_dim:
                raise ValueError(
                    "Milvus collection dims do not match embeddings. "
                    "Use --milvus-reset to recreate the collection."
                )
            return collection

    fields = [
        FieldSchema(name="pk", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="row_index", dtype=DataType.INT64),
        FieldSchema(name="cloth_id", dtype=DataType.VARCHAR, max_length=MILVUS_ID_MAX_LEN),
        FieldSchema(name="age", dtype=DataType.FLOAT),
        FieldSchema(name="size", dtype=DataType.VARCHAR, max_length=MILVUS_SMALL_MAX_LEN),
        FieldSchema(name="body_shape", dtype=DataType.VARCHAR, max_length=MILVUS_SMALL_MAX_LEN),
        FieldSchema(name="skin_tone", dtype=DataType.VARCHAR, max_length=MILVUS_SMALL_MAX_LEN),
        FieldSchema(name="occasion", dtype=DataType.VARCHAR, max_length=MILVUS_SMALL_MAX_LEN),
        FieldSchema(name="score", dtype=DataType.FLOAT),
        FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=MILVUS_TEXT_MAX_LEN),
        FieldSchema(name="image_path", dtype=DataType.VARCHAR, max_length=MILVUS_PATH_MAX_LEN),
        FieldSchema(name="text_embedding", dtype=DataType.FLOAT_VECTOR, dim=text_dim),
        FieldSchema(name="image_embedding", dtype=DataType.FLOAT_VECTOR, dim=image_dim),
    ]
    schema = CollectionSchema(fields, description="Fusion MLP training embeddings")
    return Collection(name, schema)


def _store_embeddings_in_milvus(
    df: pd.DataFrame,
    text_feats: np.ndarray,
    image_feats: np.ndarray,
    config: Dict[str, object],
) -> None:
    _connect_milvus(config)
    collection = _prepare_milvus_collection(
        str(config["collection"]),
        text_dim=int(text_feats.shape[1]),
        image_dim=int(image_feats.shape[1]),
        reset=bool(config.get("reset")),
    )

    row_index = np.arange(len(df), dtype="int64")
    cloth_ids = (
        df.get("cloth_id", pd.Series([""] * len(df)))
        .fillna("")
        .astype(str)
        .str.slice(0, MILVUS_ID_MAX_LEN)
        .tolist()
    )
    ages = df[AGE_COL].astype(float).tolist()
    sizes = df["size"].fillna("").astype(str).str.slice(0, MILVUS_SMALL_MAX_LEN).tolist()
    body_shapes = (
        df["body_shape"].fillna("").astype(str).str.slice(0, MILVUS_SMALL_MAX_LEN).tolist()
    )
    skin_tones = (
        df["skin_tone"].fillna("").astype(str).str.slice(0, MILVUS_SMALL_MAX_LEN).tolist()
    )
    occasions = df["occasion"].fillna("").astype(str).str.slice(0, MILVUS_SMALL_MAX_LEN).tolist()
    scores = df[LABEL_COL].astype(float).tolist()
    texts = df[TEXT_COL].fillna("").astype(str).str.slice(0, MILVUS_TEXT_MAX_LEN).tolist()
    image_paths = (
        df[IMAGE_COL].fillna("").astype(str).str.slice(0, MILVUS_PATH_MAX_LEN).tolist()
    )

    batch_size = max(1, int(config.get("batch_size") or MILVUS_DEFAULT_BATCH_SIZE))
    total_rows = len(df)
    print(f"Storing {total_rows} embeddings in Milvus collection '{collection.name}'...")

    for start in range(0, total_rows, batch_size):
        end = min(start + batch_size, total_rows)
        data = [
            row_index[start:end].tolist(),
            cloth_ids[start:end],
            ages[start:end],
            sizes[start:end],
            body_shapes[start:end],
            skin_tones[start:end],
            occasions[start:end],
            scores[start:end],
            texts[start:end],
            image_paths[start:end],
            text_feats[start:end].tolist(),
            image_feats[start:end].tolist(),
        ]
        collection.insert(data)
    collection.flush()


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
    milvus_config: Optional[Dict[str, object]] = None,
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
    image_embs, image_dim, missing_images = embed_images(
        df[IMAGE_COL].tolist(),
        clip_model_name=clip_model,
        clip_pretrained=clip_pretrained,
        device=device,
        base_dir=data_path.parent,
    )
    if missing_images:
        preview = ", ".join(missing_images[:5])
        print(
            f"Warning: {len(missing_images)} image paths not found. "
            f"Using zero image embeddings. Examples: {preview}"
        )

    text_feats = np.stack([text_embs[text] for text in df[TEXT_COL].tolist()]).astype("float32")
    zero_image = np.zeros(image_dim, dtype="float32")
    image_feats = np.stack(
        [image_embs.get(path, zero_image) for path in df[IMAGE_COL].tolist()]
    ).astype("float32")
    labels = df[LABEL_COL].astype("float32").to_numpy()

    milvus_config = _resolve_milvus_config(milvus_config)
    if milvus_config:
        _store_embeddings_in_milvus(df, text_feats, image_feats, milvus_config)

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
    milvus_config = _milvus_config_from_args(args)
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
        milvus_config=milvus_config,
    )
    print(f"Saved model to {result['artifacts']}")
    print(f"Metrics: {result['metrics']}")


if __name__ == "__main__":
    main()

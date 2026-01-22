import io
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import streamlit as st
from PIL import Image

if st.runtime.exists():
    st.set_page_config(page_title="Fusion MLP recommender demo", layout="centered")

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


def _is_url(value: str) -> bool:
    return value.startswith(("http://", "https://"))


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


def _load_fusion_mlp_module():
    try:
        from scripts import train_fusion_mlp as fusion_mlp

        return fusion_mlp, None
    except Exception as exc:
        return None, str(exc)


def _default_collection_path() -> str:
    if Path("collection2.json").exists():
        return "collection2.json"
    if Path("fashion_collection.json").exists():
        return "fashion_collection.json"
    return "data/collection.json"


SIZE_DISPLAY = {
    "xs": "XS",
    "small": "S",
    "medium": "M",
    "large": "L",
    "xl": "XL",
    "xxl": "XXL",
}
BODY_SHAPE_DISPLAY = {
    "apple": "Apple Shape",
    "hourglass": "Hourglass",
    "inverted_triangle": "Inverted Triangle",
    "pear": "Pear Shape",
    "rectangle": "Rectangle",
}
SKIN_TONE_DISPLAY = {
    "deep": "Deep",
    "dusky": "Dusky",
    "light": "Light",
    "medium": "Medium",
}
OCCASION_DISPLAY = {
    "casual_luxury": "Casual luxury",
    "formal": "Formal",
    "party": "Party",
    "resort": "Resort",
    "wedding": "Wedding",
}

SIZE_ORDERED = ["xs", "small", "medium", "large", "xl", "xxl"]
BODY_SHAPE_ORDERED = ["apple", "hourglass", "inverted_triangle", "pear", "rectangle"]
SKIN_TONE_ORDERED = ["deep", "dusky", "light", "medium"]
OCCASION_ORDERED = ["casual_luxury", "formal", "party", "resort", "wedding"]
CATEGORY_FIELDS = [
    "cloth_type",
    "occasion",
    "occasions",
    "fit",
    "fabric",
    "color_family",
    "style",
    "size",
    "sizes",
    "skin_tone",
    "skin_tones",
    "body_shape",
    "body_shapes",
    "age_range",
    "age_ranges",
]


def _order_options(preferred: list[str], available: list[str]) -> list[str]:
    if not available:
        return preferred[:]
    available_list = [str(val) for val in available]
    ordered = [val for val in preferred if val in available_list]
    extras = [val for val in available_list if val not in ordered]
    return ordered + extras


def _format_option(value: object, mapping: dict[str, str]) -> str:
    raw = str(value)
    if raw in mapping:
        return mapping[raw]
    lowered = raw.lower()
    if lowered in mapping:
        return mapping[lowered]
    if any(ch.isupper() for ch in raw) and " " in raw:
        return raw
    return raw.replace("_", " ").title()


def _option_index(options: list[str], value: str, fallback: int = 0) -> int:
    try:
        return options.index(value)
    except ValueError:
        return fallback


def _extract_priority_values(raw: object) -> list[tuple[str, int]]:
    if raw is None:
        return []
    values = raw if isinstance(raw, list) else [raw]
    entries = []
    for idx, entry in enumerate(values):
        priority = idx + 1
        value = None
        if isinstance(entry, dict):
            value = entry.get("value")
            raw_priority = entry.get("priority")
            if raw_priority is not None:
                try:
                    priority = int(raw_priority)
                except (TypeError, ValueError):
                    priority = idx + 1
        else:
            value = entry
        if value is None:
            continue
        text = str(value).strip()
        if not text:
            continue
        entries.append((text, priority))
    return entries


def _build_category_summary(records: list[dict], field: str) -> pd.DataFrame:
    totals: dict[str, int] = {}
    priority_counts: dict[str, dict[int, int]] = {}
    max_priority = 0

    for item in records:
        entries = _extract_priority_values(item.get(field))
        if not entries:
            continue
        seen = set()
        for value, priority in entries:
            if value not in seen:
                totals[value] = totals.get(value, 0) + 1
                seen.add(value)
            if priority < 1:
                priority = 1
            priority_counts.setdefault(value, {})
            priority_counts[value][priority] = priority_counts[value].get(priority, 0) + 1
            if priority > max_priority:
                max_priority = priority

    if not totals:
        return pd.DataFrame()

    rows = []
    for value in sorted(totals.keys(), key=lambda v: (-totals[v], str(v).lower())):
        row = {"category": value, "total": totals[value]}
        for priority in range(1, max_priority + 1):
            row[f"P{priority}"] = priority_counts.get(value, {}).get(priority, 0)
        rows.append(row)
    return pd.DataFrame(rows)


def _build_match_priority_summary(match_counts: dict[str, dict[int, int]]) -> pd.DataFrame:
    if not match_counts:
        return pd.DataFrame()
    max_priority = 0
    for counts in match_counts.values():
        if counts:
            max_priority = max(max_priority, max(counts))
    if max_priority < 1:
        return pd.DataFrame()
    rows = []
    for key in ["occasion", "body_shape", "skin_tone", "size"]:
        if key not in match_counts:
            continue
        counts = match_counts.get(key, {})
        row = {"attribute": key.replace("_", " ").title()}
        for priority in range(1, max_priority + 1):
            row[f"P{priority}"] = counts.get(priority, 0)
        rows.append(row)
    return pd.DataFrame(rows)


def render_streamlit_app():
    st.title("Fusion MLP recommender demo")
    st.caption(
        "This demo trains a fusion MLP on attributes + text + image embeddings, then uses it to "
        "score items from a collection. Expand the attribute guide below for clear definitions."
    )

    with st.expander("Attribute guide", expanded=False):
        st.markdown(
            """
**What each attribute means**
- age: numeric user age. It is normalized by the age divisor and used as a feature, not a hard filter.
- size: clothing size category. Used in the MLP and in the optional priority filter.
- body_shape: body shape category. Used in the MLP and in the optional priority filter.
- skin_tone: skin tone category. Used in the MLP and in the optional priority filter.
- occasion: target use case (party, wedding, etc.). Used in the MLP and in the optional priority filter.

**Text + image inputs**
- description/text field: the item description used to build the text embedding for each item.
- image_url or image_path (training) / image or image_url (collection): local path or URL to the item image.

**Important**
- Categories must match training data. If you pick values not seen in training, the app will warn.
"""
        )

    st.header("Collections (train / test)")
    st.write(
        "Quickly inspect your prepared collection JSON/CSV files with grouped counts only. "
        "Defaults point to `main_train_data.csv` for both train/test."
    )

    col_paths_a, col_paths_b = st.columns(2)
    train_collection_path = Path(
        col_paths_a.text_input(
            "Train collection JSON/CSV", "main_train_data.csv", key="collection_train_json"
        )
    )
    test_collection_path = Path(
        col_paths_b.text_input(
            "Test collection JSON/CSV", "main_train_data.csv", key="collection_test_json"
        )
    )

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
        # Slow fallback: search by filename within project tree (up to a small depth)
        try:
            name = path.name
            for root in [BASE_DIR, BASE_DIR.parent]:
                match = next(root.rglob(name), None)
                if match:
                    return match
        except Exception:
            pass
        return path

    def _render_collection_preview(label: str, path: Path):
        with st.expander(label, expanded=False):
            label_key = label.lower().replace(" ", "_").replace("/", "_")
            resolved = _resolve_path(path)
            if not resolved.exists():
                st.warning(f"File not found: {path}")
                return
            try:
                data = None
                if resolved.suffix.lower() == ".csv":
                    df_raw = pd.read_csv(resolved)
                    fusion_mlp, fusion_mlp_error = _load_fusion_mlp_module()
                    if not fusion_mlp_error:
                        try:
                            data = fusion_mlp.collection_records_from_main_df(df_raw)
                        except Exception as exc:
                            st.warning(str(exc))
                    if data is None:
                        data = df_raw.to_dict(orient="records")
                else:
                    data = json.loads(resolved.read_text(encoding="utf-8"))
                    if isinstance(data, dict):
                        data = data.get("data") or data.get("records") or data
                if not isinstance(data, list):
                    st.error("Collection must be a list of objects.")
                    return
                st.caption(f"{len(data)} items loaded from {resolved}")
                preview_rows = min(10, len(data))
                df = pd.DataFrame(data)
                summary_fields = [field for field in CATEGORY_FIELDS if field in df.columns]
                if summary_fields:
                    default_fields = []
                    for candidate in [
                        "occasion",
                        "body_shape",
                        "skin_tone",
                        "sizes",
                        "cloth_type",
                    ]:
                        if candidate in summary_fields:
                            default_fields.append(candidate)
                    if not default_fields:
                        default_fields = [summary_fields[0]]
                    selected_fields = st.multiselect(
                        "Category fields",
                        summary_fields,
                        default=default_fields,
                        key=f"{label_key}_category_fields",
                    )
                    if not selected_fields:
                        st.info("Select at least one category field to summarize.")
                    else:
                        any_rows = False
                        for field in selected_fields:
                            summary_df = _build_category_summary(data, field)
                            if summary_df.empty:
                                st.info(f"No category values found for {field}.")
                                continue
                            any_rows = True
                            display_field = field.replace("_", " ").title()
                            st.markdown(f"**Counts for {display_field}**")
                            st.dataframe(summary_df, use_container_width=True)
                        if any_rows:
                            st.caption(
                                "P1/P2 indicate priority order in the list (or explicit priority values)."
                            )
                else:
                    st.info("No category fields found to summarize.")

            except Exception as exc:
                st.error(str(exc))

    _render_collection_preview("Training collection preview", train_collection_path)
    _render_collection_preview("Test collection preview", test_collection_path)

    st.info(
        "Training/testing workflow: use the controls below to train the Fusion MLP on your "
        "collection JSON/CSV, then evaluate or recommend using the trained checkpoint. You can "
        "also swap in your collection JSON/CSV via the inputs in the recommender section."
    )

    fusion_mlp, fusion_mlp_error = _load_fusion_mlp_module()

    st.header("Prerequisites (optional)")
    st.write(
        "Pre-embed a fixed collection for faster recommendations. Text embeddings are used "
        "during scoring; image embeddings are optional and stored for future use."
    )
    if fusion_mlp_error:
        st.info(f"Fusion MLP unavailable: {fusion_mlp_error}")
    else:
        pre_col_a, pre_col_b = st.columns(2)
        prereq_collection_path = Path(
            pre_col_a.text_input(
                "Collection JSON path (pre-embed)",
                _default_collection_path(),
                key="prereq_collection_path",
            )
        )
        prereq_output_path = Path(
            pre_col_b.text_input(
                "Embeddings output path",
                "artifacts/collection_embeddings.npz",
                key="prereq_output_path",
            )
        )

        pre_col_c, pre_col_d, pre_col_e = st.columns(3)
        prereq_desc_field = pre_col_c.text_input(
            "Description field (pre-embed)", "description", key="prereq_desc_field"
        )
        prereq_id_field = pre_col_d.text_input(
            "ID field (pre-embed)", "cloth_id", key="prereq_id_field"
        )
        prereq_image_field = pre_col_e.text_input(
            "Image field (pre-embed)", "image", key="prereq_image_field"
        )

        pre_col_f, pre_col_g, pre_col_h = st.columns(3)
        prereq_text_model = pre_col_f.text_input(
            "Sentence-BERT model (pre-embed)",
            "all-MiniLM-L6-v2",
            key="prereq_text_model",
        )
        prereq_clip_model = pre_col_g.text_input(
            "OpenCLIP model (pre-embed)",
            "ViT-B-32",
            key="prereq_clip_model",
        )
        prereq_clip_pretrained = pre_col_h.text_input(
            "OpenCLIP pretrained (pre-embed)",
            "laion2b_s34b_b79k",
            key="prereq_clip_pretrained",
        )

        pre_col_i, pre_col_j = st.columns(2)
        prereq_text_max_length = pre_col_i.number_input(
            "Text max length (pre-embed)",
            min_value=16,
            max_value=512,
            value=128,
            step=8,
            key="prereq_text_max",
        )
        prereq_batch_size = pre_col_j.number_input(
            "Batch size (pre-embed)",
            min_value=1,
            max_value=256,
            value=16,
            step=1,
            key="prereq_batch",
        )

        prereq_include_images = st.checkbox(
            "Include image embeddings (stored only, not used for scoring)",
            value=False,
            key="prereq_include_images",
        )

        if st.button("Embed collection", key="prereq_embed_button"):
            try:
                status = st.status("Embedding collection", expanded=True)
                resolved = _resolve_path(prereq_collection_path)
                if not resolved.exists():
                    raise FileNotFoundError(f"Collection not found: {prereq_collection_path}")

                raw = json.loads(resolved.read_text(encoding="utf-8"))
                if isinstance(raw, dict):
                    raw = raw.get("data") or raw.get("records") or raw
                if not isinstance(raw, list):
                    raise ValueError("Collection JSON must be a list of objects.")
                if not raw:
                    raise ValueError("Collection JSON is empty.")

                df = pd.DataFrame(raw)
                if prereq_desc_field not in df.columns:
                    raise ValueError(f"Missing description field: {prereq_desc_field}")

                texts = df[prereq_desc_field].fillna("").astype(str).tolist()
                if prereq_id_field in df.columns:
                    ids = df[prereq_id_field].fillna("").astype(str).tolist()
                else:
                    ids = [f"item-{i+1:04d}" for i in range(len(df))]

                device = "cuda" if fusion_mlp.torch.cuda.is_available() else "cpu"

                status.update(label="Embedding text", state="running")
                text_embs = fusion_mlp.embed_texts(
                    texts=texts,
                    model_name=prereq_text_model,
                    device=device,
                    batch_size=int(prereq_batch_size),
                    max_length=int(prereq_text_max_length),
                )
                text_feats = np.stack([text_embs[text] for text in texts]).astype("float32")

                image_paths = []
                image_feats = np.empty((0, 0), dtype="float32")
                if prereq_include_images:
                    if prereq_image_field not in df.columns:
                        raise ValueError(f"Missing image field: {prereq_image_field}")
                    image_paths = df[prereq_image_field].fillna("").astype(str).tolist()
                    status.update(label="Embedding images", state="running")
                    image_embs, image_dim, missing = fusion_mlp.embed_images(
                        image_paths,
                        clip_model_name=prereq_clip_model,
                        clip_pretrained=prereq_clip_pretrained,
                        device=device,
                        base_dir=resolved.parent,
                    )
                    zero_image = np.zeros(image_dim, dtype="float32")
                    image_feats = np.stack(
                        [image_embs.get(path, zero_image) for path in image_paths]
                    ).astype("float32")
                    if missing:
                        st.warning(
                            f"{len(missing)} image paths missing; "
                            f"zero embeddings used. Examples: {', '.join(missing[:5])}"
                        )

                prereq_output_path.parent.mkdir(parents=True, exist_ok=True)
                np.savez_compressed(
                    prereq_output_path,
                    ids=np.array(ids, dtype=object),
                    texts=np.array(texts, dtype=object),
                    text_embs=text_feats,
                    image_paths=np.array(image_paths, dtype=object),
                    image_embs=image_feats,
                    text_model=np.array([prereq_text_model], dtype=object),
                    clip_model=np.array([prereq_clip_model], dtype=object),
                    clip_pretrained=np.array([prereq_clip_pretrained], dtype=object),
                    desc_field=np.array([prereq_desc_field], dtype=object),
                    image_field=np.array([prereq_image_field], dtype=object),
                    id_field=np.array([prereq_id_field], dtype=object),
                )
                status.update(label="Collection embedded", state="complete")
                st.success(f"Saved embeddings to {prereq_output_path}")
            except Exception as exc:
                try:
                    status.update(label="Embedding failed", state="error")
                except Exception:
                    pass
                st.error(str(exc))

    st.header("Train fusion MLP (attributes + text + image)")
    st.write(
        "Train a multimodal fusion model on collection JSON using attributes "
        "(age/size/body_shape/skin_tone/occasion), Sentence-BERT text embeddings, "
        "and OpenCLIP image embeddings."
    )

    if fusion_mlp_error:
        st.info(f"Fusion MLP unavailable: {fusion_mlp_error}")
    else:
        fusion_data_path = Path(
            st.text_input(
                "Training data CSV/JSON path (fusion)",
                "main_train_data.csv",
                key="fusion_train_path",
                help=(
                    "CSV or JSON path. CSV can be the fusion training format (age, size, "
                    "body_shape, skin_tone, occasion, cloth_description or "
                    "clothing_description, image_path (local path or URL), score) or "
                    "main_train_data.csv format. "
                    "JSON collections are expanded into training rows automatically."
                ),
            )
        )
        fusion_artifacts_dir = Path(
            st.text_input(
                "Artifacts folder (fusion)",
                "artifacts",
                key="fusion_artifacts",
                help="Output directory for the trained model and preprocessing spec.",
            )
        )

        with st.expander("Preview training data (fusion)", expanded=False):
            if fusion_data_path.exists():
                try:
                    if fusion_data_path.suffix.lower() == ".json":
                        raw = json.loads(fusion_data_path.read_text(encoding="utf-8"))
                        if isinstance(raw, dict):
                            raw = raw.get("data") or raw.get("records") or raw
                        if isinstance(raw, list):
                            total_rows = len(raw)
                            st.caption(f"{total_rows} records loaded from {fusion_data_path}.")
                            max_preview = max(1, min(10, total_rows))
                            preview_rows = st.number_input(
                                "Preview records",
                                min_value=1,
                                max_value=max_preview,
                                value=min(5, max_preview),
                                step=1,
                                key="fusion_preview_rows_json",
                            )
                            st.json(raw[: int(preview_rows)])
                        else:
                            st.warning("Unsupported JSON format for preview.")
                    else:
                        df_preview = pd.read_csv(fusion_data_path)
                        total_rows = len(df_preview)
                        st.caption(f"{total_rows} rows loaded from {fusion_data_path}.")
                        max_preview = max(1, min(50, total_rows))
                        preview_rows = st.number_input(
                            "Preview rows",
                            min_value=1,
                            max_value=max_preview,
                            value=min(10, max_preview),
                            step=1,
                            key="fusion_preview_rows",
                        )
                        preview = df_preview.head(int(preview_rows)).copy()
                        show_cols = [
                            col
                            for col in [
                                "image_url",
                                "image_path",
                                "Image",
                                "image",
                                "age",
                                "size",
                                "body_shape",
                                "skin_tone",
                                "occasion",
                                "score",
                            ]
                            if col in preview.columns
                        ]
                        if show_cols:
                            st.dataframe(preview[show_cols], use_container_width=True)

                        image_col = next(
                            (
                                col
                                for col in ["image_url", "image_path", "Image", "image"]
                                if col in preview.columns
                            ),
                            None,
                        )
                        if image_col:
                            cols = st.columns(5)
                            for idx, row in preview.iterrows():
                                raw_path = str(row.get(image_col, "")).strip()
                                if not raw_path:
                                    cols[idx % 5].warning(f"Missing {image_col}")
                                    continue
                                caption = f"row {idx + 1}"
                                if "occasion" in preview.columns:
                                    caption = f"{caption} • {row.get('occasion', '')}"
                                if _is_url(raw_path):
                                    cols[idx % 5].image(raw_path, caption=caption, width=140)
                                    continue
                                img_path = Path(raw_path)
                                if not img_path.is_absolute():
                                    candidate = fusion_data_path.parent / img_path
                                    if candidate.exists():
                                        img_path = candidate
                                if img_path.exists():
                                    cols[idx % 5].image(
                                        str(img_path), caption=caption, width=140
                                    )
                                else:
                                    cols[idx % 5].warning(f"Missing: {raw_path}")
                except Exception as exc:
                    st.warning(str(exc))
            else:
                st.info(f"Training data not found at {fusion_data_path}.")

        with st.expander("Training sequence (fusion)", expanded=False):
            st.markdown(
                """
1. Load the training file and validate required fields.
2. Normalize categorical attributes and build tabular vectors.
3. Embed item descriptions with Sentence-BERT.
4. Embed item images with OpenCLIP.
5. Train the MLP and save artifacts.
"""
            )
            if fusion_data_path.exists():
                try:
                    rows = []
                    base_dir = fusion_data_path.parent
                    if fusion_data_path.suffix.lower() == ".json":
                        raw = json.loads(fusion_data_path.read_text(encoding="utf-8"))
                        if isinstance(raw, dict):
                            raw = raw.get("data") or raw.get("records") or raw
                        if isinstance(raw, list):
                            rows = raw
                    else:
                        df_sample = pd.read_csv(fusion_data_path)
                        rows = df_sample.to_dict(orient="records")

                    if rows:
                        sample_keys = set(rows[0].keys())
                        desc_key = next(
                            (
                                key
                                for key in ["cloth_description", "clothing_description", "description"]
                                if key in sample_keys
                            ),
                            None,
                        )
                        image_key = next(
                            (
                                key
                                for key in ["image_url", "image_path", "image", "Image"]
                                if key in sample_keys
                            ),
                            None,
                        )
                        if not desc_key and not image_key:
                            st.info("No image/text fields found for preview.")
                        else:
                            st.write("Sample image + text pairs (first 5):")
                            for item in rows[:5]:
                                cols = st.columns([1, 2])
                                img_path_raw = str(item.get(image_key, "")).strip() if image_key else ""
                                text_value = str(item.get(desc_key, "")).strip() if desc_key else ""

                                if img_path_raw:
                                    if _is_url(img_path_raw):
                                        cols[0].image(img_path_raw, width=140)
                                    else:
                                        img_path = Path(img_path_raw)
                                        if not img_path.is_absolute():
                                            candidate = base_dir / img_path
                                            if candidate.exists():
                                                img_path = candidate
                                        if img_path.exists():
                                            cols[0].image(str(img_path), width=140)
                                        else:
                                            cols[0].warning(f"Missing: {img_path_raw}")
                                else:
                                    cols[0].warning("Missing image")

                                if text_value:
                                    cols[1].write(text_value)
                                else:
                                    cols[1].warning("Missing description")
                except Exception as exc:
                    st.warning(str(exc))

        col_a, col_b, col_c = st.columns(3)
        fusion_text_model = col_a.text_input(
            "Sentence-BERT model", "all-MiniLM-L6-v2", key="fusion_text_model"
        )
        fusion_clip_model = col_b.text_input("OpenCLIP model", "ViT-B-32", key="fusion_clip_model")
        fusion_clip_pretrained = col_c.text_input(
            "OpenCLIP pretrained", "laion2b_s34b_b79k", key="fusion_clip_pretrained"
        )

        col_d, col_e, col_f = st.columns(3)
        fusion_epochs = col_d.number_input(
            "Epochs", min_value=1, max_value=100, value=10, step=1, key="fusion_epochs"
        )
        fusion_lr = col_e.number_input(
            "Learning rate",
            min_value=0.00001,
            max_value=0.1,
            value=0.001,
            step=0.0001,
            key="fusion_lr",
        )
        fusion_val_size = col_f.number_input(
            "Validation split",
            min_value=0.05,
            max_value=0.5,
            value=0.2,
            step=0.05,
            key="fusion_val_size",
            help="Fraction of rows held out for validation during training.",
        )
        if fusion_data_path.exists():
            try:
                split_df = fusion_mlp.load_data(fusion_data_path)
                total_rows = len(split_df)
                val_count = int(math.ceil(total_rows * float(fusion_val_size)))
                val_count = max(1, min(val_count, total_rows - 1))
                train_count = total_rows - val_count
                st.caption(
                    "Split preview (after expansion): "
                    f"{train_count} train / {val_count} validation "
                    f"(total {total_rows}, val={float(fusion_val_size):.2f})."
                )
            except Exception as exc:
                st.caption(f"Split preview unavailable: {exc}")
        else:
            st.caption("Split preview: training data file not found.")

        col_g, col_h, col_i = st.columns(3)
        fusion_batch_size = col_g.number_input(
            "Batch size", min_value=1, max_value=256, value=16, step=1, key="fusion_batch"
        )
        fusion_hidden_layers = col_h.text_input(
            "Hidden layers", "512,128", key="fusion_hidden_layers"
        )
        fusion_dropout = col_i.number_input(
            "Dropout", min_value=0.0, max_value=0.9, value=0.1, step=0.05, key="fusion_dropout"
        )
        col_j, col_k, col_l = st.columns(3)
        fusion_text_max_length = col_j.number_input(
            "Text max length", min_value=16, max_value=512, value=128, step=8, key="fusion_text_max"
        )
        fusion_age_divisor = col_k.number_input(
            "Age divisor",
            min_value=1.0,
            max_value=100.0,
            value=60.0,
            step=1.0,
            key="fusion_age_divisor",
            help="Age is normalized by this value before entering the MLP.",
        )
        fusion_seed = col_l.number_input(
            "Random seed (fusion)", min_value=0, max_value=10000, value=42, step=1, key="fusion_seed"
        )

        if st.button("Train fusion MLP", key="fusion_train_button"):
            try:
                status = st.status("Fusion MLP training", expanded=True)
                progress_messages = {
                    "loading_data": "Loading training data",
                    "building_attributes": "Building attribute vectors",
                    "embedding_text": "Embedding text (Sentence-BERT)",
                    "embedding_images": "Embedding images (OpenCLIP)",
                    "training_mlp": "Training MLP",
                    "saving_artifacts": "Saving model artifacts",
                }

                def _progress(step: str) -> None:
                    label = progress_messages.get(step, f"Running: {step}")
                    if step == "done":
                        status.update(label="Fusion MLP trained", state="complete")
                    else:
                        status.update(label=label, state="running")
                        status.write(label)

                hidden_layers = fusion_mlp.parse_hidden(fusion_hidden_layers)
                result = fusion_mlp.run_training(
                    data_path=fusion_data_path,
                    artifacts=fusion_artifacts_dir,
                    text_model=fusion_text_model,
                    clip_model=fusion_clip_model,
                    clip_pretrained=fusion_clip_pretrained,
                    epochs=int(fusion_epochs),
                    lr=float(fusion_lr),
                    val_size=float(fusion_val_size),
                    seed=int(fusion_seed),
                    batch_size=int(fusion_batch_size),
                    hidden=hidden_layers,
                    dropout=float(fusion_dropout),
                    text_max_length=int(fusion_text_max_length),
                    age_divisor=float(fusion_age_divisor),
                    progress_callback=_progress,
                )
                status.update(label="Fusion MLP trained", state="complete")
                st.success(f"Saved model to {result['artifacts']}.")
                st.json(result["metrics"])
            except Exception as exc:
                try:
                    status.update(label="Fusion MLP failed", state="error")
                except Exception:
                    pass
                st.error(str(exc))

    st.divider()
    st.header("Recommend from fashion collection (fusion)")
    st.write("Upload a user image, enter attributes, and score items from the collection.")

    if fusion_mlp_error:
        st.info(f"Fusion MLP unavailable: {fusion_mlp_error}")
    else:
        fusion_model_path = Path(
            st.text_input("Fusion model path", "artifacts/fusion_mlp.pt", key="fusion_model_path")
        )
        fusion_preprocess_path = Path(
            st.text_input(
                "Fusion preprocess path", "artifacts/fusion_preprocess.json", key="fusion_preprocess"
            )
        )
        fusion_collection_upload = st.file_uploader(
            "Collection JSON/CSV file (fusion)",
            type=["json", "csv"],
            key="fusion_collection_upload",
        )
        default_fusion_collection = _default_collection_path()
        fusion_collection_path = Path(
            st.text_input(
                "Collection JSON/CSV path (fusion)",
                default_fusion_collection,
                key="fusion_collection_path",
                help=(
                    "Path to a collection JSON list of items or main_train_data.csv. "
                    "CSV ignores Score and maps Description/Image/@Occasion fields."
                ),
            )
        )
        fusion_desc_col = st.text_input(
            "Description field (fusion)",
            "description",
            key="fusion_desc_col",
            help="Column name in the collection items used for text embeddings.",
        )
        fusion_id_field = st.text_input(
            "ID field (fusion)",
            "cloth_id",
            key="fusion_id_field",
            help="Field used to match precomputed embeddings to collection items.",
        )
        fusion_image_field = st.text_input(
            "Image field (fusion)",
            "image",
            key="fusion_image_field",
            help="Field with the image path or URL for each collection item.",
        )
        use_precomputed_embeddings = st.checkbox(
            "Use precomputed collection embeddings",
            value=False,
            key="fusion_use_precomputed",
            help="Loads embeddings saved from the Prerequisites section to skip runtime embedding.",
        )
        precomputed_embeddings_path = Path(
            st.text_input(
                "Precomputed embeddings path",
                "artifacts/collection_embeddings.npz",
                key="fusion_precomputed_path",
            )
        )

        def _load_fusion_collection():
            if fusion_collection_upload is not None:
                raw = fusion_collection_upload.getvalue()
                if fusion_collection_upload.name.lower().endswith(".csv"):
                    df = pd.read_csv(io.BytesIO(raw))
                    return fusion_mlp.collection_records_from_main_df(df)
                return json.loads(raw.decode("utf-8"))
            if fusion_collection_path.exists():
                if fusion_collection_path.suffix.lower() == ".csv":
                    df = pd.read_csv(fusion_collection_path)
                    return fusion_mlp.collection_records_from_main_df(df)
                return json.loads(fusion_collection_path.read_text(encoding="utf-8"))
            raise FileNotFoundError("Provide a collection JSON/CSV file or a valid path.")

        fusion_collection_data = None
        fusion_collection_error = None
        try:
            fusion_collection_data = _load_fusion_collection()
            if not isinstance(fusion_collection_data, list):
                raise ValueError("Collection JSON must be a list of objects.")
            if not fusion_collection_data:
                raise ValueError("Collection JSON is empty.")
        except Exception as exc:
            fusion_collection_error = str(exc)

        if fusion_collection_error:
            st.info(fusion_collection_error)

        spec = None
        spec_error = None
        if fusion_preprocess_path.exists():
            try:
                spec = fusion_mlp.load_preprocess_spec(fusion_preprocess_path)
            except Exception as exc:
                spec_error = str(exc)
        else:
            spec_error = f"Preprocess file not found at {fusion_preprocess_path}."

        if spec_error:
            st.info(spec_error)

        col_a, col_b, col_c = st.columns(3)
        age = col_a.number_input(
            "age",
            min_value=0,
            max_value=100,
            value=25,
            step=1,
            key="fusion_age",
            help="Numeric age used as a feature. It is normalized by the age divisor.",
        )

        size_options: list[str] = []
        body_options: list[str] = []
        skin_options: list[str] = []
        occasion_options: list[str] = []
        if spec and isinstance(spec.get("categories"), dict):
            size_options = [str(v) for v in spec["categories"].get("size", [])]
            body_options = [str(v) for v in spec["categories"].get("body_shape", [])]
            skin_options = [str(v) for v in spec["categories"].get("skin_tone", [])]
            occasion_options = [str(v) for v in spec["categories"].get("occasion", [])]

        size_options = _order_options(SIZE_ORDERED, size_options or SIZE_ORDERED)
        body_options = _order_options(BODY_SHAPE_ORDERED, body_options or BODY_SHAPE_ORDERED)
        skin_options = _order_options(SKIN_TONE_ORDERED, skin_options or SKIN_TONE_ORDERED)
        occasion_options = _order_options(OCCASION_ORDERED, occasion_options or OCCASION_ORDERED)

        size = col_b.selectbox(
            "size",
            size_options,
            key="fusion_size",
            help="Size category used in the MLP and optional attribute filter.",
            format_func=lambda value: _format_option(value, SIZE_DISPLAY),
            index=_option_index(size_options, "medium"),
        )

        body_shape = col_c.selectbox(
            "body_shape",
            body_options,
            key="fusion_body_shape",
            help="Body shape category used in the MLP and optional attribute filter.",
            format_func=lambda value: _format_option(value, BODY_SHAPE_DISPLAY),
            index=_option_index(body_options, "hourglass"),
        )

        skin_tone = st.selectbox(
            "skin_tone",
            skin_options,
            key="fusion_skin_tone",
            help="Skin tone category used in the MLP and optional attribute filter.",
            format_func=lambda value: _format_option(value, SKIN_TONE_DISPLAY),
            index=_option_index(skin_options, "medium"),
        )

        occasion = st.selectbox(
            "occasion",
            occasion_options,
            key="fusion_occasion",
            help="Occasion category used in the MLP and optional attribute filter.",
            format_func=lambda value: _format_option(value, OCCASION_DISPLAY),
            index=_option_index(occasion_options, "party"),
        )

        fusion_user_upload = st.file_uploader(
            "Upload user image (fusion)", type=["png", "jpg", "jpeg"], key="fusion_user_image"
        )
        user_image = None
        if fusion_user_upload is not None:
            user_image = Image.open(fusion_user_upload).convert("RGB")
            st.image(user_image, caption=fusion_user_upload.name, width=360)

        top_k = st.number_input(
            "Top K results (fusion)",
            min_value=1,
            max_value=100,
            value=5,
            step=1,
            key="fusion_top_k",
            help="How many items to return after scoring the collection.",
        )
        apply_priority_filter = st.checkbox(
            "Apply attribute filter (priority-weighted)",
            value=True,
            key="fusion_priority_filter",
            help=(
                "Filter collection items to those that contain your selected attributes. "
                "Priorities in the item metadata determine the match strength."
            ),
        )
        apply_priority_weight = st.checkbox(
            "Weight scores by attribute priorities",
            value=True,
            key="fusion_priority_weight",
            help="Adjust final scores by the attribute priorities defined in the collection items.",
        )

        if st.button("Recommend (fusion)", key="fusion_recommend_button"):
            if fusion_collection_error:
                st.error(fusion_collection_error)
            elif spec_error:
                st.error(spec_error)
            elif not fusion_model_path.exists():
                st.error(f"Model not found at {fusion_model_path}. Train first or update the path.")
            elif user_image is None:
                st.error("Upload a user image to score the collection.")
            else:
                try:
                    device = "cuda" if fusion_mlp.torch.cuda.is_available() else "cpu"
                    state = fusion_mlp.torch.load(fusion_model_path, map_location=device)
                    if "state_dict" not in state or "config" not in state:
                        raise ValueError("Unsupported fusion model format.")
                    config = state["config"]

                    text_model_name = config.get("text_model", "all-MiniLM-L6-v2")
                    clip_model_name = config.get("clip_model", "ViT-B-32")
                    clip_pretrained = config.get("clip_pretrained", "laion2b_s34b_b79k")
                    text_max_length = int(config.get("text_max_length", 128))

                    collection_records = fusion_collection_data
                    match_summary = None
                    matched_items = None
                    if apply_priority_filter:
                        user_filters = {
                            "occasion": _normalize_occasion_value(str(occasion)),
                            "body_shape": _normalize_body_shape_value(str(body_shape)),
                            "skin_tone": _normalize_skin_tone_value(str(skin_tone)),
                            "size": _normalize_size_value(str(size)),
                        }
                        filtered = []
                        match_summary = {
                            "occasion": {},
                            "body_shape": {},
                            "skin_tone": {},
                            "size": {},
                        }
                        for item in fusion_collection_data:
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
                            occ_priority = int(occ_priority)
                            shape_priority = int(shape_priority)
                            tone_priority = int(tone_priority)
                            size_priority = int(size_priority)
                            priority_score = (
                                0.4 * _priority_weight(occ_priority)
                                + 0.3 * _priority_weight(shape_priority)
                                + 0.2 * _priority_weight(tone_priority)
                                + 0.1 * _priority_weight(size_priority)
                            )
                            item_copy = dict(item)
                            item_copy["_priority_score"] = priority_score
                            item_copy["_occ_priority"] = occ_priority
                            item_copy["_shape_priority"] = shape_priority
                            item_copy["_tone_priority"] = tone_priority
                            item_copy["_size_priority"] = size_priority
                            filtered.append(item_copy)
                            match_summary["occasion"][occ_priority] = (
                                match_summary["occasion"].get(occ_priority, 0) + 1
                            )
                            match_summary["body_shape"][shape_priority] = (
                                match_summary["body_shape"].get(shape_priority, 0) + 1
                            )
                            match_summary["skin_tone"][tone_priority] = (
                                match_summary["skin_tone"].get(tone_priority, 0) + 1
                            )
                            match_summary["size"][size_priority] = (
                                match_summary["size"].get(size_priority, 0) + 1
                            )
                        if filtered:
                            collection_records = filtered
                            matched_items = filtered
                        else:
                            st.warning(
                                "No items matched the attribute filter; using full collection."
                            )
                            match_summary = None

                    df = pd.DataFrame(collection_records)
                    if fusion_desc_col not in df.columns:
                        raise ValueError(f"Missing description field: {fusion_desc_col}")
                    df = df.copy()
                    if fusion_id_field in df.columns:
                        df["id"] = df[fusion_id_field].astype(str)
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
                        summary = ", ".join(
                            f"{key}={sorted(set(vals))}" for key, vals in unknowns.items()
                        )
                        st.warning(f"Unknown categories not seen in training: {summary}")

                    texts = df[fusion_desc_col].astype(str).tolist()
                    text_feats = None
                    cache_error = None
                    if use_precomputed_embeddings:
                        if not precomputed_embeddings_path.exists():
                            cache_error = f"Precomputed embeddings not found at {precomputed_embeddings_path}."
                        else:
                            try:
                                cached = np.load(precomputed_embeddings_path, allow_pickle=True)
                                cached_text = cached["text_embs"] if "text_embs" in cached.files else None
                                cached_ids = cached["ids"] if "ids" in cached.files else None
                                cached_texts = cached["texts"] if "texts" in cached.files else None
                                if cached_text is None:
                                    raise ValueError("Precomputed file missing text embeddings.")
                                if cached_text.shape[0] != len(df):
                                    raise ValueError("Precomputed embeddings row count mismatch.")
                                if cached_ids is not None:
                                    cached_ids_list = [str(val) for val in cached_ids.tolist()]
                                    current_ids = df["id"].astype(str).tolist()
                                    if cached_ids_list != current_ids:
                                        raise ValueError("Precomputed embeddings do not match collection IDs.")
                                elif cached_texts is not None:
                                    cached_texts_list = [str(val) for val in cached_texts.tolist()]
                                    if cached_texts_list != texts:
                                        raise ValueError("Precomputed embeddings do not match collection text.")
                                text_feats = cached_text.astype("float32")
                            except Exception as exc:
                                cache_error = str(exc)

                    if text_feats is None:
                        if cache_error:
                            st.warning(f"Precomputed embeddings not used: {cache_error}")
                        text_embs = fusion_mlp.embed_texts(
                            texts=texts,
                            model_name=text_model_name,
                            device=device,
                            batch_size=16,
                            max_length=text_max_length,
                        )
                        text_feats = np.stack([text_embs[text] for text in texts]).astype("float32")

                    clip_model, _, preprocess = fusion_mlp.open_clip.create_model_and_transforms(
                        clip_model_name, pretrained=clip_pretrained
                    )
                    clip_model = clip_model.to(device)
                    clip_model.eval()
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

                    hidden_layers = tuple(int(v) for v in config.get("hidden", [512, 128]))
                    model = fusion_mlp.FusionMLP(
                        input_dim=expected_input,
                        hidden=hidden_layers,
                        dropout=float(config.get("dropout", 0.0)),
                    ).to(device)
                    model.load_state_dict(state["state_dict"])
                    model.eval()

                    with fusion_mlp.torch.no_grad():
                        scores = (
                            model(fusion_mlp.torch.from_numpy(features).to(device)).cpu().numpy()
                        )

                    df = df.copy()
                    df["score"] = scores
                    sort_col = "score"
                    if "priority_score" in df.columns and apply_priority_weight:
                        df["final_score"] = df["score"] * df["priority_score"]
                        sort_col = "final_score"
                    df = df.sort_values(sort_col, ascending=False)
                    df["rank"] = np.arange(1, len(df) + 1)
                    top_df = df.head(int(top_k)).copy()
                    if not top_df.empty:
                        total = len(top_df)
                        first_cut = math.ceil(total / 3)
                        second_cut = math.ceil(2 * total / 3)
                        labels = []
                        for idx in range(total):
                            if idx < first_cut:
                                labels.append("perfect for you")
                            elif idx < second_cut:
                                labels.append("good for you")
                            else:
                                labels.append("you can also try")
                        top_df["score_label"] = labels

                    show_cols = [
                        "rank",
                        "id",
                        "score_label",
                        sort_col,
                        "score",
                        "priority_score",
                        "final_score",
                        fusion_desc_col,
                    ]
                    seen = set()
                    show_cols = [c for c in show_cols if c in top_df.columns and not (c in seen or seen.add(c))]
                    st.dataframe(top_df[show_cols], use_container_width=True)

                    if apply_priority_filter and matched_items:
                        with st.expander("Attribute filter matches (P1/P2/P3)", expanded=False):
                            summary_df = _build_match_priority_summary(match_summary or {})
                            if not summary_df.empty:
                                st.dataframe(summary_df, use_container_width=True)
                            match_table = df.copy()
                            rename_map = {
                                "_occ_priority": "occasion_priority",
                                "_shape_priority": "body_shape_priority",
                                "_tone_priority": "skin_tone_priority",
                                "_size_priority": "size_priority",
                            }
                            for raw_col, display_col in rename_map.items():
                                if raw_col in match_table.columns:
                                    match_table[display_col] = match_table[raw_col]
                            match_cols = [
                                "rank",
                                "id",
                                "cloth_type",
                                "occasion",
                                "body_shape",
                                "skin_tone",
                                "sizes",
                                "occasion_priority",
                                "body_shape_priority",
                                "skin_tone_priority",
                                "size_priority",
                                "priority_score",
                                "score",
                                "final_score",
                            ]
                            match_cols = [c for c in match_cols if c in match_table.columns]
                            if match_cols:
                                st.dataframe(match_table[match_cols], use_container_width=True)

                    image_field = None
                    if fusion_image_field in top_df.columns:
                        image_field = fusion_image_field
                    else:
                        for candidate in ("image", "image_path"):
                            if candidate in top_df.columns:
                                image_field = candidate
                                break

                    if image_field:
                        if fusion_collection_path.exists():
                            collection_base = fusion_collection_path.resolve().parent
                        else:
                            collection_base = BASE_DIR

                        def _resolve_image_path(raw_path: str) -> str | None:
                            cleaned = str(raw_path).strip()
                            if not cleaned:
                                return None
                            if cleaned.startswith(("http://", "https://")):
                                return cleaned
                            img_path = Path(cleaned)
                            if img_path.is_absolute():
                                return str(img_path) if img_path.exists() else None
                            for base in (collection_base, BASE_DIR, Path.cwd()):
                                candidate = base / img_path
                                if candidate.exists():
                                    return str(candidate)
                            return None

                        st.write("Image previews")
                        img_cols = st.columns(3)
                        shown = 0
                        for _, row in top_df.iterrows():
                            img_path = _resolve_image_path(row.get(image_field, ""))
                            if not img_path:
                                continue
                            caption = str(row.get("id", "")).strip()
                            label = str(row.get("score_label", "")).strip()
                            if label:
                                caption = f"{caption} • {label}" if caption else label
                            img_cols[shown % 3].image(img_path, caption=caption or None, width=220)
                            shown += 1
                        if shown == 0:
                            st.info("No images found for the recommended items.")
                    else:
                        st.info("No image field found in the collection; set Image field (fusion).")
                except Exception as exc:
                    st.error(str(exc))


if __name__ == "__main__":
    render_streamlit_app()

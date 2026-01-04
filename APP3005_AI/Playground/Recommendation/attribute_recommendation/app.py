from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Dict, List, Optional, Sequence, Tuple

import importlib.util
import sys
import clip
import cv2
import numpy as np
import streamlit as st
import torch
from PIL import Image


BASE_DIR = Path(__file__).resolve().parent
EMBEDDED_PATH = BASE_DIR / "embedded_collection.json"
COLLECTION_PATH = BASE_DIR / "collection.json"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

SKIN_TONES = [
    {"id": "light", "label": "Light (Honey)", "hex": "#f3d4b3"},
    {"id": "medium", "label": "Medium (Wheat)", "hex": "#ddb08a"},
    {"id": "tan", "label": "Tan (Almond)", "hex": "#c18c68"},
    {"id": "dusky", "label": "Dusky (Caramel)", "hex": "#a56b4d"},
    {"id": "deep", "label": "Deep (Mocha)", "hex": "#7c4f32"},
]


@dataclass
class UserProfile:
    age: int
    gender: str
    height_cm: int
    body_type: str
    skin_tone: str
    skin_hex: Optional[str] = None
    skin_label: Optional[str] = None

    @property
    def height_bucket(self) -> str:
        if self.height_cm < 160:
            return "petite"
        if self.height_cm < 175:
            return "average"
        return "tall"


@st.cache_resource
def load_clip_model(model_name: str = "ViT-B/32"):
    model, preprocess = clip.load(model_name, device=DEVICE)
    model.eval()
    return model, preprocess


@st.cache_resource
def load_catalog(path: Path = EMBEDDED_PATH):
    if not path.exists():
        raise FileNotFoundError(f"Embedded catalog missing at {path}")
    try:
        text = path.read_text(encoding="utf-8")
        payload = json.loads(text)
    except Exception as exc:
        raise ValueError(f"Failed to read embedded catalog JSON at {path}: {exc}") from exc
    if not payload:
        raise ValueError(f"Embedded catalog JSON is empty at {path}")

    warmth_values = [
        item.get("color_vector", {}).get("warmth")
        for item in payload
        if item.get("color_vector", {}).get("warmth") is not None
    ]
    warmth_bands = compute_warmth_bands(warmth_values)
    return payload, warmth_bands


@st.cache_data
def load_collection(path: Path = COLLECTION_PATH):
    if not path.exists():
        raise FileNotFoundError(f"Collection JSON missing at {path}")
    try:
        text = path.read_text(encoding="utf-8")
        payload = json.loads(text)
    except Exception as exc:
        raise ValueError(f"Failed to read collection JSON at {path}: {exc}") from exc
    if not payload:
        raise ValueError(f"Collection JSON is empty at {path}")
    return payload


def load_embedding_module():
    """Load embedding.py from ModelDemo so we can rebuild embeddings in-app."""
    candidates = []
    for root in [BASE_DIR] + list(BASE_DIR.parents):
        candidates.append(root / "ModelDemo" / "embedding.py")
        candidates.append(root / "embedding.py")

    module_path = next((c for c in candidates if c.exists()), None)
    if module_path is None:
        raise FileNotFoundError("Could not find embedding.py (looked under ModelDemo/ and current tree).")

    spec = importlib.util.spec_from_file_location("attribute_embedding_module", module_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load spec for {module_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules["attribute_embedding_module"] = module
    spec.loader.exec_module(module)
    return module


def hex_to_lab(hex_code: str) -> np.ndarray:
    """Convert a hex color to LAB for palette comparison."""
    hex_code = hex_code.lstrip("#")
    r, g, b = tuple(int(hex_code[i : i + 2], 16) for i in (0, 2, 4))
    rgb = np.uint8([[[r, g, b]]])
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)[0, 0]
    return lab.astype(float)


def skin_match_score(color_vector: Optional[Dict], skin_lab: Optional[np.ndarray]) -> Tuple[Optional[float], Optional[float]]:
    if not color_vector or skin_lab is None:
        return None, None
    palette = color_vector.get("palette_lab")
    weights = color_vector.get("palette_weight") or []
    if not palette:
        return None, None

    weights = weights or [1.0 / len(palette)] * len(palette)
    best = None
    for lab, w in zip(palette, weights):
        dist = np.linalg.norm(np.array(lab) - skin_lab)
        adjusted = dist * (1 - min(max(w, 0.0), 1.0) * 0.4)
        best = adjusted if best is None or adjusted < best else best

    # Normalize to 0..1 where 1 is closest (0 distance) and 0 at ~180 apart.
    max_dist = 180.0
    score = max(0.0, 1.0 - min(best, max_dist) / max_dist) if best is not None else None
    return score, best


def simple_build_embedded_catalog(
    collection_path: Path,
    output_path: Path,
    model_name: str = "ViT-B/32",
    progress_callback: Optional[Callable[[int, int, str], None]] = None,
) -> int:
    """Minimal fallback: build style embeddings only using CLIP from the collection.json."""
    collection_path = Path(collection_path)
    catalog = load_collection(collection_path)

    model, preprocess = load_clip_model(model_name)
    embedded = []
    total = len(catalog)
    for idx, item in enumerate(catalog, start=1):
        item_id = item.get("item_id", "unknown")
        image_path_str = item.get("image_path") or ""
        resolved = resolve_image_path(image_path_str)
        if not resolved or not resolved.exists():
            raise FileNotFoundError(f"Image not found for {item_id}: {image_path_str}")

        image = preprocess(Image.open(resolved).convert("RGB")).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            style_vec = model.encode_image(image)
            style_vec = style_vec / style_vec.norm(dim=-1, keepdim=True)
        embedded.append(
            {
                **item,
                "style_embedding": style_vec.cpu().numpy()[0].tolist(),
            }
        )
        if progress_callback:
            progress_callback(idx, total, item_id)

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(embedded, indent=2), encoding="utf-8")
    return len(embedded)


def rebuild_embeddings(
    collection_path: Path,
    output_path: Path,
    model_name: str = "ViT-B/32",
    progress_callback: Optional[Callable[[int, int, str], None]] = None,
):
    try:
        module = load_embedding_module()
        module.build_embedded_catalog(
            catalog_path=collection_path,
            output_path=output_path,
            image_root=None,
            model_name=model_name,
        )
        return "full"
    except Exception:
        # Fallback to the simple builder (style embeddings only).
        simple_build_embedded_catalog(
            collection_path,
            output_path,
            model_name=model_name,
            progress_callback=progress_callback,
        )
        return "fallback"


def compute_warmth_bands(values: Sequence[float]) -> Optional[Tuple[float, float]]:
    if not values:
        return None
    sorted_vals = sorted(values)
    low_idx = max(0, int(len(sorted_vals) * 0.33) - 1)
    high_idx = max(0, int(len(sorted_vals) * 0.66) - 1)
    return sorted_vals[low_idx], sorted_vals[high_idx]


def build_preference_vector(user: UserProfile, model) -> torch.Tensor:
    body_phrase = {
        "slim": "slim build",
        "medium": "balanced or athletic build",
        "curvy": "curvy build",
    }.get(user.body_type, "balanced build")

    skin_desc = user.skin_label or user.skin_tone
    if user.skin_hex:
        skin_desc = f"{skin_desc} ({user.skin_hex})"

    prompt = (
        f"stylish {user.gender} outfit for a {user.height_bucket} height and a {body_phrase}; "
        f"flattering for {skin_desc} skin tone; age {user.age}; everyday wearable clothing"
    )
    tokens = clip.tokenize(prompt).to(DEVICE)
    with torch.no_grad():
        features = model.encode_text(tokens)
        features = features / features.norm(dim=-1, keepdim=True)
    return features[0]


def _score_body_type(body_type: str, silhouette: Optional[str], tags: List[str], waist_focus: bool, notes: List[str]) -> float:
    score = 0.0
    if body_type == "slim":
        if silhouette in ("bodycon", "mermaid"):
            score += 0.35
            notes.append("Suits slim builds (bodycon/mermaid)")
        if "bodycon" in tags:
            score += 0.1
    elif body_type == "medium":
        if silhouette in ("wrap", "a_line", "peplum"):
            score += 0.3
            notes.append("Wrap/A-line works for balanced frames")
        if waist_focus:
            score += 0.1
    elif body_type == "curvy":
        if silhouette in ("a_line", "wrap", "peplum", "empire"):
            score += 0.35
            notes.append("A-line/empire gives room for curves")
        if waist_focus:
            score += 0.15
            notes.append("Waist focus flatters curves")
    return score


def _score_height(height_bucket: str, length: Optional[str], notes: List[str]) -> float:
    score = 0.0
    if height_bucket == "petite":
        if length in ("mini", "short"):
            score += 0.25
            notes.append("Short length boosts petite height")
        if length == "maxi":
            score -= 0.15
    elif height_bucket == "tall":
        if length in ("maxi", "midi", "long"):
            score += 0.2
            notes.append("Midi/maxi matches tall frames")
        if length in ("mini", "short"):
            score -= 0.05
    else:  # average
        if length in ("knee", "midi"):
            score += 0.1
    return score


def attribute_match_score(item: Dict, user: UserProfile, skin_lab: Optional[np.ndarray]) -> Tuple[float, List[str], Optional[float]]:
    attrs = item.get("attributes", {}) or {}
    tags = attrs.get("tags", []) or []
    silhouette = attrs.get("silhouette")
    length = attrs.get("length")
    waist_focus = bool(attrs.get("waist_focus"))

    score = 0.0
    notes: List[str] = []

    if item.get("gender") in (user.gender, "unisex"):
        score += 0.25
    elif item.get("gender"):
        score -= 0.15

    score += _score_body_type(user.body_type, silhouette, tags, waist_focus, notes)
    score += _score_height(user.height_bucket, length, notes)

    best_skin_dist = None
    if skin_lab is not None and item.get("color_vector"):
        skin_match, best_skin_dist = skin_match_score(item.get("color_vector"), skin_lab)
        if skin_match is not None:
            score += 0.2 * skin_match
            if skin_match >= 0.55:
                notes.append("Palette suits selected skin tone")
            else:
                notes.append("Palette partially suits selected skin tone")

    if user.age < 28 and length in ("mini", "short"):
        score += 0.05
    if user.age > 45 and length in ("mini", "short"):
        score -= 0.1

    score = max(-1.0, min(score, 1.0))
    return score, notes, best_skin_dist


def resolve_image_path(image_path: str) -> Optional[Path]:
    path = Path(image_path)
    candidates = [
        (BASE_DIR / path).resolve(),
        (BASE_DIR.parent / path).resolve(),
        (BASE_DIR.parent / "Data" / path).resolve(),
    ]

    if path.parts and path.parts[0] == "..":
        trimmed = Path(*path.parts[1:])
        candidates.append((BASE_DIR / trimmed).resolve())
        candidates.append((BASE_DIR.parent / trimmed).resolve())

    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def recommend_outfits(
    user: UserProfile,
    catalog: List[Dict],
    preference_vector: torch.Tensor,
    skin_lab: Optional[np.ndarray],
) -> List[Dict]:
    results = []
    for item in catalog:
        style_vec = torch.tensor(item["style_embedding"], device=DEVICE, dtype=torch.float32)
        style_vec = style_vec / style_vec.norm(dim=-1, keepdim=True)
        clip_score = float(torch.dot(style_vec, preference_vector).item())

        attr_score, attr_notes, best_skin_dist = attribute_match_score(item, user, skin_lab)

        total = 0.7 * clip_score + 0.3 * attr_score
        results.append(
            {
                "item": item,
                "score": total,
                "clip_score": clip_score,
                "attr_score": attr_score,
                "skin_distance": best_skin_dist,
                "notes": attr_notes,
            }
        )

    results.sort(key=lambda x: x["score"], reverse=True)
    return results


def render_collection_preview(collection: List[Dict]):
    st.subheader("Collection preview (first 12 items)")
    rows = []
    for item in collection[:12]:
        attrs = item.get("attributes") or {}
        rows.append(
            {
                "item_id": item.get("item_id"),
                "category": item.get("category"),
                "gender": item.get("gender"),
                "silhouette": attrs.get("silhouette", ""),
                "length": attrs.get("length", ""),
                "tags": ", ".join(sorted(attrs.get("tags", [])[:4])),
            }
        )
    st.dataframe(rows, use_container_width=True, hide_index=True)


def render_recommendations(results: List[Dict], top_k: int):
    if not results:
        st.info("No items scored. Check that the embedded catalog exists.")
        return

    for rec in results[:top_k]:
        item = rec["item"]
        attrs = item.get("attributes", {}) or {}
        image_path = resolve_image_path(item.get("image_path", ""))

        col1, col2 = st.columns([1, 2])
        with col1:
            if image_path and image_path.exists():
                st.image(Image.open(image_path), use_column_width=True)
            else:
                st.write("Image missing")
        with col2:
            st.subheader(f"{item.get('item_id')} — {item.get('category', '').title()}")
            st.markdown(
                f"Score **{rec['score']:.3f}** "
                f"(style {rec['clip_score']:.3f} + fit {rec['attr_score']:.3f})"
            )
            skin_dist = rec.get("skin_distance")
            if skin_dist is None:
                skin_match = "n/a"
            elif skin_dist < 35:
                skin_match = "close"
            elif skin_dist < 60:
                skin_match = "fair"
            else:
                skin_match = "weak"
            st.caption(
                f"Silhouette: {attrs.get('silhouette', 'n/a')}, "
                f"Length: {attrs.get('length', 'n/a')}, "
                f"Skin match: {skin_match}"
            )
            if attrs.get("tags"):
                st.write("Tags:", ", ".join(sorted(attrs["tags"])))
            if rec["notes"]:
                st.write("Fit notes:", "; ".join(rec["notes"]))


def render_item_preview(item: Dict):
    attrs = item.get("attributes") or {}
    image_path = resolve_image_path(item.get("image_path", ""))
    col1, col2 = st.columns([1, 2])
    with col1:
        if image_path and image_path.exists():
            st.image(Image.open(image_path), use_column_width=True)
        else:
            st.write("Image missing")
    with col2:
        st.subheader(f"{item.get('item_id')} — {item.get('category', '').title()}")
        st.write(f"Gender: {item.get('gender', 'n/a')}")
        st.write(f"Silhouette: {attrs.get('silhouette', 'n/a')}, Length: {attrs.get('length', 'n/a')}")
        if attrs.get("tags"):
            st.write("Tags:", ", ".join(sorted(attrs["tags"])))
        if item.get("color_vector", {}).get("palette_hex"):
            st.write("Palette:", ", ".join(item["color_vector"]["palette_hex"]))


def main():
    st.set_page_config(page_title="Attribute recommender", layout="wide")
    st.title("Attribute-driven Outfit Recommender")
    st.write(
        "Pick attributes (age, gender, height, body type, skin tone) to score outfits. "
        "CLIP text-image similarity handles style alignment, while attribute heuristics "
        "nudge toward body-type and palette matches."
    )

    try:
        collection = load_collection()
    except (FileNotFoundError, ValueError) as exc:
        collection = None
        st.warning(str(exc))

    catalog = None
    warmth_bands = None
    try:
        catalog, warmth_bands = load_catalog()
    except (FileNotFoundError, ValueError) as exc:
        st.warning(str(exc))

    skin_lab = None

    with st.sidebar:
        st.markdown("**Catalog**")
        has_catalog = catalog is not None
        st.write(
            f"{len(catalog)} items loaded from `{EMBEDDED_PATH.name}`"
            if has_catalog
            else f"Missing `{EMBEDDED_PATH.name}`"
        )
        preview_clicked = st.button("Preview collection", use_container_width=True, disabled=collection is None)
        rebuild_label = "Build embeddings" if not has_catalog else "Rebuild embeddings"
        rebuild_clicked = st.button(
            rebuild_label,
            use_container_width=True,
            disabled=collection is None,
        )
        reload_clicked = st.button(
            "Load embeddings",
            use_container_width=True,
            disabled=not EMBEDDED_PATH.exists(),
        )
        top_k = st.slider("Results to show", min_value=3, max_value=12, value=6, step=1)

        st.markdown("---")
        st.markdown("**User profile**")
        gender = st.selectbox("Gender", options=["women", "men", "unisex"], index=0)
        age = st.slider("Age", min_value=16, max_value=70, value=28, step=1)
        height_cm = st.slider("Height (cm)", min_value=145, max_value=190, value=165, step=1)
        body_type = st.selectbox(
            "Body type",
            options=[("slim", "Slim / lean"), ("medium", "Medium / athletic"), ("curvy", "Curvy / full")],
            format_func=lambda choice: choice[1],
            index=1,
        )[0]
        skin_choice = st.selectbox(
            "Skin tone (default Indian palette)",
            options=SKIN_TONES,
            format_func=lambda choice: f"{choice['label']} {choice['hex']}",
            index=2,
        )
        skin_tone = skin_choice["id"]
        skin_lab = hex_to_lab(skin_choice["hex"])

        run_clicked = st.button("Recommend outfits", type="primary")

    if rebuild_clicked:
        if collection is None:
            st.error("Cannot rebuild embeddings: collection.json is missing.")
        else:
            progress = st.progress(0.0, text="Preparing to embed...")
            def _cb(done: int, total: int, item_id: str):
                frac = done / max(total, 1)
                progress.progress(frac, text=f"Embedding {item_id} ({done}/{total})")

            with st.spinner("Rebuilding embeddings from collection.json..."):
                mode = rebuild_embeddings(COLLECTION_PATH, EMBEDDED_PATH, progress_callback=_cb)
            load_catalog.clear()
            try:
                catalog, warmth_bands = load_catalog()
                st.success(
                    f"Embeddings written to {EMBEDDED_PATH.name} "
                f"({'fallback' if mode == 'fallback' else 'full pipeline'})"
            )
            except Exception as exc:
                st.error(f"Embeddings built but failed to reload: {exc}")
            progress.empty()
    elif reload_clicked:
        load_catalog.clear()
        try:
            catalog, warmth_bands = load_catalog()
            st.success(f"Reloaded {len(catalog)} items from {EMBEDDED_PATH.name}.")
        except Exception as exc:
            st.error(f"Failed to load embeddings: {exc}")

    if preview_clicked and collection:
        render_collection_preview(collection)

    if not catalog:
        st.info("Click **Build embeddings** to generate the embedded catalog, then rerun recommendations.")
        return

    if catalog:
        with st.expander("Browse & preview collection"):
            item_ids = [item.get("item_id") for item in catalog]
            selected_id = st.selectbox("Select an item to view", options=item_ids)
            chosen = next((itm for itm in catalog if itm.get("item_id") == selected_id), None)
            if chosen:
                render_item_preview(chosen)

    if not run_clicked:
        st.info("Select your attributes in the sidebar and click **Recommend outfits**.")
        return

    user = UserProfile(
        age=age,
        gender=gender,
        height_cm=height_cm,
        body_type=body_type,
        skin_tone=skin_tone,
        skin_hex=skin_choice["hex"],
        skin_label=skin_choice["label"],
    )

    with st.spinner("Scoring the catalog..."):
        model, _ = load_clip_model()
        preference_vector = build_preference_vector(user, model)
        results = recommend_outfits(user, catalog, preference_vector, skin_lab)

    render_recommendations(results, top_k)


if __name__ == "__main__":
    main()

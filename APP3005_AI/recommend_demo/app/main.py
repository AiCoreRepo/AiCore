import colorsys
import json
from pathlib import Path
from typing import List

import joblib
import numpy as np
import pandas as pd
import streamlit as st
from PIL import Image

if st.runtime.exists():
    st.set_page_config(page_title="Folder-based labeler", layout="centered")

IMAGE_EXTS = {".png", ".jpg", ".jpeg"}

def _mediapipe():
    try:
        import mediapipe as mp
    except Exception as exc:
        raise RuntimeError(
            "Mediapipe is required for image analysis. Install dependencies via `uv sync`."
        ) from exc
    if not hasattr(mp, "solutions"):
        try:
            import mediapipe.python.solutions as solutions
        except Exception as exc:
            raise RuntimeError(
                "Mediapipe is installed but missing `solutions`. Reinstall mediapipe."
            ) from exc
        mp.solutions = solutions
    return mp


@st.cache_resource
def _pose_model():
    mp = _mediapipe()
    return mp.solutions.pose.Pose(
        static_image_mode=True,
        model_complexity=2,
        enable_segmentation=True,
        min_detection_confidence=0.6,
    )


@st.cache_resource
def _face_model():
    mp = _mediapipe()
    return mp.solutions.face_detection.FaceDetection(
        model_selection=1,
        min_detection_confidence=0.6,
    )


@st.cache_resource
def _segmentation_model():
    mp = _mediapipe()
    return mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=1)


def _resize_for_analysis(image, max_dim=1024):
    width, height = image.size
    scale = min(1.0, max_dim / float(max(width, height)))
    if scale < 1.0:
        return image.resize((int(width * scale), int(height * scale)), Image.BICUBIC)
    return image


def _center_crop(rgb, frac=0.6):
    height, width = rgb.shape[:2]
    crop_w = max(1, int(width * frac))
    crop_h = max(1, int(height * frac))
    x0 = (width - crop_w) // 2
    y0 = (height - crop_h) // 2
    return rgb[y0 : y0 + crop_h, x0 : x0 + crop_w]


def _face_bbox(detections, image_shape):
    if not detections:
        return None, None
    height, width = image_shape[:2]
    best = max(detections, key=lambda d: float(d.score[0]) if d.score else 0.0)
    bbox = best.location_data.relative_bounding_box
    x0 = int(max(bbox.xmin, 0.0) * width)
    y0 = int(max(bbox.ymin, 0.0) * height)
    x1 = int(min(bbox.xmin + bbox.width, 1.0) * width)
    y1 = int(min(bbox.ymin + bbox.height, 1.0) * height)
    if x1 <= x0 or y1 <= y0:
        return None, None
    area_ratio = (x1 - x0) * (y1 - y0) / float(width * height)
    return (x0, y0, x1, y1), area_ratio


def _crop_face(rgb, bbox):
    x0, y0, x1, y1 = bbox
    dx = int((x1 - x0) * 0.2)
    dy = int((y1 - y0) * 0.2)
    x0 = max(x0 + dx, 0)
    y0 = max(y0 + dy, 0)
    x1 = min(x1 - dx, rgb.shape[1])
    y1 = min(y1 - dy, rgb.shape[0])
    if x1 <= x0 or y1 <= y0:
        return None
    return rgb[y0:y1, x0:x1]


def _luma(rgb):
    r = rgb[..., 0].astype(np.float32)
    g = rgb[..., 1].astype(np.float32)
    b = rgb[..., 2].astype(np.float32)
    return 0.299 * r + 0.587 * g + 0.114 * b


def _skin_mask(rgb, strict=True):
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
    cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
    mask = (cb >= 77) & (cb <= 127) & (cr >= 133) & (cr <= 173)
    if strict:
        max_rgb = np.maximum.reduce([r, g, b])
        min_rgb = np.minimum.reduce([r, g, b])
        mask &= (r > 95) & (g > 40) & (b > 20)
        mask &= (max_rgb - min_rgb > 15)
        mask &= (np.abs(r - g) > 15)
        mask &= (r > g) & (r > b)
    return mask


def _skin_tone_label(rgb):
    r, g, b = rgb
    luma_median = 0.299 * r + 0.587 * g + 0.114 * b
    if luma_median >= 170:
        return "light"
    if luma_median >= 125:
        return "medium"
    return "deep"


def _median_rgb(rgb, mask=None):
    if mask is None or int(mask.sum()) == 0:
        values = rgb.reshape(-1, 3)
    else:
        values = rgb[mask]
    return np.median(values, axis=0)


def _rgb_to_hex(rgb):
    r, g, b = [int(np.clip(x, 0, 255)) for x in rgb]
    return f"#{r:02x}{g:02x}{b:02x}"


def _skin_palette(rgb):
    r, g, b = [x / 255.0 for x in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    offsets = (-0.12, 0.0, 0.12)
    shades = []
    for offset in offsets:
        nl = min(max(l + offset, 0.05), 0.95)
        nr, ng, nb = colorsys.hls_to_rgb(h, nl, s)
        shades.append(_rgb_to_hex((nr * 255, ng * 255, nb * 255)))
    return shades


def _estimate_skin_tone(rgb, face_bbox, person_mask):
    roi = None
    roi_person_mask = None
    if face_bbox:
        roi = _crop_face(rgb, face_bbox)
    if roi is None and person_mask is not None:
        ys, xs = np.where(person_mask)
        if xs.size:
            x0, x1 = xs.min(), xs.max()
            y0, y1 = ys.min(), ys.max()
            roi = rgb[y0 : y1 + 1, x0 : x1 + 1]
            roi_person_mask = person_mask[y0 : y1 + 1, x0 : x1 + 1]
    if roi is None:
        roi = _center_crop(rgb, 0.6)

    min_pixels = max(200, int(roi.shape[0] * roi.shape[1] * 0.01))
    skin_mask = _skin_mask(roi, strict=True)
    if int(skin_mask.sum()) < min_pixels:
        skin_mask = _skin_mask(roi, strict=False)
    if int(skin_mask.sum()) < min_pixels:
        skin_mask = None

    if skin_mask is None and roi_person_mask is not None and int(roi_person_mask.sum()) >= min_pixels:
        base_rgb = _median_rgb(roi, roi_person_mask)
    else:
        base_rgb = _median_rgb(roi, skin_mask)

    label = _skin_tone_label(base_rgb)
    palette = _skin_palette(base_rgb)
    return label, palette


def _mask_width(mask, y_center, band_frac=0.05):
    if mask is None or y_center is None:
        return None
    height, width = mask.shape
    y_center = int(np.clip(y_center, 0, height - 1))
    half_band = max(1, int(band_frac * height))
    y0 = max(0, y_center - half_band)
    y1 = min(height - 1, y_center + half_band)
    widths = []
    for row in range(y0, y1 + 1):
        xs = np.where(mask[row])[0]
        if xs.size:
            widths.append(xs.max() - xs.min())
    if not widths:
        return None
    return float(np.median(widths))


def _estimate_body_shape(landmarks, mask, image_shape):
    if mask is None:
        return "other"
    height, width = image_shape[:2]
    ys = np.where(mask)[0]
    if ys.size == 0:
        return "other"
    top = ys.min()
    bottom = ys.max()
    body_height = bottom - top
    if body_height <= 0:
        return "other"

    shoulder_y = None
    hip_y = None
    if landmarks:
        mp = _mediapipe()
        lm = landmarks.landmark

        def _y(idx):
            point = lm[idx]
            if point.visibility < 0.5:
                return None
            return point.y * height

        left_shoulder = _y(mp.solutions.pose.PoseLandmark.LEFT_SHOULDER)
        right_shoulder = _y(mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER)
        if left_shoulder is not None and right_shoulder is not None:
            shoulder_y = (left_shoulder + right_shoulder) / 2.0

        left_hip = _y(mp.solutions.pose.PoseLandmark.LEFT_HIP)
        right_hip = _y(mp.solutions.pose.PoseLandmark.RIGHT_HIP)
        if left_hip is not None and right_hip is not None:
            hip_y = (left_hip + right_hip) / 2.0

    if shoulder_y is None:
        shoulder_y = top + body_height * 0.25
    if hip_y is None:
        hip_y = top + body_height * 0.65
    waist_y = shoulder_y + 0.5 * (hip_y - shoulder_y)

    # Use silhouette widths at shoulder/waist/hip bands to estimate ratios.
    shoulder_w = _mask_width(mask, shoulder_y)
    waist_w = _mask_width(mask, waist_y)
    hip_w = _mask_width(mask, hip_y)
    if not shoulder_w or not waist_w or not hip_w:
        return "other"

    if min(shoulder_w, waist_w, hip_w) < 0.08 * width:
        return "other"

    shoulders = shoulder_w
    waist = waist_w
    hips = hip_w

    balance = abs(shoulders - hips) / max(shoulders, hips)
    waist_ratio = waist / ((shoulders + hips) / 2.0)

    if balance <= 0.12 and waist_ratio <= 0.78:
        return "hourglass"
    if hips >= shoulders * 1.12 and waist <= hips * 0.92:
        return "pear"
    if shoulders >= hips * 1.12 and waist <= shoulders * 0.92:
        return "inverted_triangle"
    if waist >= max(shoulders, hips) * 1.05:
        return "apple"
    if balance <= 0.15 and abs(waist - shoulders) / max(waist, shoulders) <= 0.15:
        return "rectangle"
    if shoulders > hips * 1.05:
        return "inverted_triangle"
    if hips > shoulders * 1.05:
        return "pear"
    return "rectangle"


def _has_full_body(landmarks, mask, image_shape, face_area_ratio):
    height, width = image_shape[:2]
    if face_area_ratio is not None and face_area_ratio > 0.2:
        return False

    full_body = False
    if landmarks:
        mp = _mediapipe()
        lm = landmarks.landmark
        hips = [
            mp.solutions.pose.PoseLandmark.LEFT_HIP,
            mp.solutions.pose.PoseLandmark.RIGHT_HIP,
        ]
        legs = [
            mp.solutions.pose.PoseLandmark.LEFT_KNEE,
            mp.solutions.pose.PoseLandmark.RIGHT_KNEE,
            mp.solutions.pose.PoseLandmark.LEFT_ANKLE,
            mp.solutions.pose.PoseLandmark.RIGHT_ANKLE,
        ]
        hips_visible = all(lm[idx].visibility > 0.5 for idx in hips)
        legs_visible = sum(1 for idx in legs if lm[idx].visibility > 0.5)
        full_body = hips_visible and legs_visible >= 2

    if mask is not None:
        ys = np.where(mask)[0]
        if ys.size == 0:
            return False
        top = ys.min()
        bottom = ys.max()
        body_height = (bottom - top) / float(height)
        if bottom < 0.85 * height or body_height < 0.55:
            return False
        if not landmarks:
            full_body = True

    return full_body


def analyze_user_image(image):
    try:
        pose = _pose_model()
        face = _face_model()
        seg = _segmentation_model()
    except RuntimeError as exc:
        return {"error": str(exc)}

    image = _resize_for_analysis(image)
    rgb = np.array(image.convert("RGB"))

    pose_results = pose.process(rgb)
    face_results = face.process(rgb)
    seg_results = seg.process(rgb)

    mask = None
    if seg_results and seg_results.segmentation_mask is not None:
        mask = seg_results.segmentation_mask > 0.1
    elif pose_results and pose_results.segmentation_mask is not None:
        mask = pose_results.segmentation_mask > 0.1

    face_bbox, face_ratio = _face_bbox(
        face_results.detections if face_results else None, rgb.shape
    )
    skin_label, skin_hexes = _estimate_skin_tone(rgb, face_bbox, mask)

    landmarks = pose_results.pose_landmarks if pose_results else None
    full_body = _has_full_body(landmarks, mask, rgb.shape, face_ratio)

    body_shape = None
    if full_body:
        body_shape = _estimate_body_shape(landmarks, mask, rgb.shape)

    return {
        "skin_tone_label": skin_label,
        "skin_hexes": skin_hexes,
        "body_shape": body_shape,
        "full_body": full_body,
    }



def list_images(folder: Path) -> List[Path]:
    if not folder.exists():
        return []
    return sorted(p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS)


def ensure_state():
    if "person_idx" not in st.session_state:
        st.session_state.person_idx = 0
    if "garment_idx" not in st.session_state:
        st.session_state.garment_idx = 0


def append_label(person_path: Path, garment_path: Path, label: int, csv_path: Path):
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    header_needed = not csv_path.exists()
    with csv_path.open("a", encoding="utf-8") as f:
        if header_needed:
            f.write("person_path,garment_path,label\n")
        f.write(f"{person_path},{garment_path},{label}\n")


def render_streamlit_app():
    st.title("Label pairs from folders")
    st.write(
        "Point to a folder of person images and a folder of garment images. "
        "The app iterates person × garment so you can label each pair as Looks good / Not good."
    )
    
    person_dir = Path(st.text_input("Person images folder", "data/persons"))
    garment_dir = Path(st.text_input("Garment images folder", "data/garments"))
    pairs_csv = Path(st.text_input("Output CSV path", "data/pairs.csv"))
    
    persons = list_images(person_dir)
    garments = list_images(garment_dir)
    ensure_state()
    
    # Reset indices if folders changed size
    if persons and st.session_state.person_idx >= len(persons):
        st.session_state.person_idx = 0
    if garments and st.session_state.garment_idx >= len(garments):
        st.session_state.garment_idx = 0
    
    if not persons:
        st.warning(f"No person images found in {person_dir}")
    if not garments:
        st.warning(f"No garment images found in {garment_dir}")
    
    def advance():
        st.session_state.garment_idx += 1
        if st.session_state.garment_idx >= len(garments):
            st.session_state.garment_idx = 0
            st.session_state.person_idx += 1
    
    if persons and garments:
        if st.session_state.person_idx >= len(persons):
            st.success("Finished all persons. Reset to start over.")
        else:
            person_path = persons[st.session_state.person_idx]
            garment_path = garments[st.session_state.garment_idx]
    
            st.write(
                f"Person {st.session_state.person_idx + 1}/{len(persons)} • "
                f"Garment {st.session_state.garment_idx + 1}/{len(garments)}"
            )
            col_p, col_g = st.columns(2)
            col_p.image(str(person_path), caption=person_path.name, use_column_width=True)
            col_g.image(str(garment_path), caption=garment_path.name, use_column_width=True)
    
            col1, col2, col3 = st.columns(3)
            if col1.button("Looks good"):
                append_label(person_path, garment_path, 1, pairs_csv)
                advance()
            if col2.button("Not good"):
                append_label(person_path, garment_path, 0, pairs_csv)
                advance()
            if col3.button("Skip"):
                advance()
    
    if st.button("Reset progress"):
        st.session_state.person_idx = 0
        st.session_state.garment_idx = 0
        st.info("Progress reset (CSV untouched).")
    
    st.divider()
    st.header("Analyze user image")
    st.write(
        "Upload a user photo to estimate skin tone and body shape. "
        "Selfies or half-body shots return skin tone only."
    )
    user_upload = st.file_uploader(
        "User image", type=["png", "jpg", "jpeg"], key="user_image_upload"
    )
    if user_upload is not None:
        image = Image.open(user_upload).convert("RGB")
        st.image(image, caption=user_upload.name, use_column_width=True)
        if st.button("Analyze image"):
            with st.spinner("Analyzing image..."):
                result = analyze_user_image(image)
            if "error" in result:
                st.error(result["error"])
            else:
                st.success("Analysis complete.")
                st.write(f"Skin tone label: {result['skin_tone_label']}")
                skin_hexes = result["skin_hexes"]
                st.write(f"Skin tone hexes: {', '.join(skin_hexes)}")
                cols = st.columns(len(skin_hexes))
                for col, hex_value in zip(cols, skin_hexes):
                    col.markdown(
                        f"<div style='width:100%; height: 60px; background-color:{hex_value}; "
                        "border-radius:8px; border:1px solid #ddd;'></div>"
                        f"<div style='text-align:center; font-family:monospace'>{hex_value}</div>",
                        unsafe_allow_html=True,
                    )
                if result["body_shape"]:
                    st.write(f"Body shape: {result['body_shape'].replace('_', ' ')}")
                else:
                    st.info("Selfie/half-body detected; returning only skin tone.")
    
    st.divider()
    st.header("Train tabular MLP")
    st.write(
        "Train a lightweight MLP on `data/train.csv` using categorical attributes + description text."
    )
    
    from scripts import train_tabular_mlp as tabular_mlp
    
    data_path = Path(st.text_input("Training CSV path", "data/train.csv"))
    artifacts_dir = Path(st.text_input("Artifacts folder", "artifacts"))
    hidden_layers = st.text_input("Hidden layer sizes (comma-separated)", "256,128")
    col_a, col_b, col_c = st.columns(3)
    test_size = col_a.number_input("Validation split", min_value=0.05, max_value=0.5, value=0.2, step=0.05)
    max_iter = col_b.number_input("Max iterations", min_value=50, max_value=2000, value=500, step=50)
    max_features = col_c.number_input("Max TF-IDF features", min_value=100, max_value=20000, value=5000, step=500)
    seed = st.number_input("Random seed", min_value=0, max_value=10000, value=42, step=1)
    
    if st.button("Train tabular MLP"):
        try:
            df = tabular_mlp.load_data(data_path)
            hidden = tabular_mlp.parse_hidden(hidden_layers)
            with st.spinner("Training model..."):
                pipeline, metrics = tabular_mlp.train_model(
                    df=df,
                    test_size=float(test_size),
                    seed=int(seed),
                    hidden=hidden,
                    max_features=int(max_features),
                    max_iter=int(max_iter),
                )
            artifacts_dir.mkdir(parents=True, exist_ok=True)
            model_path = artifacts_dir / "tabular_mlp.joblib"
            metrics_path = artifacts_dir / "tabular_mlp_metrics.json"
            joblib.dump(pipeline, model_path)
            with metrics_path.open("w", encoding="utf-8") as f:
                json.dump(metrics, f, indent=2)
            st.success(f"Saved model to {model_path} and metrics to {metrics_path}.")
            st.json(metrics)
        except Exception as exc:
            st.error(str(exc))
    
    st.divider()
    st.header("Test tabular MLP")
    st.write("Load a trained model and score a single row.")
    
    model_path = Path(st.text_input("Model path", "artifacts/tabular_mlp.joblib"))
    col1, col2 = st.columns(2)
    height_bucket = col1.text_input("height_bucket", "average")
    body_shape = col2.text_input("body_shape", "hourglass")
    col3, col4 = st.columns(2)
    skin_tone = col3.text_input("skin_tone", "medium")
    age_bucket = col4.text_input("age_bucket", "26-35")
    occasion = st.text_input("occasion", "wedding")
    description = st.text_area(
        "clothing_description",
        "Deep red silk lehenga with fitted blouse and flared skirt",
    )
    
    if st.button("Predict"):
        if not model_path.exists():
            st.error(f"Model not found at {model_path}. Train first or update the path.")
        else:
            try:
                model = joblib.load(model_path)
                row = {
                    "height_bucket": height_bucket,
                    "body_shape": body_shape,
                    "skin_tone": skin_tone,
                    "age_bucket": age_bucket,
                    "occasion": occasion,
                    "clothing_description": description,
                }
                df = pd.DataFrame([row])
                pred = float(model.predict(df)[0])
                st.success(f"Predicted label score: {pred:.4f}")
            except Exception as exc:
                st.error(str(exc))
    
    st.divider()
    st.header("Train image MLP (single image)")
    st.write(
        "Train an MLP on CLIP image embeddings using a JSON/CSV file that has "
        "`image_path` + `label` (score)."
    )
    
    def _load_image_mlp_module():
        try:
            from scripts import train_image_mlp as image_mlp
    
            return image_mlp, None
        except Exception as exc:
            return None, str(exc)
    
    
    def _load_fusion_mlp_module():
        try:
            from scripts import train_fusion_mlp as fusion_mlp
    
            return fusion_mlp, None
        except Exception as exc:
            return None, str(exc)
    
    
    image_mlp, image_mlp_error = _load_image_mlp_module()
    if image_mlp_error:
        st.info(f"Image MLP unavailable: {image_mlp_error}")
    else:
        image_data_path = Path(st.text_input("Training file (JSON/CSV)", "data/pairs.json"))
        image_artifacts_dir = Path(st.text_input("Artifacts folder", "artifacts"))
        col_a, col_b, col_c = st.columns(3)
        image_key = col_a.text_input("Image field key", "image_path")
        label_key = col_b.text_input("Label field key", "label")
        id_key = col_c.text_input("ID field key", "id")
    
        col_d, col_e, col_f = st.columns(3)
        clip_model_name = col_d.text_input("CLIP model", "ViT-B/32")
        label_max = col_e.number_input("Label max (scale)", min_value=0.1, max_value=100.0, value=1.0, step=0.1)
        hidden = col_f.number_input("Hidden size", min_value=64, max_value=2048, value=512, step=64)
    
        col_g, col_h, col_i = st.columns(3)
        epochs = col_g.number_input("Epochs", min_value=1, max_value=100, value=5, step=1)
        lr = col_h.number_input("Learning rate", min_value=0.00001, max_value=0.1, value=0.001, step=0.0001)
        val_size = col_i.number_input("Validation split", min_value=0.05, max_value=0.5, value=0.2, step=0.05)
        seed = st.number_input("Random seed", min_value=0, max_value=10000, value=42, step=1)
        dropout = st.number_input("Dropout", min_value=0.0, max_value=0.9, value=0.1, step=0.05)
    
        if st.button("Train image MLP"):
            try:
                with st.spinner("Training image model..."):
                    result = image_mlp.run_training(
                        data_path=image_data_path,
                        artifacts=image_artifacts_dir,
                        clip_model_name=clip_model_name,
                        epochs=int(epochs),
                        lr=float(lr),
                        val_size=float(val_size),
                        seed=int(seed),
                        hidden=int(hidden),
                        dropout=float(dropout),
                        label_max=float(label_max),
                        image_key=image_key,
                        label_key=label_key,
                        id_key=id_key,
                    )
                st.success(f"Saved model to {result['artifacts']}.")
                st.json(result["metrics"])
            except Exception as exc:
                st.error(str(exc))
    
    st.divider()
    st.header("Train fusion MLP (attributes + text + image)")
    st.write(
        "Train a multimodal fusion model on `data/fusion_train.csv` using attributes, "
        "BERT text embeddings, and CLIP image embeddings."
    )
    
    fusion_mlp, fusion_mlp_error = _load_fusion_mlp_module()
    if fusion_mlp_error:
        st.info(f"Fusion MLP unavailable: {fusion_mlp_error}")
    else:
        fusion_data_path = Path(
            st.text_input("Training CSV path (fusion)", "data/fusion_train.csv", key="fusion_train_path")
        )
        fusion_artifacts_dir = Path(
            st.text_input("Artifacts folder (fusion)", "artifacts", key="fusion_artifacts")
        )
        col_a, col_b, col_c = st.columns(3)
        fusion_text_model = col_a.text_input(
            "BERT model", "distilbert-base-uncased", key="fusion_text_model"
        )
        fusion_clip_model = col_b.text_input("CLIP model", "RN50", key="fusion_clip_model")
        fusion_embed_dim = col_c.number_input(
            "Embedding dim", min_value=32, max_value=1024, value=128, step=16, key="fusion_embed_dim"
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
        )
    
        col_g, col_h, col_i = st.columns(3)
        fusion_batch_size = col_g.number_input(
            "Batch size", min_value=1, max_value=256, value=16, step=1, key="fusion_batch"
        )
        fusion_hidden = col_h.number_input(
            "Hidden size", min_value=64, max_value=2048, value=256, step=64, key="fusion_hidden"
        )
        fusion_dropout = col_i.number_input(
            "Dropout", min_value=0.0, max_value=0.9, value=0.1, step=0.05, key="fusion_dropout"
        )
        fusion_text_max_length = st.number_input(
            "Text max length", min_value=16, max_value=512, value=96, step=8, key="fusion_text_max"
        )
        fusion_seed = st.number_input(
            "Random seed (fusion)", min_value=0, max_value=10000, value=42, step=1, key="fusion_seed"
        )
    
        if st.button("Train fusion MLP", key="fusion_train_button"):
            try:
                with st.spinner("Training fusion model..."):
                    result = fusion_mlp.run_training(
                        data_path=fusion_data_path,
                        artifacts=fusion_artifacts_dir,
                        text_model=fusion_text_model,
                        clip_model=fusion_clip_model,
                        epochs=int(fusion_epochs),
                        lr=float(fusion_lr),
                        val_size=float(fusion_val_size),
                        seed=int(fusion_seed),
                        batch_size=int(fusion_batch_size),
                        embed_dim=int(fusion_embed_dim),
                        hidden=int(fusion_hidden),
                        dropout=float(fusion_dropout),
                        text_max_length=int(fusion_text_max_length),
                    )
                st.success(f"Saved model to {result['artifacts']}.")
                st.json(result["metrics"])
            except Exception as exc:
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
            "Collection JSON file (fusion)", type=["json"], key="fusion_collection_upload"
        )
        default_fusion_collection = (
            "fashion_collection.json"
            if Path("fashion_collection.json").exists()
            else "data/collection.json"
        )
        fusion_collection_path = Path(
            st.text_input(
                "Collection JSON path (fusion)", default_fusion_collection, key="fusion_collection_path"
            )
        )
        fusion_desc_col = st.text_input(
            "Description field (fusion)", "clothing_description", key="fusion_desc_col"
        )
    
        def _load_fusion_collection():
            if fusion_collection_upload is not None:
                raw = fusion_collection_upload.getvalue()
                data = json.loads(raw.decode("utf-8"))
                return data
            if fusion_collection_path.exists():
                return json.loads(fusion_collection_path.read_text(encoding="utf-8"))
            raise FileNotFoundError("Provide a collection JSON file or a valid path.")
    
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
        age = col_a.number_input("age", min_value=0, max_value=100, value=25, step=1, key="fusion_age")
    
        size_options = []
        body_options = []
        skin_options = []
        if spec and isinstance(spec.get("categories"), dict):
            size_options = [str(v) for v in spec["categories"].get("size", [])]
            body_options = [str(v) for v in spec["categories"].get("body_shape", [])]
            skin_options = [str(v) for v in spec["categories"].get("skin_tone", [])]
    
        if size_options:
            size = col_b.selectbox("size", size_options, key="fusion_size")
        else:
            size = col_b.text_input("size", "M", key="fusion_size")
    
        if body_options:
            body_shape = col_c.selectbox("body_shape", body_options, key="fusion_body_shape")
        else:
            body_shape = col_c.text_input("body_shape", "hourglass", key="fusion_body_shape")
    
        if skin_options:
            skin_tone = st.selectbox("skin_tone", skin_options, key="fusion_skin_tone")
        else:
            skin_tone = st.text_input("skin_tone", "medium", key="fusion_skin_tone")
    
        fusion_user_upload = st.file_uploader(
            "Upload user image (fusion)", type=["png", "jpg", "jpeg"], key="fusion_user_image"
        )
        user_image = None
        if fusion_user_upload is not None:
            user_image = Image.open(fusion_user_upload).convert("RGB")
            st.image(user_image, caption=fusion_user_upload.name, use_column_width=True)
    
        top_k = st.number_input(
            "Top K results (fusion)", min_value=1, max_value=100, value=5, step=1, key="fusion_top_k"
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
    
                    text_model_name = config.get("text_model", "distilbert-base-uncased")
                    clip_model_name = config.get("clip_model", "RN50")
                    text_max_length = int(config.get("text_max_length", 96))
    
                    df = pd.DataFrame(fusion_collection_data)
                    if fusion_desc_col not in df.columns:
                        raise ValueError(f"Missing description field: {fusion_desc_col}")
                    if "id" not in df.columns:
                        df = df.copy()
                        df["id"] = [f"item-{i+1:04d}" for i in range(len(df))]
    
                    user_df = pd.DataFrame(
                        {
                            "age": [age] * len(df),
                            "size": [size] * len(df),
                            "body_shape": [body_shape] * len(df),
                            "skin_tone": [skin_tone] * len(df),
                        }
                    )
                    tabular, unknowns = fusion_mlp.build_tabular_from_spec(user_df, spec)
                    if unknowns:
                        summary = ", ".join(
                            f"{key}={sorted(set(vals))}" for key, vals in unknowns.items()
                        )
                        st.warning(f"Unknown categories not seen in training: {summary}")
    
                    texts = df[fusion_desc_col].astype(str).tolist()
                    text_embs = fusion_mlp.embed_texts(
                        texts=texts,
                        model_name=text_model_name,
                        device=device,
                        batch_size=16,
                        max_length=text_max_length,
                    )
                    text_feats = np.stack([text_embs[text] for text in texts]).astype("float32")
    
                    clip_model, preprocess = fusion_mlp.clip.load(clip_model_name, device=device)
                    clip_model.eval()
                    with fusion_mlp.torch.no_grad():
                        tensor = preprocess(user_image).unsqueeze(0).to(device)
                        emb = clip_model.encode_image(tensor)
                        emb = emb / emb.norm(dim=-1, keepdim=True)
                    user_emb = emb.cpu().numpy().astype("float32")[0]
                    image_feats = np.repeat(user_emb[None, :], len(df), axis=0)
    
                    if tabular.shape[1] != int(config["tab_dim"]):
                        raise ValueError("Tabular feature size does not match the trained model.")
                    if text_feats.shape[1] != int(config["text_dim"]):
                        raise ValueError("Text embedding size does not match the trained model.")
                    if image_feats.shape[1] != int(config["image_dim"]):
                        raise ValueError("Image embedding size does not match the trained model.")
    
                    model = fusion_mlp.FusionMLP(
                        tab_dim=int(config["tab_dim"]),
                        text_dim=int(config["text_dim"]),
                        image_dim=int(config["image_dim"]),
                        embed_dim=int(config["embed_dim"]),
                        hidden=int(config["hidden"]),
                        dropout=float(config.get("dropout", 0.0)),
                    ).to(device)
                    model.load_state_dict(state["state_dict"])
                    model.eval()
    
                    with fusion_mlp.torch.no_grad():
                        scores = model(
                            fusion_mlp.torch.from_numpy(tabular).to(device),
                            fusion_mlp.torch.from_numpy(text_feats).to(device),
                            fusion_mlp.torch.from_numpy(image_feats).to(device),
                        ).cpu().numpy()
    
                    df = df.copy()
                    df["score"] = scores
                    df = df.sort_values("score", ascending=False)
                    top_df = df.head(int(top_k)).copy()
                    show_cols = ["id", "score", fusion_desc_col]
                    show_cols = [c for c in show_cols if c in top_df.columns]
                    st.dataframe(top_df[show_cols], use_container_width=True)
                except Exception as exc:
                    st.error(str(exc))
    
    st.divider()
    st.header("Recommend from image collection")
    st.write(
        "Score a collection JSON using the trained image MLP. "
        "Collection entries must include an image path."
    )
    
    image_model_path = Path(st.text_input("Model path", "artifacts/image_mlp.pt"))
    image_collection_upload = st.file_uploader("Collection JSON file", type=["json"], key="image_collection_upload")
    default_image_collection = "fashion_collection.json" if Path("fashion_collection.json").exists() else "data/collection.json"
    image_collection_path = Path(st.text_input("Collection JSON path", default_image_collection))
    
    image_key = st.text_input("Image field key (collection)", "image_path", key="image_collection_image_key")
    image_root = st.text_input("Image root folder (optional)", "", key="image_collection_image_root")
    clip_model_name = st.text_input("CLIP model (must match training)", "ViT-B/32", key="image_collection_clip")
    score_scale = st.number_input(
        "Score scale (multiply)", min_value=0.1, max_value=100.0, value=1.0, step=0.1, key="image_collection_scale"
    )
    
    def _load_image_collection():
        if image_collection_upload is not None:
            raw = image_collection_upload.getvalue()
            data = json.loads(raw.decode("utf-8"))
            return data
        if image_collection_path.exists():
            return json.loads(image_collection_path.read_text(encoding="utf-8"))
        raise FileNotFoundError("Provide a collection JSON file or a valid path.")
    
    
    image_collection_data = None
    image_collection_error = None
    try:
        image_collection_data = _load_image_collection()
        if not isinstance(image_collection_data, list):
            raise ValueError("Collection JSON must be a list of objects.")
        if not image_collection_data:
            raise ValueError("Collection JSON is empty.")
    except Exception as exc:
        image_collection_error = str(exc)
    
    if image_collection_error:
        st.info(image_collection_error)
    
    with st.form("image_recommend_form"):
        top_k = st.number_input("Top K results", min_value=1, max_value=100, value=5, step=1)
        submitted = st.form_submit_button("Score image collection")
    
    if submitted:
        if image_mlp_error:
            st.error(f"Image MLP unavailable: {image_mlp_error}")
        elif not image_model_path.exists():
            st.error(f"Model not found at {image_model_path}. Train first or update the path.")
        elif image_collection_error:
            st.error(image_collection_error)
        else:
            try:
                df = pd.DataFrame(image_collection_data)
                if image_key not in df.columns:
                    raise ValueError(f"Missing image field in collection: {image_key}")
    
                if "id" not in df.columns:
                    df = df.copy()
                    df["id"] = [f"item-{i+1:04d}" for i in range(len(df))]
    
                image_root = image_root.strip()
                image_root_path = Path(image_root).expanduser() if image_root else None
                base_dir = image_collection_path.parent if image_collection_path else None
    
                resolved_paths = []
                missing = 0
                remote = 0
                for _, row in df.iterrows():
                    image_ref = _resolve_image_ref(row.get(image_key), image_root_path, base_dir)
                    if isinstance(image_ref, Path):
                        if image_ref.exists():
                            resolved_paths.append(str(image_ref))
                        else:
                            resolved_paths.append(None)
                            missing += 1
                    elif image_ref:
                        resolved_paths.append(None)
                        remote += 1
                    else:
                        resolved_paths.append(None)
                        missing += 1
    
                df = df.copy()
                df["_resolved_image_path"] = resolved_paths
                valid_df = df[df["_resolved_image_path"].notna()].copy()
                if valid_df.empty:
                    raise ValueError("No valid local image paths found in collection.")
    
                if missing:
                    st.warning(f"Missing local images: {missing}")
                if remote:
                    st.warning(f"Remote image URLs skipped (no download): {remote}")
    
                device = "cuda" if image_mlp.torch.cuda.is_available() else "cpu"
                clip_model, preprocess = image_mlp.clip.load(clip_model_name, device=device)
                clip_model.eval()
    
                paths = valid_df["_resolved_image_path"].tolist()
                image_embs = image_mlp.embed_images(paths, clip_model, preprocess, device)
                feats = np.stack([image_embs[p] for p in paths]).astype("float32")
    
                state = image_mlp.torch.load(image_model_path, map_location=device)
                if "net.0.weight" not in state:
                    raise ValueError("Unsupported model weights format.")
                hidden = int(state["net.0.weight"].shape[0])
                in_dim = int(state["net.0.weight"].shape[1])
                model = image_mlp.ImageMLP(in_dim=in_dim, hidden=hidden, dropout=0.0)
                model.load_state_dict(state)
                model.to(device)
                model.eval()
    
                with image_mlp.torch.no_grad():
                    scores = model(image_mlp.torch.from_numpy(feats).to(device)).cpu().numpy()
    
                valid_df["score"] = scores * float(score_scale)
                valid_df = valid_df.sort_values("score", ascending=False)
                top_df = valid_df.head(int(top_k)).copy()
                show_cols = ["id", "score", image_key]
                show_cols = [c for c in show_cols if c in top_df.columns]
                st.dataframe(top_df[show_cols], use_container_width=True)
    
                st.subheader("Top matches")
                for _, row in top_df.iterrows():
                    col_img, col_info = st.columns([1, 2])
                    col_img.image(row["_resolved_image_path"], use_column_width=True)
                    col_info.markdown(f"**{row.get('id', 'item')}**")
                    col_info.write(f"Score: {float(row['score']):.4f}")
            except Exception as exc:
                st.error(str(exc))
    
    st.divider()
    st.header("Recommend from collection JSON")
    st.write(
        "Select a user profile and occasion, then score outfits from the collection. "
        "Results are ranked by the MLP score."
    )
    
    rec_model_path = Path(st.text_input("Model path for recommendations", "artifacts/tabular_mlp.joblib"))
    collection_upload = st.file_uploader("Collection JSON file", type=["json"])
    default_collection = "fashion_collection.json" if Path("fashion_collection.json").exists() else "data/collection.json"
    collection_path = Path(st.text_input("Collection JSON path", default_collection))
    
    
    def _load_collection():
        if collection_upload is not None:
            raw = collection_upload.getvalue()
            data = json.loads(raw.decode("utf-8"))
            return data
        if collection_path.exists():
            return json.loads(collection_path.read_text(encoding="utf-8"))
        raise FileNotFoundError("Provide a collection JSON file or a valid path.")
    
    
    collection_data = None
    collection_error = None
    try:
        collection_data = _load_collection()
        if not isinstance(collection_data, list):
            raise ValueError("Collection JSON must be a list of objects.")
        if not collection_data:
            raise ValueError("Collection JSON is empty.")
    except Exception as exc:
        collection_error = str(exc)
    
    collection_df = pd.DataFrame(collection_data) if collection_data else None
    
    def _options_for(col: str):
        if collection_df is None or col not in collection_df.columns:
            return []
        values = sorted({str(v) for v in collection_df[col].dropna().astype(str)})
        return values
    
    def _resolve_image_ref(value, image_root: Path | None, base_dir: Path | None):
        if value is None:
            return None
        if isinstance(value, float) and np.isnan(value):
            return None
        ref = str(value).strip()
        if not ref:
            return None
        if ref.startswith("http://") or ref.startswith("https://"):
            return ref
        path = Path(ref).expanduser()
        if not path.is_absolute():
            if image_root is not None:
                path = image_root / path
            elif base_dir is not None:
                path = base_dir / path
        return path
    
    if collection_error:
        st.info(collection_error)
    
    occasion_options = _options_for("occasion") or ["wedding"]
    height_options = _options_for("height_bucket") or ["average"]
    body_options = _options_for("body_shape") or ["hourglass"]
    skin_options = _options_for("skin_tone") or ["medium"]
    age_options = _options_for("age_bucket") or ["26-35"]
    
    image_col_options = ["(none)"]
    image_col_default = "(none)"
    if collection_df is not None:
        image_col_options += list(collection_df.columns)
        for candidate in (
            "image_path",
            "image",
            "image_url",
            "image_uri",
            "img",
            "img_path",
            "path",
        ):
            if candidate in collection_df.columns:
                image_col_default = candidate
                break
    
    with st.form("recommend_form"):
        st.subheader("User profile")
        col_a, col_b, col_c = st.columns(3)
        occasion = col_a.selectbox("Occasion", occasion_options)
        height_bucket = col_b.selectbox("height_bucket", height_options)
        body_shape = col_c.selectbox("body_shape", body_options)
        col_d, col_e, col_f = st.columns(3)
        skin_tone = col_d.selectbox("skin_tone", skin_options)
        age_bucket = col_e.selectbox("age_bucket", age_options)
        top_k = col_f.number_input("Top K results", min_value=1, max_value=100, value=5, step=1)
        st.subheader("Display")
        col_g, col_h = st.columns(2)
        image_col = col_g.selectbox(
            "Image field (optional)",
            image_col_options,
            index=image_col_options.index(image_col_default),
        )
        image_root = col_h.text_input("Image root folder (optional)", "")
        submitted = st.form_submit_button("Score collection")
    
    if submitted:
        if not rec_model_path.exists():
            st.error(f"Model not found at {rec_model_path}. Train first or update the path.")
        elif collection_error:
            st.error(collection_error)
        else:
            try:
                df = pd.DataFrame(collection_data)
                required = {tabular_mlp.TEXT_COL, "occasion"}
                missing = required - set(df.columns)
                if missing:
                    raise ValueError(f"Missing required fields in collection: {sorted(missing)}")
    
                if "id" not in df.columns:
                    df = df.copy()
                    df["id"] = [f"item-{i+1:04d}" for i in range(len(df))]
    
                df = df[df["occasion"].astype(str) == str(occasion)]
    
                if df.empty:
                    st.warning("No outfits match the selected occasion.")
                else:
                    model = joblib.load(rec_model_path)
                    features = pd.DataFrame(
                        {
                            "height_bucket": [height_bucket] * len(df),
                            "body_shape": [body_shape] * len(df),
                            "skin_tone": [skin_tone] * len(df),
                            "age_bucket": [age_bucket] * len(df),
                            "occasion": [occasion] * len(df),
                            "clothing_description": df[tabular_mlp.TEXT_COL].astype(str).tolist(),
                        }
                    )
                    scores = model.predict(features)
                    df = df.copy()
                    df["score"] = scores
                    df = df.sort_values("score", ascending=False)
                    top_df = df.head(int(top_k)).copy()
                    show_cols = ["id", "score", tabular_mlp.TEXT_COL]
                    show_cols = [c for c in show_cols if c in top_df.columns]
                    st.dataframe(top_df[show_cols], use_container_width=True)
    
                    if image_col != "(none)" and image_col in top_df.columns:
                        st.subheader("Top matches")
                        image_root = image_root.strip()
                        image_root_path = Path(image_root).expanduser() if image_root else None
                        base_dir = collection_path.parent if collection_path else None
                        for _, row in top_df.iterrows():
                            image_ref = _resolve_image_ref(
                                row.get(image_col),
                                image_root_path,
                                base_dir,
                            )
                            col_img, col_info = st.columns([1, 2])
                            if isinstance(image_ref, Path):
                                if image_ref.exists():
                                    col_img.image(str(image_ref), use_column_width=True)
                                else:
                                    col_img.warning(f"Image not found: {image_ref}")
                            elif image_ref:
                                col_img.image(image_ref, use_column_width=True)
                            else:
                                col_img.info("No image for this item.")
    
                            item_id = row.get("id", "item")
                            score = row.get("score")
                            desc = row.get(tabular_mlp.TEXT_COL, "")
                            col_info.markdown(f"**{item_id}**")
                            if score is not None:
                                col_info.write(f"Score: {float(score):.4f}")
                            if desc:
                                col_info.write(str(desc))
            except Exception as exc:
                st.error(str(exc))

if __name__ == "__main__":
    render_streamlit_app()

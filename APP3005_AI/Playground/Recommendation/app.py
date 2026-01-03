from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import math
import re
import tempfile
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import clip
import cv2
try:
    import mediapipe as mp
except Exception:
    mp = None
import numpy as np
from PIL import Image, ImageStat
import streamlit as st
import torch


@dataclass
class ValidationConfig:
    """Thresholds for deciding whether an image is usable."""

    min_full_body_conf: float = 0.6
    min_front_facing_conf: float = 0.6
    min_detection_confidence: float = 0.5


@dataclass
class ValidationResult:
    """Outputs from the (placeholder) orientation/full-body check."""

    is_full_body: bool
    is_front_facing: bool
    detection_confidence: float
    notes: List[str]


@dataclass
class BodyRatioResult:
    """Outputs from the (placeholder) landmark/ratio estimator."""

    height_ratio: float
    waist_hip_ratio: float
    detection_confidence: float
    notes: List[str]


@dataclass
class SkinToneResult:
    """Outputs from the (placeholder) skin tone extractor."""

    palette_hex: List[str]
    confidence: float
    notes: List[str]


@dataclass
class UserProfile:
    gender: str
    height_cm: float
    age: Optional[int] = None
    size_bucket: Optional[str] = None
    height_bucket_override: Optional[str] = None
    body_shape_override: Optional[str] = None
    body_ratios: Optional[Dict[str, float]] = None
    body_type: Optional[str] = None
    skin_tone_bucket: Optional[str] = None
    skin_warmth: Optional[float] = None
    style_embedding: Optional[list] = None
    pose_ok: bool = False
    face_ok: bool = False
    heuristic_body_ratios: Optional[BodyRatioResult] = None
    heuristic_body_shape: Optional[str] = None
    heuristic_skin_tone: Optional[SkinToneResult] = None


EMBED_MODEL_OPTIONS = [
    "ViT-B/32",
    "ViT-B/16",
    "ViT-L/14",
    "ViT-L/14@336px",
    "RN50",
    "RN101",
    "RN50x4",
    "RN50x16",
    "RN50x64",
]

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
SILHOUETTE_SIZE = (64, 128)


@st.cache_resource
def load_clip_model(model_name: str):
    model, preprocess = clip.load(model_name, device=DEVICE)
    model.eval()
    return model, preprocess


@st.cache_resource
def load_mediapipe_solutions():
    if mp is None:
        return None, None, "MediaPipe not installed."
    try:
        if hasattr(mp, "solutions"):
            return mp.solutions.pose, mp.solutions.face_detection, None
        from mediapipe.python import solutions as mp_solutions
        return mp_solutions.pose, mp_solutions.face_detection, None
    except Exception as exc:
        return None, None, str(exc)


def resolve_relative_path(path_value: str, base_dir: Path) -> Path:
    path = Path(path_value)
    if path.is_absolute():
        return path
    return (base_dir / path).resolve()


def resolve_image_path(image_path: str, collection_path: Path) -> Path:
    return resolve_relative_path(image_path, collection_path.parent)


def resolve_item_image_path(image_path: str, base_dirs: List[Path]) -> Optional[Path]:
    if not image_path:
        return None
    path = Path(image_path)
    alt_paths = [path]
    if "women fashion" in path.parts:
        alt_parts = [("val" if part == "women fashion" else part) for part in path.parts]
        alt_paths.append(Path(*alt_parts))
    filenames = [p.name for p in alt_paths if p.name]
    if path.is_absolute():
        return path if path.exists() else None
    for base_dir in base_dirs:
        for candidate_path in alt_paths:
            candidate = (base_dir / candidate_path).resolve()
            if candidate.exists():
                return candidate
        for fname in filenames:
            direct_val = (base_dir / "val" / fname).resolve()
            if direct_val.exists():
                return direct_val
    return None


def load_embeddings_from_file(path: Path) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str]]:
    if not path.exists():
        return None, f"Embeddings file not found: {path}"
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return None, f"Failed to read embeddings JSON: {exc}"
    if isinstance(payload, list):
        if not payload:
            return None, "Embeddings JSON is empty."
        return payload, None
    if isinstance(payload, dict):
        return [payload], None
    return None, "Embeddings JSON must be a list or object."


@st.cache_resource
def load_embedding_module():
    module_path = Path(__file__).resolve().parents[2] / "ModelDemo" / "embedding.py"
    if not module_path.exists():
        return None, f"embedding.py not found at {module_path}"

    spec = importlib.util.spec_from_file_location("embedding_module", module_path)
    if spec is None or spec.loader is None:
        return None, f"Unable to load embedding module from {module_path}"

    try:
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    except Exception as exc:
        return None, str(exc)

    return module, None


def stub_orientation_and_body_detection(image: Image.Image) -> ValidationResult:
    """
    Placeholder for a real model (e.g., MediaPipe/MoveNet served via ONNX Runtime).

    Uses simple heuristics on image contrast and aspect ratio to produce deterministic
    confidence scores. Swap this with your production model when ready.
    """
    stats = ImageStat.Stat(image.convert("L"))
    contrast = stats.stddev[0] / 128.0  # normalized contrast proxy
    aspect_ratio = image.height / max(image.width, 1)

    detection_confidence = max(0.05, min(0.99, 0.35 + 0.4 * contrast))
    is_full_body = aspect_ratio >= 1.1 and detection_confidence >= 0.25
    is_front_facing = contrast >= 0.35

    notes: List[str] = []
    if aspect_ratio < 1.0:
        notes.append("Low height/width ratio; likely a cropped or seated pose.")
    if contrast < 0.25:
        notes.append("Low contrast; face/body details may be hard to detect.")

    return ValidationResult(
        is_full_body=is_full_body,
        is_front_facing=is_front_facing,
        detection_confidence=round(detection_confidence, 2),
        notes=notes,
    )


def validate_image(result: ValidationResult, cfg: ValidationConfig) -> bool:
    """Check model outputs against configured thresholds."""
    if result.detection_confidence < cfg.min_detection_confidence:
        return False
    if not result.is_full_body or result.detection_confidence < cfg.min_full_body_conf:
        return False
    if not result.is_front_facing or result.detection_confidence < cfg.min_front_facing_conf:
        return False
    return True


def stub_estimate_body_ratios(image: Image.Image, validation: ValidationResult) -> BodyRatioResult:
    """
    Placeholder for a real pose/landmark model (e.g., MediaPipe/MoveNet).

    Produces deterministic ratios from simple luminance bands to illustrate wiring.
    Replace with keypoint-based measurements when integrating your model.
    """
    w, h = image.size
    gray = image.convert("L")

    waist_band = gray.crop((0, h * 0.45, w, h * 0.55))
    hip_band = gray.crop((0, h * 0.60, w, h * 0.75))

    waist_mean = ImageStat.Stat(waist_band).mean[0]
    hip_mean = ImageStat.Stat(hip_band).mean[0]

    waist_hip_ratio = max(0.6, min(1.4, (waist_mean + 1) / (hip_mean + 1)))
    height_ratio = max(0.6, min(1.4, (h / max(w, 1)) * 0.8))

    detection_confidence = round(min(0.99, max(validation.detection_confidence - 0.05, 0.4)), 2)
    notes: List[str] = []
    if waist_hip_ratio > 1.1:
        notes.append("Heuristic suggests higher waist-to-hip ratio.")
    if height_ratio < 0.8:
        notes.append("Heuristic suggests shorter stature or tight crop.")

    return BodyRatioResult(
        height_ratio=round(height_ratio, 2),
        waist_hip_ratio=round(waist_hip_ratio, 2),
        detection_confidence=detection_confidence,
        notes=notes,
    )


def infer_body_shape(ratios: BodyRatioResult) -> str:
    ratio = ratios.waist_hip_ratio
    if ratio < 0.85:
        return "pear"
    if ratio < 0.95:
        return "hourglass"
    if ratio < 1.05:
        return "rectangle"
    return "apple"


def extract_style_embedding(image_path: str, model_name: str = "ViT-B/32") -> list:
    model, preprocess = load_clip_model(model_name)
    img = preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(DEVICE)
    img = img.to(DEVICE)
    with torch.no_grad():
        emb = model.encode_image(img)
        emb = emb / emb.norm(dim=-1, keepdim=True)
    return emb.detach().cpu().numpy()[0].tolist()


def _landmark_xy(landmarks, idx: int, w: int, h: int) -> Tuple[float, float]:
    lm = landmarks[idx]
    return lm.x * w, lm.y * h


def _fallback_body_ratios(
    image_bgr: np.ndarray,
) -> Tuple[bool, Optional[Dict[str, float]], Optional[str]]:
    image = Image.fromarray(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB))
    validation = stub_orientation_and_body_detection(image)
    ratios_stub = stub_estimate_body_ratios(image, validation)
    ratios = {
        "height_ratio": ratios_stub.height_ratio,
        "waist_hip_ratio": ratios_stub.waist_hip_ratio,
    }
    body_type = infer_body_shape(ratios_stub)
    return False, ratios, body_type


def extract_body_ratios_and_type(
    image_bgr: np.ndarray,
    *,
    min_detection_confidence: float = 0.5,
) -> Tuple[bool, Optional[Dict[str, float]], Optional[str]]:
    pose_mod, _, err = load_mediapipe_solutions()
    if err or pose_mod is None:
        return _fallback_body_ratios(image_bgr)

    h, w = image_bgr.shape[:2]
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    with pose_mod.Pose(
        static_image_mode=True,
        model_complexity=1,
        enable_segmentation=False,
        min_detection_confidence=min_detection_confidence,
    ) as pose:
        res = pose.process(image_rgb)

    if not res.pose_landmarks:
        return False, None, None

    lm = res.pose_landmarks.landmark

    l_sh = _landmark_xy(lm, 11, w, h)
    r_sh = _landmark_xy(lm, 12, w, h)
    l_hip = _landmark_xy(lm, 23, w, h)
    r_hip = _landmark_xy(lm, 24, w, h)
    nose = _landmark_xy(lm, 0, w, h)
    l_ank = _landmark_xy(lm, 27, w, h)
    r_ank = _landmark_xy(lm, 28, w, h)

    shoulder_width = float(np.linalg.norm(np.array(l_sh) - np.array(r_sh)))
    hip_width = float(np.linalg.norm(np.array(l_hip) - np.array(r_hip)))

    mid_hip = ((l_hip[0] + r_hip[0]) / 2.0, (l_hip[1] + r_hip[1]) / 2.0)
    torso_len = float(np.linalg.norm(np.array(nose) - np.array(mid_hip)))

    mid_ank = ((l_ank[0] + r_ank[0]) / 2.0, (l_ank[1] + r_ank[1]) / 2.0)
    leg_len = float(np.linalg.norm(np.array(mid_hip) - np.array(mid_ank)))

    shoulder_hip = shoulder_width / (hip_width + 1e-8)
    leg_torso = leg_len / (torso_len + 1e-8)

    ratios = {
        "shoulder_width_px": shoulder_width,
        "hip_width_px": hip_width,
        "torso_len_px": torso_len,
        "leg_len_px": leg_len,
        "shoulder_to_hip": float(shoulder_hip),
        "leg_to_torso": float(leg_torso),
    }

    if shoulder_hip >= 1.12:
        body_type = "inverted_triangle"
    elif shoulder_hip <= 0.92:
        body_type = "triangle"
    else:
        body_type = "rectangle"

    return True, ratios, body_type


def _clip_box(x1, y1, x2, y2, w, h):
    x1 = int(max(0, min(x1, w - 1)))
    x2 = int(max(0, min(x2, w - 1)))
    y1 = int(max(0, min(y1, h - 1)))
    y2 = int(max(0, min(y2, h - 1)))
    if x2 <= x1:
        x2 = min(w - 1, x1 + 1)
    if y2 <= y1:
        y2 = min(h - 1, y1 + 1)
    return x1, y1, x2, y2


def _warmth_to_bucket(a_mean: float) -> str:
    delta = a_mean - 128.0
    if delta >= 6.0:
        return "warm"
    if delta <= -6.0:
        return "cool"
    return "neutral"


def _fallback_skin_tone_bucket(
    image_bgr: np.ndarray,
) -> Tuple[bool, Optional[float], Optional[str]]:
    h, w = image_bgr.shape[:2]
    cx1, cy1, cx2, cy2 = int(w * 0.40), int(h * 0.20), int(w * 0.60), int(h * 0.40)
    roi = image_bgr[cy1:cy2, cx1:cx2]
    if roi.size == 0:
        return False, None, None
    lab = cv2.cvtColor(roi, cv2.COLOR_BGR2LAB)
    a_chan = float(np.mean(lab[:, :, 1]))
    bucket = _warmth_to_bucket(a_chan)
    return False, a_chan, bucket


def extract_skin_tone_bucket(
    image_bgr: np.ndarray,
    *,
    min_detection_confidence: float = 0.5,
) -> Tuple[bool, Optional[float], Optional[str]]:
    _, face_mod, err = load_mediapipe_solutions()
    if err or face_mod is None:
        return _fallback_skin_tone_bucket(image_bgr)

    h, w = image_bgr.shape[:2]
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    with face_mod.FaceDetection(
        model_selection=1,
        min_detection_confidence=min_detection_confidence,
    ) as face_det:
        res = face_det.process(image_rgb)

    if not res.detections:
        return _fallback_skin_tone_bucket(image_bgr)

    det = sorted(res.detections, key=lambda d: d.score[0], reverse=True)[0]
    bb = det.location_data.relative_bounding_box
    x1 = int(bb.xmin * w)
    y1 = int(bb.ymin * h)
    x2 = int((bb.xmin + bb.width) * w)
    y2 = int((bb.ymin + bb.height) * h)
    x1, y1, x2, y2 = _clip_box(x1, y1, x2, y2, w, h)

    face_roi = image_bgr[y1:y2, x1:x2]
    if face_roi.size == 0:
        return False, None, None

    fh, fw = face_roi.shape[:2]
    rx1, ry1, rx2, ry2 = int(fw * 0.25), int(fh * 0.45), int(fw * 0.75), int(fh * 0.85)
    rx1, ry1, rx2, ry2 = _clip_box(rx1, ry1, rx2, ry2, fw, fh)
    skin_roi = face_roi[ry1:ry2, rx1:rx2]
    if skin_roi.size == 0:
        return False, None, None

    lab = cv2.cvtColor(skin_roi, cv2.COLOR_BGR2LAB)
    a_chan = float(np.mean(lab[:, :, 1]))
    bucket = _warmth_to_bucket(a_chan)

    return True, a_chan, bucket


def build_user_profile(
    image_path: str,
    *,
    gender: str,
    height_cm: float,
    age: Optional[int] = None,
    include_style_embedding: bool = True,
    pose_min_confidence: float = 0.5,
    face_min_confidence: float = 0.5,
) -> UserProfile:
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise FileNotFoundError(f"Could not read image: {image_path}")

    profile = UserProfile(gender=gender, height_cm=float(height_cm), age=age)
    if include_style_embedding:
        profile.style_embedding = extract_style_embedding(image_path)

    image_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    image_pil = Image.fromarray(image_rgb)
    validation_stub = stub_orientation_and_body_detection(image_pil)
    ratio_stub = stub_estimate_body_ratios(image_pil, validation_stub)
    profile.heuristic_body_ratios = ratio_stub
    profile.heuristic_body_shape = infer_body_shape(ratio_stub)
    profile.heuristic_skin_tone = stub_extract_skin_tone(image_pil, validation_stub)

    pose_ok, ratios, body_type = extract_body_ratios_and_type(
        img_bgr,
        min_detection_confidence=pose_min_confidence,
    )
    profile.pose_ok = pose_ok
    profile.body_ratios = ratios
    profile.body_type = body_type

    face_ok, warmth, bucket = extract_skin_tone_bucket(
        img_bgr,
        min_detection_confidence=face_min_confidence,
    )
    profile.face_ok = face_ok
    profile.skin_warmth = warmth
    profile.skin_tone_bucket = bucket

    return profile


def profile_to_dict(profile: UserProfile) -> Dict[str, Any]:
    return asdict(profile)


def _hex_from_rgb(rgb: np.ndarray) -> str:
    r, g, b = [int(x) for x in rgb]
    return f"#{r:02x}{g:02x}{b:02x}"


def stub_extract_skin_tone(image: Image.Image, validation: ValidationResult) -> SkinToneResult:
    """
    Placeholder for skin tone extraction (replace with a proper face/skin segmenter).

    Samples probable face/arm regions, clusters via coarse quantization, and returns a
    small palette plus a heuristic confidence.
    """
    w, h = image.size
    rgb = image.convert("RGB")

    regions = []
    # Approximate face: center-top box
    regions.append(rgb.crop((w * 0.35, h * 0.08, w * 0.65, h * 0.30)))
    # Approximate left/right arms: mid-height side strips
    regions.append(rgb.crop((0, h * 0.35, w * 0.20, h * 0.70)))
    regions.append(rgb.crop((w * 0.80, h * 0.35, w, h * 0.70)))

    pixels = []
    for region in regions:
        arr = np.array(region)
        if arr.size == 0:
            continue
        pixels.append(arr.reshape(-1, 3))

    if not pixels:
        return SkinToneResult(palette_hex=[], confidence=0.2, notes=["No pixels sampled."])

    samples = np.concatenate(pixels, axis=0).astype(np.uint8)

    # Simple skin mask heuristic to avoid background/gray picks.
    r, g, b = samples[:, 0], samples[:, 1], samples[:, 2]
    maxc = np.max(samples, axis=1)
    minc = np.min(samples, axis=1)
    skin_mask = (
        (r > 95)
        & (g > 40)
        & (b > 20)
        & ((maxc - minc) > 15)
        & (np.abs(r - g) > 15)
        & (r > g)
        & (r > b)
    )
    skin_pixels = samples[skin_mask]
    used_pixels = skin_pixels if skin_pixels.size else samples

    quantized = (used_pixels // 16).astype(int)  # 0-15 per channel
    keys, counts = np.unique(quantized, axis=0, return_counts=True)
    top_indices = counts.argsort()[::-1][:3]
    top_colors = keys[top_indices] * 16 + 8  # center of bin

    palette_hex = [_hex_from_rgb(c) for c in top_colors]

    coverage = used_pixels.shape[0] / float(w * h)
    variance = float(np.mean(np.std(used_pixels.astype(float), axis=0)) / 128.0)
    confidence = max(0.2, min(0.95, 0.35 + 0.4 * variance + 0.25 * coverage))
    confidence = round(confidence, 2)

    notes: List[str] = []
    if not skin_pixels.size:
        notes.append("Falling back to unmasked pixels; adjust image or use a proper skin mask.")
    if coverage < 0.05:
        notes.append("Low skin coverage; palette may be unstable.")
    if variance < 0.2:
        notes.append("Low chroma; lighting may affect accuracy.")

    return SkinToneResult(palette_hex=palette_hex, confidence=confidence, notes=notes)


def extract_style_embedding_from_image(image: Image.Image, model_name: str = "ViT-B/32") -> list:
    model, preprocess = load_clip_model(model_name)
    img = preprocess(image.convert("RGB")).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        emb = model.encode_image(img)
        emb = emb / emb.norm(dim=-1, keepdim=True)
    return emb.detach().cpu().numpy()[0].tolist()


def extract_silhouette_embedding_from_image(image: Image.Image) -> list:
    img_bgr = cv2.cvtColor(np.array(image.convert("RGB")), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    edges = cv2.resize(edges, SILHOUETTE_SIZE)
    vec = edges.flatten().astype(np.float32)
    vec = vec / (np.linalg.norm(vec) + 1e-8)
    return vec.tolist()


def _normalize_embedding(vec: Optional[List[float]]) -> Optional[np.ndarray]:
    if not vec:
        return None
    arr = np.array(vec, dtype=np.float32)
    if arr.ndim != 1 or arr.size == 0:
        return None
    norm = np.linalg.norm(arr)
    if norm == 0:
        return None
    return arr / norm


def cosine_similarity(vec_a: Optional[List[float]], vec_b: Optional[List[float]]) -> Optional[float]:
    norm_a = _normalize_embedding(vec_a)
    norm_b = _normalize_embedding(vec_b)
    if norm_a is None or norm_b is None or norm_a.shape != norm_b.shape:
        return None
    return float(np.dot(norm_a, norm_b))


def normalize_gender(value: str) -> str:
    if not value:
        return ""
    val = value.lower()
    if "female" in val or "women" in val or "woman" in val or "girl" in val:
        return "women"
    if "male" in val or "men" in val or "man" in val or "boy" in val:
        return "men"
    if "unisex" in val or "all" in val or "any" in val or "non-binary" in val or "prefer" in val:
        return "any"
    return ""


def gender_match_score(user_gender: str, item_gender: str) -> Optional[float]:
    user = normalize_gender(user_gender)
    item = normalize_gender(item_gender)
    if not user or user == "any":
        return None
    if not item:
        return None
    if item == "any":
        return 0.6
    return 1.0 if user == item else 0.0


def color_alignment_score(
    user_bucket: Optional[str],
    user_warmth: Optional[float],
    item_warmth: Optional[float],
) -> Optional[float]:
    if item_warmth is None:
        return None
    if user_bucket:
        item_bucket = _warmth_to_bucket(item_warmth)
        if user_bucket == item_bucket:
            return 1.0
        if user_bucket == "neutral" or item_bucket == "neutral":
            return 0.6
        return 0.2
    if user_warmth is None:
        return None
    delta = abs(user_warmth - item_warmth)
    return max(0.0, 1.0 - min(delta / 128.0, 1.0))


def _hex_to_lab(hex_color: str) -> Optional[np.ndarray]:
    if not hex_color:
        return None
    value = hex_color.strip().lstrip("#")
    if len(value) != 6:
        return None
    try:
        r = int(value[0:2], 16)
        g = int(value[2:4], 16)
        b = int(value[4:6], 16)
    except ValueError:
        return None
    rgb = np.array([[[r, g, b]]], dtype=np.uint8)
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)[0, 0].astype(float)
    return lab


def palette_fit_score(
    user_palette_hex: List[str],
    item_palette_lab: Optional[List[List[float]]],
    item_palette_weight: Optional[List[float]] = None,
) -> Tuple[Optional[float], Optional[float]]:
    if not user_palette_hex or not item_palette_lab:
        return None, None

    user_labs = [lab for lab in (_hex_to_lab(c) for c in user_palette_hex) if lab is not None]
    if not user_labs:
        return None, None

    item_labs = []
    for lab in item_palette_lab:
        if isinstance(lab, (list, tuple)) and len(lab) == 3:
            item_labs.append(np.array(lab, dtype=float))
    if not item_labs:
        return None, None

    distances = []
    for item_lab in item_labs:
        distances.append(min(float(np.linalg.norm(item_lab - user_lab)) for user_lab in user_labs))

    if item_palette_weight and len(item_palette_weight) == len(distances):
        weights = np.array(item_palette_weight, dtype=float)
        if weights.sum() > 0:
            avg_dist = float(np.sum(weights * distances) / weights.sum())
        else:
            avg_dist = float(np.mean(distances))
    else:
        avg_dist = float(np.mean(distances))

    ideal = 35.0
    sigma = 18.0
    score = math.exp(-((avg_dist - ideal) ** 2) / (2 * sigma ** 2))
    return score, avg_dist


def _parse_hex_palette(text_value: str) -> List[str]:
    if not text_value:
        return []
    colors = []
    for token in text_value.split(","):
        value = token.strip().lstrip("#")
        if len(value) == 6 and all(c in "0123456789abcdefABCDEF" for c in value):
            colors.append(f"#{value.lower()}")
    return colors


def _normalize_size_bucket(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    text = value.strip().lower()
    if text in {"slim", "thin", "skinny"}:
        return "slim"
    if text in {"regular", "medium", "avg", "average"}:
        return "regular"
    if text in {"curvy", "full", "plus", "thick"}:
        return "full"
    return None


def _normalize_height_label(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    text = value.strip().lower()
    if any(term in text for term in ("petite", "short")):
        return "petite"
    if any(term in text for term in ("tall", "long")):
        return "tall"
    if any(term in text for term in ("avg", "average", "regular")):
        return "average"
    return None


def _normalize_body_shape_override(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    text = value.strip().lower().replace("-", "_")
    allowed = {
        "hourglass",
        "rectangle",
        "pear",
        "apple",
        "inverted_triangle",
        "triangle",
    }
    return text if text in allowed else None


def _normalize_label(text: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", " ", text.lower())
    return f" {cleaned} "


def infer_item_tags_from_filename(image_path: str) -> Dict[str, Any]:
    label = _normalize_label(Path(image_path).stem if image_path else "")

    def has_phrase(*phrases: str) -> bool:
        return any(f" {phrase} " in label for phrase in phrases)

    tags = {
        "a_line": has_phrase("a line", "a-line", "aline", "flared", "flare"),
        "mermaid": has_phrase("mermaid"),
        "bodycon": has_phrase("bodycon"),
        "wrap": has_phrase("wrap"),
        "belted": has_phrase("belt", "belted"),
        "peplum": has_phrase("peplum"),
        "empire": has_phrase("empire"),
        "v_neck": has_phrase("v neck", "v-neck"),
        "off_shoulder": has_phrase("off shoulder", "off-shoulder"),
        "strapless": has_phrase("strapless"),
        "halter": has_phrase("halter"),
        "puff_sleeve": has_phrase("puff sleeve", "puff sleeves", "puff"),
        "ruffle": has_phrase("ruffle", "ruffled"),
        "high_waist": has_phrase("high waist", "high-waist", "high waisted", "high-waisted"),
        "slit": has_phrase("slit"),
        "crop": has_phrase("crop", "cropped"),
        "blazer": has_phrase("blazer"),
        "saree": has_phrase("saree"),
        "anarkali": has_phrase("anarkali"),
        "kurta": has_phrase("kurta"),
        "gown": has_phrase("gown"),
        "jumpsuit": has_phrase("jumpsuit"),
        "lace": has_phrase("lace"),
        "floral": has_phrase("floral"),
    }

    length = None
    if has_phrase("maxi"):
        length = "maxi"
    elif has_phrase("midi"):
        length = "midi"
    elif has_phrase("knee length", "knee-length", "knee"):
        length = "knee"
    elif has_phrase("mini"):
        length = "mini"
    elif has_phrase("short"):
        length = "short"
    elif has_phrase("long"):
        length = "long"

    tags["length"] = length
    tags["flowy"] = tags["a_line"] or tags["anarkali"] or tags["saree"] or tags["gown"]
    tags["classic"] = tags["blazer"] or tags["saree"] or tags["anarkali"] or tags["kurta"]
    tags["bold"] = tags["strapless"] or tags["off_shoulder"] or tags["bodycon"] or tags["slit"] or tags["crop"]
    tags["waist_focus"] = (
        tags["belted"] or tags["wrap"] or tags["high_waist"] or tags["peplum"] or tags["empire"]
    )

    return tags


def _tags_from_attributes(attrs: Any) -> Dict[str, Any]:
    tags: Dict[str, Any] = {}
    if not isinstance(attrs, dict):
        return tags

    canonical_flags = {
        "a_line",
        "mermaid",
        "bodycon",
        "wrap",
        "belted",
        "peplum",
        "empire",
        "v_neck",
        "off_shoulder",
        "strapless",
        "halter",
        "puff_sleeve",
        "ruffle",
        "high_waist",
        "slit",
        "crop",
        "blazer",
        "saree",
        "anarkali",
        "kurta",
        "gown",
        "jumpsuit",
        "lace",
        "floral",
        "flowy",
        "classic",
        "bold",
        "waist_focus",
    }
    canonical_lengths = {"maxi", "midi", "knee", "mini", "short", "long"}

    tags_list = attrs.get("tags")
    if isinstance(tags_list, list):
        for tag in tags_list:
            if not isinstance(tag, str):
                continue
            key = tag.strip().lower().replace("-", "_")
            if key in canonical_flags:
                tags[key] = True
            if key in canonical_lengths:
                tags["length"] = key

    length = attrs.get("length")
    if isinstance(length, str):
        length_key = length.strip().lower().replace("-", "_")
        if length_key in canonical_lengths:
            tags["length"] = length_key

    for key in canonical_flags:
        value = attrs.get(key)
        if isinstance(value, bool) and value:
            tags[key] = True

    silhouette = attrs.get("silhouette")
    if isinstance(silhouette, str):
        sil_key = silhouette.strip().lower().replace("-", "_")
        if sil_key in canonical_flags:
            tags[sil_key] = True

    neckline = attrs.get("neckline")
    if isinstance(neckline, str):
        neck_key = neckline.strip().lower().replace("-", "_")
        neck_map = {
            "v_neck": "v_neck",
            "vneck": "v_neck",
            "v": "v_neck",
            "off_shoulder": "off_shoulder",
            "offshoulder": "off_shoulder",
            "strapless": "strapless",
            "halter": "halter",
        }
        mapped = neck_map.get(neck_key)
        if mapped:
            tags[mapped] = True

    sleeve = attrs.get("sleeve")
    if isinstance(sleeve, str):
        sleeve_key = sleeve.strip().lower().replace("-", "_")
        if "puff" in sleeve_key:
            tags["puff_sleeve"] = True

    waist_focus = attrs.get("waist_focus")
    if isinstance(waist_focus, bool) and waist_focus:
        tags["waist_focus"] = True

    return tags


def get_item_tags(item: Dict[str, Any], *, allow_filename_fallback: bool = False) -> Dict[str, Any]:
    tags = _tags_from_attributes(item.get("attributes"))
    if tags:
        return tags
    if allow_filename_fallback:
        return infer_item_tags_from_filename(item.get("image_path", ""))
    return tags


def _has_tag_flags(tags: Dict[str, Any]) -> bool:
    return any(value is True for key, value in tags.items() if key != "length")


def _clamp_score(score: float) -> float:
    return max(0.0, min(score, 1.0))


def _height_bucket(height_cm: Optional[float], height_ratio: Optional[float]) -> Optional[str]:
    if height_cm is not None:
        if height_cm < 160:
            return "petite"
        if height_cm > 175:
            return "tall"
        return "average"
    if height_ratio is not None:
        if height_ratio < 0.9:
            return "petite"
        if height_ratio > 1.1:
            return "tall"
        return "average"
    return None


def score_body_shape(body_shape: Optional[str], tags: Dict[str, Any]) -> Optional[float]:
    if not body_shape:
        return None
    if not _has_tag_flags(tags):
        return None
    shape = body_shape.lower()
    if shape == "triangle":
        shape = "pear"

    score = 0.5
    if shape == "pear":
        if tags.get("a_line"):
            score += 0.15
        if tags.get("wrap"):
            score += 0.12
        if tags.get("belted"):
            score += 0.12
        if tags.get("v_neck"):
            score += 0.08
        if tags.get("off_shoulder"):
            score += 0.08
        if tags.get("puff_sleeve"):
            score += 0.06
        if tags.get("peplum"):
            score += 0.1
        if tags.get("flowy"):
            score += 0.05
        if tags.get("bodycon"):
            score -= 0.15
        if tags.get("mermaid"):
            score -= 0.12
    elif shape == "apple":
        if tags.get("v_neck"):
            score += 0.15
        if tags.get("wrap"):
            score += 0.12
        if tags.get("empire"):
            score += 0.12
        if tags.get("a_line"):
            score += 0.08
        if tags.get("flowy"):
            score += 0.08
        if tags.get("bodycon"):
            score -= 0.18
        if tags.get("high_waist"):
            score -= 0.1
    elif shape == "hourglass":
        if tags.get("wrap"):
            score += 0.15
        if tags.get("belted"):
            score += 0.15
        if tags.get("bodycon"):
            score += 0.1
        if tags.get("mermaid"):
            score += 0.1
        if tags.get("v_neck"):
            score += 0.05
        if tags.get("off_shoulder"):
            score += 0.05
    elif shape == "rectangle":
        if tags.get("peplum"):
            score += 0.12
        if tags.get("belted"):
            score += 0.12
        if tags.get("wrap"):
            score += 0.1
        if tags.get("a_line"):
            score += 0.1
        if tags.get("ruffle"):
            score += 0.08
        if tags.get("off_shoulder"):
            score += 0.05
        if tags.get("bodycon"):
            score -= 0.08
    elif shape == "inverted_triangle":
        if tags.get("a_line"):
            score += 0.15
        if tags.get("peplum"):
            score += 0.08
        if tags.get("wrap"):
            score += 0.08
        if tags.get("v_neck"):
            score += 0.1
        if tags.get("flowy"):
            score += 0.05
        if tags.get("off_shoulder"):
            score -= 0.15
        if tags.get("strapless"):
            score -= 0.1
        if tags.get("puff_sleeve"):
            score -= 0.1
        if tags.get("bodycon"):
            score -= 0.05

    return _clamp_score(score)


def score_body_ratios(ratios: Optional[Dict[str, float]], tags: Dict[str, Any]) -> Optional[float]:
    if not ratios:
        return None
    if not _has_tag_flags(tags) and not tags.get("length"):
        return None

    def _ratio_value(keys: List[str]) -> Optional[float]:
        for key in keys:
            value = ratios.get(key)
            if value is not None:
                return float(value)
        return None

    waist_hip = _ratio_value(["waist_hip_ratio"])
    leg_torso = _ratio_value(["leg_to_torso"])
    shoulder_hip = _ratio_value(["shoulder_to_hip"])

    score = 0.5
    if waist_hip is not None:
        if waist_hip <= 0.9 and tags.get("waist_focus"):
            score += 0.1
        if waist_hip >= 1.05:
            if tags.get("empire") or tags.get("flowy") or tags.get("a_line"):
                score += 0.08
            if tags.get("bodycon"):
                score -= 0.1
    if leg_torso is not None:
        length = tags.get("length")
        if leg_torso >= 1.05 and length in ("mini", "knee", "midi"):
            score += 0.08
        if leg_torso <= 0.95 and length in ("maxi", "long", "midi"):
            score += 0.08
    if shoulder_hip is not None:
        if shoulder_hip >= 1.12:
            if tags.get("a_line") or tags.get("flowy"):
                score += 0.05
            if tags.get("off_shoulder") or tags.get("strapless") or tags.get("puff_sleeve"):
                score -= 0.05
        if shoulder_hip <= 0.92:
            if tags.get("off_shoulder") or tags.get("puff_sleeve"):
                score += 0.05

    return _clamp_score(score)


def score_height(
    height_cm: Optional[float],
    height_ratio: Optional[float],
    tags: Dict[str, Any],
    override_bucket: Optional[str] = None,
) -> Optional[float]:
    bucket = override_bucket or _height_bucket(height_cm, height_ratio)
    if bucket is None:
        return None

    length = tags.get("length")
    if not length:
        return None

    score = 0.5

    if bucket == "petite":
        if length in ("mini", "knee", "short"):
            score += 0.15
        if length in ("maxi", "long"):
            score -= 0.12
    elif bucket == "tall":
        if length in ("midi", "maxi", "long"):
            score += 0.12
        if length in ("mini", "short"):
            score -= 0.1
    else:
        if length in ("midi", "knee"):
            score += 0.05

    return _clamp_score(score)


def score_age(age: Optional[int], tags: Dict[str, Any]) -> Optional[float]:
    if age is None:
        return None
    if not tags.get("bold") and not tags.get("classic"):
        return None
    score = 0.5
    if age >= 40:
        if tags.get("bold"):
            score -= 0.1
        if tags.get("classic"):
            score += 0.08
    elif age <= 25:
        if tags.get("bold"):
            score += 0.1
    return _clamp_score(score)


def score_size_bucket(user_size: Optional[str], item_size: Optional[str]) -> Optional[float]:
    user = _normalize_size_bucket(user_size)
    item = _normalize_size_bucket(item_size)
    if not user or not item:
        return None
    if user == item:
        return 1.0
    if item == "regular":
        return 0.7
    if user == "regular":
        return 0.6
    return 0.3


def score_height_profile(user_height_bucket: Optional[str], item_height_bucket: Optional[str]) -> Optional[float]:
    user = _normalize_height_label(user_height_bucket)
    item = _normalize_height_label(item_height_bucket)
    if not user or not item:
        return None
    if user == item:
        return 1.0
    if item == "average":
        return 0.7
    if user == "average":
        return 0.6
    return 0.25


def _extract_body_ratios(profile: UserProfile) -> Tuple[Optional[Dict[str, float]], Optional[float]]:
    if profile.pose_ok and profile.body_ratios:
        return profile.body_ratios, 1.0
    if profile.body_ratios:
        return profile.body_ratios, 0.7
    if profile.heuristic_body_ratios:
        ratios = {
            "height_ratio": profile.heuristic_body_ratios.height_ratio,
            "waist_hip_ratio": profile.heuristic_body_ratios.waist_hip_ratio,
        }
        return ratios, profile.heuristic_body_ratios.detection_confidence
    return None, None


def _extract_user_palette(profile: UserProfile) -> Tuple[List[str], Optional[float]]:
    if profile.heuristic_skin_tone and profile.heuristic_skin_tone.palette_hex:
        return list(profile.heuristic_skin_tone.palette_hex), profile.heuristic_skin_tone.confidence
    return [], None


def build_recommendation_weights(
    base_weights: Dict[str, float],
    *,
    has_palette: bool,
    has_body_shape: bool,
    has_body_ratio: bool,
    has_height: bool,
    has_age: bool,
    has_silhouette: bool,
    has_gender: bool,
    has_style: bool,
    has_size_profile: bool,
    has_height_profile: bool,
    palette_confidence: Optional[float] = None,
    ratio_confidence: Optional[float] = None,
) -> Dict[str, float]:
    weights = dict(base_weights)
    availability = {
        "palette": has_palette,
        "body_shape": has_body_shape,
        "body_ratio": has_body_ratio,
        "height": has_height,
        "age": has_age,
        "gender": has_gender,
        "style": has_style,
        "silhouette": has_silhouette,
        "size": has_size_profile,
        "height_profile": has_height_profile,
    }

    for key, available in availability.items():
        if not available:
            weights[key] = 0.0

    if palette_confidence is not None:
        weights["palette"] = weights.get("palette", 0.0) * (0.5 + 0.5 * palette_confidence)
    if ratio_confidence is not None:
        weights["body_ratio"] = weights.get("body_ratio", 0.0) * (0.5 + 0.5 * ratio_confidence)

    total = sum(weights.values())
    if total <= 0:
        fallback_key = "palette"
        if not has_palette:
            if has_body_shape:
                fallback_key = "body_shape"
            elif has_size_profile:
                fallback_key = "size"
            else:
                fallback_key = "style"
        return {key: (1.0 if key == fallback_key else 0.0) for key in weights}

    for key in list(weights.keys()):
        weights[key] = weights[key] / total
    return weights


def rank_recommendations(
    items: List[Dict[str, Any]],
    *,
    profile: UserProfile,
    user_style: Optional[List[float]],
    user_silhouette: Optional[List[float]],
    weights: Dict[str, float],
) -> List[Dict[str, Any]]:
    user_palette_hex, palette_conf = _extract_user_palette(profile)
    user_warmth = profile.skin_warmth
    user_bucket = profile.skin_tone_bucket or (
        _warmth_to_bucket(user_warmth) if user_warmth is not None else None
    )
    body_shape = profile.body_type or profile.heuristic_body_shape
    ratios, ratio_conf = _extract_body_ratios(profile)
    inferred_height_bucket = _height_bucket(profile.height_cm, ratios.get("height_ratio") if ratios else None)
    user_height_bucket = profile.height_bucket_override or inferred_height_bucket
    user_size_bucket = profile.size_bucket
    if profile.body_shape_override:
        body_shape = profile.body_shape_override
    user_attributes = {
        "gender": profile.gender,
        "height_cm": profile.height_cm,
        "height_bucket": user_height_bucket,
        "height_bucket_inferred": inferred_height_bucket,
        "age": profile.age,
        "body_shape": body_shape,
        "body_shape_override": profile.body_shape_override,
        "body_size_bucket": user_size_bucket,
        "body_ratios": ratios,
        "skin_palette_hex": user_palette_hex,
        "skin_tone_bucket": user_bucket,
        "skin_warmth": user_warmth,
    }

    results = []
    for item in items:
        style_score = None
        if user_style is not None:
            style_sim = cosine_similarity(user_style, item.get("style_embedding"))
            if style_sim is not None:
                style_score = (style_sim + 1.0) / 2.0

        silhouette_score = None
        if user_silhouette is not None:
            silhouette_sim = cosine_similarity(user_silhouette, item.get("silhouette_embedding"))
            if silhouette_sim is not None:
                silhouette_score = (silhouette_sim + 1.0) / 2.0

        item_attrs = item.get("attributes") if isinstance(item.get("attributes"), dict) else {}
        item_size_bucket = _normalize_size_bucket(
            item_attrs.get("size") or item_attrs.get("fit") or item_attrs.get("size_profile")
        )
        item_height_bucket = _normalize_height_label(
            item_attrs.get("height_profile") or item_attrs.get("height_bucket")
        )

        tags = get_item_tags(item, allow_filename_fallback=False)

        color_vec = item.get("color_vector") or {}
        if not isinstance(color_vec, dict):
            color_vec = {}
        item_warmth = color_vec.get("warmth")
        item_palette_lab = color_vec.get("palette_lab")
        item_palette_hex = color_vec.get("palette_hex")
        item_palette_weight = color_vec.get("palette_weight")

        palette_score, palette_distance = palette_fit_score(
            user_palette_hex,
            item_palette_lab if isinstance(item_palette_lab, list) else None,
            item_palette_weight if isinstance(item_palette_weight, list) else None,
        )
        if palette_score is None:
            palette_score = color_alignment_score(user_bucket, user_warmth, item_warmth)
            palette_distance = None
        if palette_score is not None and palette_conf is not None:
            palette_score *= 0.5 + 0.5 * palette_conf
        if palette_score is not None and not profile.face_ok:
            palette_score *= 0.8

        body_shape_score = score_body_shape(body_shape, tags)
        body_ratio_score = score_body_ratios(ratios, tags)
        if body_ratio_score is not None and ratio_conf is not None:
            body_ratio_score *= 0.5 + 0.5 * ratio_conf
        height_score = score_height(
            profile.height_cm,
            ratios.get("height_ratio") if ratios else None,
            tags,
            override_bucket=user_height_bucket if profile.height_bucket_override else None,
        )
        age_score = score_age(profile.age, tags)
        gender_score = gender_match_score(profile.gender, str(item.get("gender", "")))
        size_score = score_size_bucket(user_size_bucket, item_size_bucket)
        height_profile_score = score_height_profile(user_height_bucket, item_height_bucket)

        components = {
            "palette": palette_score,
            "body_shape": body_shape_score,
            "body_ratio": body_ratio_score,
            "height": height_score,
            "age": age_score,
            "gender": gender_score,
            "style": style_score,
            "silhouette": silhouette_score,
            "size": size_score,
            "height_profile": height_profile_score,
        }

        final_score = 0.0
        for key, weight in weights.items():
            final_score += weight * (components.get(key) or 0.0)

        attribute_keys = [
            "palette",
            "body_shape",
            "body_ratio",
            "height",
            "height_profile",
            "size",
            "age",
            "gender",
        ]
        attribute_weight = sum(weights.get(key, 0.0) for key in attribute_keys)
        attribute_score = sum(
            weights.get(key, 0.0) * (components.get(key) or 0.0) for key in attribute_keys
        )
        if attribute_weight > 0:
            attribute_score /= attribute_weight

        results.append({
            "item": item,
            "final_score": final_score,
            "attribute_score": attribute_score,
            "score_breakdown": components,
            "palette_distance": palette_distance,
            "item_tags": tags,
            "item_palette_hex": item_palette_hex,
            "item_size_bucket": item_size_bucket,
            "item_height_bucket": item_height_bucket,
            "user_attributes": user_attributes,
        })

    results.sort(key=lambda entry: entry["final_score"], reverse=True)
    return results


def render_collection_embedding_ui() -> None:
    st.markdown("---")
    st.title("Step 1 — Collection embeddings")

    base_dir = Path(__file__).resolve().parent
    default_collection = base_dir / "Data" / "input" / "collection.json"
    collection_path_input = st.text_input("Collection JSON path", value=str(default_collection))
    if not collection_path_input.strip():
        st.error("Enter a valid collection JSON path.")
        return

    collection_path = resolve_relative_path(collection_path_input, base_dir)
    if not collection_path.exists():
        st.error(f"Collection JSON not found: {collection_path}")
        return
    st.session_state["collection_path"] = str(collection_path)

    try:
        items = json.loads(collection_path.read_text(encoding="utf-8"))
    except Exception as exc:
        st.error(f"Failed to read collection JSON: {exc}")
        return

    if not isinstance(items, list) or not items:
        st.warning("Collection is empty or not a list.")
        return

    st.caption(f"{len(items)} items loaded from {collection_path.name}")
    if "show_collection_table" not in st.session_state:
        st.session_state["show_collection_table"] = False
    if st.button("View collection table"):
        st.session_state["show_collection_table"] = True
    if st.session_state["show_collection_table"]:
        st.dataframe(items, use_container_width=True, height=260)

    def format_item(idx: int) -> str:
        item = items[idx]
        item_id = item.get("item_id", f"item_{idx}")
        category = item.get("category", "")
        gender = item.get("gender", "")
        label_parts = [item_id]
        if category:
            label_parts.append(category)
        if gender:
            label_parts.append(gender)
        return " | ".join(label_parts)

    selected_index = st.selectbox(
        "Select item",
        options=list(range(len(items))),
        format_func=format_item,
    )
    selected_item = items[selected_index]

    st.subheader("Selected item")
    st.json(selected_item)

    image_path_value = selected_item.get("image_path", "")
    resolved_image_path = None
    if image_path_value:
        resolved_image_path = resolve_image_path(image_path_value, collection_path)
        if not resolved_image_path.exists():
            st.warning(f"Image not found: {resolved_image_path}")
    else:
        st.warning("Selected item has no image_path.")

    if "show_selected_image" not in st.session_state:
        st.session_state["show_selected_image"] = False
    show_label = "Show selected image" if not st.session_state["show_selected_image"] else "Hide selected image"
    if st.button(show_label):
        st.session_state["show_selected_image"] = not st.session_state["show_selected_image"]
    if st.session_state["show_selected_image"]:
        if resolved_image_path is None or not resolved_image_path.exists():
            st.warning("Image file not found for selected item.")
        else:
            st.image(str(resolved_image_path), caption=resolved_image_path.name, use_column_width=True)

    st.subheader("Embedding")
    model_name = st.selectbox("Embedding model", EMBED_MODEL_OPTIONS, index=0)
    default_output = base_dir / "Data" / "output" / "embedded_selected.json"
    output_path_input = st.text_input("Output JSON path", value=str(default_output))
    save_output = st.checkbox("Save embedding to file", value=True)

    if st.button("Generate embedding"):
        if not image_path_value:
            st.error("Selected item has no image_path.")
            return
        if resolved_image_path is None or not resolved_image_path.exists():
            st.error("Image file not found for selected item.")
            return

        embedding_module, error = load_embedding_module()
        if error:
            st.error("Embedding dependencies are missing or failed to load.")
            st.code(error)
            return

        with st.spinner("Generating embedding..."):
            try:
                style_emb = embedding_module.get_style_embedding(
                    resolved_image_path, model_name=model_name
                )
                silhouette_emb = embedding_module.get_silhouette_embedding(resolved_image_path)
                color_vec = embedding_module.get_color_features(resolved_image_path)
                attributes = selected_item.get("attributes") or embedding_module.infer_attributes(
                    resolved_image_path,
                    model_name=model_name,
                )
            except Exception as exc:
                st.error(f"Embedding failed: {exc}")
                return

        result = {
            "item_id": selected_item.get("item_id", ""),
            "category": selected_item.get("category", ""),
            "gender": selected_item.get("gender", ""),
            "image_path": image_path_value,
            "attributes": attributes,
            "model": model_name,
            "style_embedding": style_emb,
            "silhouette_embedding": silhouette_emb,
            "color_vector": color_vec,
        }
        st.session_state["embedding_result"] = result

        if save_output:
            output_path = resolve_relative_path(output_path_input, base_dir)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
            st.session_state["embedding_output_path"] = str(output_path)
            st.success(f"Saved embedding to {output_path}")
        else:
            st.session_state["embedding_output_path"] = ""
            st.success("Embedding created.")
        st.session_state["has_embedding"] = True

    if "embedding_result" in st.session_state:
        result = st.session_state["embedding_result"]
        style_len = len(result.get("style_embedding", []))
        silhouette_len = len(result.get("silhouette_embedding", []))
        st.subheader("Embedding result")
        st.write(f"Style embedding dims: {style_len}, Silhouette dims: {silhouette_len}")
        output_path = st.session_state.get("embedding_output_path", "")
        if output_path:
            st.caption(f"Saved to: {output_path}")
        else:
            st.caption("Not saved to disk.")

        if st.checkbox("Show embedding summary table", value=True):
            color_vec = result.get("color_vector", {})
            row = {
                "item_id": result.get("item_id", ""),
                "model": result.get("model", ""),
                "image_path": result.get("image_path", ""),
                "style_dim": style_len,
                "silhouette_dim": silhouette_len,
                "warmth": color_vec.get("warmth", ""),
                "brightness": color_vec.get("brightness", ""),
                "output_path": output_path or "",
            }
            st.dataframe([row], use_container_width=True)

        with st.expander("Show full embedding JSON"):
            st.json(result)

    st.markdown("---")
    st.subheader("Embed entire collection")
    default_all_output = base_dir / "Data" / "output" / "embedded_collection.json"
    all_output_path_input = st.text_input("All embeddings output path", value=str(default_all_output))
    save_all_output = st.checkbox("Save all embeddings to file", value=True)
    skip_missing = st.checkbox("Skip items with missing images", value=True)

    st.caption("If embeddings already exist, load them instead of recomputing.")
    existing_embeddings_input = st.text_input(
        "Existing embeddings JSON path",
        value=str(default_all_output),
        key="existing_embeddings_path",
    )
    if st.button("Load embeddings from file"):
        existing_path = resolve_relative_path(existing_embeddings_input, base_dir)
        loaded, error = load_embeddings_from_file(existing_path)
        if error:
            st.error(error)
        else:
            st.session_state["embedding_all_result"] = loaded
            st.session_state["embedding_all_output_path"] = str(existing_path)
            st.session_state["has_embedding"] = True
            st.success(f"Loaded {len(loaded)} embeddings from {existing_path}")

    if st.button("Generate embeddings for all items"):
        embedding_module, error = load_embedding_module()
        if error:
            st.error("Embedding dependencies are missing or failed to load.")
            st.code(error)
            return

        results = []
        errors = []
        progress = st.progress(0)
        total = len(items)

        for idx, item in enumerate(items, start=1):
            item_id = item.get("item_id", f"item_{idx}")
            image_path = item.get("image_path")
            if not image_path:
                msg = f"Missing image_path for item {item_id}"
                if skip_missing:
                    errors.append(msg)
                    progress.progress(idx / total)
                    continue
                st.error(msg)
                return

            resolved = resolve_image_path(image_path, collection_path)
            if not resolved.exists():
                msg = f"Image not found for item {item_id}: {resolved}"
                if skip_missing:
                    errors.append(msg)
                    progress.progress(idx / total)
                    continue
                st.error(msg)
                return

            try:
                style_emb = embedding_module.get_style_embedding(resolved, model_name=model_name)
                silhouette_emb = embedding_module.get_silhouette_embedding(resolved)
                color_vec = embedding_module.get_color_features(resolved)
                attributes = item.get("attributes") or embedding_module.infer_attributes(
                    resolved,
                    model_name=model_name,
                )
            except Exception as exc:
                msg = f"Embedding failed for item {item_id}: {exc}"
                if skip_missing:
                    errors.append(msg)
                    progress.progress(idx / total)
                    continue
                st.error(msg)
                return

            results.append({
                "item_id": item_id,
                "category": item.get("category", ""),
                "gender": item.get("gender", ""),
                "image_path": image_path,
                "attributes": attributes,
                "model": model_name,
                "style_embedding": style_emb,
                "silhouette_embedding": silhouette_emb,
                "color_vector": color_vec,
            })

            progress.progress(idx / total)

        st.session_state["embedding_all_result"] = results
        if save_all_output:
            output_path = resolve_relative_path(all_output_path_input, base_dir)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
            st.session_state["embedding_all_output_path"] = str(output_path)
            st.success(f"Saved {len(results)} embeddings to {output_path}")
        else:
            st.session_state["embedding_all_output_path"] = ""
            st.success(f"Generated {len(results)} embeddings.")
        st.session_state["has_embedding"] = True

        if errors:
            st.warning(f"Skipped {len(errors)} items with errors.")
            with st.expander("Show skipped items"):
                st.write("\n".join(errors))

    if "embedding_all_result" in st.session_state:
        all_results = st.session_state["embedding_all_result"]
        st.subheader("All embeddings result")
        st.write(f"Total embeddings: {len(all_results)}")
        output_path = st.session_state.get("embedding_all_output_path", "")
        if output_path:
            st.caption(f"Saved to: {output_path}")
        else:
            st.caption("Not saved to disk.")

        if st.checkbox("Show all embeddings summary table", value=False):
            rows = []
            for item in all_results:
                color_vec = item.get("color_vector", {})
                rows.append({
                    "item_id": item.get("item_id", ""),
                    "model": item.get("model", ""),
                    "image_path": item.get("image_path", ""),
                    "style_dim": len(item.get("style_embedding", [])),
                    "silhouette_dim": len(item.get("silhouette_embedding", [])),
                    "warmth": color_vec.get("warmth", ""),
                    "brightness": color_vec.get("brightness", ""),
                    "output_path": output_path or "",
                })
            st.dataframe(rows, use_container_width=True, height=320)


def render_user_profile_ui() -> None:
    st.markdown("---")
    st.title("Step 2 — User profile")

    if not st.session_state.get("has_embedding"):
        st.info("Generate embeddings first to unlock the user profile step.")
        return

    manual_mode = st.checkbox(
        "Manual mode (skip image upload; use typed attributes only)",
        value=False,
        key="user_manual_mode_toggle",
    )
    st.session_state["user_manual_mode"] = manual_mode

    base_dir = Path(__file__).resolve().parent
    gender = st.selectbox(
        "Gender",
        options=["female", "male", "non-binary", "prefer not to say"],
        index=0,
        key="user_profile_gender",
    )
    height_cm = st.number_input(
        "Height (cm)",
        min_value=120,
        max_value=220,
        value=165 if not manual_mode else 150,
        step=1,
        key="user_profile_height",
    )
    age_years = st.number_input(
        "Age (years)",
        min_value=0,
        max_value=120,
        value=25,
        step=1,
        key="user_profile_age",
    )

    if not manual_mode:
        with st.expander("Detection settings", expanded=False):
            pose_min_conf = st.slider(
                "Pose detection confidence",
                min_value=0.1,
                max_value=0.9,
                value=0.1,
                step=0.05,
                key="user_pose_min_conf",
            )
            face_min_conf = st.slider(
                "Face detection confidence",
                min_value=0.1,
                max_value=0.9,
                value=0.1,
                step=0.05,
                key="user_face_min_conf",
            )

        uploaded = st.file_uploader(
            "Upload user image",
            type=["png", "jpg", "jpeg", "webp"],
            accept_multiple_files=False,
            key="user_profile_upload",
        )

        if not uploaded:
            st.info("Upload a user image to generate the profile, or enable Manual mode above.")
            return

    image = None
    tmp_path = None
    if not manual_mode:
        uploaded_bytes = uploaded.getvalue()
        image_hash = hashlib.sha256(uploaded_bytes).hexdigest()
        if st.session_state.get("user_image_hash") != image_hash:
            st.session_state["user_image_hash"] = image_hash
            st.session_state.pop("user_style_embedding", None)
            st.session_state.pop("user_style_model", None)
            st.session_state.pop("user_silhouette_embedding", None)
            st.session_state.pop("recommendation_results", None)

        image = Image.open(io.BytesIO(uploaded_bytes)).convert("RGB")

        st.subheader("User image")
        st.image(image, use_column_width=True, caption=uploaded.name or "uploaded image")

        pose_mod, face_mod, mp_error = load_mediapipe_solutions()
        if mp_error:
            st.info("MediaPipe not available; using heuristic fallbacks for body ratios and skin tone.")

        try:
            suffix = Path(uploaded.name or "").suffix or ".png"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
                tmp_file.write(uploaded_bytes)
                tmp_path = Path(tmp_file.name)
            profile = build_user_profile(
                str(tmp_path),
                gender=gender,
                height_cm=float(height_cm),
                age=int(age_years),
                include_style_embedding=False,
                pose_min_confidence=pose_min_conf,
                face_min_confidence=face_min_conf,
            )
        except Exception as exc:
            if tmp_path is not None:
                tmp_path.unlink(missing_ok=True)
            st.error(f"Profile generation failed: {exc}")
            return
    else:
        default_palette = "#c58c85, #b5835a, #8d5524"  # warm fair/medium brownish
        manual_palette_input = st.text_input(
            "Skin palette hex (comma-separated)",
            value=default_palette,
            key="manual_mode_palette",
        )
        manual_palette = _parse_hex_palette(manual_palette_input)
        manual_bucket_choice = st.selectbox(
            "Skin tone bucket",
            options=["Warm", "Neutral", "Cool"],
            index=0,
            key="manual_mode_skin_bucket",
        )
        body_shape_choice = st.selectbox(
            "Body shape",
            options=["hourglass", "rectangle", "pear", "apple", "inverted_triangle"],
            index=2,
            key="manual_mode_body_shape",
        )
        profile = UserProfile(
            gender=gender,
            height_cm=float(height_cm),
            age=int(age_years),
        )
        profile.body_shape_override = _normalize_body_shape_override(body_shape_choice)
        profile.body_type = profile.body_shape_override
        profile.heuristic_skin_tone = SkinToneResult(
            palette_hex=manual_palette,
            confidence=1.0,
            notes=["Manual palette (no image)"],
        )
        profile.skin_tone_bucket = manual_bucket_choice.lower()
        profile.skin_warmth = None

    st.subheader("Manual overrides (optional)")
    body_shape_override = st.selectbox(
        "Body shape (override detection)",
        options=[
            "Auto (use detected)",
            "hourglass",
            "rectangle",
            "pear",
            "apple",
            "inverted_triangle",
        ],
        index=0,
        key="user_body_shape_override",
    )
    size_bucket_choice = st.selectbox(
        "Body size (self-report)",
        options=["Skip", "Slim / Thin", "Medium / Average", "Full / Curvy"],
        index=0,
        key="user_size_bucket",
    )
    height_bucket_choice = st.selectbox(
        "Height bucket (self-report)",
        options=["Auto (use height)", "Short / Petite", "Average", "Tall"],
        index=0,
        key="user_height_bucket_override",
    )

    profile.body_shape_override = _normalize_body_shape_override(
        None if body_shape_override.startswith("Auto") else body_shape_override
    )
    size_map = {
        "Slim / Thin": "slim",
        "Medium / Average": "regular",
        "Full / Curvy": "full",
    }
    profile.size_bucket = _normalize_size_bucket(size_map.get(size_bucket_choice))
    if height_bucket_choice.startswith("Auto"):
        profile.height_bucket_override = None
    else:
        profile.height_bucket_override = _normalize_height_label(height_bucket_choice)

    st.subheader("Skin preferences (optional)")
    manual_palette_input = st.text_input(
        "Manual skin palette hex (comma-separated, e.g. #d2a67b, #8c5a3c)",
        value="",
        key="user_manual_palette",
    )
    manual_palette = _parse_hex_palette(manual_palette_input)
    manual_bucket_choice = st.selectbox(
        "Skin tone bucket override",
        options=["Auto (use detection)", "Warm", "Cool", "Neutral"],
        index=0,
        key="user_skin_bucket_override",
    )
    use_manual_palette = st.checkbox(
        "Use manual palette instead of detected skin swatches",
        value=bool(manual_palette),
        key="user_use_manual_palette",
    )
    if manual_bucket_choice != "Auto (use detection)":
        profile.skin_tone_bucket = manual_bucket_choice.lower()
        profile.skin_warmth = None  # prefer manual bucket over detected warmth
    if use_manual_palette and manual_palette:
        profile.heuristic_skin_tone = SkinToneResult(
            palette_hex=manual_palette,
            confidence=1.0,
            notes=["Manual palette"],
        )
        profile.skin_warmth = None  # avoid blending manual palette with detected warmth

    st.subheader("Attributes")
    cols = st.columns(3)
    cols[0].metric("Body type (using)", profile.body_shape_override or profile.body_type or "unknown")
    cols[1].metric("Skin tone", profile.skin_tone_bucket or "unknown")
    cols[2].metric("Pose detected", "Yes" if profile.pose_ok else "No")

    ratios = profile.body_ratios or {}
    ratio_cols = st.columns(2)
    shoulder_hip = ratios.get("shoulder_to_hip")
    leg_torso = ratios.get("leg_to_torso")
    waist_hip = ratios.get("waist_hip_ratio")
    height_ratio = ratios.get("height_ratio")
    if shoulder_hip is not None:
        ratio_cols[0].metric("Shoulder/Hip", f"{shoulder_hip:.2f}")
    elif waist_hip is not None:
        ratio_cols[0].metric("Waist/Hip (stub)", f"{waist_hip:.2f}")
    else:
        ratio_cols[0].metric("Shoulder/Hip", "n/a")
    if leg_torso is not None:
        ratio_cols[1].metric("Leg/Torso", f"{leg_torso:.2f}")
    elif height_ratio is not None:
        ratio_cols[1].metric("Height ratio (stub)", f"{height_ratio:.2f}")
    else:
        ratio_cols[1].metric("Leg/Torso", "n/a")

    inferred_height_bucket = _height_bucket(profile.height_cm, height_ratio)
    active_height_bucket = profile.height_bucket_override or inferred_height_bucket or "unknown"
    active_size_bucket = profile.size_bucket or "n/a"
    if profile.body_shape_override:
        st.caption(f"Detected body shape: {profile.body_type or 'unknown'} (override applied)")
    st.caption(f"Using size bucket: {active_size_bucket} | Using height bucket: {active_height_bucket}")

    heuristic_ratios = profile.heuristic_body_ratios
    heuristic_shape = profile.heuristic_body_shape
    heuristic_skin = profile.heuristic_skin_tone
    if heuristic_ratios or heuristic_skin:
        st.subheader("Heuristic attributes")
        if heuristic_ratios:
            h_cols = st.columns(4)
            h_cols[0].metric("Height ratio (heuristic)", f"{heuristic_ratios.height_ratio:.2f}")
            h_cols[1].metric("Waist/Hip (heuristic)", f"{heuristic_ratios.waist_hip_ratio:.2f}")
            h_cols[2].metric("Ratio conf (heuristic)", f"{heuristic_ratios.detection_confidence:.2f}")
            h_cols[3].metric("Body shape (heuristic)", heuristic_shape or "n/a")
            if heuristic_ratios.notes:
                st.caption("Heuristic ratio notes: " + " ".join(heuristic_ratios.notes))
        if heuristic_skin:
            st.caption(f"Heuristic skin tone confidence: {heuristic_skin.confidence:.2f}")
            if heuristic_skin.palette_hex:
                swatches = []
                for color in heuristic_skin.palette_hex:
                    swatches.append(
                        f"<div style='display:inline-block;width:48px;height:24px;"
                        f"background:{color};border-radius:6px;border:1px solid #444;"
                        f"margin-right:6px;'></div>"
                    )
                st.markdown("".join(swatches), unsafe_allow_html=True)
                st.code(", ".join(heuristic_skin.palette_hex), language="text")
            if heuristic_skin.notes:
                st.caption("Heuristic skin notes: " + " ".join(heuristic_skin.notes))

    if profile.skin_warmth is not None:
        st.caption(f"Skin warmth (LAB A): {profile.skin_warmth:.2f}")
    if not profile.face_ok:
        st.caption("Face not detected; skin tone uses fallback region.")
    if not profile.pose_ok and (waist_hip is not None or height_ratio is not None):
        st.caption("Pose not detected; using heuristic ratios because MediaPipe is unavailable.")
    elif not profile.pose_ok:
        st.caption("Pose not detected; body ratios may be missing.")

    st.subheader("User embedding")
    if manual_mode:
        st.info("Manual mode: style/silhouette embeddings are skipped.")
        style_embedding = None
    else:
        if st.button("Generate user embedding"):
            if tmp_path is None:
                st.error("No image available to embed.")
            else:
                try:
                    model_name = "ViT-B/32"
                    st.session_state["user_style_embedding"] = extract_style_embedding(
                        str(tmp_path),
                        model_name=model_name,
                    )
                    st.session_state["user_style_model"] = model_name
                    st.success("User embedding generated.")
                except Exception as exc:
                    st.error(f"Embedding failed: {exc}")

        style_embedding = st.session_state.get("user_style_embedding")
        if style_embedding is not None:
            st.caption(f"Style embedding dims: {len(style_embedding)}")
            if st.checkbox("Show user embedding JSON", value=False, key="user_embedding_json"):
                st.json(style_embedding)

    if tmp_path is not None:
        tmp_path.unlink(missing_ok=True)

    profile_dict = profile_to_dict(profile)
    profile_dict["image_name"] = uploaded.name if not manual_mode else "manual"
    profile_dict["mode"] = "manual" if manual_mode else "image"
    if style_embedding is not None:
        profile_dict["style_embedding"] = style_embedding
    else:
        profile_dict.pop("style_embedding", None)

    uploaded_name = uploaded.name if not manual_mode else "manual_user"
    default_profile_path = base_dir / "Data" / "output" / f"user_profile_{Path(uploaded_name or 'user').stem}.json"
    if "user_profile_output_path" not in st.session_state:
        st.session_state["user_profile_output_path"] = str(default_profile_path)
    profile_output_input = st.text_input("User profile output path", key="user_profile_output_path")

    output_path = resolve_relative_path(profile_output_input, base_dir)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(profile_dict, indent=2), encoding="utf-8")
    st.caption(f"Saved to: {output_path}")

    st.subheader("User profile JSON")
    st.json(profile_dict)

    st.markdown("---")
    st.title("Step 3 — Recommendations")
    st.write(
        "Generate recommendations by matching skin palette, body shape, height, body ratios, "
        "age, and gender. Similarity scores are optional."
    )

    default_embeddings_path = base_dir / "Data" / "output" / "embedded_collection.json"
    use_session_embeddings = st.checkbox(
        "Use embeddings from Step 1 if available",
        value=True,
        key="reco_use_session_embeddings",
    )
    embeddings_path_input = st.text_input(
        "Embeddings JSON path",
        value=str(default_embeddings_path),
        key="reco_embeddings_path",
    )

    with st.expander("Scoring weights", expanded=False):
        st.caption("Attribute-first scoring. Set similarity weights to 0 to avoid image similarity.")
        base_palette = st.slider("Skin palette match", 0.0, 1.0, 0.35, 0.05, key="reco_weight_palette")
        base_body_shape = st.slider("Body shape fit", 0.0, 1.0, 0.2, 0.05, key="reco_weight_body_shape")
        base_body_ratio = st.slider("Body ratio fit", 0.0, 1.0, 0.1, 0.05, key="reco_weight_body_ratio")
        base_height = st.slider("Height/length fit", 0.0, 1.0, 0.1, 0.05, key="reco_weight_height")
        base_height_profile = st.slider(
            "Short/petite/average/tall match",
            0.0,
            1.0,
            0.1,
            0.05,
            key="reco_weight_height_profile",
        )
        base_size_profile = st.slider(
            "Body size/fit match (thin/medium/full)",
            0.0,
            1.0,
            0.15,
            0.05,
            key="reco_weight_size_profile",
        )
        base_age = st.slider("Age/style fit", 0.0, 1.0, 0.05, 0.05, key="reco_weight_age")
        base_gender = st.slider("Gender match", 0.0, 1.0, 0.05, 0.05, key="reco_weight_gender")
        base_style = st.slider("Style similarity (optional)", 0.0, 1.0, 0.0, 0.05, key="reco_weight_style")
        base_silhouette = st.slider("Silhouette similarity (optional)", 0.0, 1.0, 0.0, 0.05, key="reco_weight_sil")

    if st.button("Get recommendations", key="reco_button"):
        if use_session_embeddings and "embedding_all_result" in st.session_state:
            items = st.session_state["embedding_all_result"]
            embedding_path_used = st.session_state.get("embedding_all_output_path") or ""
        else:
            embeddings_path = resolve_relative_path(embeddings_path_input, base_dir)
            loaded, error = load_embeddings_from_file(embeddings_path)
            if error:
                st.error(error)
                return
            items = loaded
            embedding_path_used = str(embeddings_path)

        if not items:
            st.error("No embeddings available for recommendations.")
            return
        palette_ready = any(
            isinstance(item.get("color_vector"), dict) and item.get("color_vector", {}).get("palette_hex")
            for item in items[:20]
        )
        if not palette_ready:
            st.warning(
                "Embeddings do not include color palettes yet. Re-run Step 1 to regenerate "
                "embeddings for palette-based matching."
            )
        attributes_ready = any(get_item_tags(item, allow_filename_fallback=False) for item in items[:20])
        if not attributes_ready:
            st.warning(
                "No item attributes found. Re-run Step 1 to auto-tag items, or add an "
                "`attributes` object in collection.json for manual control."
            )
        size_profile_ready = any(
            _normalize_size_bucket(
                (item.get("attributes") or {}).get("size")
                or (item.get("attributes") or {}).get("fit")
                or (item.get("attributes") or {}).get("size_profile")
            )
            for item in items[:20]
        )
        height_profile_ready = any(
            _normalize_height_label(
                (item.get("attributes") or {}).get("height_profile")
                or (item.get("attributes") or {}).get("height_bucket")
            )
            for item in items[:20]
        )

        model_name = None
        for item in items:
            model_name = item.get("model")
            if model_name:
                break
        if not model_name:
            model_name = "ViT-B/32"

        manual_mode_reco = st.session_state.get("user_manual_mode", False)
        user_style = None
        user_silhouette = None
        try:
            if manual_mode_reco and (base_style > 0.0 or base_silhouette > 0.0):
                st.warning("Manual mode: style/silhouette similarity disabled.")
                base_style = 0.0
                base_silhouette = 0.0
            if base_style > 0.0:
                user_style = st.session_state.get("user_style_embedding")
                user_style_model = st.session_state.get("user_style_model")
                if user_style is None or user_style_model != model_name:
                    with st.spinner("Generating user style embedding..."):
                        user_style = extract_style_embedding_from_image(image, model_name=model_name)
                    st.session_state["user_style_embedding"] = user_style
                    st.session_state["user_style_model"] = model_name

            if base_silhouette > 0.0:
                user_silhouette = st.session_state.get("user_silhouette_embedding")
                if user_silhouette is None:
                    with st.spinner("Generating user silhouette embedding..."):
                        user_silhouette = extract_silhouette_embedding_from_image(image)
                    st.session_state["user_silhouette_embedding"] = user_silhouette
        except Exception as exc:
            st.error(f"Failed to generate user embeddings: {exc}")
            return

        body_shape = profile.body_type or profile.heuristic_body_shape
        user_warmth = profile.skin_warmth
        user_bucket = profile.skin_tone_bucket
        if user_bucket is None and user_warmth is not None:
            user_bucket = _warmth_to_bucket(user_warmth)

        user_palette_hex, palette_conf = _extract_user_palette(profile)
        ratios, ratio_conf = _extract_body_ratios(profile)
        inferred_height_bucket = _height_bucket(
            profile.height_cm,
            ratios.get("height_ratio") if ratios else None,
        )
        user_height_bucket = profile.height_bucket_override or inferred_height_bucket

        base_weights = {
            "palette": base_palette,
            "body_shape": base_body_shape,
            "body_ratio": base_body_ratio,
            "height": base_height,
            "height_profile": base_height_profile,
            "size": base_size_profile,
            "age": base_age,
            "gender": base_gender,
            "style": base_style,
            "silhouette": base_silhouette,
        }
        has_gender = normalize_gender(profile.gender) not in ("", "any")
        has_palette = bool(user_palette_hex or user_bucket or user_warmth is not None)
        has_body_shape = bool(body_shape)
        has_body_ratio = bool(ratios)
        has_height = profile.height_cm is not None
        has_height_profile = bool(user_height_bucket and height_profile_ready)
        has_size_profile = bool(profile.size_bucket and size_profile_ready)
        has_age = profile.age is not None
        has_style = user_style is not None
        has_silhouette = user_silhouette is not None
        weights = build_recommendation_weights(
            base_weights,
            has_palette=has_palette,
            has_body_shape=has_body_shape,
            has_body_ratio=has_body_ratio,
            has_height=has_height,
            has_age=has_age,
            has_silhouette=has_silhouette,
            has_gender=has_gender,
            has_style=has_style,
            has_size_profile=has_size_profile,
            has_height_profile=has_height_profile,
            palette_confidence=palette_conf if user_palette_hex else None,
            ratio_confidence=ratio_conf,
        )

        results = rank_recommendations(
            items,
            profile=profile,
            user_style=user_style,
            user_silhouette=user_silhouette,
            weights=weights,
        )

        if not results:
            st.error("No items could be scored for recommendations.")
            return

        st.session_state["recommendation_results"] = results
        st.session_state["recommendation_weights"] = weights
        st.session_state["recommendation_meta"] = {
            "body_shape": body_shape,
            "skin_bucket": user_bucket,
            "skin_palette": user_palette_hex,
            "height_bucket": user_height_bucket,
            "height_bucket_inferred": inferred_height_bucket,
            "size_bucket": profile.size_bucket,
        }
        st.session_state["recommendation_embedding_path"] = embedding_path_used

    results = st.session_state.get("recommendation_results")
    if results:
        weights = st.session_state.get("recommendation_weights", {})
        meta = st.session_state.get("recommendation_meta", {})
        body_shape = meta.get("body_shape")
        skin_bucket = meta.get("skin_bucket")
        base_dirs: List[Path] = []
        embedding_path_used = st.session_state.get("recommendation_embedding_path") or ""
        if embedding_path_used:
            base_dirs.append(Path(embedding_path_used).resolve().parent)
        collection_path = st.session_state.get("collection_path")
        if collection_path:
            base_dirs.append(Path(collection_path).resolve().parent)
        base_dirs.append(base_dir)
        seen_dirs = set()
        deduped_dirs = []
        for dir_path in base_dirs:
            key = str(dir_path)
            if key in seen_dirs:
                continue
            seen_dirs.add(key)
            deduped_dirs.append(dir_path)

        weight_parts = [
            f"palette {weights.get('palette', 0.0):.2f}",
            f"body_shape {weights.get('body_shape', 0.0):.2f}",
            f"body_ratio {weights.get('body_ratio', 0.0):.2f}",
            f"height {weights.get('height', 0.0):.2f}",
            f"height_profile {weights.get('height_profile', 0.0):.2f}",
            f"size {weights.get('size', 0.0):.2f}",
            f"age {weights.get('age', 0.0):.2f}",
            f"gender {weights.get('gender', 0.0):.2f}",
            f"style {weights.get('style', 0.0):.2f}",
            f"silhouette {weights.get('silhouette', 0.0):.2f}",
        ]
        st.caption("Weights used: " + " | ".join(weight_parts))
        if body_shape:
            st.caption(f"Body shape considered: {body_shape}")
        if skin_bucket:
            st.caption(f"Skin tone bucket: {skin_bucket}")
        if meta.get("height_bucket"):
            st.caption(f"Height bucket: {meta['height_bucket']}")
        if meta.get("height_bucket_inferred") and meta.get("height_bucket") != meta.get("height_bucket_inferred"):
            st.caption(f"Height bucket override applied (inferred {meta['height_bucket_inferred']})")
        if meta.get("size_bucket"):
            st.caption(f"Body size bucket: {meta['size_bucket']}")
        if meta.get("skin_palette"):
            st.caption("Skin palette: " + ", ".join(meta["skin_palette"]))

        st.subheader("Top 3 recommendations")
        top_results = results[:3]
        for idx, result in enumerate(top_results, start=1):
            item = result["item"]
            item_id = item.get("item_id", f"item_{idx}")
            category = item.get("category", "")
            gender = item.get("gender", "")
            image_path = item.get("image_path", "")

            st.markdown(f"### {idx}. {item_id}")
            meta_parts = [part for part in (category, gender) if part]
            if meta_parts:
                st.caption(" | ".join(meta_parts))

            if image_path:
                resolved_image = resolve_item_image_path(image_path, deduped_dirs)
                if resolved_image is not None:
                    st.image(str(resolved_image), use_column_width=True)

            scores = result.get("score_breakdown", {})
            user_attrs = result.get("user_attributes", {})
            tags = result.get("item_tags", {})
            palette_distance = result.get("palette_distance")

            reasons = []
            if scores.get("palette") is not None:
                if palette_distance is not None:
                    reasons.append(f"Skin palette fit: {scores['palette']:.2f} (ΔE {palette_distance:.1f})")
                else:
                    reasons.append(f"Skin tone fit: {scores['palette']:.2f}")
            if body_shape and scores.get("body_shape") is not None:
                reasons.append(f"Body shape fit ({body_shape}): {scores['body_shape']:.2f}")
            if scores.get("body_ratio") is not None:
                reasons.append(f"Body ratio fit: {scores['body_ratio']:.2f}")
            if scores.get("height") is not None and meta.get("height_bucket"):
                reasons.append(f"Height fit ({meta['height_bucket']}): {scores['height']:.2f}")
            if scores.get("height_profile") is not None and meta.get("height_bucket"):
                reasons.append(
                    f"Short/average/tall match ({meta['height_bucket']}): {scores['height_profile']:.2f}"
                )
            if scores.get("size") is not None and meta.get("size_bucket"):
                reasons.append(
                    f"Body size fit ({meta['size_bucket']} → {result.get('item_size_bucket', 'n/a')}): "
                    f"{scores['size']:.2f}"
                )
            if scores.get("age") is not None and user_attrs.get("age") is not None:
                reasons.append(f"Age fit ({user_attrs['age']}): {scores['age']:.2f}")
            if scores.get("gender") is not None and scores.get("gender") >= 0.6:
                reasons.append("Matches gender preference")
            if scores.get("style") is not None and weights.get("style", 0.0) > 0:
                reasons.append(f"Style similarity: {scores['style']:.2f}")
            if scores.get("silhouette") is not None and weights.get("silhouette", 0.0) > 0:
                reasons.append(f"Silhouette similarity: {scores['silhouette']:.2f}")

            st.caption(
                f"Final score: {result['final_score']:.3f} | "
                f"Attribute fit: {result.get('attribute_score', 0.0):.3f}"
            )
            tag_labels = []
            if tags.get("length"):
                tag_labels.append(f"length {tags['length']}")
            if tags.get("a_line"):
                tag_labels.append("a-line")
            if tags.get("wrap"):
                tag_labels.append("wrap")
            if tags.get("belted"):
                tag_labels.append("belted")
            if tags.get("v_neck"):
                tag_labels.append("v-neck")
            if tags.get("off_shoulder"):
                tag_labels.append("off-shoulder")
            if tags.get("bodycon"):
                tag_labels.append("bodycon")
            if tags.get("mermaid"):
                tag_labels.append("mermaid")
            if tag_labels:
                st.caption("Detected tags: " + ", ".join(tag_labels[:8]))
            if result.get("item_palette_hex"):
                palette_list = result["item_palette_hex"]
                if isinstance(palette_list, list):
                    st.caption("Item palette: " + ", ".join(palette_list))
            st.markdown("**Why this is recommended**")
            if reasons:
                st.markdown("- " + "\n- ".join(reasons))
            else:
                st.markdown("- No attribute signals were available for this item.")


def render_validation_ui() -> None:
    st.title("Step 3 — Validation (optional)")
    st.write(
        "This step checks whether the uploaded photo is usable before running the rest "
        "of the recommendation pipeline. In production, swap the stubbed detector with "
        "an ONNX/TensorRT-served orientation/full-body model."
    )

    cfg = ValidationConfig(
        min_full_body_conf=st.slider("Min full-body confidence", 0.0, 1.0, 0.6, 0.05),
        min_front_facing_conf=st.slider("Min front-facing confidence", 0.0, 1.0, 0.6, 0.05),
        min_detection_confidence=st.slider("Min overall detection confidence", 0.0, 1.0, 0.5, 0.05),
    )

    uploaded = st.file_uploader(
        "Upload a front-facing, full-body image",
        type=["png", "jpg", "jpeg", "webp"],
        accept_multiple_files=False,
    )

    if not uploaded:
        st.info("Upload an image to run the validation step.")
        return

    image = Image.open(uploaded).convert("RGB")

    st.subheader("Preview")
    st.image(image, use_column_width=True, caption=uploaded.name or "uploaded image")

    st.subheader("Validation results")
    with st.spinner("Running stubbed detector..."):
        result = stub_orientation_and_body_detection(image)
        is_valid = validate_image(result, cfg)

    cols = st.columns(3)
    cols[0].metric("Full-body detected", "Yes" if result.is_full_body else "No")
    cols[1].metric("Front-facing", "Yes" if result.is_front_facing else "No")
    cols[2].metric("Detection confidence", f"{result.detection_confidence:.2f}")

    if is_valid:
        st.success("Pass: image meets validation thresholds.")
    else:
        st.error("Fail: image did not meet validation thresholds.")

    if result.notes:
        st.caption("Notes: " + " ".join(result.notes))

    st.markdown(
        "> Replace `stub_orientation_and_body_detection` with your ONNX/TensorRT "
        "model inference call. Keep the return signature intact to plug into the next "
        "pipeline steps."
    )

    st.markdown("---")
    st.title("Landmarks & body ratios (optional, stubbed)")
    st.write(
        "Illustrative computation of height_ratio and waist_hip_ratio. Swap the stub "
        "for your pose/landmark model output to feed downstream steps."
    )

    if not is_valid:
        st.warning("Ratios are only computed when the image passes validation.")
        return

    with st.spinner("Estimating ratios..."):
        ratios = stub_estimate_body_ratios(image, result)

    cols2 = st.columns(3)
    cols2[0].metric("Height ratio", f"{ratios.height_ratio:.2f}")
    cols2[1].metric("Waist/Hip ratio", f"{ratios.waist_hip_ratio:.2f}")
    cols2[2].metric("Ratio confidence", f"{ratios.detection_confidence:.2f}")

    if ratios.notes:
        st.caption("Notes: " + " ".join(ratios.notes))

    with st.expander("How these ratios are calculated (stubbed)"):
        st.markdown(
            "- **What they mean:** `height_ratio` is a normalized proxy for how tall the "
            "person appears in the frame; `waist_hip_ratio` compares estimated waist width "
            "to hip width. In a real model, these come from keypoint distances.\n"
            "- **How this demo estimates them:** it slices horizontal bands from the grayscale "
            "image (waist ≈ 45–55% of height, hips ≈ 60–75%), measures average luminance, "
            "and derives a ratio. Height ratio is a scaled height/width heuristic. These are "
            "deterministic placeholders—replace with landmark-based measurements from your "
            "pose model."
        )

    st.markdown(
        "> Replace `stub_estimate_body_ratios` with your pose/landmark model. Keep the "
        "return signature to chain into extreme-case detection and styling rules."
    )

    st.markdown("---")
    st.title("Skin tone extraction (optional, stubbed)")
    st.write(
        "Approximates a skin tone palette from face/arm regions. Replace with a proper "
        "skin/face segmenter and a robust tone model."
    )

    with st.spinner("Extracting skin tone..."):
        skin = stub_extract_skin_tone(image, result)

    col3 = st.columns(2)
    with col3[0]:
        st.metric("Skin tone confidence", f"{skin.confidence:.2f}")
        if skin.notes:
            st.caption("Notes: " + " ".join(skin.notes))
    with col3[1]:
        st.markdown("Detected palette:")
        if skin.palette_hex:
            swatches = []
            for color in skin.palette_hex:
                swatches.append(
                    f"<div style='display:inline-block;width:48px;height:24px;"
                    f"background:{color};border-radius:6px;border:1px solid #444;"
                    f"margin-right:6px;'></div>"
                )
            st.markdown("".join(swatches), unsafe_allow_html=True)
            st.code(", ".join(skin.palette_hex), language="text")
        else:
            st.info("No palette detected.")

    with st.expander("How this skin tone stub works"):
        st.markdown(
            "- Samples likely skin regions (face/arms) via fixed boxes.\n"
            "- Converts to RGB and performs coarse quantization (16 levels/channel) to "
            "find the top 3 dominant bins.\n"
            "- Confidence mixes pixel coverage and color variance; low coverage or low "
            "chroma reduces confidence.\n"
            "- Replace with a proper face/skin mask and tone model for production use."
        )


def main() -> None:
    st.set_page_config(page_title="Recommendation Pipeline", page_icon="🧭", layout="wide")
    render_collection_embedding_ui()
    render_user_profile_ui()


if __name__ == "__main__":
    main()

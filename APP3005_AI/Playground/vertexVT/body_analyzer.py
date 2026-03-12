"""
Body Analyzer - Simplified version for deployment compatibility.

Uses basic image processing for skin tone detection since MediaPipe 0.10.30+
requires the new Tasks API which needs model files. This fallback approach
works without external model downloads.
"""

import colorsys
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import List, Optional, Tuple, Dict

import numpy as np
from PIL import Image


def _to_gray_f32(image: Image.Image) -> np.ndarray:
    """Convert image to grayscale float32."""
    rgb = np.array(image.convert("RGB"))
    gray = rgb.astype(np.float32)
    gray = 0.299 * gray[:, :, 0] + 0.587 * gray[:, :, 1] + 0.114 * gray[:, :, 2]
    return gray


def _laplacian_variance(gray: np.ndarray) -> float:
    """Compute variance of a Laplacian-like filter as a blur proxy."""
    if gray.shape[0] < 3 or gray.shape[1] < 3:
        return 0.0

    center = gray[1:-1, 1:-1]
    lap = (
        gray[:-2, 1:-1]
        + gray[2:, 1:-1]
        + gray[1:-1, :-2]
        + gray[1:-1, 2:]
        - 4.0 * center
    )
    return float(lap.var())


def _jpeg_blockiness_score(gray: np.ndarray, block_size: int = 8) -> float:
    """
    Heuristic JPEG blockiness score. Higher values indicate stronger 8x8 discontinuities.
    """
    if gray.shape[0] < block_size * 2 or gray.shape[1] < block_size * 2:
        return 0.0

    h_diff = np.abs(gray[:, 1:] - gray[:, :-1])
    v_diff = np.abs(gray[1:, :] - gray[:-1, :])

    cols = np.arange(1, h_diff.shape[1] + 1)
    boundary_col_mask = (cols % block_size) == 0
    inner_col_mask = ~boundary_col_mask

    rows = np.arange(1, v_diff.shape[0] + 1)
    boundary_row_mask = (rows % block_size) == 0
    inner_row_mask = ~boundary_row_mask

    boundary_h = float(np.mean(h_diff[:, boundary_col_mask])) if boundary_col_mask.any() else 0.0
    boundary_v = float(np.mean(v_diff[boundary_row_mask, :])) if boundary_row_mask.any() else 0.0
    inner_h = float(np.mean(h_diff[:, inner_col_mask])) if inner_col_mask.any() else boundary_h
    inner_v = float(np.mean(v_diff[inner_row_mask, :])) if inner_row_mask.any() else boundary_v

    denom = inner_h + inner_v
    if denom <= 1e-6:
        return 0.0

    return (boundary_h + boundary_v) / denom


def _entropy(gray: np.ndarray, bins: int = 256) -> float:
    values = np.clip(gray.astype(np.uint8), 0, 255)
    hist, _ = np.histogram(values, bins=bins, range=(0, 256), density=True)
    hist = hist[hist > 0]
    if hist.size == 0:
        return 0.0
    return float(-np.sum(hist * np.log2(hist)))


def assess_image_quality(
    image: Image.Image,
    image_bytes: Optional[bytes] = None,
    *,
    min_shorter_side: int = 640,
    blur_threshold: float = 95.0,
    jpeg_blockiness_ratio_threshold: float = 1.55,
    jpeg_entropy_threshold: float = 5.0,
) -> Dict[str, object]:
    """
    Evaluate basic quality requirements for reliable body-shape estimation.

    Returns:
        {
            "ok": bool,
            "reasons": [str, ...],
            "metrics": {...}
        }
    """
    reasons: List[str] = []
    metrics: Dict[str, object] = {}

    width, height = image.size
    shorter = min(width, height)
    metrics["width"] = width
    metrics["height"] = height
    metrics["shorter_side"] = shorter

    if shorter < min_shorter_side:
        reasons.append(
            f"image is too small: shorter side={shorter}px, minimum required={min_shorter_side}px"
        )

    gray = _to_gray_f32(image)
    blur = _laplacian_variance(gray)
    metrics["laplacian_variance"] = blur
    if blur < blur_threshold:
        reasons.append(
            f"image looks blurry (laplacian variance={blur:.2f}, threshold={blur_threshold})"
        )

    is_jpeg = isinstance(image_bytes, (bytes, bytearray)) and image_bytes[:2] == b"\xff\xd8"
    if is_jpeg:
        blockiness = _jpeg_blockiness_score(gray)
        block_entropy = _entropy(gray)
        metrics["is_jpeg"] = True
        metrics["jpeg_blockiness_ratio"] = blockiness
        metrics["jpeg_entropy"] = block_entropy
        if blockiness > jpeg_blockiness_ratio_threshold and block_entropy < jpeg_entropy_threshold:
            reasons.append(
                "heavy JPEG compression artifacts detected (8x8 blockiness)"
            )
    else:
        metrics["is_jpeg"] = False

    return {
        "ok": len(reasons) == 0,
        "reasons": reasons,
        "metrics": metrics,
    }


def _resize_for_analysis(image: Image.Image, max_dim: int = 1024) -> Image.Image:
    """Resize image for faster processing."""
    width, height = image.size
    scale = min(1.0, max_dim / float(max(width, height)))
    if scale < 1.0:
        return image.resize((int(width * scale), int(height * scale)), Image.BICUBIC)
    return image


def _center_crop(rgb: np.ndarray, frac: float = 0.5) -> np.ndarray:
    """Extract center region of image."""
    height, width = rgb.shape[:2]
    crop_w = max(1, int(width * frac))
    crop_h = max(1, int(height * frac))
    x0 = (width - crop_w) // 2
    y0 = (height - crop_h) // 2
    return rgb[y0 : y0 + crop_h, x0 : x0 + crop_w]


def _skin_mask(rgb: np.ndarray, strict: bool = True) -> np.ndarray:
    """
    Create a mask of skin-colored pixels using YCbCr color space.
    
    This is a color-based skin detection that works without ML models.
    """
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    
    # Convert to YCbCr
    cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
    cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
    
    # Skin color range in YCbCr
    mask = (cb >= 77) & (cb <= 127) & (cr >= 133) & (cr <= 173)
    
    if strict:
        max_rgb = np.maximum.reduce([r, g, b])
        min_rgb = np.minimum.reduce([r, g, b])
        mask &= (r > 95) & (g > 40) & (b > 20)
        mask &= (max_rgb - min_rgb > 15)
        mask &= (np.abs(r - g) > 15)
        mask &= (r > g) & (r > b)
    
    return mask


def _skin_tone_label(rgb: Tuple[float, float, float]) -> str:
    """Classify skin tone based on luminance."""
    r, g, b = rgb
    luma_median = 0.299 * r + 0.587 * g + 0.114 * b
    
    if luma_median >= 170:
        return "light"
    if luma_median >= 140:
        return "medium"
    if luma_median >= 110:
        return "dusky"
    return "deep"


def _median_rgb(rgb: np.ndarray, mask: Optional[np.ndarray] = None) -> np.ndarray:
    """Calculate median RGB values, optionally from masked region."""
    if mask is None or int(mask.sum()) == 0:
        values = rgb.reshape(-1, 3)
    else:
        values = rgb[mask]
    return np.median(values, axis=0)


def _rgb_to_hex(rgb: Tuple[float, float, float]) -> str:
    """Convert RGB tuple to hex color string."""
    r, g, b = [int(np.clip(x, 0, 255)) for x in rgb]
    return f"#{r:02x}{g:02x}{b:02x}"


def _skin_palette(rgb: Tuple[float, float, float]) -> List[str]:
    """Generate a 3-shade skin color palette from base RGB."""
    r, g, b = [x / 255.0 for x in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    
    offsets = (-0.12, 0.0, 0.12)
    shades = []
    for offset in offsets:
        nl = min(max(l + offset, 0.05), 0.95)
        nr, ng, nb = colorsys.hls_to_rgb(h, nl, s)
        shades.append(_rgb_to_hex((nr * 255, ng * 255, nb * 255)))
    return shades


def _estimate_skin_tone(rgb: np.ndarray) -> Tuple[str, List[str]]:
    """
    Estimate skin tone from image using color-based detection.
    
    Returns: (skin_tone_label, [hex_color_palette])
    """
    # Try center crop first (often contains face/upper body)
    roi = _center_crop(rgb, 0.5)
    
    min_pixels = max(200, int(roi.shape[0] * roi.shape[1] * 0.01))
    
    # Try strict skin mask first
    skin_mask = _skin_mask(roi, strict=True)
    if int(skin_mask.sum()) < min_pixels:
        # Fall back to less strict detection
        skin_mask = _skin_mask(roi, strict=False)
    
    if int(skin_mask.sum()) < min_pixels:
        skin_mask = None
    
    base_rgb = _median_rgb(roi, skin_mask)
    label = _skin_tone_label(base_rgb)
    palette = _skin_palette(base_rgb)
    
    return label, palette


def _estimate_body_coverage(rgb: np.ndarray) -> bool:
    """
    Estimate if the image shows a full body based on image proportions
    and skin pixel distribution.
    
    This is a simplified heuristic without ML-based pose detection.
    """
    height, width = rgb.shape[:2]
    
    # Assume full body if image is portrait-oriented (height > width * 1.3)
    aspect_ratio = height / width
    
    # Check skin pixel distribution vertically
    skin_mask = _skin_mask(rgb, strict=False)
    ys = np.where(skin_mask)[0]
    
    if ys.size == 0:
        return False
    
    top = ys.min()
    bottom = ys.max()
    body_height = (bottom - top) / float(height)
    
    # Consider full body if:
    # - Image is portrait-oriented (aspect ratio > 1.3)
    # - Skin pixels span at least 65% of image height
    # - Bottom skin pixels reach at least 85% down the image
    # These thresholds are conservative to avoid half-body false positives.
    is_portrait = aspect_ratio > 1.3
    good_height_coverage = body_height >= 0.65
    reaches_bottom = bottom >= 0.85 * height
    
    return is_portrait and good_height_coverage and reaches_bottom


@lru_cache(maxsize=1)
def _get_pose_landmarker() -> Tuple[Optional[object], Optional[str]]:
    """
    Lazily load a MediaPipe Pose Landmarker model if available.
    Returns None when the model is missing or MediaPipe Tasks is unavailable.
    """
    model_dir = Path(__file__).resolve().parent / "models"
    model_path = os.environ.get("POSE_LANDMARKER_MODEL")

    if model_path:
        shortcut = model_path.strip().lower()
        if shortcut in {"lite", "full", "heavy"}:
            candidates = [
                model_dir / "pose_landmarker_full.task",
                model_dir / "pose_landmarker_heavy.task",
                model_dir / "pose_landmarker_lite.task",
            ] if shortcut == "full" else [
                model_dir / f"pose_landmarker_{shortcut}.task",
                model_dir / "pose_landmarker_lite.task",
            ]
        else:
            candidates = [Path(model_path).expanduser()]
    else:
        candidates = [
            model_dir / "pose_landmarker_full.task",
            model_dir / "pose_landmarker_heavy.task",
            model_dir / "pose_landmarker_lite.task",
        ]

    candidates = [candidate.resolve() for candidate in candidates]
    existing_paths = [candidate for candidate in candidates if candidate.exists()]

    if not existing_paths:
        if model_path and model_path.strip().lower() not in {"full", "heavy", "lite"}:
            requested = model_path.strip()
            return None, f"failed(model file missing: {requested})"
        tried = ", ".join(str(c) for c in candidates)
        return None, f"failed(model file missing: tried {tried})"

    path = existing_paths[0]

    if not path.exists():
        return None, f"failed(model file missing: {path})"

    try:
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision
    except Exception as exc:
        return None, f"failed(media pipe tasks import failed: {exc})"

    try:
        base_options = mp_python.BaseOptions(model_asset_path=str(path))
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        return vision.PoseLandmarker.create_from_options(options), None
    except Exception:
        return None, "failed(pose landmarker model initialization failed)"


def _estimate_pose_landmarks(image: Image.Image):
    """
    Run pose detection and return a list of landmarks for the first detected person.
    Returns landmarks on success, otherwise None.
    """
    landmarker, landmarker_error = _get_pose_landmarker()
    if landmarker is None:
        return None, landmarker_error or "failed(unknown)"

    try:
        import mediapipe as mp
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.array(image.convert("RGB")))
        result = landmarker.detect(mp_image)
    except Exception as exc:
        logging.getLogger(__name__).warning(
            "Pose landmarker inference failed; falling back to heuristic: %s", exc
        )
        return None, f"failed(pose inference exception: {exc})"

    if not result.pose_landmarks:
        return None, "failed(no pose landmarks detected)"

    if len(result.pose_landmarks) < 1 or len(result.pose_landmarks[0]) < 29:
        return None, "failed(incomplete pose landmarks)"

    return result.pose_landmarks[0], None


def _pose_confidence(lm, threshold: float = 0.5) -> bool:
    visibility = getattr(lm, "visibility", 0.0) or 0.0
    presence = getattr(lm, "presence", 0.0) or 0.0
    return max(visibility, presence) >= threshold


def _pose_score(lm) -> float:
    """Return landmark confidence score in range [0,1]."""
    return float(max(getattr(lm, "visibility", 0.0) or 0.0, getattr(lm, "presence", 0.0) or 0.0))


def _clamp01(value: float) -> float:
    """Clamp a floating value into the [0,1] range."""
    return float(max(0.0, min(1.0, value)))


def _visible_landmarks_bbox(
    landmarks, indices: List[int], threshold: float = 0.3
) -> Optional[Tuple[float, float, float, float]]:
    xs: List[float] = []
    ys: List[float] = []
    for idx in indices:
        if idx >= len(landmarks):
            continue
        if not _pose_confidence(landmarks[idx], threshold):
            continue
        point = landmarks[idx]
        xs.append(point.x)
        ys.append(point.y)

    if not xs:
        return None

    return float(min(xs)), float(max(xs)), float(min(ys)), float(max(ys))


def _distance_2d(a, b) -> float:
    """Compute normalized 2D distance between two landmarks."""
    return float(np.hypot(a.x - b.x, a.y - b.y))


def _distance_px(a, b, width: int, height: int) -> float:
    """Compute Euclidean distance in pixel coordinates."""
    return float(np.hypot((a.x - b.x) * width, (a.y - b.y) * height))


def _select_visible_point(
    landmarks,
    indices: List[int],
    threshold: float = 0.35,
) -> Optional[object]:
    """Pick the most visible landmark from a candidate set."""
    best = None
    best_score = -1.0
    for idx in indices:
        if idx >= len(landmarks):
            continue
        score = _pose_score(landmarks[idx])
        if score < threshold:
            continue
        if score > best_score:
            best_score = score
            best = landmarks[idx]
    return best


def _select_top_point(
    landmarks,
    indices: List[int],
    threshold: float = 0.30,
) -> Optional[object]:
    """Pick topmost visible landmark from candidates."""
    candidates = []
    for idx in indices:
        if idx >= len(landmarks):
            continue
        score = _pose_score(landmarks[idx])
        if score < threshold:
            continue
        candidates.append((landmarks[idx].y, score, landmarks[idx]))
    if not candidates:
        return None
    candidates.sort(key=lambda item: (item[0], -item[1]))
    return candidates[0][2]


def _select_bottom_point(
    landmarks,
    indices: List[int],
    threshold: float = 0.30,
) -> Optional[object]:
    """Pick lowest visible landmark from candidates."""
    candidates = []
    for idx in indices:
        if idx >= len(landmarks):
            continue
        score = _pose_score(landmarks[idx])
        if score < threshold:
            continue
        candidates.append((landmarks[idx].y, score, landmarks[idx]))
    if not candidates:
        return None
    candidates.sort(key=lambda item: (item[0], -item[1]), reverse=True)
    return candidates[0][2]


def _interpolated_x(upper, lower, target_y: float) -> float:
    """Interpolate x-coordinate at a target y between two landmarks."""
    dy = lower.y - upper.y
    if abs(dy) < 1e-6:
        return float((upper.x + lower.x) / 2.0)
    t = (target_y - upper.y) / dy
    t = float(np.clip(t, 0.0, 1.0))
    return float(upper.x + t * (lower.x - upper.x))


def _width_at_y(mask: np.ndarray, y: int, band: int = 4) -> Optional[float]:
    """Return median horizontal pixel span at a target row (with a small band)."""
    height, width = mask.shape[:2]
    y0 = max(0, y - band)
    y1 = min(height - 1, y + band)
    widths = []
    for row in range(y0, y1 + 1):
        xs = np.where(mask[row])[0]
        if xs.size >= 2:
            widths.append(xs.max() - xs.min())
    if not widths:
        return None
    return float(np.median(widths))


def _sample_body_widths(
    mask: np.ndarray,
    top: int,
    bottom: int,
    levels: List[float],
) -> List[Optional[float]]:
    """Sample body widths at multiple normalized vertical levels."""
    height = bottom - top
    widths: List[Optional[float]] = []
    for level in levels:
        y = int(top + level * height)
        widths.append(_width_at_y(mask, y, band=max(1, int(0.025 * mask.shape[0]))))
    return widths


def _fuse_pose_mask_width(
    pose_width_px: float,
    mask: Optional[np.ndarray],
    target_y_norm: float,
    image_width: int,
    image_height: int,
    *,
    prefer_pose: float = 0.65,
) -> float:
    """
    Blend pose width with a segmentation-derived width at the same height.

    Useful for reducing unrealistic pose-only ratios when landmarks jitter or are
    partially occluded.
    """
    if mask is None:
        return float(pose_width_px)
    if pose_width_px <= 0.0 or not np.isfinite(pose_width_px):
        pose_width_px = 1.0
    y_px = int(np.clip(target_y_norm * image_height, 0, image_height - 1))
    mask_width = _width_at_y(mask, y_px, band=max(1, int(0.008 * image_height)))
    if mask_width is None or not np.isfinite(mask_width) or mask_width <= 1.0:
        return float(pose_width_px)

    pose_ratio = pose_width_px / float(image_width)
    mask_ratio = mask_width / float(image_width)
    if not (0.01 <= mask_ratio <= 1.0):
        return float(pose_width_px)

    # If pose and mask strongly diverge, prefer segmentation width.
    if abs(pose_ratio - mask_ratio) > 0.30:
        return float(mask_width)

    fused_ratio = prefer_pose * pose_ratio + (1.0 - prefer_pose) * mask_ratio
    return float(_clamp01(fused_ratio) * image_width)


def _estimate_body_coverage_pose(landmarks) -> bool:
    """Estimate full-body visibility using pose landmarks."""
    def is_visible(idx: int, threshold: float) -> bool:
        return _pose_confidence(landmarks[idx], threshold)

    # Require reliable upper and lower body landmarks to avoid selfie/half-body false positives.
    if not (is_visible(11, 0.45) and is_visible(12, 0.45)):  # shoulders
        return False
    if not (is_visible(23, 0.45) and is_visible(24, 0.45)):  # hips
        return False

    has_ankle = is_visible(27, 0.35) or is_visible(28, 0.35)
    has_both_knees = is_visible(25, 0.35) and is_visible(26, 0.35)
    if not has_ankle and not has_both_knees:
        return False

    shoulder_y = min(landmarks[11].y, landmarks[12].y)
    hip_y = min(landmarks[23].y, landmarks[24].y)
    if hip_y <= shoulder_y:
        return False

    lower_candidates = [landmarks[idx].y for idx in (23, 24, 25, 26, 27, 28) if is_visible(idx, 0.30)]
    if not lower_candidates:
        return False
    bottom_y = max(lower_candidates)

    # Full body if ankles are near the bottom and vertical span is large.
    if has_ankle:
        if bottom_y < 0.77:
            return False
        if (bottom_y - shoulder_y) < 0.58:
            return False
    else:
        if bottom_y < 0.72:
            return False
        if (bottom_y - shoulder_y) < 0.55:
            return False

    if hip_y >= bottom_y:
        return False

    bbox = _visible_landmarks_bbox(
        landmarks, [11, 12, 23, 24, 25, 26, 27, 28], threshold=0.25
    )
    if bbox is None:
        return False

    min_x, max_x, _, _ = bbox
    if (max_x - min_x) < 0.08:
        return False

    return True


@lru_cache(maxsize=1)
def _get_selfie_segmenter():
    """Lazily create the MediaPipe selfie segmenter."""
    try:
        import mediapipe as mp
    except Exception as exc:
        return None, f"failed(media pipe import failed: {exc})"

    try:
        segmenter_cls = mp.solutions.selfie_segmentation
        return segmenter_cls.SelfieSegmentation(model_selection=1), None
    except Exception as exc:
        return None, f"failed(selfie segmentation unavailable: {exc})"


def _estimate_full_body_from_segmentation(
    rgb: np.ndarray,
) -> Tuple[bool, Optional[np.ndarray], Optional[str]]:
    """
    Estimate full-body visibility from person segmentation mask.

    Returns:
        (is_full_body, person_mask, error)
    """
    segmenter, segmenter_error = _get_selfie_segmenter()
    if segmenter is None:
        return False, None, segmenter_error

    try:
        result = segmenter.process(rgb)
        mask = getattr(result, "segmentation_mask", None)
        if mask is None:
            return False, None, "failed(segmentation mask missing)"

        person_mask = np.asarray(mask) > 0.5
        ys, xs = np.where(person_mask)
        if ys.size < 2000:
            return False, None, "failed(segmentation has too few person pixels)"

        top = int(ys.min())
        bottom = int(ys.max())
        left = int(xs.min())
        right = int(xs.max())

        height, width = rgb.shape[:2]
        body_h = (bottom - top + 1) / float(height)
        body_w = (right - left + 1) / float(width)

        if body_h < 0.60:
            return False, None, "failed(full-body not detected from segmentation)"
        if body_w < 0.08:
            return False, None, "failed(segmentation mask too narrow)"
        if bottom < int(0.76 * height):
            return False, None, "failed(full body not reaching image bottom in segmentation)"

        return True, person_mask, None
    except Exception as exc:
        return False, None, f"failed(segmentation failed: {exc})"


def _estimate_body_shape_from_pose(
    landmarks,
    width: int,
    height: int,
    person_mask: Optional[np.ndarray] = None,
) -> Tuple[Optional[str], str, float, Optional[Dict[str, float]]]:
    """
    Estimate body shape from pose landmarks using normalized body proportions.
    Returns shape, reason, confidence, measurements.
    """
    ls = landmarks[11] if len(landmarks) > 11 else None
    rs = landmarks[12] if len(landmarks) > 12 else None
    lh = landmarks[23] if len(landmarks) > 23 else None
    rh = landmarks[24] if len(landmarks) > 24 else None
    lk = landmarks[25] if len(landmarks) > 25 else None
    rk = landmarks[26] if len(landmarks) > 26 else None
    le = landmarks[13] if len(landmarks) > 13 else None
    re = landmarks[14] if len(landmarks) > 14 else None

    if ls is None or rs is None or lh is None or rh is None:
        return None, "pose landmarks missing required shoulder/hip points", 0.0, None

    if not (_pose_confidence(ls, 0.45) and _pose_confidence(rs, 0.45)):
        return None, "shoulders are not confidently visible", 0.0, None
    if not (_pose_confidence(lh, 0.40) and _pose_confidence(rh, 0.40)):
        return None, "hips are not confidently visible", 0.0, None

    head = _select_top_point(landmarks, [0, 1, 2, 3, 4, 5, 6], 0.35)
    if head is None:
        return None, "head landmark is not visible for pose height estimation", 0.0, None

    ankle = _select_bottom_point(landmarks, [27, 28], 0.30)
    if ankle is None:
        return None, "ankles are not visible for pose height estimation", 0.0, None

    pose_body_height_px = _distance_px(head, ankle, width, height)
    body_height_px = pose_body_height_px
    if person_mask is not None:
        ys, _ = np.where(person_mask)
        if ys.size >= 100:
            seg_height = float(ys.max() - ys.min() + 1)
            if seg_height > 30.0:
                body_height_px = float(0.70 * pose_body_height_px + 0.30 * seg_height)

    if body_height_px < 20.0:
        return None, f"pose body height too short in pixels ({body_height_px:.1f})", 0.0, None

    shoulder_width_raw = _distance_px(ls, rs, width, height)
    hip_width_raw = _distance_px(lh, rh, width, height)
    knee_width_raw = _distance_px(lk, rk, width, height) if (lk and rk) else 0.0

    shoulder_mid_y = (ls.y + rs.y) / 2.0
    hip_mid_y = (lh.y + rh.y) / 2.0
    shoulder_width_px = _fuse_pose_mask_width(
        shoulder_width_raw, person_mask, shoulder_mid_y, width, height
    )
    hip_width_px = _fuse_pose_mask_width(
        hip_width_raw, person_mask, hip_mid_y, width, height
    )
    knee_width_px = (
        _fuse_pose_mask_width(
            knee_width_raw, person_mask, (lk.y + rk.y) / 2.0, width, height
        )
        if (lk and rk)
        else 0.0
    )

    # Bust width: use shoulders when available. If a shoulder is low-confidence but elbow is visible,
    # fall back to armpit proxy by taking shoulder-elbow midpoint anchor.
    bust_left = ls
    bust_right = rs
    if not _pose_confidence(ls, 0.55) and _pose_confidence(le, 0.40):
        bust_left = le
    if not _pose_confidence(rs, 0.55) and _pose_confidence(re, 0.40):
        bust_right = re
    bust_width_raw = _distance_px(bust_left, bust_right, width, height)
    bust_mid_y = (bust_left.y + bust_right.y) / 2.0
    bust_width_px = _fuse_pose_mask_width(
        bust_width_raw, person_mask, bust_mid_y, width, height
    )

    if shoulder_width_px < 1.0 or hip_width_px < 1.0 or bust_width_px < 1.0:
        return None, "critical width measurements too small for stable shape inference", 0.0, None

    waist_y = shoulder_mid_y + 0.72 * (hip_mid_y - shoulder_mid_y)
    waist_left = _interpolated_x(ls, lh, waist_y)
    waist_right = _interpolated_x(rs, rh, waist_y)
    waist_width_px = abs(waist_left - waist_right) * width
    waist_width_px = _fuse_pose_mask_width(
        waist_width_px, person_mask, waist_y, width, height
    )
    if not np.isfinite(waist_width_px) or waist_width_px < 1.0:
        return None, "waist width estimate is invalid", 0.0, None

    shoulder_to_hip = shoulder_width_px / max(hip_width_px, 1e-6)
    shoulder_to_bust = shoulder_width_px / max(bust_width_px, 1e-6)
    shoulder_ratio = shoulder_width_px / max(body_height_px, 1e-6)
    bust_ratio = bust_width_px / max(body_height_px, 1e-6)
    hip_ratio = hip_width_px / max(body_height_px, 1e-6)
    waist_ratio = waist_width_px / max(body_height_px, 1e-6)
    knee_ratio = knee_width_px / max(body_height_px, 1e-6) if knee_width_px > 0 else 0.0

    keypoint_scores = [_pose_score(p) for p in (ls, rs, lh, rh, lk, rk, ankle, head) if p is not None]
    quality = _clamp01(float(np.mean(keypoint_scores)) if keypoint_scores else 0.0)
    if quality < 0.35:
        return None, f"pose keypoint quality too low (quality={quality:.3f})", 0.0, None

    torso_shift = abs((ls.x + rs.x) / 2.0 - (lh.x + rh.x) / 2.0)
    posture_quality = _clamp01(1.0 - torso_shift * 15.0)
    quality = _clamp01(0.75 * quality + 0.25 * posture_quality)

    # Measurements in the exact normalized ratios as requested.
    metrics = {
        "shoulder_width": shoulder_width_px,
        "bust_width": bust_width_px,
        "waist_width": waist_width_px,
        "hip_width": hip_width_px,
        "body_height": body_height_px,
        "shoulder_to_hip_ratio": shoulder_to_hip,
        "shoulder_to_bust_ratio": shoulder_to_bust,
        "shoulder_ratio": shoulder_ratio,
        "bust_ratio": bust_ratio,
        "waist_ratio": waist_ratio,
        "hip_ratio": hip_ratio,
        "knee_ratio": knee_ratio,
    }

    # Score-based multi-class voting to reduce boundary collapse.
    shoulder_hip_span = shoulder_to_hip
    shoulder_hip_balance = 1.0 - min(1.0, abs(bust_ratio - hip_ratio) / max(hip_ratio, 1e-6))
    bust_hip_ratio = bust_ratio / max(hip_ratio, 1e-6)
    waist_to_bust = waist_ratio / max(bust_ratio, 1e-6)
    waist_to_hip = waist_ratio / max(hip_ratio, 1e-6)
    shoulder_to_waist = shoulder_ratio / max(waist_ratio, 1e-6)
    mean_top_bottom_ratio = (bust_ratio + hip_ratio) * 0.5
    waist_mid_ratio = waist_ratio / max(mean_top_bottom_ratio, 1e-6)
    posture_penalty = 1.0 - min(1.0, torso_shift * 12.0)
    shoulder_to_hip_balance = 1.0 - min(1.0, abs(shoulder_hip_span - 1.0) / 1.0)

    if waist_ratio <= 0.0:
        return None, f"waist ratio is non-positive: {waist_ratio:.3f}", 0.0, metrics

    # Geometric sanity checks: reject clearly invalid pose geometries before scoring.
    if not (0.55 <= shoulder_hip_span <= 1.80):
        return None, f"unrealistic shoulder-to-hip ratio: {shoulder_hip_span:.3f}", 0.0, metrics
    if shoulder_to_waist < 0.70:
        return None, f"waist width appears too wide for this pose: shoulder_to_waist={shoulder_to_waist:.3f}", 0.0, metrics

    # Build soft class scores. Scores are in [0,1] and represent geometric support.
    hourglass_score = (
        _clamp01(1.0 - abs(1.0 - bust_hip_ratio) / 0.24)
        * _clamp01((min(bust_ratio, hip_ratio) - waist_ratio * 1.28) / max(min(bust_ratio, hip_ratio), 1e-6))
        * _clamp01(1.0 - abs(shoulder_to_waist - 1.16) / 0.45)
        * _clamp01(shoulder_hip_balance)
    )
    pear_score = (
        _clamp01((hip_ratio / max(bust_ratio, 1e-6) - 1.0) / 0.75)
        * _clamp01((1.0 - abs(waist_to_hip - 0.80) / 0.45))
        * _clamp01((1.15 - shoulder_hip_span) / 1.15)
        * _clamp01(1.0 - max(shoulder_to_waist - 1.2, 0.0) / 0.4)
    )
    apple_score = (
        _clamp01((waist_to_bust - 1.0) / 0.80)
        * _clamp01((waist_to_hip - 1.0) / 0.80)
        * _clamp01((shoulder_to_waist - 1.08) / 0.65)
    )
    inverted_score = (
        _clamp01((shoulder_hip_span - 1.0) / 0.85)
        * _clamp01((1.0 - waist_to_bust) / 0.55)
        * _clamp01((1.0 - waist_to_hip) / 0.60)
        * _clamp01((bust_hip_ratio - 1.0) / 0.75)
    )
    # Penalize inverted_triangle unless shoulders are clearly broader than hips.
    inverted_gate = (
        _clamp01((shoulder_hip_span - 1.16) / 0.60)
        * _clamp01((0.95 - waist_to_hip) / 0.95)
    )
    inverted_score *= inverted_gate
    rectangle_score = (
        shoulder_hip_balance
        * _clamp01(1.0 - abs(waist_mid_ratio - 1.0) / 0.24)
        * _clamp01(1.0 - abs(shoulder_hip_span - 1.0) / 0.18)
        * _clamp01(1.0 - max(shoulder_hip_span - 1.05, 0.0) / 0.35)
    )

    # Slightly penalize all scores when model confidence is weak or posture is off-center.
    evidence_factor = _clamp01(0.60 + 0.30 * quality + 0.10 * posture_penalty)
    class_scores = {
        "hourglass": _clamp01(hourglass_score * evidence_factor),
        "pear": _clamp01(pear_score * evidence_factor),
        "apple": _clamp01(apple_score * evidence_factor),
        "inverted_triangle": _clamp01(inverted_score * evidence_factor),
        "rectangle": _clamp01(rectangle_score * evidence_factor),
    }
    class_scores = {k: _clamp01(v) for k, v in class_scores.items()}
    class_score_text = "{" + ", ".join(f"{k}:{v:.3f}" for k, v in class_scores.items()) + "}"

    # If strict scores are weak, use a relaxed geometric fallback so high-quality
    # full-body detections still return a class with low confidence instead of null.
    strict_max_score = max(class_scores.values()) if class_scores else 0.0
    if quality >= 0.65 and strict_max_score < 0.06:
        fallback_scores = {
            "hourglass": _clamp01(
                0.45 * (1.0 - abs(shoulder_to_hip - 1.0) / 1.0)
                + 0.30 * (1.0 - abs(waist_to_bust - 0.74) / 0.8)
                + 0.25 * (1.0 - abs(waist_to_hip - 0.74) / 0.8)
            ),
            "pear": _clamp01(
                0.40 * (1.0 - abs(shoulder_to_hip - 0.82) / 1.0)
                + 0.30 * (1.0 - abs(waist_to_bust - 0.82) / 0.9)
                + 0.15 * _clamp01((hip_ratio / max(bust_ratio, 1e-6) - 0.85) / 0.8)
                + 0.15 * (1.0 - abs(waist_ratio / max(hip_ratio, 1e-6) - 1.05) / 0.7)
            ),
            "apple": _clamp01(
                0.35 * _clamp01(waist_to_bust - 1.0)
                + 0.35 * _clamp01(waist_to_hip - 1.0)
                + 0.20 * _clamp01((shoulder_to_waist - 1.1) / 0.7)
                + 0.10 * (1.0 - abs(waist_to_hip - 1.2) / 1.0)
            ),
            "inverted_triangle": _clamp01(
                0.38 * (1.0 - abs(shoulder_to_hip - 1.35) / 1.2)
                + 0.25 * (1.0 - abs(shoulder_to_bust - 1.20) / 1.2)
                + 0.20 * _clamp01((1.0 - waist_to_hip) / 0.85)
                + 0.17 * _clamp01((bust_hip_ratio - 1.05) / 1.0)
            ) * _clamp01((shoulder_to_hip - 1.12) / 0.45),
            "rectangle": _clamp01(
                0.55 * (1.0 - abs(shoulder_to_hip - 1.0) / 1.2)
                + 0.25 * (1.0 - abs(waist_mid_ratio - 1.0) / 0.75)
                + 0.20 * (1.0 - abs(1.0 - shoulder_hip_balance) / 1.0)
            ),
        }
        fallback_scores = {k: _clamp01(v) for k, v in fallback_scores.items()}
        fallback_sorted = sorted(fallback_scores.items(), key=lambda kv: kv[1], reverse=True)
        fallback_top_shape, fallback_top_score = fallback_sorted[0]
        fallback_second_shape = fallback_sorted[1][0] if len(fallback_sorted) > 1 else fallback_top_shape
        fallback_second_score = fallback_sorted[1][1] if len(fallback_sorted) > 1 else 0.0
        fallback_gap = fallback_top_score - fallback_second_score if len(fallback_sorted) > 1 else fallback_top_score
        fallback_swapped = False

        # When soft scores are very close, prefer the second shape to avoid
        # over-calling the dominant class (especially inverted/hourglass).
        if (
            fallback_gap < 0.06
            and fallback_top_score >= 0.12
            and fallback_second_score >= 0.10
            and fallback_top_shape in {"inverted_triangle", "hourglass", "rectangle"}
            and quality < 0.97
        ):
            fallback_top_shape = fallback_second_shape
            fallback_top_score = fallback_second_score
            fallback_gap = fallback_top_score - (fallback_sorted[2][1] if len(fallback_sorted) > 2 else 0.0)
            fallback_swapped = True

        if fallback_top_score >= 0.12 and (fallback_gap >= 0.05 or quality >= 0.90):
            fallback_confidence = _clamp01(0.18 + 0.56 * fallback_top_score + 0.12 * quality + 0.14 * fallback_gap)
            fallback_score_text = "{" + ", ".join(f"{k}:{v:.3f}" for k, v in fallback_scores.items()) + "}"
            return fallback_top_shape, (
                f"shape_soft[{fallback_top_shape}{', from_second' if fallback_swapped else ''}] ratios={fallback_score_text}, "
                f"score={fallback_top_score:.3f}, gap={fallback_gap:.3f}, conf={fallback_confidence:.3f}, "
                f"raw_scores={class_score_text}, quality={quality:.3f}"
            ), fallback_confidence, metrics

    sorted_scores = sorted(class_scores.items(), key=lambda kv: kv[1], reverse=True)
    top_shape, top_score = sorted_scores[0]
    second_score = sorted_scores[1][1]
    score_gap = top_score - second_score

    # Hard reject: reduce weak over-calls for both inverted_triangle and hourglass.
    if top_shape == "inverted_triangle" and (
        shoulder_hip_span < 1.22
        or top_score < 0.63
        or score_gap < 0.10
        or shoulder_to_waist < 1.10
        or waist_to_hip > 1.00
    ):
        top_shape = sorted_scores[1][0]
        top_score = sorted_scores[1][1]
        score_gap = sorted_scores[1][1] - sorted_scores[2][1] if len(sorted_scores) > 2 else top_score
    elif top_shape == "hourglass" and (
        shoulder_to_waist < 1.10
        or shoulder_to_waist > 1.70
        or abs(shoulder_hip_span - 1.0) > 0.22
        or waist_to_bust > 0.88
    ):
        top_shape = sorted_scores[1][0]
        top_score = sorted_scores[1][1]
        score_gap = sorted_scores[1][1] - sorted_scores[2][1] if len(sorted_scores) > 2 else top_score

    # Confidence is evidence-weighted and includes separation between classes.
    confidence = _clamp01(0.30 + 0.55 * top_score + 0.15 * score_gap)
    decision_threshold = 0.52 if quality >= 0.90 else 0.62

    if top_score >= decision_threshold and score_gap >= 0.08:
        reason_map = {
            "hourglass": (
                f"hourglass (bust={bust_width_px:.1f}px, hip={hip_width_px:.1f}px, waist={waist_width_px:.1f}px, "
                f"bust_to_hip={bust_hip_ratio:.3f}, waist_ratio={waist_ratio:.3f}, score={top_score:.3f}, "
                f"gap={score_gap:.3f}, conf={confidence:.3f}, ratios={class_score_text})"
            ),
            "pear": (
                f"pear (hip={hip_width_px:.1f}px, bust={bust_width_px:.1f}px, hip_to_bust={bust_hip_ratio:.3f}, "
                f"waist_ratio={waist_ratio:.3f}, score={top_score:.3f}, gap={score_gap:.3f}, "
                f"conf={confidence:.3f}, ratios={class_score_text})"
            ),
            "apple": (
                f"apple (waist={waist_width_px:.1f}px, bust={bust_width_px:.1f}px, hip={hip_width_px:.1f}px, "
                f"waist_to_bust={waist_to_bust:.3f}, waist_to_hip={waist_to_hip:.3f}, score={top_score:.3f}, "
                f"gap={score_gap:.3f}, conf={confidence:.3f}, ratios={class_score_text})"
            ),
            "inverted_triangle": (
                f"inverted_triangle (bust={bust_width_px:.1f}px, hip={hip_width_px:.1f}px, "
                f"shoulder_to_hip={shoulder_to_hip:.3f}, waist_to_hip={waist_to_hip:.3f}, score={top_score:.3f}, "
                f"gap={score_gap:.3f}, conf={confidence:.3f}, ratios={class_score_text})"
            ),
            "rectangle": (
                f"rectangle (bust={bust_width_px:.1f}px, waist={waist_width_px:.1f}px, hip={hip_width_px:.1f}px, "
                f"bust_to_hip={bust_hip_ratio:.3f}, score={top_score:.3f}, gap={score_gap:.3f}, "
                f"conf={confidence:.3f}, ratios={class_score_text})"
            ),
        }

        # Return selected class only when score is truly confident.
        if quality < 0.50:
            return None, (
                f"low-quality pose for decision (scores={class_score_text}, "
                f"quality={quality:.3f}, gap={score_gap:.3f})"
            ), quality, metrics

        return top_shape, reason_map[top_shape], confidence, metrics

    # Borderline cases: if all classes are weak, but quality is strong, return fallback top.
    if quality >= 0.95 and top_score >= 0.38 and score_gap >= 0.05:
        confidence = _clamp01(0.35 + 0.45 * top_score + 0.15 * quality + 0.05 * score_gap)
        return top_shape, (
            f"shape_fallback[{top_shape}] scores={class_score_text}, "
            f"conf={confidence:.3f}"
        ), confidence, metrics

    return (
        None,
        (
            f"pose proportions are ambiguous (shoulder_ratio={shoulder_ratio:.3f}, bust_ratio={bust_ratio:.3f}, "
            f"waist_ratio={waist_ratio:.3f}, hip_ratio={hip_ratio:.3f}, quality={quality:.3f}, "
            f"scores={class_score_text}, conf={confidence:.3f}, gap={score_gap:.3f})"
        ),
        quality,
        metrics,
    )


def _estimate_body_shape_simple(
    rgb: np.ndarray, person_mask: Optional[np.ndarray] = None
) -> Tuple[Optional[str], str, float]:
    """
    Simple body shape estimation using silhouette analysis.
    
    Without ML pose detection, we use skin pixel width at different
    vertical positions as a proxy for body proportions.
    """
    height, width = rgb.shape[:2]
    skin_mask = person_mask
    if skin_mask is None:
        skin_mask = _skin_mask(rgb, strict=False)
        if int(skin_mask.sum()) < max(1000, int(height * width * 0.002)):
            skin_mask = _skin_mask(rgb, strict=True)

    ys, _ = np.where(skin_mask)
    if ys.size == 0:
        return None, "no silhouette mask pixels found", 0.0
    
    top = ys.min()
    bottom = ys.max()
    body_height = bottom - top
    
    if body_height < height * 0.4:
        return (
            None,
            f"silhouette height too short (pixel_height={body_height}, min_required={int(height * 0.4)})",
            0.0,
        )
    
    sampled = {
        "shoulder": _sample_body_widths(skin_mask, top, bottom, [0.20, 0.24, 0.28]),
        "waist": _sample_body_widths(skin_mask, top, bottom, [0.42, 0.46, 0.50]),
        "hip": _sample_body_widths(skin_mask, top, bottom, [0.62, 0.66, 0.70]),
        "knee": _sample_body_widths(skin_mask, top, bottom, [0.80, 0.84, 0.88]),
    }

    def _valid_median(values: List[Optional[float]]) -> Optional[float]:
        valid_values = [v for v in values if v is not None]
        if not valid_values:
            return None
        return float(np.median(valid_values))

    shoulder_w = _valid_median(sampled["shoulder"])
    waist_w = _valid_median(sampled["waist"])
    hip_w = _valid_median(sampled["hip"])
    knee_w = _valid_median(sampled["knee"])

    if not all([shoulder_w, waist_w, hip_w]):
        return None, "insufficient silhouette width at sampled levels", 0.0

    # Minimum width threshold
    min_level_width = min(shoulder_w, waist_w, hip_w)
    min_required = 0.08 * width
    if min_level_width < min_required:
        return None, (
            f"measured widths are too narrow (shoulder={shoulder_w:.1f}, waist={waist_w:.1f}, hip={hip_w:.1f}, "
            f"min={min_level_width:.1f}, required>={min_required:.1f})"
        ), 0.0
    
    # Calculate ratios
    balance = abs(shoulder_w - hip_w) / max(shoulder_w, hip_w)
    waist_ratio = waist_w / ((shoulder_w + hip_w) / 2.0)
    shoulder_hip_gap = max(0.0, shoulder_w - hip_w)
    shoulder_to_hip = shoulder_w / max(hip_w, 1e-6)
    knee_ratio = (knee_w / max((shoulder_w + hip_w) / 2.0, 1e-6)) if knee_w else 1.0

    # Classify body shape
    silhouette_quality = _clamp01((body_height / float(height) - 0.4) / 0.4)
    coverage = min(1.0, ys.size / float(height * width))
    width_span = shoulder_hip_gap / max((shoulder_w + hip_w) / 2.0, 1e-6)
    quality = _clamp01(0.55 * silhouette_quality + 0.30 * coverage + 0.15 * (1.0 - _clamp01(width_span)))

    if balance <= 0.12 and waist_ratio <= 0.78:
        confidence = _clamp01(0.40 + 0.35 * (0.12 - balance) / 0.12 + 0.25 * quality)
        return (
            "hourglass",
            f"hourglass (balance={balance:.3f}, waist_ratio={waist_ratio:.3f}, shoulder={shoulder_w:.1f}, waist={waist_w:.1f}, hip={hip_w:.1f}, conf={confidence:.3f})",
            confidence,
        )
    if hip_w >= shoulder_w * 1.22 and waist_ratio <= 0.88:
        confidence = _clamp01(0.35 + 0.35 * min((hip_w / shoulder_w - 1.22) / 0.8, 1.0) + 0.30 * quality)
        return (
            "pear",
            f"pear (hip={hip_w:.1f}, shoulder={shoulder_w:.1f}, hip_to_shoulder={hip_w / shoulder_w:.3f}, waist_ratio={waist_ratio:.3f}, conf={confidence:.3f})",
            confidence,
        )
    if shoulder_w >= hip_w * 1.45 and waist_ratio <= 0.87 and shoulder_to_hip >= 1.45:
        confidence = _clamp01(0.35 + 0.35 * min((shoulder_w / hip_w - 1.32) / 0.8, 1.0) + 0.30 * quality)
        return (
            "inverted_triangle",
            f"inverted_triangle (shoulder={shoulder_w:.1f}, hip={hip_w:.1f}, shoulder_to_hip={shoulder_w / hip_w:.3f}, waist_ratio={waist_ratio:.3f}, conf={confidence:.3f})",
            confidence,
        )
    if waist_w >= max(shoulder_w, hip_w) * 1.05:
        confidence = _clamp01(0.40 + 0.40 * min((waist_w / max(shoulder_w, hip_w) - 1.05) / 0.8, 1.0) + 0.20 * quality)
        return (
            "apple",
            f"apple (waist={waist_w:.1f}, shoulder={shoulder_w:.1f}, hip={hip_w:.1f}, waist_ratio={waist_w / max(shoulder_w, hip_w):.3f}, conf={confidence:.3f})",
            confidence,
        )
    shoulder_diff_ratio = abs(waist_w - shoulder_w) / max(waist_w, shoulder_w)
    if (
        balance <= 0.14
        and 0.84 <= waist_ratio <= 1.16
        and 0.85 <= shoulder_to_hip <= 1.18
        and 0.75 <= knee_ratio <= 1.35
    ):
        confidence = _clamp01(0.45 + 0.35 * (1.0 - balance / 0.14) + 0.20 * quality)
        return (
            "rectangle",
            f"rectangle (balance={balance:.3f}, waist_ratio={waist_ratio:.3f}, shoulder_diff_ratio={shoulder_diff_ratio:.3f}, conf={confidence:.3f})",
            confidence,
        )

    confidence = _clamp01(0.20 + 0.30 * quality + 0.50 * (1.0 - abs(balance)))
    if confidence < 0.48:
        return None, (
            f"silhouette proportions below confidence floor (balance={balance:.3f}, waist_ratio={waist_ratio:.3f}, "
            f"knee_ratio={knee_ratio:.3f}, conf={confidence:.3f})"
        ), confidence
    return None, (
        f"silhouette mapping ambiguous (balance={balance:.3f}, waist_ratio={waist_ratio:.3f}, "
        f"knee_ratio={knee_ratio:.3f}, conf={confidence:.3f})"
    ), confidence


def analyze_user_image(image: Image.Image) -> Dict:
    """
    Analyze a user image for skin tone and body attributes.
    
    This simplified version uses color-based heuristics instead of
    ML-based pose detection, for compatibility with newer MediaPipe versions.
    
    Args:
        image: PIL Image object
        
    Returns:
        Dictionary with:
        - skin_tone_label: "light", "medium", "dusky", or "deep"
        - skin_hexes: List of 3 hex color codes representing skin palette
        - body_shape: Body shape classification or None
        - full_body: Boolean indicating if full body is visible
    """
    image = _resize_for_analysis(image)
    rgb = np.array(image.convert("RGB"))
    
    # Estimate skin tone
    skin_label, skin_hexes = _estimate_skin_tone(rgb)

    width, height = image.size

    # Step 1: Optional person segmentation for cleaner full-body validation.
    segmentation_full_body, seg_mask, segmentation_error = _estimate_full_body_from_segmentation(rgb)

    # Check if full body is visible with best-effort layers:
    # 1) pose landmarks (primary)
    # 2) segmentation fallback (validation only)
    pose_landmarks, pose_error = _estimate_pose_landmarks(image)
    pose_status = pose_error or "ok"
    mediapipe_status = pose_status

    full_body = False
    full_body_method = None
    body_shape: Optional[str] = None
    body_shape_reason: Optional[str] = None
    pose_shape_confidence = 0.0
    body_shape_measurements: Optional[Dict[str, float]] = None
    silhouette_shape = None
    silhouette_reason = None
    silhouette_confidence = 0.0
    if seg_mask is not None:
        silhouette_shape, silhouette_reason, silhouette_confidence = _estimate_body_shape_simple(rgb, seg_mask)

    if pose_landmarks is not None:
        pose_coverage_ok = _estimate_body_coverage_pose(pose_landmarks)
        pose_body_shape, pose_reason, pose_shape_confidence, pose_measurements = _estimate_body_shape_from_pose(
            pose_landmarks, width, height, seg_mask
        )
        original_pose_body_shape = pose_body_shape
        if (
            pose_body_shape in {"inverted_triangle", "hourglass"}
            and silhouette_shape is not None
            and silhouette_shape != pose_body_shape
            and silhouette_confidence >= 0.60
            and pose_shape_confidence < 0.86
        ):
            pose_shape_confidence = _clamp01(
                0.50 * pose_shape_confidence + 0.50 * silhouette_confidence
            )
            pose_body_shape = silhouette_shape
            pose_reason = (
                f"silhouette arbitration replaced {original_pose_body_shape} (pose={original_pose_body_shape}, "
                f"silhouette={silhouette_shape}, reason={silhouette_reason})"
            )
            pose_measurements = None

        if pose_body_shape is not None:
            body_shape = pose_body_shape
            body_shape_reason = pose_reason
            body_shape_measurements = pose_measurements

        if pose_coverage_ok and pose_body_shape is not None:
            full_body = True
            full_body_method = "mediapipe"
            mediapipe_status = "ok"
        elif pose_coverage_ok:
            full_body = True
            full_body_method = "mediapipe"
            body_shape_reason = pose_reason
            mediapipe_status = f"failed(pose shape failed); {pose_reason}"
        elif segmentation_full_body and pose_body_shape is not None and pose_shape_confidence >= 0.60:
            full_body = True
            full_body_method = "segmentation"
            body_shape = pose_body_shape
            body_shape_reason = (
                f"{pose_reason}; segmentation full-body confirmed"
                if body_shape_reason
                else "segmentation full-body confirmed"
            )
            body_shape_measurements = pose_measurements
            mediapipe_status = "failed(full-body not detected from pose landmarks); segmentation ok"
        else:
            full_body = bool(segmentation_full_body)
            if full_body:
                full_body_method = "segmentation"
                if pose_shape_confidence <= 0.0:
                    body_shape_reason = "pose shape not reliable for classification"
                    if body_shape_reason and "pose shape failed" in body_shape_reason:
                        body_shape_reason = body_shape_reason
                else:
                    body_shape_reason = pose_reason
                mediapipe_status = "failed(full-body not detected from pose landmarks); segmentation ok"
            else:
                full_body_method = "heuristic"
                mediapipe_status = pose_reason
                if body_shape_reason is None:
                    body_shape_reason = pose_reason
    else:
        if segmentation_full_body:
            full_body = True
            full_body_method = "segmentation"
            if (
                body_shape is None
                and silhouette_shape is not None
                and silhouette_confidence >= 0.60
            ):
                body_shape = silhouette_shape
                body_shape_reason = f"silhouette fallback: {silhouette_reason}"
                pose_shape_confidence = silhouette_confidence
                body_shape_measurements = None
            mediapipe_status = f"failed(pose failed); {pose_status}"
            if body_shape_reason is None:
                body_shape_reason = f"pose failed: {pose_status}"
            else:
                body_shape_reason = f"{body_shape_reason}; pose failed: {pose_status}"
        else:
            body_shape_reason = f"pose inference failed: {pose_status}"

    # If pose returned no usable shape but segmentation confirms full body,
    # use silhouette fallback for a stable result instead of forcing one pose class.
    if (
        body_shape is None
        and segmentation_full_body
        and seg_mask is not None
        and pose_shape_confidence < 0.70
    ):
        if silhouette_shape is not None:
            if body_shape_reason is None:
                body_shape_reason = f"silhouette fallback: {silhouette_reason}"
            else:
                body_shape_reason = f"{body_shape_reason}; silhouette fallback: {silhouette_reason}"
            body_shape = silhouette_shape
            body_shape_measurements = None
            pose_shape_confidence = _clamp01(max(pose_shape_confidence, silhouette_confidence))
            full_body = True
            if full_body_method != "mediapipe":
                full_body_method = "segmentation"
            if "failed(pose" in str(mediapipe_status):
                mediapipe_status = f"failed(pose unreliable); {mediapipe_status}"

    if not full_body:
        body_shape = None
        if body_shape_reason is None:
            body_shape_reason = "full body not detected"
        pose_shape_confidence = 0.0

    if not full_body:
        body_shape_measurements = None

    return {
        "skin_tone_label": skin_label,
        "skin_hexes": skin_hexes,
        "body_shape": body_shape,
        "body_shape_measurements": body_shape_measurements,
        "body_shape_confidence": pose_shape_confidence,
        "body_shape_reason": body_shape_reason,
        "full_body": full_body,
        "full_body_method": full_body_method,
        "mediapipe": mediapipe_status,
    }

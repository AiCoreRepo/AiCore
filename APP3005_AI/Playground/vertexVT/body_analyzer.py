import colorsys
from functools import lru_cache

import numpy as np
from PIL import Image


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


@lru_cache(maxsize=1)
def _pose_model():
    mp = _mediapipe()
    return mp.solutions.pose.Pose(
        static_image_mode=True,
        model_complexity=2,
        enable_segmentation=True,
        min_detection_confidence=0.6,
    )


@lru_cache(maxsize=1)
def _face_model():
    mp = _mediapipe()
    return mp.solutions.face_detection.FaceDetection(
        model_selection=1,
        min_detection_confidence=0.6,
    )


@lru_cache(maxsize=1)
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
    if luma_median >= 140:
        return "medium"
    if luma_median >= 110:
        return "dusky"
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
        # Be more lenient: if hips are visible, we can likely estimate shape
        full_body = hips_visible

    if mask is not None:
        ys = np.where(mask)[0]
        if ys.size == 0:
            return False
        top = ys.min()
        bottom = ys.max()
        body_height = (bottom - top) / float(height)
        # Relaxed: bottom at 75% (was 85%), total height 45% (was 55%)
        if bottom < 0.75 * height or body_height < 0.45:
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

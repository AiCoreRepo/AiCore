from __future__ import annotations

from dataclasses import dataclass
from typing import List

import streamlit as st
from PIL import Image, ImageStat
import numpy as np


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


def main() -> None:
    st.set_page_config(page_title="Step 1-2: Validation + Ratios", page_icon="🧭", layout="wide")
    st.title("Step 1 — Validate image (front-facing, full-body)")
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
    st.title("Step 2 — Landmarks & body ratios (stubbed)")
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
    st.title("Step 3 — Skin tone extraction (stubbed)")
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


if __name__ == "__main__":
    main()

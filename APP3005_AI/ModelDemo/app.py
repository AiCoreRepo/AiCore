import os
# Limit math libs threads to avoid oversubscription crashes on large-core machines
os.environ.setdefault("OPENBLAS_NUM_THREADS", "2")
os.environ.setdefault("OMP_NUM_THREADS", "2")
os.environ.setdefault("MKL_NUM_THREADS", "2")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "2")

import base64
import io
import time
from collections import Counter

import cv2
import numpy as np
import requests
import streamlit as st
from PIL import Image

# Optional heavy modules (age/gender/emotion). Guarded to avoid forcing install.
try:
    from deepface import DeepFace  # type: ignore
    DEEPFACE_AVAILABLE = True
except Exception:
    DEEPFACE_AVAILABLE = False

# Optional lightweight face utils
try:
    import mediapipe as mp  # type: ignore
    MEDIAPIPE_AVAILABLE = True
except Exception:
    MEDIAPIPE_AVAILABLE = False

# Page config
st.set_page_config(page_title="Virtual Try-On Demo", layout="wide", page_icon="👔")

# Initialize session state
if 'user_image' not in st.session_state:
    st.session_state.user_image = None
if 'processed_avatar' not in st.session_state:
    st.session_state.processed_avatar = None
if 'attributes' not in st.session_state:
    st.session_state.attributes = {}
if 'last_upload_name' not in st.session_state:
    st.session_state.last_upload_name = None
if 'nano_banana_image' not in st.session_state:
    st.session_state.nano_banana_image = None
if 'nano_banana_prompt' not in st.session_state:
    st.session_state.nano_banana_prompt = ""
if 'enhanced_2d_image' not in st.session_state:
    st.session_state.enhanced_2d_image = None
if 'bg_style' not in st.session_state:
    st.session_state.bg_style = "Soft Gradient"

# Safe image loading for large files
def load_image(uploaded_file, max_size_mb=12, max_dim=2000):
    """Load and standardize uploaded image with size checks."""
    if uploaded_file.size > max_size_mb * 1024 * 1024:
        raise ValueError(f"File too large. Please upload under {max_size_mb}MB.")
    
    try:
        image = Image.open(uploaded_file)
    except Exception as exc:
        raise ValueError("Could not read the image. Please upload a valid JPG/PNG.") from exc
    
    if image.mode not in ["RGB", "RGBA", "L"]:
        image = image.convert("RGB")
    elif image.mode == "L":
        image = image.convert("RGB")
    elif image.mode == "RGBA":
        image = image.convert("RGB")
    
    # Downscale very large images to keep processing responsive
    if max(image.size) > max_dim:
        image = image.copy()
        image.thumbnail((max_dim, max_dim))
    
    return image

# Helper functions
def remove_background_grabcut(image):
    """Improved background removal using edge-guided GrabCut for cleaner 2D avatar."""
    img_array = np.array(image)

    # Ensure image is in RGB format
    if len(img_array.shape) == 2:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
    elif img_array.shape[2] == 4:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)

    height, width = img_array.shape[:2]

    # Downscale for faster masking
    max_side = 800
    scale = min(1.0, max_side / max(height, width))
    if scale < 1.0:
        small = cv2.resize(img_array, (int(width * scale), int(height * scale)))
    else:
        small = img_array

    small_gray = cv2.cvtColor(small, cv2.COLOR_RGB2GRAY)
    blurred = cv2.GaussianBlur(small_gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 120)

    # Expand edges to close small gaps
    kernel3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    kernel5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    edges = cv2.dilate(edges, kernel3, iterations=1)
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel5, iterations=2)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    mask_small = np.zeros_like(small_gray)

    if contours:
        # Prefer the largest contour that covers the center (likely the person)
        center_pt = (small_gray.shape[1] // 2, small_gray.shape[0] // 2)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        chosen = None
        for cnt in contours:
            if cv2.pointPolygonTest(cnt, center_pt, False) >= 0:
                chosen = cnt
                break
        if chosen is None:
            chosen = contours[0]
        cv2.drawContours(mask_small, [chosen], -1, 255, thickness=cv2.FILLED)
        mask_small = cv2.morphologyEx(mask_small, cv2.MORPH_OPEN, kernel5, iterations=1)
    else:
        # Fallback to centered rectangle if no contour found
        h_s, w_s = mask_small.shape
        rect = (
            int(w_s * 0.15),
            int(h_s * 0.1),
            int(w_s * 0.7),
            int(h_s * 0.8),
        )
        mask_small[rect[1]:rect[1] + rect[3], rect[0]:rect[0] + rect[2]] = 255

    # Upscale mask to original size
    if scale < 1.0:
        mask_init = cv2.resize(mask_small, (width, height), interpolation=cv2.INTER_LINEAR)
    else:
        mask_init = mask_small

    # Initialize GrabCut with the guided mask
    gc_mask = np.full(mask_init.shape, cv2.GC_PR_BGD, dtype=np.uint8)
    gc_mask[mask_init > 0] = cv2.GC_PR_FGD

    # Force image borders to background to avoid spill
    border = max(5, int(0.03 * max(height, width)))
    gc_mask[:border, :] = cv2.GC_BGD
    gc_mask[-border:, :] = cv2.GC_BGD
    gc_mask[:, :border] = cv2.GC_BGD
    gc_mask[:, -border:] = cv2.GC_BGD

    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)

    try:
        cv2.grabCut(img_array, gc_mask, None, bgd_model, fgd_model, 3, cv2.GC_INIT_WITH_MASK)
        mask2 = np.where((gc_mask == 2) | (gc_mask == 0), 0, 1).astype("uint8")

        # Clean mask edges
        mask2 = cv2.morphologyEx(mask2, cv2.MORPH_OPEN, kernel3, iterations=1)
        mask2 = cv2.morphologyEx(mask2, cv2.MORPH_CLOSE, kernel5, iterations=1)

        result = img_array * mask2[:, :, np.newaxis]
        white_bg = np.ones_like(img_array) * 255
        final_result = np.where(mask2[:, :, np.newaxis] == 1, result, white_bg)

        return Image.fromarray(final_result.astype("uint8"))
    except Exception:
        # Fallback to original image if GrabCut fails
        return image

def extract_skin_tone(image, mask_region=None):
    """Extract skin tone from face/neck region"""
    img_array = np.array(image)
    height, width = img_array.shape[:2]
    
    # Focus on upper-middle region (likely face/neck)
    if mask_region is None:
        face_region = img_array[int(height*0.15):int(height*0.4), 
                               int(width*0.3):int(width*0.7)]
    else:
        face_region = img_array[mask_region]
    
    # Convert to HSV for better skin detection
    hsv = cv2.cvtColor(face_region, cv2.COLOR_RGB2HSV)
    
    # Skin color range in HSV
    lower_skin = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin = np.array([20, 255, 255], dtype=np.uint8)
    
    # Create mask for skin pixels
    skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
    
    # Extract skin pixels
    skin_pixels = face_region[skin_mask > 0]
    
    if len(skin_pixels) > 0:
        avg_color = np.mean(skin_pixels, axis=0).astype(int)
    else:
        # Fallback to simple average
        avg_color = np.mean(face_region, axis=(0, 1)).astype(int)
    
    # Determine skin tone category
    brightness = np.mean(avg_color)
    
    if brightness > 200:
        skin_tone = "Very Fair"
        undertone = "Cool"
    elif brightness > 170:
        skin_tone = "Fair"
        undertone = "Neutral-Cool"
    elif brightness > 140:
        skin_tone = "Medium"
        undertone = "Neutral"
    elif brightness > 110:
        skin_tone = "Olive/Tan"
        undertone = "Warm"
    else:
        skin_tone = "Deep"
        undertone = "Warm"
    
    return {
        "tone": skin_tone,
        "undertone": undertone,
        "rgb": avg_color,
        "hex": '#{:02x}{:02x}{:02x}'.format(avg_color[0], avg_color[1], avg_color[2])
    }

def detect_body_shape(image):
    """Detect body shape from image contours"""
    img_array = np.array(image)
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    
    # Find contours
    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return "Standard", {}
    
    # Get largest contour (person)
    largest_contour = max(contours, key=cv2.contourArea)
    
    # Get bounding rectangle
    x, y, w, h = cv2.boundingRect(largest_contour)
    
    # Calculate ratios
    height, width = img_array.shape[:2]
    aspect_ratio = h / w if w > 0 else 1
    
    # Estimate measurements at different heights
    shoulder_y = y + int(h * 0.2)
    waist_y = y + int(h * 0.5)
    hip_y = y + int(h * 0.7)
    
    # Measure width at different points
    shoulder_width = np.sum(thresh[shoulder_y, :] > 0)
    waist_width = np.sum(thresh[waist_y, :] > 0)
    hip_width = np.sum(thresh[hip_y, :] > 0)
    
    # Calculate ratios
    measurements = {
        "shoulder_width": shoulder_width,
        "waist_width": waist_width,
        "hip_width": hip_width,
        "height": h,
        "width": w
    }
    
    # Determine body shape
    if shoulder_width > 0 and waist_width > 0:
        shoulder_waist_ratio = shoulder_width / waist_width
        waist_hip_ratio = waist_width / hip_width if hip_width > 0 else 1
        
        if shoulder_waist_ratio > 1.15 and waist_hip_ratio < 0.95:
            body_shape = "Triangle/Pear"
        elif shoulder_waist_ratio < 0.95 and waist_hip_ratio > 1.05:
            body_shape = "Inverted Triangle"
        elif abs(shoulder_waist_ratio - 1) < 0.1 and abs(waist_hip_ratio - 1) < 0.1:
            body_shape = "Rectangle"
        elif waist_hip_ratio < 0.85:
            body_shape = "Hourglass"
        else:
            body_shape = "Oval"
    else:
        body_shape = "Standard"
    
    return body_shape, measurements

def detect_current_style(image):
    """Detect current clothing style and colors"""
    img_array = np.array(image)
    height, width = img_array.shape[:2]
    
    # Analyze upper body region (clothing)
    upper_body = img_array[int(height*0.3):int(height*0.6), 
                           int(width*0.25):int(width*0.75)]
    
    # Get dominant colors
    pixels = upper_body.reshape(-1, 3)
    # Remove white/near-white pixels (background)
    pixels = pixels[np.sum(pixels, axis=1) < 700]
    
    if len(pixels) == 0:
        return ["Neutral"], "Casual"
    
    # K-means clustering for dominant colors
    from sklearn.cluster import KMeans
    try:
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        kmeans.fit(pixels)
        colors = kmeans.cluster_centers_.astype(int)
    except:
        # Fallback: just use mean color
        colors = [np.mean(pixels, axis=0).astype(int)]
    
    # Categorize colors
    color_names = []
    for color in colors:
        r, g, b = color
        brightness = np.mean(color)
        
        if brightness < 50:
            color_names.append("Black")
        elif brightness > 200:
            color_names.append("White")
        elif r > g + 30 and r > b + 30:
            color_names.append("Red")
        elif b > r + 30 and b > g + 30:
            color_names.append("Blue")
        elif g > r + 20 and g > b + 20:
            color_names.append("Green")
        elif r > 150 and g > 150 and b < 100:
            color_names.append("Yellow")
        elif r > 100 and g < 100 and b > 100:
            color_names.append("Purple")
        else:
            color_names.append("Neutral")
    
    # Determine style (simplified)
    avg_brightness = np.mean(pixels)
    if avg_brightness < 100:
        style = "Formal/Dark"
    elif avg_brightness > 180:
        style = "Light/Casual"
    else:
        style = "Smart Casual"
    
    return list(set(color_names)), style

def detect_hair_and_face_features(image):
    """Lightweight heuristics for hair color, beard presence, and face shape."""
    img_array = np.array(image)
    height, width = img_array.shape[:2]
    
    # Use top quarter for hair estimation
    hair_region = img_array[:max(1, int(height * 0.25)), int(width * 0.2):int(width * 0.8)]
    hair_pixels = hair_region.reshape(-1, 3)
    hair_pixels = hair_pixels[np.sum(hair_pixels, axis=1) < 700]  # drop near-white bg
    
    if len(hair_pixels) > 0:
        hair_color = np.median(hair_pixels, axis=0).astype(int)
    else:
        hair_color = np.array([80, 70, 60])  # dark fallback
    
    # Face region centered upper-middle
    face_region = img_array[int(height * 0.15):int(height * 0.45),
                            int(width * 0.3):int(width * 0.7)]
    face_pixels = face_region.reshape(-1, 3)
    face_pixels = face_pixels[np.sum(face_pixels, axis=1) < 730]
    
    # Beard: check lower half of face region for darker density
    beard_region = face_region[int(face_region.shape[0] * 0.5):, :]
    beard_mask = np.sum(beard_region, axis=2) < 360  # dark pixels
    beard_ratio = np.mean(beard_mask) if beard_mask.size > 0 else 0
    beard_presence = "Yes" if beard_ratio > 0.08 else "No/Minimal"
    
    # Face shape heuristic based on width/height of face crop
    face_h, face_w, _ = face_region.shape
    face_ratio = face_w / face_h if face_h else 1
    if face_ratio > 0.95:
        face_shape = "Round"
    elif face_ratio > 0.8:
        face_shape = "Oval"
    else:
        face_shape = "Oblong"
    
    hair_hex = '#{:02x}{:02x}{:02x}'.format(
        int(hair_color[0]), int(hair_color[1]), int(hair_color[2])
    )
    
    return {
        "hair_color_rgb": f"RGB({hair_color[0]}, {hair_color[1]}, {hair_color[2]})",
        "hair_color_hex": hair_hex,
        "beard": beard_presence,
        "face_shape": face_shape
    }


def add_depth_shading(rgb_img):
    """Add gentle highlights/shadows to give a flatter render a 3D-ish lift."""
    h, w = rgb_img.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    norm_x = (xx - w * 0.5) / (w * 0.5)
    norm_y = (yy - h * 0.5) / (h * 0.5)
    radial = np.sqrt(norm_x ** 2 + norm_y ** 2)

    shadow = np.clip(radial * 80, 0, 75).astype(np.uint8)
    shadow_rgb = np.stack([shadow] * 3, axis=2)

    light_dir = np.clip(0.7 - ((xx / max(w, 1)) * 0.8 + (yy / max(h, 1)) * 0.5), 0, 0.7)
    light = (light_dir * 65).astype(np.uint8)
    light_rgb = np.stack([light] * 3, axis=2)

    lifted = cv2.add(rgb_img, light_rgb)
    lifted = cv2.subtract(lifted, shadow_rgb)
    return np.clip(lifted, 0, 255).astype(np.uint8)


def build_background(style, h, w):
    """Generate simple, clean backdrops to avoid white edges and add polish."""
    if style == "Studio Gray":
        base = np.full((h, w, 3), 236, dtype=np.uint8)
        grad = np.linspace(12, -12, h, dtype=np.int16)[:, None]
        base = np.clip(base.astype(np.int16) + grad, 0, 255).astype(np.uint8)
        noise = np.random.normal(0, 4, (h, w, 3)).astype(np.int16)
        return np.clip(base.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    elif style == "Cool Grid":
        base = np.full((h, w, 3), [234, 240, 248], dtype=np.uint8)
        step = max(24, w // 28)
        for x in range(0, w, step):
            cv2.line(base, (x, 0), (x, h), (220, 228, 238), 1)
        for y in range(0, h, step):
            cv2.line(base, (0, y), (w, y), (220, 228, 238), 1)
        blur = cv2.GaussianBlur(base, (0, 0), 1.2)
        return blur
    elif style == "Sunset Wash":
        top = np.array([250, 230, 220], dtype=np.float32)
        mid = np.array([230, 240, 250], dtype=np.float32)
        bottom = np.array([210, 225, 245], dtype=np.float32)
        yy = np.linspace(0, 1, h)[:, None]
        grad = np.where(yy < 0.4,
                        top + (mid - top) * (yy / 0.4),
                        mid + (bottom - mid) * ((yy - 0.4) / 0.6))
        noise = np.random.normal(0, 3, (h, w, 3))
        return np.clip(grad + noise, 0, 255).astype(np.uint8)
    else:  # Soft Gradient (default)
        base_color = np.array([240, 244, 252], dtype=np.float32)
        accent = np.array([224, 234, 248], dtype=np.float32)
        y_grad = np.linspace(0, 1, h)[:, None]
        x_wave = np.sin(np.linspace(0, np.pi * 2.2, w))[None, :]
        mix = 0.55 + 0.25 * y_grad + 0.08 * x_wave
        return (base_color + (accent - base_color) * mix[..., None]).clip(0, 255).astype(np.uint8)


def quick_face_readings_mediapipe(image):
    """Offline, fast face analysis using MediaPipe detection + heuristics."""
    if not MEDIAPIPE_AVAILABLE:
        return None

    mp_face_detection = mp.solutions.face_detection  # type: ignore
    img_array = np.array(image)
    h, w = img_array.shape[:2]
    bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

    try:
        with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.4) as detector:
            results = detector.process(bgr)
    except Exception:
        return None

    if not results.detections:
        return None

    det = results.detections[0]
    bbox = det.location_data.relative_bounding_box
    x1 = max(int(bbox.xmin * w) - 12, 0)
    y1 = max(int(bbox.ymin * h) - 12, 0)
    x2 = min(int((bbox.xmin + bbox.width) * w) + 12, w)
    y2 = min(int((bbox.ymin + bbox.height) * h) + 16, h)

    face_crop = img_array[y1:y2, x1:x2]
    if face_crop.size == 0:
        return None

    gray = cv2.cvtColor(face_crop, cv2.COLOR_RGB2GRAY)
    blur_gray = cv2.GaussianBlur(gray, (3, 3), 0)
    lap_var = cv2.Laplacian(blur_gray, cv2.CV_64F).var()
    brightness = gray.mean()
    edge_density = np.mean(cv2.Canny(gray, 45, 110) > 0)
    binary_face = gray < 245
    # Quick beard density: darker pixels on lower half of the face
    lower_half = gray[int(gray.shape[0] * 0.55):, :]
    if lower_half.size:
        beard_ratio = np.mean(lower_half < 100)
    else:
        beard_ratio = 0.0

    # Heuristic age bucket: lower texture variance + higher brightness -> younger
    texture_score = np.clip((150 - lap_var) / 150, 0, 1)
    shade_penalty = np.clip((130 - brightness) / 130, 0, 1)
    age_est = 18 + (1 - texture_score) * 28 + shade_penalty * 10 + edge_density * 8
    age_est = int(np.clip(age_est, 18, 70))
    if age_est < 26:
        age_label = f"~{age_est} (youthful)"
    elif age_est < 36:
        age_label = f"~{age_est} (20s-30s)"
    elif age_est < 46:
        age_label = f"~{age_est} (30s-40s)"
    else:
        age_label = f"~{age_est} (40+)"

    # Gender heuristic using multiple lightweight cues instead of defaulting to masculine
    fh, fw = gray.shape
    if fh == 0:
        return None

    def _row_width(frac):
        idx = min(fh - 1, max(0, int(fh * frac)))
        return float(np.sum(binary_face[idx]))

    top_w = _row_width(0.32)
    mid_w = _row_width(0.55)
    jaw_w = _row_width(0.82)
    taper_ratio = jaw_w / max(mid_w, 1.0)

    ratio = fw / fh if fh else 1
    lower_mean = gray[int(fh * 0.65):].mean() if fh else 0
    upper_mean = gray[:int(fh * 0.25)].mean() if fh else 0
    shadow_delta = (lower_mean - upper_mean) if lower_mean else 0  # darker jaw boosts masculine score
    beard_bonus = np.clip((beard_ratio - 0.12) / 0.3, 0, 1) * 0.45
    width_score = np.clip((ratio - 0.94) * 1.4, -0.9, 0.9)
    jaw_score = np.clip((taper_ratio - 0.94) * 2.0, -1.0, 1.0)
    shadow_score = np.clip(shadow_delta / 80, -0.25, 0.25)
    masculinity_score = width_score + jaw_score + shadow_score + beard_bonus
    gender_guess = "Male" if masculinity_score >= 0.6 else "Female"

    # Smile/neutral heuristic from mouth texture
    mouth = gray[int(fh * 0.65):, int(fw * 0.2):int(fw * 0.8)]
    mouth_edges = np.mean(cv2.Canny(mouth, 30, 90) > 0) if mouth.size else 0
    if mouth_edges > 0.19:
        emotion_guess = "Happy/Smiling (quick heuristic)"
    elif brightness < 90:
        emotion_guess = "Serious/Focused (quick heuristic)"
    else:
        emotion_guess = "Neutral/Calm (quick heuristic)"

    return {
        "age": age_label,
        "gender": gender_guess,
        "emotion": emotion_guess,
        "source": "MediaPipe fast heuristic"
    }


def analyze_face_age_gender_emotion(image):
    """Optional DeepFace-based age/gender/emotion analysis.
    Returns empty values if DeepFace is not installed or inference fails.
    """
    if not DEEPFACE_AVAILABLE:
        fallback = quick_face_readings_mediapipe(image)
        if fallback:
            return fallback
        return {
            "age": None,
            "gender": None,
            "emotion": None,
            "source": "DeepFace not installed (pip install deepface)"
        }

    try:
        # DeepFace expects BGR numpy arrays
        bgr_img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        analysis = DeepFace.analyze(
            img_path=bgr_img,
            actions=["age", "gender", "emotion"],
            enforce_detection=False
        )

        # DeepFace may return a list
        if isinstance(analysis, list):
            analysis = analysis[0] if analysis else {}

        gender_val = analysis.get("gender")
        if isinstance(gender_val, dict):
            gender_val = max(gender_val.items(), key=lambda kv: kv[1])[0] if gender_val else None

        result = {
            "age": analysis.get("age"),
            "gender": gender_val,
            "emotion": analysis.get("dominant_emotion"),
            "source": "DeepFace"
        }

        # Fill any missing slots with fast heuristic to avoid N/A in UI
        if any(val is None for val in result.values()):
            fallback = quick_face_readings_mediapipe(image)
            if fallback:
                for key in ["age", "gender", "emotion"]:
                    if result.get(key) is None:
                        result[key] = fallback.get(key)
                result["source"] = f"DeepFace + {fallback.get('source')}"

        return result
    except Exception:
        fallback = quick_face_readings_mediapipe(image)
        if fallback:
            return fallback
        return {
            "age": None,
            "gender": None,
            "emotion": None,
            "source": "DeepFace error"
        }

def extract_comprehensive_attributes(image):
    """Extract all attributes needed for recommendations"""
    img_array = np.array(image)
    height, width = img_array.shape[:2]
    
    # 1. Skin tone analysis
    skin_info = extract_skin_tone(image)
    
    # 2. Body shape detection
    body_shape, measurements = detect_body_shape(image)
    
    # 3. Current style and color preferences
    current_colors, current_style = detect_current_style(image)

    # 4. Hair/beard/face heuristics
    face_features = detect_hair_and_face_features(image)

    # 4b. Optional age/gender/emotion if DeepFace is available
    age_gender_emotion = analyze_face_age_gender_emotion(image)

    # 5. Size estimation (proportional)
    estimated_size = "M"  # Default
    if measurements.get("width", 0) > 0:
        width_ratio = measurements["width"] / width
        if width_ratio < 0.35:
            estimated_size = "S"
        elif width_ratio > 0.50:
            estimated_size = "L"
    
    # Normalize face AI outputs so UI never shows nulls
    age_val = age_gender_emotion.get("age")
    gender_val = age_gender_emotion.get("gender")
    emotion_val = age_gender_emotion.get("emotion")

    attributes = {
        "skin_tone": skin_info["tone"],
        "skin_undertone": skin_info["undertone"],
        "skin_color_rgb": f"RGB({skin_info['rgb'][0]}, {skin_info['rgb'][1]}, {skin_info['rgb'][2]})",
        "skin_color_hex": skin_info["hex"],
        "body_shape": body_shape,
        "estimated_size": estimated_size,
        "shoulder_width_px": measurements.get("shoulder_width", 0),
        "waist_width_px": measurements.get("waist_width", 0),
        "hip_width_px": measurements.get("hip_width", 0),
        "height_px": measurements.get("height", 0),
        "current_style": current_style,
        "current_colors": ", ".join(current_colors),
        "image_dimensions": f"{width}x{height}",
        "hair_color_rgb": face_features["hair_color_rgb"],
        "hair_color_hex": face_features["hair_color_hex"],
        "beard": face_features["beard"],
        "face_shape": face_features["face_shape"],
        "age_estimate": age_val if age_val is not None else "N/A",
        "gender_estimate": gender_val if gender_val is not None else "N/A",
        "dominant_emotion": emotion_val if emotion_val is not None else "N/A",
        "face_model": age_gender_emotion.get("source"),
    }

    return attributes

def create_avatar(image, background_style="Soft Gradient"):
    """Create a clean avatar from the uploaded image with optional backdrop."""
    img_array = np.array(image)
    h, w = img_array.shape[:2]

    # Try high-quality segmentation first, fall back to GrabCut
    mask = None
    if MEDIAPIPE_AVAILABLE:
        try:
            mp_selfie = mp.solutions.selfie_segmentation  # type: ignore
            with mp_selfie.SelfieSegmentation(model_selection=1) as segmenter:
                result = segmenter.process(img_array)
                if result.segmentation_mask is not None:
                    mask = (result.segmentation_mask > 0.45).astype("uint8") * 255
        except Exception:
            mask = None

    if mask is None:
        # Downscale for fast GrabCut
        max_side = 900
        scale = min(1.0, max_side / max(h, w))
        if scale < 1.0:
            small = cv2.resize(img_array, (int(w * scale), int(h * scale)))
        else:
            small = img_array
        no_bg_small = remove_background_grabcut(Image.fromarray(small))
        no_bg_small_arr = np.array(no_bg_small)
        if scale < 1.0:
            no_bg = cv2.resize(no_bg_small_arr, (w, h), interpolation=cv2.INTER_LINEAR)
        else:
            no_bg = no_bg_small_arr
        gray_mask = cv2.cvtColor(no_bg, cv2.COLOR_RGB2GRAY)
        mask = (gray_mask < 245).astype("uint8") * 255
    else:
        if mask.shape[:2] != (h, w):
            mask = cv2.resize(mask, (w, h), interpolation=cv2.INTER_LINEAR)
        no_bg = img_array.copy()
        no_bg[mask == 0] = 255

    # Clean mask edges
    kernel_el = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel_el, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel_el, iterations=1)
    # Trim a thin halo to remove white border artifacts, then softly feather
    mask = cv2.erode(mask, kernel_el, iterations=1)
    mask = cv2.GaussianBlur(mask, (13, 13), 0)

    # Enhance the image for a cleaner, brighter avatar
    denoised = cv2.bilateralFilter(no_bg, d=7, sigmaColor=40, sigmaSpace=25)
    lab = cv2.cvtColor(denoised, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced_lab = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)
    enhanced = np.clip(enhanced * 1.05, 0, 255).astype(np.uint8)

    kernel = np.array([[-1, -1, -1],
                       [-1, 10, -1],
                       [-1, -1, -1]]) * 0.45
    sharpened = cv2.filter2D(enhanced, -1, kernel)
    shaded = add_depth_shading(sharpened)

    # Stylized canvas with selectable background
    h_pad, w_pad = int(h * 0.07), int(w * 0.07)
    canvas_h, canvas_w = h + h_pad * 2, w + w_pad * 2
    canvas = build_background(background_style, canvas_h, canvas_w)

    # Soft shadow behind the avatar
    shadow = cv2.dilate(mask, None, iterations=10)
    shadow = cv2.GaussianBlur(shadow, (27, 27), 18)
    shadow_rgb = cv2.cvtColor(shadow, cv2.COLOR_GRAY2RGB)
    shadow_rgb = (shadow_rgb * 0.16).astype(np.uint8)
    canvas[h_pad:h_pad + h, w_pad:w_pad + w] = cv2.add(
        canvas[h_pad:h_pad + h, w_pad:w_pad + w], shadow_rgb)

    # Subtle outline to hide residual fringing
    outline = cv2.dilate((mask > 0).astype("uint8") * 255, None, iterations=2)
    outline = outline - mask
    outline_rgb = cv2.cvtColor(outline, cv2.COLOR_GRAY2RGB)
    outline_rgb = (outline_rgb * 0.28).astype(np.uint8)

    # Paste avatar with alpha from the feathered mask
    alpha = (mask.astype(np.float32) / 255.0)[..., None]
    region = canvas[h_pad:h_pad + h, w_pad:w_pad + w].astype(np.float32)
    blended = alpha * shaded.astype(np.float32) + (1 - alpha) * region
    blended = blended.astype(np.uint8) + outline_rgb
    canvas[h_pad:h_pad + h, w_pad:w_pad + w] = blended

    return Image.fromarray(canvas)

def simulate_tryon(avatar_image, clothing_item):
    """Simulate virtual try-on by overlaying clothing"""
    avatar_array = np.array(avatar_image)
    height, width = avatar_array.shape[:2]
    
    # Create a simple colored overlay for demonstration
    overlay = avatar_array.copy()
    
    # Define clothing region (upper body for shirt, lower for pants)
    if clothing_item['type'] == 'shirt':
        y_start, y_end = int(height * 0.25), int(height * 0.6)
        x_start, x_end = int(width * 0.2), int(width * 0.8)
    elif clothing_item['type'] == 'pants':
        y_start, y_end = int(height * 0.55), int(height * 0.95)
        x_start, x_end = int(width * 0.25), int(width * 0.75)
    else:  # dress
        y_start, y_end = int(height * 0.25), int(height * 0.9)
        x_start, x_end = int(width * 0.2), int(width * 0.8)
    
    # Create clothing overlay with transparency
    clothing_color = tuple(int(clothing_item['color'][i:i+2], 16) for i in (1, 3, 5))
    overlay[y_start:y_end, x_start:x_end] = clothing_color
    
    # Blend with original avatar
    alpha = 0.4
    result = cv2.addWeighted(avatar_array, 1 - alpha, overlay, alpha, 0)
    
    return Image.fromarray(result)

def get_smart_recommendations(attributes):
    """Generate intelligent clothing recommendations based on extracted attributes"""
    recommendations = []
    
    # Expanded clothing database with more attributes
    clothing_db = [
        # Shirts
        {"name": "Classic White Button-Down", "type": "shirt", "color": "#FFFFFF", "style": "Formal", "size": "M", "best_for": ["All", "Fair", "Medium"]},
        {"name": "Navy Blue Oxford Shirt", "type": "shirt", "color": "#2C3E50", "style": "Smart Casual", "size": "M", "best_for": ["All"]},
        {"name": "Light Blue Chambray", "type": "shirt", "color": "#89CFF0", "style": "Casual", "size": "M", "best_for": ["Fair", "Medium", "Olive/Tan"]},
        {"name": "Burgundy Polo", "type": "shirt", "color": "#800020", "style": "Casual", "size": "M", "best_for": ["Fair", "Medium"]},
        {"name": "Charcoal Henley", "type": "shirt", "color": "#36454F", "style": "Casual", "size": "M", "best_for": ["All"]},
        {"name": "Cream Linen Shirt", "type": "shirt", "color": "#FFFDD0", "style": "Summer Casual", "size": "M", "best_for": ["Deep", "Olive/Tan"]},
        
        # Pants
        {"name": "Navy Dress Trousers", "type": "pants", "color": "#1C2841", "style": "Formal", "size": "32", "best_for": ["All"]},
        {"name": "Khaki Chinos", "type": "pants", "color": "#C3B091", "style": "Casual", "size": "32", "best_for": ["All"]},
        {"name": "Black Slim Jeans", "type": "pants", "color": "#1C1C1C", "style": "Casual", "size": "32", "best_for": ["All"]},
        {"name": "Grey Wool Trousers", "type": "pants", "color": "#808080", "style": "Formal", "size": "32", "best_for": ["All"]},
        {"name": "Olive Cargo Pants", "type": "pants", "color": "#708238", "style": "Casual", "size": "32", "best_for": ["Medium", "Olive/Tan", "Deep"]},
        
        # Dresses
        {"name": "Little Black Dress", "type": "dress", "color": "#000000", "style": "Formal", "size": "M", "best_for": ["Fair", "Medium", "Olive/Tan"]},
        {"name": "Floral Summer Dress", "type": "dress", "color": "#FF69B4", "style": "Casual", "size": "M", "best_for": ["All"]},
        {"name": "Emerald Evening Gown", "type": "dress", "color": "#50C878", "style": "Formal", "size": "M", "best_for": ["Fair", "Medium"]},
        {"name": "Coral A-Line Dress", "type": "dress", "color": "#FF7F50", "style": "Casual", "size": "M", "best_for": ["Deep", "Olive/Tan"]},
        {"name": "Navy Midi Dress", "type": "dress", "color": "#000080", "style": "Smart Casual", "size": "M", "best_for": ["All"]},
    ]
    
    skin_tone = attributes.get("skin_tone", "Medium")
    undertone = attributes.get("skin_undertone", "Neutral")
    body_shape = attributes.get("body_shape", "Standard")
    current_style = attributes.get("current_style", "Casual")
    
    for item in clothing_db:
        score = 0
        reasons = []
        
        # Score based on skin tone compatibility
        if skin_tone in item['best_for'] or "All" in item['best_for']:
            score += 3
            reasons.append("Great for your skin tone")
        
        # Score based on undertone
        item_color_rgb = tuple(int(item['color'][i:i+2], 16) for i in (1, 3, 5))
        color_temp = item_color_rgb[0] - item_color_rgb[2]  # Red - Blue
        
        if undertone == "Warm" and color_temp > 0:
            score += 2
            reasons.append("Matches warm undertone")
        elif undertone == "Cool" and color_temp < 0:
            score += 2
            reasons.append("Matches cool undertone")
        elif undertone in ["Neutral", "Neutral-Cool"]:
            score += 1
            reasons.append("Neutral tone works well")
        
        # Score based on style match
        if item['style'] == current_style:
            score += 2
            reasons.append("Matches your style")
        elif "Casual" in item['style'] and "Casual" in current_style:
            score += 1
        
        # Body shape recommendations
        if body_shape == "Hourglass" and item['type'] in ['dress', 'shirt']:
            score += 1
            reasons.append("Flattering for hourglass shape")
        elif body_shape == "Rectangle" and item['type'] == 'dress':
            score += 1
            reasons.append("Creates curves for rectangle shape")
        elif body_shape in ["Triangle/Pear", "Inverted Triangle"]:
            score += 1
        
        item['match_score'] = score
        item['match_reasons'] = reasons
        recommendations.append(item)
    
    # Sort by score
    recommendations.sort(key=lambda x: x['match_score'], reverse=True)
    
    return recommendations[:6]


def _banana_image_from_outputs(outputs):
    """Parse common Nano Banana model output shapes and return a PIL image."""
    if not outputs:
        return None

    first = outputs[0] if isinstance(outputs, list) else outputs

    # Handle base64 outputs from typical Banana templates
    b64_keys = [
        "image_base64",
        "imageBase64",
        "image_b64",
        "image",
        "output",
    ]
    for key in b64_keys:
        b64_val = first.get(key) if isinstance(first, dict) else None
        if isinstance(b64_val, str):
            try:
                cleaned = b64_val.split(",")[-1]
                return Image.open(io.BytesIO(base64.b64decode(cleaned)))
            except Exception:
                continue

    # Handle remote image URL outputs
    url_key = None
    if isinstance(first, dict):
        url_key = first.get("image_url") or first.get("imageURL")
    if isinstance(url_key, str):
        try:
            resp = requests.get(url_key, timeout=30)
            resp.raise_for_status()
            return Image.open(io.BytesIO(resp.content))
        except Exception:
            return None

    return None


def generate_2d_model_via_banana(prompt, timeout_s=90, poll_interval=2.5):
    """Call Nano Banana (banana.dev) to generate a 2D model from a text prompt."""
    api_key = os.getenv("BANANA_API_KEY")
    model_key = os.getenv("BANANA_MODEL_KEY")

    if not api_key or not model_key:
        raise RuntimeError("BANANA_API_KEY and BANANA_MODEL_KEY must be set for Nano Banana calls.")

    start_payload = {
        "apiKey": api_key,
        "modelKey": model_key,
        "modelInputs": {"prompt": prompt},
        "startOnly": False,
    }

    try:
        start_resp = requests.post("https://api.banana.dev/start/v4/", json=start_payload, timeout=30)
        start_resp.raise_for_status()
        start_data = start_resp.json()
    except Exception as exc:
        raise RuntimeError(f"Nano Banana API request failed: {exc}") from exc

    image = _banana_image_from_outputs(start_data.get("modelOutputs"))
    if image:
        return image

    call_id = start_data.get("id") or start_data.get("callID") or start_data.get("callId")
    if not call_id:
        raise RuntimeError("Nano Banana response did not include model outputs or a call ID.")

    # Poll until the remote model finishes
    start_time = time.time()
    while time.time() - start_time < timeout_s:
        time.sleep(poll_interval)
        poll_payload = {"apiKey": api_key, "callID": call_id}
        poll_resp = requests.post("https://api.banana.dev/check/v4/", json=poll_payload, timeout=30)
        poll_resp.raise_for_status()
        poll_data = poll_resp.json()

        image = _banana_image_from_outputs(poll_data.get("modelOutputs"))
        if image:
            return image

        if poll_data.get("modelState") in {"failed", "canceled", "finished_with_error"}:
            break

    raise RuntimeError("Nano Banana API did not return an image. Check your model output or try again.")


def _hex_to_rgb(color_hex):
    """Convert #RRGGBB to tuple[int, int, int] with basic validation."""
    if not isinstance(color_hex, str) or not color_hex.startswith("#") or len(color_hex) != 7:
        return (255, 255, 255)
    try:
        return tuple(int(color_hex[i:i+2], 16) for i in (1, 3, 5))
    except Exception:
        return (255, 255, 255)


def enhance_2d_visual(image, mode="Crisp Line Art", accent_hex="#e8eefb"):
    """Lightweight, offline 2D enhancement to improve presentation of generated outputs."""
    if image is None:
        raise ValueError("No image provided for enhancement.")

    rgb = np.array(image.convert("RGB"))
    h, w = rgb.shape[:2]

    # Base smoothing / color simplification
    smooth = cv2.bilateralFilter(rgb, d=9, sigmaColor=40, sigmaSpace=18)
    accent_rgb = np.array(_hex_to_rgb(accent_hex), dtype=np.uint8)

    if mode == "Crisp Line Art":
        gray = cv2.cvtColor(smooth, cv2.COLOR_RGB2GRAY)
        blur = cv2.medianBlur(gray, 7)
        edges = cv2.adaptiveThreshold(
            blur, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 9
        )
        edges_rgb = cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)
        base = cv2.addWeighted(smooth, 0.92, edges_rgb, 0.12, 0)
    elif mode == "Soft Cartoon":
        # Posterize colors a bit
        div = 24
        poster = (smooth // div) * div + div // 2
        edge_mask = cv2.Canny(poster, 60, 150)
        edge_mask = cv2.GaussianBlur(edge_mask, (5, 5), 0)
        edge_mask_rgb = cv2.cvtColor(edge_mask, cv2.COLOR_GRAY2RGB)
        base = cv2.subtract(poster, edge_mask_rgb // 5)
    else:  # "Bold Poster"
        z = smooth.reshape((-1, 3)).astype(np.float32)
        K = 8
        try:
            _, labels, centers = cv2.kmeans(
                z,
                K,
                None,
                (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 15, 1.0),
                3,
                cv2.KMEANS_PP_CENTERS,
            )
            centers = centers.astype(np.uint8)
            quant = centers[labels.flatten()].reshape((h, w, 3))
        except Exception:
            quant = smooth
        edges = cv2.Canny(quant, 80, 180)
        edges = cv2.dilate(edges, None, iterations=1)
        edges_rgb = cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)
        base = cv2.subtract(quant, edges_rgb // 4)

    # Add a gentle accent wash behind the subject
    accent_layer = np.full_like(base, accent_rgb)
    alpha = 0.12 if mode != "Bold Poster" else 0.18
    blended = cv2.addWeighted(base, 1.0, accent_layer, alpha, 0)
    return Image.fromarray(blended)

# Main UI
st.title("👔 AI-Powered Virtual Try-On")
st.markdown("Upload your photo to get personalized clothing recommendations!")

# Sidebar for navigation
with st.sidebar:
    st.header("📍 Navigation")
    step = st.radio("Select Step:", 
                    ["1. Upload Image", 
                     "2. View Avatar & Attributes", 
                     "3. Virtual Try-On",
                     "4. Smart Recommendations",
                     "5. Prompt-to-2D (Nano Banana)",
                     "6. Enhance 2D Output"],
                    index=0)
    
    st.markdown("---")
    st.markdown("### 💡 Features")
    st.info("""
    - Background removal
    - Skin tone analysis
    - Body shape detection
    - Style recognition
    - Smart recommendations
    - Prompt-to-2D generation (Nano Banana)
    - Offline 2D enhancer (cartoon/poster/line-art)
    """)

# Step 1: Upload Image
if "1. Upload Image" in step:
    st.header("Step 1: Upload Your Image")
    st.markdown("📸 Upload a clear, full-body or upper-body photo for best results")
    
    uploaded_file = st.file_uploader("Choose an image...", type=['jpg', 'jpeg', 'png'])
    
    if uploaded_file is not None:
        try:
            # Read and display original image safely
            image = load_image(uploaded_file)
        except ValueError as err:
            st.error(str(err))
            st.stop()
        except Exception:
            st.error("Unexpected error while reading the image. Please try another file.")
            st.stop()
        
        # Avoid re-processing the same file
        if st.session_state.last_upload_name != uploaded_file.name:
            st.session_state.user_image = None
            st.session_state.processed_avatar = None
            st.session_state.attributes = {}
        
        st.session_state.last_upload_name = uploaded_file.name
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📷 Original Image")
            st.image(image, use_column_width=True)
        
        with col2:
            st.subheader("🔄 Processing...")
            progress_bar = st.progress(0)
            status_text = st.empty()
            bg_style = st.selectbox(
                "Background style",
                ["Soft Gradient", "Sunset Wash", "Cool Grid", "Studio Gray"],
                index=["Soft Gradient", "Sunset Wash", "Cool Grid", "Studio Gray"].index(st.session_state.bg_style),
                help="Choose a clean backdrop to hide extraction artifacts and make the avatar pop.",
            )
            st.session_state.bg_style = bg_style
            
            try:
                # Step 1: Background removal
                status_text.text("Removing background...")
                progress_bar.progress(33)
                avatar = create_avatar(image, background_style=bg_style)
                
                # Step 2: Extract attributes
                status_text.text("Analyzing attributes...")
                progress_bar.progress(66)
                attributes = extract_comprehensive_attributes(image)
                
                # Step 3: Complete
                status_text.text("Complete!")
                progress_bar.progress(100)
                
                st.session_state.processed_avatar = avatar
                st.session_state.attributes = attributes
                st.session_state.user_image = image
                
                st.success("✅ Avatar created successfully!")
                st.image(avatar, use_column_width=True)
            except Exception as exc:
                st.error(f"Processing failed: {exc}")
        
        st.info("👉 Move to Step 2 to view detailed attributes")

# Step 2: View Avatar & Attributes
elif "2. View Avatar" in step:
    st.header("Step 2: Your Avatar & Extracted Features")
    
    if st.session_state.processed_avatar is None:
        st.warning("⚠️ Please upload an image first (Step 1)")
    else:
        col1, col2 = st.columns([1, 1])
        
        with col1:
            st.subheader("👤 Your Clean Avatar")
            st.image(st.session_state.processed_avatar, use_column_width=True)
            with st.expander("Change backdrop"):
                bg_choice = st.selectbox(
                    "Backdrop style",
                    ["Soft Gradient", "Sunset Wash", "Cool Grid", "Studio Gray"],
                    index=["Soft Gradient", "Sunset Wash", "Cool Grid", "Studio Gray"].index(st.session_state.bg_style),
                )
                if st.button("Apply backdrop", key="rebg"):
                    st.session_state.bg_style = bg_choice
                    st.session_state.processed_avatar = create_avatar(
                        st.session_state.user_image, background_style=bg_choice
                    )
                    st.experimental_rerun()
        
        with col2:
            st.subheader("📊 Extracted Attributes")
            
            attrs = st.session_state.attributes
            st.markdown("##### Key Values")
            st.json({
                "skin_tone": attrs.get("skin_tone"),
                "skin_undertone": attrs.get("skin_undertone"),
                "skin_color_hex": attrs.get("skin_color_hex"),
                "hair_color_hex": attrs.get("hair_color_hex"),
                "beard": attrs.get("beard"),
                "face_shape": attrs.get("face_shape"),
                "age_estimate": attrs.get("age_estimate"),
                "gender_estimate": attrs.get("gender_estimate"),
                "dominant_emotion": attrs.get("dominant_emotion"),
                "face_model": attrs.get("face_model"),
                "body_shape": attrs.get("body_shape"),
                "estimated_size": attrs.get("estimated_size"),
                "current_style": attrs.get("current_style"),
                "dominant_colors": attrs.get("current_colors")
            })
            
            # Skin Analysis
            st.markdown("#### 🎨 Skin Analysis")
            col_a, col_b = st.columns(2)
            with col_a:
                st.metric("Skin Tone", attrs.get("skin_tone", "N/A"))
                st.metric("Undertone", attrs.get("skin_undertone", "N/A"))
            with col_b:
                st.metric("RGB Color", attrs.get("skin_color_rgb", "N/A"))
                st.markdown(f'<div style="width:100%; height:40px; background-color:{attrs.get("skin_color_hex", "#FFFFFF")}; border-radius:5px; border: 1px solid #ccc;"></div>', 
                           unsafe_allow_html=True)
            
            st.markdown("---")
            
            # Body Analysis
            st.markdown("#### 👔 Body Analysis")
            col_c, col_d = st.columns(2)
            with col_c:
                st.metric("Body Shape", attrs.get("body_shape", "N/A"))
                st.metric("Est. Size", attrs.get("estimated_size", "N/A"))
            with col_d:
                st.metric("Shoulder Width", f"{attrs.get('shoulder_width_px', 0):.0f}px")
                st.metric("Waist Width", f"{attrs.get('waist_width_px', 0):.0f}px")

            st.markdown("---")

            # Face AI (optional)
            st.markdown("#### 🙂 Face AI (optional)")
            col_face1, col_face2 = st.columns(2)
            with col_face1:
                st.metric("Age (est.)", attrs.get("age_estimate", "n/a"))
                st.metric("Gender (est.)", attrs.get("gender_estimate", "n/a"))
            with col_face2:
                st.metric("Dominant Emotion", attrs.get("dominant_emotion", "n/a"))
                st.metric("Model", attrs.get("face_model", "Not installed"))
            model_label = attrs.get("face_model", "")
            if model_label.startswith("DeepFace not installed"):
                st.info("Fast offline heuristic is active. Install DeepFace for higher-accuracy age/gender/emotion: pip install deepface")
            elif "MediaPipe fast heuristic" in model_label:
                st.info("Using MediaPipe fast heuristic for face cues (offline, low-latency).")

            st.markdown("---")

            # Style Analysis
            st.markdown("#### 👗 Style Analysis")
            st.metric("Current Style", attrs.get("current_style", "N/A"))
            st.metric("Dominant Colors", attrs.get("current_colors", "N/A"))
        
        st.info("👉 Move to Step 3 for virtual try-on or Step 4 for recommendations")

# Step 3: Virtual Try-On
elif "3. Virtual Try-On" in step:
    st.header("Step 3: Virtual Try-On")
    
    if st.session_state.processed_avatar is None:
        st.warning("⚠️ Please upload an image first (Step 1)")
    else:
        st.subheader("🎨 Customize Your Outfit")
        
        col_config1, col_config2 = st.columns(2)
        
        with col_config1:
            clothing_type = st.selectbox("Clothing Type:", ["shirt", "pants", "dress"])
        
        with col_config2:
            clothing_color = st.color_picker("Pick a color:", "#4A90E2")
        
        if st.button("✨ Try On This Item", type="primary"):
            clothing_item = {
                "type": clothing_type,
                "color": clothing_color
            }
            
            with st.spinner("Applying clothing..."):
                result = simulate_tryon(st.session_state.processed_avatar, clothing_item)
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader("Before")
                st.image(st.session_state.processed_avatar, use_column_width=True)
            
            with col2:
                st.subheader("After Try-On")
                st.image(result, use_column_width=True)
        
        st.info("👉 Move to Step 4 for AI-powered recommendations")

# Step 4: Smart Recommendations
elif "4. Smart Recommendations" in step:
    st.header("Step 4: AI-Powered Recommendations")
    
    if not st.session_state.attributes:
        st.warning("⚠️ Please upload an image first (Step 1)")
    else:
        st.subheader("🎯 Personalized for You")
        st.markdown(f"Based on your **{st.session_state.attributes.get('skin_tone')}** skin tone with **{st.session_state.attributes.get('skin_undertone')}** undertone and **{st.session_state.attributes.get('body_shape')}** body shape")
        
        recommendations = get_smart_recommendations(st.session_state.attributes)
        
        # Display recommendations in a grid
        for idx in range(0, len(recommendations), 3):
            cols = st.columns(3)
            
            for col_idx, item in enumerate(recommendations[idx:idx+3]):
                with cols[col_idx]:
                    st.markdown(f"### {item['name']}")
                    
                    # Color swatch
                    st.markdown(f'<div style="width:100%; height:80px; background-color:{item["color"]}; border-radius:8px; border: 2px solid #ddd; margin-bottom: 10px;"></div>', 
                               unsafe_allow_html=True)
                    
                    st.markdown(f"**Type:** {item['type'].title()}")
                    st.markdown(f"**Style:** {item['style']}")
                    st.markdown(f"**Size:** {item['size']}")
                    st.markdown(f"**Match Score:** {'⭐' * min(item['match_score'], 5)}")
                    
                    # Show match reasons
                    if item.get('match_reasons'):
                        with st.expander("Why this works for you"):
                            for reason in item['match_reasons']:
                                st.markdown(f"✓ {reason}")
                    
                    if st.button(f"👗 Try On", key=f"try_{idx}_{col_idx}"):
                        with st.spinner("Applying..."):
                            result = simulate_tryon(st.session_state.processed_avatar, item)
                            st.image(result, use_column_width=True)
                    
                    st.markdown("---")

# Step 5: Nano Banana prompt-to-2D
elif "5. Prompt-to-2D" in step:
    st.header("Step 5: Prompt-to-2D with Nano Banana API")
    st.markdown("Provide a text prompt, and we'll call your Nano Banana (banana.dev) model to render a 2D output.")

    st.markdown("""
    - Set environment variables `BANANA_API_KEY` and `BANANA_MODEL_KEY` for authentication.
    - The app will try to parse `image_base64` or `image_url` from the model output.
    """)

    prompt = st.text_area(
        "Describe the 2D look you want:",
        value=st.session_state.nano_banana_prompt,
        placeholder="e.g., full-body 2D flat illustration of a modern streetwear outfit in pastel tones",
    )

    col_gen, col_clear = st.columns([1, 1])
    with col_gen:
        if st.button("Generate 2D Model", type="primary"):
            if not prompt.strip():
                st.warning("Please enter a prompt first.")
            else:
                st.session_state.nano_banana_prompt = prompt
                with st.spinner("Calling Nano Banana..."):
                    try:
                        result_img = generate_2d_model_via_banana(prompt.strip())
                        st.session_state.nano_banana_image = result_img
                        st.success("2D model generated successfully!")
                    except Exception as exc:
                        st.error(f"Generation failed: {exc}")
    with col_clear:
        if st.button("Clear Result"):
            st.session_state.nano_banana_image = None

    if st.session_state.nano_banana_image:
        st.subheader("Generated 2D Model")
        st.image(st.session_state.nano_banana_image, use_column_width=True)

        if st.session_state.processed_avatar:
            st.markdown("#### Compare with your avatar")
            col_a, col_b = st.columns(2)
            with col_a:
                st.markdown("Your avatar")
                st.image(st.session_state.processed_avatar, use_column_width=True)
            with col_b:
                st.markdown("Nano Banana output")
                st.image(st.session_state.nano_banana_image, use_column_width=True)
    else:
        st.info("No Nano Banana output yet. Enter a prompt and click Generate.")

# Step 6: Enhance 2D Output (offline)
elif "6. Enhance 2D Output" in step:
    st.header("Step 6: Enhance a 2D Output (Offline)")
    st.markdown("Apply lightweight, on-device filters to make your 2D avatar or Nano Banana output more presentable—no extra APIs or paid models.")

    source_options = []
    if st.session_state.nano_banana_image:
        source_options.append("Nano Banana result")
    if st.session_state.processed_avatar:
        source_options.append("Your avatar")

    if not source_options:
        st.warning("⚠️ Upload an image (Step 1) or generate a Nano Banana image (Step 5) to enhance it.")
    else:
        source_choice = st.radio("Pick a source image:", source_options, index=0)
        if source_choice == "Nano Banana result":
            base_img = st.session_state.nano_banana_image
        else:
            base_img = st.session_state.processed_avatar

        style = st.selectbox("Enhancement style:", ["Crisp Line Art", "Soft Cartoon", "Bold Poster"])
        accent_color = st.color_picker("Accent wash color (background lift):", "#e8eefb")

        cols = st.columns([1, 1])
        with cols[0]:
            st.subheader("Original")
            st.image(base_img, use_column_width=True)
        with cols[1]:
            st.subheader("Enhanced preview")
            if st.session_state.enhanced_2d_image:
                st.image(st.session_state.enhanced_2d_image, use_column_width=True)
            else:
                st.info("Choose a style and click Enhance to preview.")

        if st.button("✨ Enhance", type="primary"):
            with st.spinner("Enhancing on-device..."):
                try:
                    enhanced = enhance_2d_visual(base_img, mode=style, accent_hex=accent_color)
                    st.session_state.enhanced_2d_image = enhanced
                    st.success("Enhanced image ready!")
                except Exception as exc:
                    st.error(f"Enhancement failed: {exc}")

        if st.session_state.enhanced_2d_image:
            buf = io.BytesIO()
            st.session_state.enhanced_2d_image.save(buf, format="PNG")
            png_bytes = buf.getvalue()
            st.download_button(
                "Download enhanced PNG",
                data=png_bytes,
                file_name="enhanced-2d.png",
                mime="image/png",
                help="Downloaded from the latest enhanced preview above.",
            )

# Footer
st.markdown("---")
st.markdown("### 🚀 Technology Stack")
with st.expander("See technical details"):
    st.markdown("""
    **Current Implementation:**
    - OpenCV GrabCut for background removal
    - Color analysis for skin tone detection
    - Contour analysis for body shape
    - HSV color space for style recognition
    - Weighted scoring algorithm for recommendations
    
    **Production Enhancements:**
    - MediaPipe/OpenPose for pose estimation
    - U-2-Net/SAM for precise segmentation
    - HR-VITON for realistic try-on
    - Deep learning models for attribute extraction
    - Collaborative filtering for personalization
    """)

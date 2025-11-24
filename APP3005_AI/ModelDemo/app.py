import os
# Limit math libs threads to avoid oversubscription crashes on large-core machines
os.environ.setdefault("OPENBLAS_NUM_THREADS", "2")
os.environ.setdefault("OMP_NUM_THREADS", "2")
os.environ.setdefault("MKL_NUM_THREADS", "2")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "2")

import streamlit as st
import cv2
import numpy as np
from PIL import Image
import io
from collections import Counter

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
    """Improved background removal using GrabCut algorithm"""
    img_array = np.array(image)
    
    # Ensure image is in RGB format
    if len(img_array.shape) == 2:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
    elif img_array.shape[2] == 4:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)
    
    # Create a mask
    mask = np.zeros(img_array.shape[:2], np.uint8)
    
    # Define rectangle around the person (assume center of image)
    height, width = img_array.shape[:2]
    rect = (int(width*0.1), int(height*0.1), int(width*0.8), int(height*0.8))
    
    # GrabCut algorithm
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    
    try:
        cv2.grabCut(img_array, mask, rect, bgd_model, fgd_model, 2, cv2.GC_INIT_WITH_RECT)
        
        # Create binary mask
        mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
        
        # Apply morphological operations to smooth edges
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask2 = cv2.morphologyEx(mask2, cv2.MORPH_CLOSE, kernel)
        mask2 = cv2.morphologyEx(mask2, cv2.MORPH_OPEN, kernel)
        
        # Apply mask
        result = img_array * mask2[:, :, np.newaxis]
        
        # Add white background
        white_bg = np.ones_like(img_array) * 255
        final_result = np.where(mask2[:, :, np.newaxis] == 1, result, white_bg)
        
        return Image.fromarray(final_result.astype('uint8'))
    except:
        # Fallback to simple method if GrabCut fails
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
    
    # 5. Size estimation (proportional)
    estimated_size = "M"  # Default
    if measurements.get("width", 0) > 0:
        width_ratio = measurements["width"] / width
        if width_ratio < 0.35:
            estimated_size = "S"
        elif width_ratio > 0.50:
            estimated_size = "L"
    
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
    }
    
    return attributes

def create_avatar(image):
    """Create a clean avatar from the uploaded image (fast path)."""
    # Downscale for fast GrabCut
    MAX_MASK_SIDE = 900
    img_array_full = np.array(image)
    h, w = img_array_full.shape[:2]
    scale = min(1.0, MAX_MASK_SIDE / max(h, w))
    if scale < 1.0:
        small = cv2.resize(img_array_full, (int(w * scale), int(h * scale)))
    else:
        small = img_array_full
    
    # Quick background removal on smaller image
    small_pil = Image.fromarray(small)
    no_bg_small = remove_background_grabcut(small_pil)
    no_bg_small_arr = np.array(no_bg_small)
    
    # Upscale mask back to original size if needed
    if scale < 1.0:
        no_bg = cv2.resize(no_bg_small_arr, (w, h), interpolation=cv2.INTER_LINEAR)
    else:
        no_bg = no_bg_small_arr
    
    # Enhance the image
    enhancer_img = no_bg
    
    # Apply brightness/contrast adjustment
    lab = cv2.cvtColor(enhancer_img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to L channel
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    
    # Merge channels
    enhanced_lab = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)
    
    # Slight sharpening
    kernel = np.array([[-1,-1,-1],
                       [-1, 9,-1],
                       [-1,-1,-1]]) * 0.5
    sharpened = cv2.filter2D(enhanced, -1, kernel)
    
    return Image.fromarray(sharpened)

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
                     "4. Smart Recommendations"],
                    index=0)
    
    st.markdown("---")
    st.markdown("### 💡 Features")
    st.info("""
    - Background removal
    - Skin tone analysis
    - Body shape detection
    - Style recognition
    - Smart recommendations
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
            
            try:
                # Step 1: Background removal
                status_text.text("Removing background...")
                progress_bar.progress(33)
                avatar = create_avatar(image)
                
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
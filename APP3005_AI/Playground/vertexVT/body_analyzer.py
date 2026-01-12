"""
Body Analyzer - Simplified version for deployment compatibility.

Uses basic image processing for skin tone detection since MediaPipe 0.10.30+
requires the new Tasks API which needs model files. This fallback approach
works without external model downloads.
"""

import colorsys
from functools import lru_cache
from typing import List, Optional, Tuple, Dict

import numpy as np
from PIL import Image


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
    # - Skin pixels span at least 50% of image height
    # - Bottom skin pixels reach at least 70% down the image
    is_portrait = aspect_ratio > 1.3
    good_height_coverage = body_height >= 0.5
    reaches_bottom = bottom >= 0.7 * height
    
    return is_portrait and good_height_coverage and reaches_bottom


def _estimate_body_shape_simple(rgb: np.ndarray) -> Optional[str]:
    """
    Simple body shape estimation using silhouette analysis.
    
    Without ML pose detection, we use skin pixel width at different
    vertical positions as a proxy for body proportions.
    """
    height, width = rgb.shape[:2]
    skin_mask = _skin_mask(rgb, strict=False)
    
    ys = np.where(skin_mask)[0]
    if ys.size == 0:
        return None
    
    top = ys.min()
    bottom = ys.max()
    body_height = bottom - top
    
    if body_height < height * 0.4:
        return None  # Not enough body visible
    
    def get_width_at_y(y_pos: int) -> Optional[float]:
        """Get width of skin pixels at a given y position."""
        y_pos = int(np.clip(y_pos, 0, height - 1))
        band_height = max(1, int(0.05 * height))
        y0 = max(0, y_pos - band_height)
        y1 = min(height - 1, y_pos + band_height)
        
        widths = []
        for row in range(y0, y1 + 1):
            xs = np.where(skin_mask[row])[0]
            if xs.size:
                widths.append(xs.max() - xs.min())
        
        return float(np.median(widths)) if widths else None
    
    # Estimate positions (as fractions of body height from top)
    shoulder_y = top + body_height * 0.25
    waist_y = top + body_height * 0.45
    hip_y = top + body_height * 0.65
    
    shoulder_w = get_width_at_y(shoulder_y)
    waist_w = get_width_at_y(waist_y)
    hip_w = get_width_at_y(hip_y)
    
    if not all([shoulder_w, waist_w, hip_w]):
        return None
    
    # Minimum width threshold
    if min(shoulder_w, waist_w, hip_w) < 0.08 * width:
        return None
    
    # Calculate ratios
    balance = abs(shoulder_w - hip_w) / max(shoulder_w, hip_w)
    waist_ratio = waist_w / ((shoulder_w + hip_w) / 2.0)
    
    # Classify body shape
    if balance <= 0.12 and waist_ratio <= 0.78:
        return "hourglass"
    if hip_w >= shoulder_w * 1.12 and waist_w <= hip_w * 0.92:
        return "pear"
    if shoulder_w >= hip_w * 1.12 and waist_w <= shoulder_w * 0.92:
        return "inverted_triangle"
    if waist_w >= max(shoulder_w, hip_w) * 1.05:
        return "apple"
    if balance <= 0.15 and abs(waist_w - shoulder_w) / max(waist_w, shoulder_w) <= 0.15:
        return "rectangle"
    if shoulder_w > hip_w * 1.05:
        return "inverted_triangle"
    if hip_w > shoulder_w * 1.05:
        return "pear"
    
    return "rectangle"


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
    
    # Check if full body is visible
    full_body = _estimate_body_coverage(rgb)
    
    # Estimate body shape (only if full body visible)
    body_shape = None
    if full_body:
        body_shape = _estimate_body_shape_simple(rgb)
    
    return {
        "skin_tone_label": skin_label,
        "skin_hexes": skin_hexes,
        "body_shape": body_shape,
        "full_body": full_body,
    }

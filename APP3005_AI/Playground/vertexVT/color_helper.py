"""
Optimized token strategy with metadata caching.
Model uses cached metadata for faster, more accurate generation.
"""

# Logical angle sequence: front → side-left → left → side-right → right → back
# This ensures a natural progression around the person
ANGLES = ["front", "side-left", "left", "side-right", "right", "back"]

ANGLE_DEFS = {
    "front": "0° (front view)",
    "side-left": "45° left (front-left three-quarter view)",
    "left": "90° left (full left profile)",
    "side-right": "45° right (front-right three-quarter view)",
    "right": "90° right (full right profile)",
    "back": "180° (back view)",
}

class AngleSessionManager:
    """Manages angle sequences per user+product session."""
    def __init__(self):
        # Dictionary to store angle index per session_key
        # Format: {session_key: current_index}
        self.sessions = {}
    
    def get_next_angle(self, session_key: str) -> tuple[str, int]:
        """Get the next angle for a specific session and return both angle and index."""
        # Get current index for this session (default to 0 if new session)
        idx = self.sessions.get(session_key, 0)
        
        # Get the angle at this index
        angle = ANGLES[idx % len(ANGLES)]
        
        # Increment the index for next time
        self.sessions[session_key] = idx + 1
        
        return angle, idx
    
    def reset_session(self, session_key: str):
        """Reset a session to start from front angle."""
        self.sessions[session_key] = 0
    
    def get_current_index(self, session_key: str) -> int:
        """Get the current index for a session."""
        return self.sessions.get(session_key, 0)

# Global session manager instance
_angle_manager = AngleSessionManager()

def generate_angle_prompt(
    angle: str | None = None,
    angle_index: int | None = None,
    cached_metadata: dict | None = None,
    session_key: str | None = None,
):
    """
    Generate angle-specific prompt for image generation.
    
    Args:
        angle: Specific angle to use (if None, auto-determines from session or index)
        angle_index: Specific index in ANGLES list (if None, uses session or defaults to front)
        cached_metadata: Optional cached image metadata (colors, dimensions, etc.)
        session_key: Optional session key for tracking angle progression per user+product
    
    Returns:
        Optimized prompt for angle generation
    """
    # Decide angle
    if angle is None:
        if angle_index is not None:
            angle = ANGLES[angle_index % len(ANGLES)]
        elif session_key:
            angle, angle_index = _angle_manager.get_next_angle(session_key)
        else:
            angle = "front"

    angle_instruction = ANGLE_DEFS.get(angle, angle)

    # Minimal metadata
    colors_str = ""
    if cached_metadata and isinstance(cached_metadata.get("dominantColors"), list):
        colors = cached_metadata["dominantColors"][:3]
        if colors:
            colors_str = f" Outfit colors must match: {', '.join(colors)}."

    prompt = (
        f"Full-body fashion photo of the SAME PERSON as the reference image; "
        f"same face/identity, same hair, same outfit, same background and lighting."
        f"{colors_str}\n"
        f"Camera rotates around the person. ANGLE: {angle_instruction}. "
        f"Fixed tripod, eye-level, distance ~2.5m, keep subject size constant.\n"
        f"Framing: head-to-toe visible with margin above head and below feet. "
        f"No zoom, no crop.\n"
        f"Negative: close-up, portrait, cropped, zoomed in, different person, different face, different outfit, different background"
    )
    return prompt

"""
Optimized token strategy with metadata caching.
Model uses cached metadata for faster, more accurate generation.
"""

# Logical angle sequence: front → side-left → left → side-right → right → back
# This ensures a natural progression around the person
ANGLES = ["front", "side-left", "left", "side-right", "right", "back"]

class AngleSessionManager:
    """Manages angle sequences per user+product session."""
    def __init__(self):
        # Dictionary to store angle index per session_key
        # Format: {session_key: current_index}
        self.sessions = {}
    
    def get_next_angle(self, session_key: str) -> str:
        """Get the next angle for a specific session."""
        # Get current index for this session (default to 0 if new session)
        current_idx = self.sessions.get(session_key, 0)
        
        # Get the angle at this index
        angle = ANGLES[current_idx % len(ANGLES)]
        
        # Increment the index for next time
        self.sessions[session_key] = current_idx + 1
        
        return angle
    
    def reset_session(self, session_key: str):
        """Reset a session to start from front angle."""
        self.sessions[session_key] = 0
    
    def get_current_index(self, session_key: str) -> int:
        """Get the current index for a session."""
        return self.sessions.get(session_key, 0)

# Global session manager instance
_angle_manager = AngleSessionManager()

def generate_angle_prompt(angle: str = None, cached_metadata: dict = None, session_key: str = None, **kwargs) -> str:
    """
    Optimized angle generation using cached metadata.
    
    Args:
        angle: Optional specific angle, auto-rotates if None
        cached_metadata: Optional cached image metadata (colors, dimensions, etc.)
        session_key: Optional session key for tracking angle progression per user+product
    
    Returns:
        Optimized prompt for angle generation with contextual background
    """
    if not angle:
        # Use session-based angle tracking if session_key is provided
        if session_key:
            angle = _angle_manager.get_next_angle(session_key)
        else:
            # Fallback to first angle if no session key
            angle = ANGLES[0]
    
    # Define explicit angle instructions based on the requested angle
    angle_definitions = {
        "front": "0° - Person facing directly at the camera, showing their full front view. You can see their face, chest, and front of their outfit clearly.",
        "side-left": "45° to the left - Person rotated 45 degrees to their left (your right when looking at them). You can see part of their face profile and left side of their body.",
        "left": "90° to the left - Full left profile view. Person is sideways showing their complete left side. You can see their left ear, left side of face, left shoulder, and left side of outfit.",
        "side-right": "45° to the right - Person rotated 45 degrees to their right (your left when looking at them). You can see part of their face profile and right side of their body.",
        "right": "90° to the right - Full right profile view. Person is sideways showing their complete right side. You can see their right ear, right side of face, right shoulder, and right side of outfit.",
        "back": "180° - Person facing away from camera, showing their full back view. You can see the back of their head, back of their outfit, and rear view."
    }
    
    angle_instruction = angle_definitions.get(angle, f"{angle} view")
    
    # Maximum detail prompt with facial feature preservation
    base_prompt = f"""🎯 CRITICAL INSTRUCTION: Generate ONLY a {angle.upper()} camera angle rotation of the EXACT SAME PERSON.

📐 ANGLE SPECIFICATION:
{angle_instruction}

⚠️ ABSOLUTE REQUIREMENTS - ZERO TOLERANCE FOR CHANGES:

1. FACIAL IDENTITY (MUST BE IDENTICAL):
   - EXACT same face shape and bone structure
   - EXACT same eye shape, color, and spacing
   - EXACT same nose shape and size
   - EXACT same mouth shape and lip thickness
   - EXACT same eyebrow shape and thickness
   - EXACT same skin tone (no lighter/darker)
   - EXACT same facial hair (if present)
   - EXACT same age appearance
   - EXACT same gender
   - EXACT same ethnicity
   - EXACT same facial proportions

2. HAIR (MUST BE IDENTICAL):
   - EXACT same hair color
   - EXACT same hairstyle
   - EXACT same hair length
   - EXACT same hair texture

3. BODY (MUST BE IDENTICAL):
   - EXACT same height
   - EXACT same body build
   - EXACT same skin tone on all visible skin
   - EXACT same posture

4. OUTFIT (MUST BE IDENTICAL):
   - EXACT same clothing item
   - EXACT same colors and patterns
   - EXACT same fabric and texture
   - EXACT same fit and draping
   - EXACT same accessories

5. ENVIRONMENT (MUST BE IDENTICAL):
   - EXACT same background
   - EXACT same lighting direction and intensity
   - EXACT same floor/ground
   - EXACT same atmosphere

6. WHAT TO CHANGE:
   - ONLY the camera viewing angle to {angle.upper()}
   - Rotate the person's body to show the {angle} view as defined above
   - Everything else stays EXACTLY the same

✅ VERIFICATION: After generation, the person must be instantly recognizable as the EXACT SAME INDIVIDUAL. If someone saw both images, they should say "that's the same person from a different angle" not "that's a different person in similar clothes".

💡 IMPORTANT: This is a CAMERA ROTATION, not generating a new person. Think of it as rotating a camera around a statue - the statue doesn't change, only the viewing angle changes."""
    
    # Add color context if available from cached metadata
    if cached_metadata and cached_metadata.get('dominantColors'):
        colors = cached_metadata['dominantColors']
        colors_str = ', '.join(colors[:3]) if isinstance(colors, list) else str(colors)
        return f"{base_prompt}\n\nREFERENCE DATA:\n- Outfit colors: {colors_str}\n- These MUST be preserved exactly in the {angle} view\n- Use this as verification that you're showing the same person"
    
    return base_prompt


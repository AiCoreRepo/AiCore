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
    
    # ULTRA-STRICT prompt to prevent cropping and zooming
    base_prompt = f"""🚨 CRITICAL INSTRUCTION: Generate the EXACT SAME PERSON from a {angle.upper()} camera angle.

📐 ANGLE SPECIFICATION:
{angle_instruction}

🚫 ABSOLUTELY FORBIDDEN - DO NOT DO THESE:
❌ DO NOT ZOOM IN on the person
❌ DO NOT CROP the image closer
❌ DO NOT cut off the head or feet
❌ DO NOT make the person bigger in the frame
❌ DO NOT change the camera distance
❌ DO NOT focus only on upper body
❌ DO NOT change facial features
❌ DO NOT change the person's identity

✅ MANDATORY REQUIREMENTS:

1. FULL BODY VISIBILITY (NON-NEGOTIABLE):
   ⚠️ SHOW THE ENTIRE PERSON FROM HEAD TO FEET
   ⚠️ Include space above the head (at least 10% of image height)
   ⚠️ Include space below the feet (at least 10% of image height)
   ⚠️ Include space on both sides (at least 10% of image width each side)
   ⚠️ The person should occupy approximately 60-70% of the image height
   ⚠️ NEVER let the person fill more than 80% of the frame
   ⚠️ Keep the same distance - imagine a camera on a tripod rotating around the person

2. FRAMING & COMPOSITION (CRITICAL):
   - Maintain WIDE SHOT framing (not medium shot, not close-up)
   - Keep the SAME zoom level as the original
   - Keep the SAME camera distance (approximately 6-8 feet away)
   - Show FULL LENGTH body shot
   - Include background context around the person
   - DO NOT fill the entire frame with just the person
   - Leave breathing room on all sides

3. FACIAL IDENTITY (MUST BE 100% IDENTICAL):
   - EXACT same face (not similar, EXACT)
   - EXACT same skin tone
   - EXACT same facial features
   - EXACT same age
   - EXACT same gender
   - EXACT same ethnicity
   - If you change the face even slightly, this is WRONG

4. BODY & OUTFIT (MUST BE IDENTICAL):
   - EXACT same body build and height
   - EXACT same clothing and colors
   - EXACT same accessories
   - EXACT same posture

5. ENVIRONMENT (MUST BE IDENTICAL):
   - EXACT same background
   - EXACT same lighting
   - EXACT same floor/ground

6. WHAT TO CHANGE (ONLY THIS):
   - ONLY rotate the camera viewing angle to {angle.upper()}
   - Show the person from the {angle} side
   - Keep everything else EXACTLY the same

🎯 REFERENCE EXAMPLE:
Think of this like a product photography turntable:
- The person stands still on a platform
- The camera rotates around them at a FIXED DISTANCE
- The camera stays at the SAME HEIGHT
- The camera stays the SAME DISTANCE away
- The ENTIRE PERSON remains visible from head to toe
- There is space around the person in the frame

⚠️ FINAL CHECK BEFORE GENERATING:
1. Can you see the person's HEAD? ✓
2. Can you see the person's FEET? ✓
3. Is there space ABOVE the head? ✓
4. Is there space BELOW the feet? ✓
5. Is there space on BOTH SIDES? ✓
6. Is the person the SAME SIZE in the frame? ✓
7. Is it the EXACT SAME FACE? ✓

If ANY of these checks fail, DO NOT GENERATE. Start over.

💡 REMEMBER: This is NOT a portrait photo. This is a FULL BODY fashion shot showing the complete outfit from head to toe with proper framing."""
    
    # Add color context if available from cached metadata
    if cached_metadata and cached_metadata.get('dominantColors'):
        colors = cached_metadata['dominantColors']
        colors_str = ', '.join(colors[:3]) if isinstance(colors, list) else str(colors)
        return f"{base_prompt}\n\n📊 REFERENCE DATA:\n- Outfit colors: {colors_str}\n- These colors MUST be preserved exactly\n- Use this to verify you're showing the same person\n- If colors don't match, you generated the wrong image"
    
    return base_prompt


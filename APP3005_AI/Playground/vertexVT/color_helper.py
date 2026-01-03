"""
Ultra-minimal token strategy.
Model analyzes colors visually - no config sent.
"""

# Single-word angles
ANGLES = ["front", "left", "right", "back", "side-left", "side-right"]

class ColorSelector:
    """Minimal angle rotator."""
    def __init__(self):
        self.idx = 0
    
    def get_next_angle(self) -> str:
        """Rotate through angles."""
        angle = ANGLES[self.idx % len(ANGLES)]
        self.idx += 1
        return angle

_selector = ColorSelector()

def generate_angle_prompt(angle: str = None, **kwargs) -> str:
    """
    Angle generation with NEW aesthetic background.
    
    Args:
        angle: Optional specific angle, auto-rotates if None
    
    Returns:
        Prompt for angle with new complementary background
    """
    if not angle:
        angle = _selector.get_next_angle()
    
    # Create new aesthetic background for each angle
    return f"Show {angle} view. Analyze outfit colors and create complementary aesthetic background."

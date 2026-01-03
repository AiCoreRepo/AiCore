"""
Test examples for color configuration system.
Demonstrates how to use the color-aware angle generation.
"""

from color_helper import ColorSelector, generate_angle_prompt


def test_basic_usage():
    """Test basic color selection without parameters."""
    print("=== Test 1: Basic Auto-Rotation ===")
    for i in range(3):
        prompt = generate_angle_prompt()
        print(f"Call {i+1}: {prompt}\n")


def test_skin_tone_selection():
    """Test color selection with different skin tones."""
    print("\n=== Test 2: Skin Tone Selection ===")
    
    for skin_tone in ["warm", "cool", "neutral"]:
        prompt = generate_angle_prompt(skin_tone=skin_tone)
        print(f"{skin_tone.capitalize()} skin tone: {prompt}\n")


def test_background_types():
    """Test different background types."""
    print("\n=== Test 3: Background Types ===")
    
    backgrounds = ["light", "dark", "greenery", "beach", "colorful_urban"]
    for bg in backgrounds:
        prompt = generate_angle_prompt(background_type=bg)
        print(f"{bg.capitalize()}: {prompt}\n")


def test_genz_palettes():
    """Test Gen-Z aesthetic palettes."""
    print("\n=== Test 4: Gen-Z Palettes ===")
    
    styles = ["dopamine", "pastel", "monochrome"]
    for style in styles:
        prompt = generate_angle_prompt(use_genz_palette=True, genz_style=style)
        print(f"{style.capitalize()}: {prompt}\n")


def test_specific_angles():
    """Test specific camera angles."""
    print("\n=== Test 5: Specific Angles ===")
    
    angles = ["front view", "side profile left", "back view"]
    for angle in angles:
        prompt = generate_angle_prompt(angle=angle, background_type="studio")
        print(f"{angle}: {prompt}\n")


def test_api_request_examples():
    """Show example API request payloads."""
    print("\n=== Test 6: API Request Examples ===")
    
    examples = [
        {
            "name": "Auto-rotation (default)",
            "payload": {
                "previous_image": "<base64_image>",
                "additional_params": {}
            }
        },
        {
            "name": "Warm skin tone with beach background",
            "payload": {
                "previous_image": "<base64_image>",
                "additional_params": {
                    "skin_tone": "warm",
                    "background_type": "beach"
                }
            }
        },
        {
            "name": "Gen-Z dopamine aesthetic",
            "payload": {
                "previous_image": "<base64_image>",
                "additional_params": {
                    "use_genz_palette": True,
                    "genz_style": "dopamine"
                }
            }
        },
        {
            "name": "Specific angle with custom background",
            "payload": {
                "previous_image": "<base64_image>",
                "additional_params": {
                    "angle": "three-quarter view left",
                    "background_type": "cafe",
                    "skin_tone": "cool"
                }
            }
        },
        {
            "name": "Custom prompt (override color system)",
            "payload": {
                "previous_image": "<base64_image>",
                "additional_params": {
                    "prompt": "Your custom prompt here"
                }
            }
        }
    ]
    
    for example in examples:
        print(f"\n{example['name']}:")
        print(f"Payload: {example['payload']}")


def test_color_selector_class():
    """Test ColorSelector class directly."""
    print("\n=== Test 7: ColorSelector Class ===")
    
    selector = ColorSelector()
    
    # Test skin tone colors
    print("Warm skin tone colors:", selector.select_colors_by_skin_tone("warm"))
    print("Cool skin tone colors:", selector.select_colors_by_skin_tone("cool"))
    
    # Test background and color selection
    selection = selector.select_background_and_colors("beach", "warm")
    print(f"\nBeach + Warm skin:")
    print(f"  Background: {selection['background_description']}")
    print(f"  Clothing color: {selection['clothing_color']}")
    
    # Test Gen-Z palette
    clothing, bg = selector.get_genz_palette("dopamine")
    print(f"\nDopamine palette: {clothing} clothing, {bg} background")


if __name__ == "__main__":
    print("🎨 Color Configuration System Test Suite\n")
    print("=" * 60)
    
    test_basic_usage()
    test_skin_tone_selection()
    test_background_types()
    test_genz_palettes()
    test_specific_angles()
    test_color_selector_class()
    test_api_request_examples()
    
    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("\nUsage Summary:")
    print("- No params: Auto-rotates angles and backgrounds")
    print("- skin_tone: warm/cool/neutral for color compatibility")
    print("- background_type: light/dark/greenery/beach/urban/studio/cafe")
    print("- use_genz_palette: True for Gen-Z aesthetics")
    print("- genz_style: dopamine/pastel/monochrome")
    print("- angle: Specific camera angle")
    print("- prompt: Custom prompt (overrides color system)")

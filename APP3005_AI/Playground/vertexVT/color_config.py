"""
Color configuration for dynamic background and clothing selection in virtual try-on.
Optimized for Gen-Z aesthetics and skin tone compatibility.
"""

FACE_BACKGROUND_COLOR_CONFIG = {
    "skin_tone": {
        "warm": ["mustard", "olive", "rust", "teal", "warm_red", "cream"],
        "cool": ["cobalt_blue", "emerald", "lavender", "black", "white", "cool_gray"],
        "neutral": ["navy", "maroon", "peach", "brown", "white", "black"]
    },

    "background_type": {
        "light": {
            "avoid": ["white", "cream", "beige"],
            "prefer": ["black", "navy", "red", "emerald", "royal_blue"]
        },
        "dark": {
            "avoid": ["black", "navy"],
            "prefer": ["white", "mint", "peach", "yellow", "sky_blue"]
        },
        "greenery": {
            "avoid": ["green", "olive"],
            "prefer": ["red", "pink", "yellow", "white", "black"]
        },
        "beach": {
            "avoid": ["beige", "tan"],
            "prefer": ["blue", "teal", "black", "maroon"]
        },
        "colorful_urban": {
            "prefer": ["black", "white", "gray"],
        }
    },

    "genz_palettes": {
        "dopamine": [
            ("hot_pink", "black"),
            ("neon_green", "charcoal"),
            ("electric_blue", "white"),
            ("orange", "navy")
        ],
        "pastel": [
            ("lavender", "cream"),
            ("mint", "beige"),
            ("baby_blue", "white"),
            ("peach", "off_white")
        ],
        "monochrome": [
            ("black", "black"),
            ("white", "white"),
            ("gray", "black"),
            ("brown", "cream")
        ]
    },

    "fallback_rules": {
        "same_as_background": "increase_contrast",
        "too_low_contrast_face": "darken_clothing",
        "busy_background": "prefer_neutral",
        "night_scene": "avoid_dark_colors"
    }
}

# Angle variations for diverse try-on images
ANGLE_VARIATIONS = [
    "front view",
    "slight left turn",
    "slight right turn",
    "side profile left",
    "side profile right",
    "three-quarter view left",
    "three-quarter view right",
    "back view"
]

# Background settings mapped to descriptive prompts
BACKGROUND_SETTINGS = {
    "light": "bright, well-lit indoor setting with soft natural light",
    "dark": "moody, dimly lit environment with dramatic lighting",
    "greenery": "outdoor garden or park with lush green plants",
    "beach": "coastal beach setting with sand and ocean",
    "colorful_urban": "vibrant urban street with colorful graffiti walls",
    "studio": "clean professional photography studio with neutral backdrop",
    "cafe": "cozy modern cafe interior",
    "minimalist": "minimalist white room with clean lines"
}

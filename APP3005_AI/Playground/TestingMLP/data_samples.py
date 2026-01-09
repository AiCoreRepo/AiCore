from __future__ import annotations

from typing import Dict, List

from matching import ClothingItem, PersonAttributes

CLOTHING_CATALOG: Dict[str, ClothingItem] = {
    "navy_wedding_suit": ClothingItem(
        id="navy_wedding_suit",
        title="Navy Wool Wedding Suit",
        description_lines=[
            "Midnight navy wool suit with satin notch lapel.",
            "Tailored lining keeps the look sharp for formal vows.",
        ],
        event_focus="wedding",
    ),
    "charcoal_interview_blazer": ClothingItem(
        id="charcoal_interview_blazer",
        title="Charcoal Interview Blazer",
        description_lines=[
            "Charcoal stretch blazer with crisp darts and light shoulder padding.",
            "Pairs with tapered trousers for an interview-ready silhouette.",
        ],
        event_focus="interview",
    ),
    "emerald_party_dress": ClothingItem(
        id="emerald_party_dress",
        title="Emerald Satin Party Dress",
        description_lines=[
            "Emerald satin midi dress with a soft drape and waist tie.",
            "Bias-cut skirt that moves under party lights.",
        ],
        event_focus="party",
    ),
    "linen_beach_set": ClothingItem(
        id="linen_beach_set",
        title="Sand Linen Beach Set",
        description_lines=[
            "Sand linen shirt and drawstring trousers with rolled cuffs.",
            "Open weave keeps things breathable for beach evenings.",
        ],
        event_focus="beach",
    ),
    "athleisure_set": ClothingItem(
        id="athleisure_set",
        title="Graphite Athleisure Set",
        description_lines=[
            "Graphite performance hoodie and tapered joggers with stretch.",
            "Moisture-wicking knit made for casual days and travel.",
        ],
        event_focus="casual",
    ),
    "black_cocktail_dress": ClothingItem(
        id="black_cocktail_dress",
        title="Black Cocktail Dress",
        description_lines=[
            "Black cocktail dress with structured bodice and clean neckline.",
            "Subtle shimmer makes it pop for night events.",
        ],
        event_focus="party",
    ),
    "pastel_daydress": ClothingItem(
        id="pastel_daydress",
        title="Pastel Day Dress",
        description_lines=[
            "Powder blue day dress with elastic waist and pockets.",
            "Soft cotton designed for daytime weddings and brunches.",
        ],
        event_focus="wedding",
    ),
    "tech_fleece_jacket": ClothingItem(
        id="tech_fleece_jacket",
        title="Tech Fleece Layer",
        description_lines=[
            "Lightweight tech fleece with bonded seams and drop-in pockets.",
            "Streamlined layer for commutes and relaxed offices.",
        ],
        event_focus="casual",
    ),
}


TRAINING_DATA: List[dict] = [
    {"person": PersonAttributes("tall", "athletic", "medium", "wedding"), "clothing_id": "navy_wedding_suit", "label": 1},
    {"person": PersonAttributes("short", "curvy", "light", "wedding"), "clothing_id": "navy_wedding_suit", "label": 1},
    {"person": PersonAttributes("average", "slim", "medium", "wedding"), "clothing_id": "pastel_daydress", "label": 1},
    {"person": PersonAttributes("short", "curvy", "medium", "casual"), "clothing_id": "pastel_daydress", "label": 1},
    {"person": PersonAttributes("average", "slim", "light", "interview"), "clothing_id": "charcoal_interview_blazer", "label": 1},
    {"person": PersonAttributes("tall", "broad", "deep", "interview"), "clothing_id": "charcoal_interview_blazer", "label": 1},
    {"person": PersonAttributes("average", "athletic", "medium", "party"), "clothing_id": "emerald_party_dress", "label": 1},
    {"person": PersonAttributes("short", "slim", "deep", "party"), "clothing_id": "emerald_party_dress", "label": 1},
    {"person": PersonAttributes("tall", "athletic", "medium", "party"), "clothing_id": "black_cocktail_dress", "label": 1},
    {"person": PersonAttributes("average", "curvy", "deep", "party"), "clothing_id": "black_cocktail_dress", "label": 1},
    {"person": PersonAttributes("average", "athletic", "medium", "beach"), "clothing_id": "linen_beach_set", "label": 1},
    {"person": PersonAttributes("tall", "broad", "light", "beach"), "clothing_id": "linen_beach_set", "label": 1},
    {"person": PersonAttributes("average", "athletic", "light", "casual"), "clothing_id": "athleisure_set", "label": 1},
    {"person": PersonAttributes("short", "slim", "medium", "casual"), "clothing_id": "athleisure_set", "label": 1},
    {"person": PersonAttributes("average", "athletic", "medium", "interview"), "clothing_id": "tech_fleece_jacket", "label": 0},
    {"person": PersonAttributes("tall", "athletic", "medium", "wedding"), "clothing_id": "athleisure_set", "label": 0},
    {"person": PersonAttributes("average", "curvy", "light", "beach"), "clothing_id": "charcoal_interview_blazer", "label": 0},
    {"person": PersonAttributes("short", "slim", "deep", "interview"), "clothing_id": "emerald_party_dress", "label": 0},
    {"person": PersonAttributes("tall", "broad", "light", "casual"), "clothing_id": "black_cocktail_dress", "label": 0},
    {"person": PersonAttributes("average", "athletic", "medium", "party"), "clothing_id": "charcoal_interview_blazer", "label": 0},
    {"person": PersonAttributes("short", "curvy", "deep", "beach"), "clothing_id": "navy_wedding_suit", "label": 0},
    {"person": PersonAttributes("tall", "broad", "light", "interview"), "clothing_id": "linen_beach_set", "label": 0},
    {"person": PersonAttributes("average", "slim", "light", "casual"), "clothing_id": "navy_wedding_suit", "label": 0},
]

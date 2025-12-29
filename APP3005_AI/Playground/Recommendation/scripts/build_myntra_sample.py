from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd


CSV_PATH = Path("archive/myntradataset/styles.csv")
OUTPUT_PATH = Path("data/catalog_myntra_50.json")

COLOR_MAP: Dict[str, str] = {
    "black": "#000000",
    "white": "#ffffff",
    "grey": "#808080",
    "gray": "#808080",
    "blue": "#1b2a44",
    "navy": "#1b2a44",
    "red": "#c62828",
    "maroon": "#800000",
    "green": "#2e7d32",
    "olive": "#3d9970",
    "yellow": "#f4d03f",
    "beige": "#f5f5dc",
    "brown": "#6d4c41",
    "pink": "#ec407a",
    "purple": "#7b1fa2",
    "orange": "#ef6c00",
}


def hash_embedding(text: str, dim: int = 16) -> List[float]:
    """Deterministic pseudo-embedding from text using SHA256."""
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    # Use first dim*2 bytes to form dim 16-bit integers
    ints = []
    for i in range(dim):
        two_bytes = digest[2 * i : 2 * i + 2]
        if len(two_bytes) < 2:
            two_bytes = two_bytes.ljust(2, b"\x00")
        val = int.from_bytes(two_bytes, byteorder="big", signed=False)
        ints.append(val)
    arr = np.array(ints, dtype=np.float32)
    arr = arr - arr.mean()
    arr = arr / (arr.std() + 1e-6)
    arr = arr / 3.0  # narrow to roughly [-1, 1]
    return [round(float(x), 4) for x in arr.tolist()]


def build_sample() -> None:
    df = pd.read_csv(CSV_PATH, on_bad_lines="skip")
    df = df.dropna(subset=["productDisplayName", "baseColour"])
    df = df.head(50)

    records = []
    for _, row in df.iterrows():
        base_colour = str(row["baseColour"]).strip().lower()
        primary_hex = COLOR_MAP.get(base_colour, "#808080")
        display_name = str(row["productDisplayName"]).strip()
        record = {
            "item_id": f"myntra-{int(row['id'])}",
            "category": str(row.get("masterCategory", "")).strip().lower(),
            "sub_category": str(row.get("subCategory", "")).strip().lower(),
            "article_type": str(row.get("articleType", "")).strip().lower(),
            "fit_type": "regular",
            "fabric_type": "unspecified",
            "pattern": "unspecified",
            "primary_color_hex": primary_hex,
            "base_colour": base_colour,
            "season": str(row.get("season", "")).strip(),
            "year": int(row.get("year", 0)),
            "usage": str(row.get("usage", "")).strip().lower(),
            "product_display_name": display_name,
            "vector_embedding": hash_embedding(display_name),
        }
        records.append(record)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(records, indent=2))
    print(f"Wrote {len(records)} items to {OUTPUT_PATH}")


if __name__ == "__main__":
    build_sample()

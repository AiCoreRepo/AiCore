#!/usr/bin/env python3
"""
Prepare a fusion MLP training CSV from main_train_data.csv.

Outputs:
- training_main.csv (full dataset)
- training_main_train.csv (train split)
- training_main_test.csv (test split)
"""
from __future__ import annotations

import argparse
import math
from itertools import islice, product
from pathlib import Path
from typing import Iterable, List

import numpy as np
import pandas as pd

SIZE_ALIASES = {
    "xs": "xs",
    "x-small": "xs",
    "xsmall": "xs",
    "extra small": "xs",
    "s": "small",
    "sm": "small",
    "small": "small",
    "m": "medium",
    "md": "medium",
    "medium": "medium",
    "l": "large",
    "lg": "large",
    "large": "large",
    "xl": "xl",
    "extra large": "xl",
    "xxl": "xxl",
    "2xl": "xxl",
}

BODY_SHAPE_ALIASES = {
    "pear shape": "pear",
    "apple shape": "apple",
    "inverted triangle": "inverted_triangle",
}

OCCASION_ALIASES = {
    "casual luxury": "casual_luxury",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert main_train_data.csv to fusion training format and split 70/30."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("main_train_data.csv"),
        help="Source CSV (main_train_data.csv).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("training_main.csv"),
        help="Output CSV in fusion training format.",
    )
    parser.add_argument(
        "--train-output",
        type=Path,
        default=Path("training_main_train.csv"),
        help="Train split output CSV.",
    )
    parser.add_argument(
        "--test-output",
        type=Path,
        default=Path("training_main_test.csv"),
        help="Test split output CSV.",
    )
    parser.add_argument(
        "--split",
        type=float,
        default=0.7,
        help="Train split fraction (default 0.7).",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for split.")
    parser.add_argument(
        "--max-combos",
        type=int,
        default=50,
        help="Max attribute combinations per row.",
    )
    parser.add_argument(
        "--no-expand",
        action="store_true",
        help="Do not expand size/body_shape/skin_tone combinations.",
    )
    return parser.parse_args()


def _split_list(value: object) -> List[str]:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return []
    raw = str(value)
    raw = raw.replace(";", ",").replace("/", ",")
    parts = [p.strip() for p in raw.split(",")]
    return [p for p in parts if p]


def _clean_text(value: object) -> str | None:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "<na>"}:
        return None
    return text


def _is_url(value: str) -> bool:
    return value.startswith(("http://", "https://"))


def _age_from_range(value: object) -> float | None:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    cleaned = str(value).strip()
    if not cleaned:
        return None
    if "+" in cleaned:
        try:
            base = float(cleaned.replace("+", "").strip())
        except ValueError:
            return None
        return max(base, base + 4.0)
    if "-" in cleaned:
        parts = cleaned.replace("–", "-").split("-")
        if len(parts) != 2:
            return None
        try:
            low = float(parts[0].strip())
            high = float(parts[1].strip())
        except ValueError:
            return None
        return (low + high) / 2.0
    try:
        return float(cleaned)
    except ValueError:
        return None


def _normalize_size(value: str) -> str:
    cleaned = value.strip().lower()
    cleaned = cleaned.replace(" ", "")
    return SIZE_ALIASES.get(cleaned, cleaned)


def _normalize_body_shape(value: str) -> str:
    cleaned = value.strip().lower().replace("_", " ").replace("-", " ")
    cleaned = BODY_SHAPE_ALIASES.get(cleaned, cleaned)
    return cleaned.replace(" ", "_")


def _normalize_skin_tone(value: str) -> str:
    return value.strip().lower()


def _normalize_occasion(value: str) -> str:
    cleaned = value.strip().lower().replace("_", " ")
    cleaned = OCCASION_ALIASES.get(cleaned, cleaned)
    return cleaned.replace(" ", "_")


def _build_rows(df: pd.DataFrame, base_dir: Path, max_combos: int, expand: bool) -> pd.DataFrame:
    rows = []
    for _, row in df.iterrows():
        image_url = _clean_text(row.get("image_url"))
        image_path = _clean_text(row.get("Image"))
        image_value = image_url or image_path
        if not image_value:
            continue

        description = _clean_text(row.get("Description")) or ""
        if not description:
            continue

        score_raw = row.get("Score")
        try:
            score = float(score_raw)
        except (TypeError, ValueError):
            continue
        if score < 0 or score > 1:
            continue

        age = _age_from_range(row.get("@Age Group"))
        if age is None:
            age = 25.0

        occasions = _split_list(row.get("@Occasion"))
        occasions = occasions or [""]
        occasions = [_normalize_occasion(o) for o in occasions if o]

        sizes = _split_list(row.get("@Recommended size"))
        sizes = sizes or [""]
        sizes = [_normalize_size(s) for s in sizes if s]

        shapes = _split_list(row.get("@Recommended Body shape"))
        shapes = shapes or [""]
        shapes = [_normalize_body_shape(s) for s in shapes if s]

        tones = _split_list(row.get("@Skin tone"))
        tones = tones or [""]
        tones = [_normalize_skin_tone(t) for t in tones if t]

        if not occasions or not sizes or not shapes or not tones:
            continue

        if not _is_url(image_value):
            img_path = Path(image_value)
            if not img_path.is_absolute():
                candidate = base_dir / img_path
                if candidate.exists():
                    image_value = str(candidate)

        combo_iter: Iterable[tuple[str, str, str, str]]
        if expand:
            combo_iter = islice(product(occasions, shapes, tones, sizes), max_combos)
        else:
            combo_iter = [(occasions[0], shapes[0], tones[0], sizes[0])]

        for occ, shape, tone, size in combo_iter:
            rows.append(
                {
                    "age": age,
                    "size": size,
                    "body_shape": shape,
                    "skin_tone": tone,
                    "occasion": occ,
                    "cloth_description": description,
                    "image_path": image_value,
                    "score": score,
                }
            )
    return pd.DataFrame(rows)


def _split_train_test(df: pd.DataFrame, split: float, seed: int) -> tuple[pd.DataFrame, pd.DataFrame]:
    if split <= 0 or split >= 1:
        raise ValueError("Split must be between 0 and 1.")
    rng = np.random.default_rng(seed)
    indices = rng.permutation(len(df))
    split_idx = int(round(len(df) * split))
    train_idx = indices[:split_idx]
    test_idx = indices[split_idx:]
    return df.iloc[train_idx].reset_index(drop=True), df.iloc[test_idx].reset_index(drop=True)


def main() -> None:
    args = parse_args()
    src_path = args.input
    if not src_path.exists():
        raise FileNotFoundError(f"Input CSV not found: {src_path}")

    df = pd.read_csv(src_path)
    base_dir = src_path.resolve().parent
    out_df = _build_rows(
        df,
        base_dir=base_dir,
        max_combos=args.max_combos,
        expand=not args.no_expand,
    )
    if out_df.empty:
        raise ValueError("No rows generated for fusion training.")

    out_df.to_csv(args.output, index=False)
    train_df, test_df = _split_train_test(out_df, split=args.split, seed=args.seed)
    train_df.to_csv(args.train_output, index=False)
    test_df.to_csv(args.test_output, index=False)

    print(f"Saved full dataset: {args.output} ({len(out_df)} rows)")
    print(f"Saved train split: {args.train_output} ({len(train_df)} rows)")
    print(f"Saved test split: {args.test_output} ({len(test_df)} rows)")


if __name__ == "__main__":
    main()

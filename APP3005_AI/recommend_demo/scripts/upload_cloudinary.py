"""
Upload local images to Cloudinary and write back image URLs for Excel/Sheets.

Example:
  python scripts/upload_cloudinary.py \
    --input collection2_test.xlsx \
    --output collection2_cloudinary.xlsx \
    --image-key image \
    --folder fashion-annotator
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Iterable, List, Tuple

import pandas as pd

try:
    import cloudinary
    import cloudinary.uploader
except ImportError as exc:  # pragma: no cover
    raise RuntimeError(
        "Missing dependency: cloudinary. Install with `pip install cloudinary`."
    ) from exc


REQUIRED_ENV = ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Upload local images to Cloudinary and save URLs for Excel/Sheets."
    )
    parser.add_argument("--input", "-i", type=Path, required=True)
    parser.add_argument("--output", "-o", type=Path, default=None)
    parser.add_argument("--image-key", type=str, default="image")
    parser.add_argument("--url-key", type=str, default="image_url")
    parser.add_argument("--root", type=Path, default=None)
    parser.add_argument("--folder", type=str, default=None)
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--replace-image", action="store_true")
    parser.add_argument("--max-rows", type=int, default=0)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def _progress(iterable: Iterable, desc: str):
    try:
        import tqdm  # type: ignore

        return tqdm.tqdm(iterable, desc=desc)
    except Exception:
        return iterable


def _load_records(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            if "data" in data and isinstance(data["data"], list):
                data = data["data"]
            elif "records" in data and isinstance(data["records"], list):
                data = data["records"]
        if not isinstance(data, list):
            raise ValueError("JSON data must be a list of objects.")
        return pd.DataFrame(data)
    if suffix in {".jsonl", ".ndjson"}:
        rows = []
        with path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                rows.append(json.loads(line))
        return pd.DataFrame(rows)
    if suffix in {".xlsx", ".xls"}:
        try:
            return pd.read_excel(path)
        except ImportError as exc:  # pragma: no cover
            hint = "openpyxl" if suffix == ".xlsx" else "xlrd"
            raise RuntimeError(
                f"{hint} is required to read {suffix} files. "
                f"Install with `pip install {hint}`."
            ) from exc
    return pd.read_csv(path)


def _write_records(df: pd.DataFrame, output_path: Path) -> None:
    suffix = output_path.suffix.lower()
    if suffix == ".json":
        output_path.write_text(
            json.dumps(df.to_dict(orient="records"), indent=2),
            encoding="utf-8",
        )
        return
    if suffix in {".jsonl", ".ndjson"}:
        with output_path.open("w", encoding="utf-8") as f:
            for record in df.to_dict(orient="records"):
                f.write(json.dumps(record))
                f.write("\n")
        return
    if suffix in {".xlsx", ".xls"}:
        try:
            import openpyxl  # type: ignore  # noqa: F401
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError(
                "openpyxl is required to write .xlsx files. Use .csv instead."
            ) from exc
        df.to_excel(output_path, index=False)
        return
    df.to_csv(output_path, index=False)


def _configure_cloudinary() -> None:
    missing = [name for name in REQUIRED_ENV if not os.getenv(name)]
    if missing:
        raise RuntimeError(
            "Missing Cloudinary env vars: "
            + ", ".join(missing)
            + ". Set them before running."
        )
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    )


def _looks_like_url(value: str) -> bool:
    return value.startswith("http://") or value.startswith("https://")


def _resolve_path(raw: str, root: Path) -> Path:
    if raw.startswith("file://"):
        raw = raw[7:]
    path = Path(raw)
    if not path.is_absolute():
        path = root / path
    return path


def _upload_image(path: Path, folder: str | None) -> str:
    options = {"resource_type": "image"}
    if folder:
        options["folder"] = folder
    result = cloudinary.uploader.upload(str(path), **options)
    if not result or "secure_url" not in result:
        raise RuntimeError("Cloudinary upload failed.")
    return str(result["secure_url"])


def _get_indices(df: pd.DataFrame, max_rows: int) -> List[int]:
    indices = df.index.tolist()
    if max_rows and max_rows > 0:
        return indices[:max_rows]
    return indices


def _has_value(value) -> bool:
    if pd.isna(value):
        return False
    return bool(str(value).strip())


def _process_rows(
    df: pd.DataFrame,
    image_key: str,
    url_key: str,
    root: Path,
    folder: str | None,
    overwrite: bool,
    replace_image: bool,
    max_rows: int,
    dry_run: bool,
) -> Tuple[int, int, int, List[str]]:
    uploaded = 0
    skipped = 0
    missing = 0
    errors: List[str] = []
    cache: dict[str, str] = {}

    for idx in _progress(_get_indices(df, max_rows), "Uploading images"):
        raw_value = df.at[idx, image_key]
        if not _has_value(raw_value):
            missing += 1
            continue
        raw_str = str(raw_value).strip()

        if _looks_like_url(raw_str):
            if overwrite or not _has_value(df.at[idx, url_key]):
                df.at[idx, url_key] = raw_str
            if replace_image:
                df.at[idx, image_key] = raw_str
            skipped += 1
            continue

        if not overwrite and _has_value(df.at[idx, url_key]):
            skipped += 1
            continue

        resolved = _resolve_path(raw_str, root)
        if not resolved.is_file():
            missing += 1
            errors.append(f"Missing file: {resolved}")
            continue

        cache_key = str(resolved)
        if cache_key in cache:
            url = cache[cache_key]
        elif dry_run:
            url = f"DRY_RUN:{resolved}"
        else:
            try:
                url = _upload_image(resolved, folder)
            except Exception as exc:  # pragma: no cover
                errors.append(f"Upload failed for {resolved}: {exc}")
                continue
            cache[cache_key] = url

        df.at[idx, url_key] = url
        if replace_image:
            df.at[idx, image_key] = url
        uploaded += 1

    return uploaded, skipped, missing, errors


def main() -> None:
    args = parse_args()
    input_path = args.input
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    df = _load_records(input_path)
    if args.image_key not in df.columns:
        raise ValueError(f"Missing image column: {args.image_key}")
    if args.url_key not in df.columns:
        df[args.url_key] = ""

    root = args.root or input_path.parent
    if args.output:
        output_path = args.output
    else:
        suffix = input_path.suffix.lower()
        output_suffix = ".xlsx" if suffix in {".xlsx", ".xls"} else ".csv"
        output_path = input_path.with_name(
            f"{input_path.stem}_cloudinary{output_suffix}"
        )

    if not args.dry_run:
        _configure_cloudinary()

    uploaded, skipped, missing, errors = _process_rows(
        df=df,
        image_key=args.image_key,
        url_key=args.url_key,
        root=root,
        folder=args.folder,
        overwrite=args.overwrite,
        replace_image=args.replace_image,
        max_rows=args.max_rows,
        dry_run=args.dry_run,
    )

    _write_records(df, output_path)

    print(
        "Done. Uploaded: "
        f"{uploaded}, Skipped: {skipped}, Missing: {missing}, "
        f"Errors: {len(errors)}"
    )
    if errors:
        print("First 5 errors:")
        for err in errors[:5]:
            print(f"- {err}")


if __name__ == "__main__":
    main()

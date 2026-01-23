"""
Upload local PNGs from a directory to Cloudinary, sequentially.

Example:
  python scripts/upload_cloudinary_folder.py \
    --input-dir data/images \
    --pattern "*.png" \
    --folder fashion-annotator \
    --output uploads.json
"""
from __future__ import annotations

import argparse
import csv
import json
import os
from pathlib import Path
from typing import Iterable, List

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
        description="Upload PNGs from a directory to Cloudinary sequentially."
    )
    parser.add_argument("--input-dir", "-i", type=Path, required=True)
    parser.add_argument("--pattern", type=str, default="*.png")
    parser.add_argument("--recursive", action="store_true")
    parser.add_argument("--output", "-o", type=Path, default=None)
    parser.add_argument("--folder", type=str, default=None)
    parser.add_argument("--max-files", type=int, default=0)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--env", type=Path, default=None)
    parser.add_argument("--no-env", action="store_true")
    return parser.parse_args()


def _progress(iterable: Iterable, desc: str):
    try:
        import tqdm  # type: ignore

        return tqdm.tqdm(iterable, desc=desc)
    except Exception:
        return iterable


def _load_env_file(path: Path) -> None:
    if not path.is_file():
        raise FileNotFoundError(f".env file not found: {path}")
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export ") :].strip()
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key or key in os.environ:
            continue
        if value and value[0] in {"'", '"'} and value[-1] == value[0]:
            value = value[1:-1]
        os.environ[key] = value


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


def _upload_image(path: Path, folder: str | None) -> str:
    options = {"resource_type": "image"}
    if folder:
        options["folder"] = folder
    result = cloudinary.uploader.upload(str(path), **options)
    if not result or "secure_url" not in result:
        raise RuntimeError("Cloudinary upload failed.")
    return str(result["secure_url"])


def _iter_files(input_dir: Path, pattern: str, recursive: bool) -> List[Path]:
    if recursive:
        candidates = input_dir.rglob(pattern)
    else:
        candidates = input_dir.glob(pattern)
    files = [path for path in candidates if path.is_file()]
    files.sort(key=lambda path: str(path))
    return files


def _write_output(results: List[dict], output_path: Path) -> None:
    suffix = output_path.suffix.lower()
    if suffix == ".json":
        output_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
        return
    if suffix in {".jsonl", ".ndjson"}:
        with output_path.open("w", encoding="utf-8") as f:
            for record in results:
                f.write(json.dumps(record))
                f.write("\n")
        return
    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["path", "url"])
        writer.writeheader()
        writer.writerows(results)


def main() -> None:
    args = parse_args()
    input_dir = args.input_dir
    if not input_dir.is_dir():
        raise NotADirectoryError(f"Input directory not found: {input_dir}")

    env_path = None if args.no_env else args.env
    if env_path is None and not args.no_env:
        default_env = Path(".env")
        if default_env.is_file():
            env_path = default_env
    if env_path:
        _load_env_file(env_path)

    if not args.dry_run:
        _configure_cloudinary()

    files = _iter_files(input_dir, args.pattern, args.recursive)
    if args.max_files and args.max_files > 0:
        files = files[: args.max_files]

    if not files:
        print(f"No files matched {args.pattern} in {input_dir}")
        return

    results: List[dict] = []
    errors: List[str] = []

    for path in _progress(files, "Uploading images"):
        if not path.is_file():
            errors.append(f"Missing file: {path}")
            continue
        if args.dry_run:
            url = f"DRY_RUN:{path}"
        else:
            try:
                url = _upload_image(path, args.folder)
            except Exception as exc:  # pragma: no cover
                errors.append(f"Upload failed for {path}: {exc}")
                continue
        results.append({"path": str(path), "url": url})

    if args.output:
        _write_output(results, args.output)
    else:
        for row in results:
            print(f"{row['path']}\t{row['url']}")

    print(f"Done. Uploaded: {len(results)}, Errors: {len(errors)}")
    if errors:
        print("First 5 errors:")
        for err in errors[:5]:
            print(f"- {err}")


if __name__ == "__main__":
    main()

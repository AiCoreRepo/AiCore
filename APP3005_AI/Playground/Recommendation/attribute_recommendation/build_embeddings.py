from __future__ import annotations

import argparse
import importlib.util
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_COLLECTION = BASE_DIR / "collection.json"
DEFAULT_OUTPUT = BASE_DIR / "embedded_collection.json"


def load_embedding_module():
    """Load the shared embedding utilities from ModelDemo/embedding.py."""
    module_path = BASE_DIR.parents[2] / "ModelDemo" / "embedding.py"
    if not module_path.exists():
        raise FileNotFoundError(f"Could not find embedding.py at {module_path}")

    spec = importlib.util.spec_from_file_location("attribute_embedding", module_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load spec for {module_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules["attribute_embedding"] = module
    spec.loader.exec_module(module)
    return module


def parse_args():
    parser = argparse.ArgumentParser(
        description="Rebuild embeddings for the attribute-based recommender catalog."
    )
    parser.add_argument(
        "--input",
        default=str(DEFAULT_COLLECTION),
        help="Path to the collection JSON to embed.",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="Where to write the embedded catalog JSON.",
    )
    parser.add_argument(
        "--model",
        default="ViT-B/32",
        help="CLIP vision model name used for embeddings.",
    )
    parser.add_argument(
        "--image-root",
        default=None,
        help="Optional base directory for resolving image paths (defaults to the collection directory).",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    module = load_embedding_module()

    module.build_embedded_catalog(
        catalog_path=args.input,
        output_path=args.output,
        image_root=args.image_root,
        model_name=args.model,
    )
    print(f"✅ Wrote embeddings to {args.output}")


if __name__ == "__main__":
    main()

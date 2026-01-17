"""
Build a FAISS index over garment images to enable fast retrieval.

Input can be CSV or JSON.
Required fields:
- garment_path
Optional: garment_id, age_group, gender, height, skin_tone, body_shape

Outputs (artifacts/):
- garment_embs.npy
- garment_ids.npy
- garment_meta.json
- garment_index.faiss
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List

import faiss
import numpy as np
import pandas as pd
import tqdm


try:
    import clip  # type: ignore
    import torch
except ImportError as exc:  # pragma: no cover
    raise RuntimeError("Install dependencies first (uv sync).") from exc


def parse_args():
    parser = argparse.ArgumentParser(description="Build garment FAISS index from CSV.")
    parser.add_argument("--data", type=Path, default=Path("data/garments.csv"))
    parser.add_argument("--artifacts", type=Path, default=Path("artifacts"))
    parser.add_argument("--clip-model", type=str, default="ViT-B/32")
    parser.add_argument("--path-key", type=str, default="garment_path")
    parser.add_argument("--id-key", type=str, default="garment_id")
    return parser.parse_args()


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
    return pd.read_csv(path)


def load_items(path: Path, path_key: str, id_key: str) -> pd.DataFrame:
    df = _load_records(path)
    rename = {}
    if path_key in df.columns and "garment_path" not in df.columns:
        rename[path_key] = "garment_path"
    if id_key in df.columns and "garment_id" not in df.columns:
        rename[id_key] = "garment_id"
    if rename:
        df = df.rename(columns=rename)
    if "garment_path" not in df.columns:
        raise ValueError("Missing required garment_path column.")
    return df


def preprocess_image(path: str, preprocess):
    from PIL import Image

    img = Image.open(path).convert("RGB")
    return preprocess(img).unsqueeze(0)


def embed_garments(paths: List[str], model, preprocess, device: str):
    out: Dict[str, np.ndarray] = {}
    unique = sorted(set(paths))
    for p in tqdm.tqdm(unique, desc="Embedding garments"):
        tensor = preprocess_image(p, preprocess)
        with torch.no_grad():
            emb = model.encode_image(tensor.to(device))
            emb = emb / emb.norm(dim=-1, keepdim=True)
        out[p] = emb.cpu().numpy().astype("float32")[0]
    return out


def main():
    args = parse_args()
    df = load_items(args.data, path_key=args.path_key, id_key=args.id_key)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = clip.load(args.clip_model, device=device)
    model.eval()

    embs = embed_garments(df.garment_path.tolist(), model, preprocess, device)

    ids = []
    metas = []
    for _, row in df.iterrows():
        gid = str(row.get("garment_id") or row.garment_path)
        if gid in ids:
            continue
        ids.append(gid)
        meta = {"id": gid, "image_path": row.garment_path}
        for key in ["age_group", "gender", "height", "skin_tone", "body_shape"]:
            if key in row and not pd.isna(row[key]):
                meta[key] = str(row[key])
        metas.append(meta)

    emb_array = np.stack([embs[row.garment_path] for _, row in df.drop_duplicates("garment_path").iterrows()])
    index = faiss.IndexFlatIP(emb_array.shape[1])
    index.add(emb_array)

    args.artifacts.mkdir(parents=True, exist_ok=True)
    np.save(args.artifacts / "garment_embs.npy", emb_array.astype("float32"))
    np.save(args.artifacts / "garment_ids.npy", np.array(ids))
    with (args.artifacts / "garment_meta.json").open("w", encoding="utf-8") as f:
        json.dump(metas, f, indent=2)
    faiss.write_index(index, str(args.artifacts / "garment_index.faiss"))
    print(f"Saved FAISS index to {args.artifacts / 'garment_index.faiss'}")


if __name__ == "__main__":
    main()

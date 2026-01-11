"""
Lightweight inference helper for the compatibility recommender.

Expected artifacts (produce via scripts/build_garment_index.py and scripts/train.py):
- artifacts/garment_index.faiss : FAISS index of garment embeddings
- artifacts/garment_embs.npy    : raw garment embeddings (float32, L2-normalized)
- artifacts/garment_ids.npy     : item ids aligned with embeddings
- artifacts/garment_meta.json   : metadata dicts aligned with embeddings
- artifacts/compat_mlp.pt       : optional trained MLP weights
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

import faiss
import numpy as np
import torch
from PIL import Image


try:
    import clip  # type: ignore
except ImportError as exc:  # pragma: no cover - handled at runtime
    raise RuntimeError(
        "CLIP is missing. Install dependencies via `uv sync` or pip before running."
    ) from exc


def _load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


class CompatibilityMLP(torch.nn.Module):
    """Small MLP on concatenated person/garment embeddings."""

    def __init__(self, in_dim: int, hidden: int = 512, dropout: float = 0.1):
        super().__init__()
        self.net = torch.nn.Sequential(
            torch.nn.Linear(in_dim, hidden),
            torch.nn.ReLU(),
            torch.nn.Dropout(dropout),
            torch.nn.Linear(hidden, hidden // 2),
            torch.nn.ReLU(),
            torch.nn.Dropout(dropout),
            torch.nn.Linear(hidden // 2, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return torch.sigmoid(self.net(x)).squeeze(-1)


@dataclass
class Recommendation:
    item_id: str
    score: float
    metadata: Dict


class Recommender:
    def __init__(
        self,
        artifacts_dir: Path = Path("artifacts"),
        clip_model: str = "ViT-B/32",
        device: Optional[str] = None,
        use_mlp: bool = True,
    ):
        self.artifacts_dir = artifacts_dir
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model, self.preprocess = clip.load(clip_model, device=self.device)
        self.model.eval()

        self.index = self._load_index()
        self.garment_embs = self._load_garment_embs()
        self.garment_ids = np.load(self.artifacts_dir / "garment_ids.npy")
        self.garment_meta = _load_json(self.artifacts_dir / "garment_meta.json")
        self.mlp = self._load_mlp(use_mlp)

    def _load_index(self) -> faiss.Index:
        index_path = self.artifacts_dir / "garment_index.faiss"
        if not index_path.exists():
            raise FileNotFoundError(
                f"Missing {index_path}. Run scripts/build_garment_index.py first."
            )
        return faiss.read_index(str(index_path))

    def _load_garment_embs(self) -> np.ndarray:
        path = self.artifacts_dir / "garment_embs.npy"
        if path.exists():
            return np.load(path)
        # fallback to reconstruct from FAISS index
        total = self.index.ntotal
        return np.array([self.index.reconstruct(i) for i in range(total)], dtype="float32")

    def _load_mlp(self, use_mlp: bool) -> Optional[CompatibilityMLP]:
        weights = self.artifacts_dir / "compat_mlp.pt"
        if not use_mlp or not weights.exists():
            return None

        in_dim = self.garment_embs.shape[1] * 2
        mlp = CompatibilityMLP(in_dim=in_dim)
        mlp.load_state_dict(torch.load(weights, map_location=self.device))
        mlp.to(self.device)
        mlp.eval()
        return mlp

    def embed_image(self, file) -> np.ndarray:
        image = Image.open(file).convert("RGB")
        with torch.no_grad():
            tensor = self.preprocess(image).unsqueeze(0).to(self.device)
            emb = self.model.encode_image(tensor)
            emb = emb / emb.norm(dim=-1, keepdim=True)
        return emb.cpu().numpy().astype("float32")

    def _filter_mask(self, attrs: Dict[str, Optional[str]]) -> np.ndarray:
        if not attrs:
            return np.ones(len(self.garment_meta), dtype=bool)
        mask = np.ones(len(self.garment_meta), dtype=bool)
        for key, val in attrs.items():
            if not val:
                continue
            mask &= np.array([meta.get(key) == val for meta in self.garment_meta], dtype=bool)
        return mask

    def recommend(
        self,
        person_image,
        attrs: Optional[Dict[str, Optional[str]]] = None,
        top_k: int = 5,
        pool_size: int = 50,
    ) -> List[Recommendation]:
        person_emb = self.embed_image(person_image)
        mask = self._filter_mask(attrs or {})
        if mask.sum() == 0:
            mask = np.ones_like(mask)

        filtered_embs = self.garment_embs[mask]
        filtered_ids = self.garment_ids[mask]
        filtered_meta = [m for m, keep in zip(self.garment_meta, mask) if keep]

        # Lightweight ANN over the filtered set
        sub_index = faiss.IndexFlatIP(filtered_embs.shape[1])
        sub_index.add(filtered_embs)
        sims, idxs = sub_index.search(person_emb, min(pool_size, len(filtered_embs)))

        sims = sims[0]
        idxs = idxs[0]
        scores = sims

        if self.mlp:
            person_rep = torch.from_numpy(np.repeat(person_emb, len(idxs), axis=0)).to(self.device)
            garment_rep = torch.from_numpy(filtered_embs[idxs]).to(self.device)
            feats = torch.cat([person_rep, garment_rep], dim=1)
            with torch.no_grad():
                scores = self.mlp(feats).cpu().numpy()

        ordering = np.argsort(-scores)[:top_k]
        results: List[Recommendation] = []
        for rank in ordering:
            idx = idxs[rank]
            results.append(
                Recommendation(
                    item_id=str(filtered_ids[idx]),
                    score=float(scores[rank]),
                    metadata=filtered_meta[idx],
                )
            )
        return results

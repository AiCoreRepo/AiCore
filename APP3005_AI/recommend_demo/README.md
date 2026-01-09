# Compatibility Recommender (folder-based labeler)

Lightweight Streamlit app to collect labeled pairs for training later. Point to a folder of person images and a folder of garment images; the app walks person × garment and you mark “Looks good / Not good.” Each label appends to `data/pairs.csv`. Heavy ML dependencies are removed to keep builds fast.

## What’s included
- `app/main.py` folder-based labeler UI.
- `docker-compose.yml` + `Dockerfile` to run the labeler via `docker compose up --build`.
- Training/recommender code remains (`scripts/train.py`, `app/recommender.py`) but is not active without heavy deps.

## Dependencies (light)
Streamlit, Pillow, pandas, scikit-learn (declared in `pyproject.toml`).

## Run locally
```bash
uv sync
uv run streamlit run app/main.py
```

## Docker
```bash
docker compose up --build
```
Open http://localhost:8505. The container mounts `./data` and `./artifacts`.

## Data format
`data/pairs.csv` rows: `person_path,garment_path,label` where `label` is `1` (looks good) or `0` (not good). Paths refer to files in your person/garment folders.

You can also provide JSON as a list of objects with the same keys, for example:
```json
[
  {
    "person_path": "data/uploads/persons/user1.jpg",
    "garment_path": "data/uploads/garments/top1.jpg",
    "label": 1
  }
]
```

## Tabular MLP training
For `data/train.csv` (height/shape/skin/age/occasion + clothing description + label), run:
```bash
uv run python scripts/train_tabular_mlp.py --data data/train.csv --artifacts artifacts
```
This writes `artifacts/tabular_mlp.joblib` and `artifacts/tabular_mlp_metrics.json`.
You can also trigger training, run a quick single-row prediction, and score a JSON collection from the Streamlit UI under **Train tabular MLP**, **Test tabular MLP**, and **Recommend from collection JSON** (works in Docker too).

## Single-image MLP training
If you have a single image per look (person wearing the outfit), you can train on CLIP embeddings with an MLP:
```bash
uv run python scripts/train_image_mlp.py --data data/pairs.json --artifacts artifacts
```
Expected JSON fields: `image_path` and `label` (0-1). If your labels are 1-5, add `--label-max 5`.

Example:
```json
[
  {
    "id": "look-001",
    "image_path": "data/uploads/looks/look1.jpg",
    "label": 0.8
  }
]
```

## Fusion MLP (attributes + text + image)
For a CSV with user attributes, cloth description, and a person image, run:
```bash
uv run python scripts/train_fusion_mlp.py --data data/fusion_train.csv --artifacts artifacts
```
Expected columns:
- `age`
- `size`
- `body_shape`
- `skin_tone`
- `cloth_description`
- `image_path`
- `score` (0-1)

This script uses a frozen BERT encoder for text, CLIP for images, and an MLP fusion head.
It requires heavier deps (torch, transformers, openai-clip).

## To enable training later
Add heavy deps (torch/torchvision/faiss/clip, etc.) back to `pyproject.toml` and rebuild. The existing training/recommender scripts will then work.

# Fusion MLP Recommender Demo

Streamlit app for training and scoring a multimodal fusion MLP that combines attributes,
text embeddings, and image embeddings.

## What's included
- `app/main.py`: Streamlit UI for fusion MLP training + recommendation.
- `scripts/train_fusion_mlp.py`: CLI training for the fusion MLP.
- `docker-compose.yml` + `Dockerfile` to run the demo via Docker.

## Run locally
```bash
uv sync
uv run streamlit run app/main.py
```

## Fusion MLP (attributes + text + image)
Training CSV columns:
- `age`
- `size`
- `body_shape`
- `skin_tone`
- `occasion`
- `cloth_description` (or `clothing_description`)
- `image_path`
- `score` (0-1)

CLI training:
```bash
uv run python scripts/train_fusion_mlp.py --data training.csv --artifacts artifacts
```

The Streamlit UI includes:
- **Train fusion MLP**
- **Recommend from fashion collection (fusion)**

## Notes on heavy deps
Fusion training requires torch, sentence-transformers, and open_clip_torch. CPU wheels are
used in this repo. If you install locally, set:
```
UV_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu
```

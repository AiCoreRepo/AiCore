# Attribute-driven Recommendation Demo

A small Streamlit demo that scores outfits with both CLIP style similarity and lightweight attribute heuristics (age, gender, body type, height, skin tone).

## What's inside
- `collection.json`: catalog metadata (no embeddings) for 48 looks pulled from the women's fashion set.
- `embedded_collection.json`: precomputed embeddings for the same items (every other item from the full set to stay lightweight).
- `build_embeddings.py`: helper to regenerate the embedded catalog from the collection file.
- `app.py`: Streamlit UI to collect attributes and return the top matches.

## Run the UI
```bash
cd AiCore/APP3005_AI/Playground/Recommendation
uv sync  # installs streamlit/clip/torch/etc. from pyproject.toml
uv run streamlit run attribute_recommendation/app.py
```
- **Preview collection** button shows the first dozen catalog rows.
- **Build/Rebuild embeddings** button writes `embedded_collection.json` from `collection.json`. It first tries the shared `ModelDemo/embedding.py` pipeline; if that file isn't present in the container it falls back to a minimal CLIP-only embedding pass (skin/palette matching works best with the full pipeline because it adds `color_vector`).
- **Load embeddings** button refreshes the in-memory catalog from an existing `embedded_collection.json`.
- **Browse & preview collection** expander lets you pick any item and see its image/attributes before running recommendations.

Use the sidebar to pick gender, age, height, body type (thin/medium/curvy), and skin tone palette. The app:
1) Builds a CLIP text embedding from your profile,
2) Scores the catalog's style embeddings against it,
3) Adds heuristic boosts/penalties for silhouette-length-body fit and a hex-based palette match against an Indian skin-tone preset,
4) Shows the best items with images and fit notes (skin-match strength is displayed).

## Rebuild embeddings (optional)
If you change `collection.json` or want a different CLIP backbone:
```bash
cd AiCore/APP3005_AI/Playground/Recommendation
uv run python attribute_recommendation/build_embeddings.py \
  --input attribute_recommendation/collection.json \
  --output attribute_recommendation/embedded_collection.json \
  --model ViT-B/32
```
Images are referenced relative to the `attribute_recommendation` folder (e.g., `../women fashion/...`), so keep that layout or pass `--image-root` when embedding.

## Docker (uv) + docker-compose
Build and run with the provided uv-based image and compose file:
```bash
cd AiCore/APP3005_AI/Playground/Recommendation
docker compose up --build
```
This uses the root `Dockerfile` (uv base) and starts Streamlit at http://localhost:8501 running `attribute_recommendation/app.py`.

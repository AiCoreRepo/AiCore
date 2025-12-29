# Recommendation Pipeline — Step 1 (Image Validation)

Streamlit app for the first stage of the image-only recommendation pipeline: check that an uploaded photo is front-facing and full-body before downstream processing.

## Run
```bash
uv sync
uv run streamlit run app.py
```

## Notes
- The current detector is a stub; replace `stub_orientation_and_body_detection` in `app.py` with your ONNX/TensorRT model call.
- Thresholds are configurable in the UI so you can tune pass/fail behavior without code changes.

## Embedding the catalog
Use the embedding script to populate `vector_embedding` fields with OpenCLIP:

```bash
cd AiCore/APP3005_AI/Playground/Recommendation
uv sync --group embed
uv run python scripts/embed_catalog.py --catalog data/catalog_sample.json --image-root data/images --output data/catalog_with_embeddings.json
```

- Expects each item to have `image_path` relative to `image-root`. Falls back to text embeddings when images are missing (disable with `--no-text-fallback`).
- Customize model/checkpoint via `--model` / `--pretrained`; defaults to `ViT-H-14` / `laion2b_s32b_b79k`.

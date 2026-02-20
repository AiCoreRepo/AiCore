# Streamlit Avatar + Virtual Try-On (Standalone Bundle)

Self-contained copy of the Streamlit app so you can copy/paste this folder elsewhere and run it.

## What's inside
- `src/streamlit_app.py` — the full app (avatar + Gemini try-on + Vertex try-on).
- `pyproject.toml` — dependencies (`streamlit`, `google-genai`, `google-cloud-aiplatform`).

## Run
```bash
uv sync
uv run streamlit run src/streamlit_app.py
```

## Auth & configuration
- Gemini: set `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) in your env or type it into the UI.
- Vertex try-on: set `GOOGLE_CLOUD_PROJECT` / `GOOGLE_CLOUD_REGION` in env to prefill, and provide credentials via ADC (`GOOGLE_APPLICATION_CREDENTIALS` pointing to a service account JSON or `gcloud auth application-default login`) or upload a service account JSON in the UI.

## Copy/paste
Copy the whole `streamlit_bundle/` folder to any machine, run the commands above, and it should work as-is.
# AiCore uv run uvicorn api:app --host 0.0.0.0 --port 8000 --reload
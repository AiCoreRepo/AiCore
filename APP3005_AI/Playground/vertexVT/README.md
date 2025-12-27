# Vertex AI Virtual Try-On (Streamlit)

Streamlit UI to call the Vertex AI virtual try-on model: upload one person image and one garment image, then render the generated try-on result returned by the Vertex API.

## Setup (uv + pyproject.toml)

```bash
uv sync
uv run streamlit run app.py
```

If you prefer pip/venv, use `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt` then `streamlit run app.py`.

- Make sure you are authenticated with gcloud (`gcloud auth application-default login`).
- Optionally set `VERTEX_TOKEN` or `ACCESS_TOKEN` if you prefer to pass a token via environment instead of letting the app call `gcloud auth print-access-token`.

## Using the app

1. Fill in your `Project ID`, `Location` (e.g., `us-central1`), and `Model ID` (e.g., `virtualtryon@001`).
2. Upload a person image and a garment image.
3. Adjust optional parameters (watermark, steps, seed, MIME type, etc.).
4. Click **Generate try-on image** to call the Vertex predict endpoint and view the response plus any returned images.

The app automatically base64-encodes the uploaded images and POSTs to:
`https://LOCATION-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/LOCATION/publishers/google/models/MODEL_ID:predict`.

direct command gemini vt
cd AiCore/APP3005_AI/Playground/"Gemini 2.5"
uv sync
uv run streamlit run src/streamlit_app.py

direct virtual vertex vt 
cd AiCore/APP3005_AI/Playground/vertexVT
uv sync
uv run streamlit run app.py

To run Vertex VT alongside the Gemini app, launch it on a different port (e.g., 8502):

```bash
cd AiCore/APP3005_AI/Playground/vertexVT
uv sync
uv run streamlit run app.py --server.port 8502
```

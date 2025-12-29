# Vertex AI Virtual Try-On (Streamlit)

Streamlit UI to call the Vertex AI virtual try-on model: upload one person image and one garment image, then render the generated try-on result returned by the Vertex API.

## Setup (uv + pyproject.toml)

```bash
uv sync
uv run streamlit run app.py
```

If you prefer pip/venv, use `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt` then `streamlit run app.py`.

- Make sure you are authenticated with gcloud (`gcloud auth application-default login`).
- Optionally set `VERTEX_TOKEN` if you prefer to pass a token via environment instead of letting the app call `gcloud auth print-access-token`.

## Using the app

1. Fill in your `Project ID`, `Location` (e.g., `us-central1`), and `Model ID` (e.g., `virtualtryon@001`).
2. Upload a person image and a garment image.
3. Adjust optional parameters (watermark, steps, seed, MIME type, etc.).
4. Click **Generate try-on image** to call the Vertex predict endpoint and view the response plus any returned images.

The app automatically base64-encodes the uploaded images and POSTs to:
`https://LOCATION-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/LOCATION/publishers/google/models/MODEL_ID:predict`.

## FastAPI backend (JPEG in → base64 out)

Run locally (uv):

```bash
uv sync  # or pip install -r requirements.txt
uv run uvicorn api:app --host 0.0.0.0 --port 8000
```

Auth via env:

```bash
cp .env.example .env
# set VERTEX_TOKEN, VERTEX_PROJECT_ID, VERTEX_MODEL_ID, and optionally VERTEX_LOCATION
# quickest way: VERTEX_TOKEN=$(gcloud auth print-access-token) and paste into .env
uv run uvicorn api:app --reload --port 8000
```

Single-shot run (env + server) in one line:

```bash
VERTEX_TOKEN=$(gcloud auth print-access-token) \
VERTEX_PROJECT_ID=project-e849184b-cc5d-4f74-93b \
VERTEX_MODEL_ID=virtual-try-on-preview-08-04 \
VERTEX_LOCATION=us-central1 \
GEMINI_API_KEY=your-gemini-key \
uv run uvicorn api:app --host 0.0.0.0 --port 8000
```

### Gemini 2.5 Flash endpoint

Env: set `GEMINI_API_KEY` (from Google AI Studio) plus the Vertex envs above if you’re also using Vertex.

```bash
uv sync
uv run uvicorn api:app --host 0.0.0.0 --port 8000
```

Curl:

```bash
curl -X POST http://localhost:8000/gemini/try-on \
  -F "person_image=@avatar.jpg;type=image/jpeg" \
  -F "garment_image=@garment.jpg;type=image/jpeg" \
  -F "prompt=Put the clothing from the second image onto the person in the first image."
```
(API key comes from `GEMINI_API_KEY` in the environment; no header needed.)

Sample curl:

```bash
curl -X POST http://localhost:8000/vertex/try-on \
  -F "person_image=@avatar.jpg;type=image/jpeg" \
  -F "garment_image=@garment.jpg;type=image/jpeg"
```

## Run with Docker (uses uv inside the image)

```bash
docker build -t vertex-vt-api .
docker run --rm -p 8000:8000 --env-file .env vertex-vt-api
```

## Run with Docker Compose

```bash
cp .env.example .env   # add your VERTEX_TOKEN, VERTEX_PROJECT_ID, VERTEX_MODEL_ID
docker compose up --build
```

API docs will be available at `http://localhost:8000/docs`.

If you see dependency downloads each build, make sure Docker BuildKit is enabled (default on recent Docker). The Dockerfile uses a cache mount so package wheels are reused across builds as long as `requirements.txt` doesn't change.

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

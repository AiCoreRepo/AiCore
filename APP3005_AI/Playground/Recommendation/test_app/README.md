# Streamlit Test App

Minimal Streamlit app that loads an embedding JSON file and shows a short summary.

## Run with uv
```bash
uv sync
uv run streamlit run test.py
```

## Run with Docker
```bash
docker build -t streamlit-test-app .
docker run --rm -p 8501:8501 streamlit-test-app
```

## Run with Docker Compose
```bash
docker compose up --build
```

## Notes
- The app defaults to `data/embedded_selected.json`. Update the path in the UI to load other files.

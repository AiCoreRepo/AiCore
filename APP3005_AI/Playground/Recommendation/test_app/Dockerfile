# Use Astral's uv image for fast installs across platforms.
FROM ghcr.io/astral-sh/uv:python3.11-bookworm

WORKDIR /app

COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system -r requirements.txt

COPY test.py ./
COPY data ./data

EXPOSE 8501

CMD ["streamlit", "run", "test.py", "--server.address=0.0.0.0", "--server.port=8501"]

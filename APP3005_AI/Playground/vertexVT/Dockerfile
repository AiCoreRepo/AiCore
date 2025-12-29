# Use Astral's uv image for fast installs across platforms.
FROM ghcr.io/astral-sh/uv:python3.11-bookworm

WORKDIR /app

# Build essentials for any wheels that need compilation.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies with uv (cache wheel downloads between builds).
COPY requirements.txt uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system -r requirements.txt

# App source
COPY api.py app.py README.md pyproject.toml uv.lock ./
COPY .env.example .env.example

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]

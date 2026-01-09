FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_HTTP_TIMEOUT=300

RUN apt-get update && apt-get install -y --no-install-recommends git libglib2.0-0 libgl1 libgomp1 && rm -rf /var/lib/apt/lists/*

ENV UV_VERSION=0.4.20
RUN pip install "uv==${UV_VERSION}"
# Preinstall build backend deps to avoid timeouts during uv sync
RUN pip install --no-cache-dir setuptools wheel

WORKDIR /app

COPY pyproject.toml ./
COPY README.md ./
COPY app ./app
COPY scripts ./scripts
# Optional: include artifacts if already built locally
COPY artifacts ./artifacts

RUN uv sync --no-dev

EXPOSE 8505
EXPOSE 8898

CMD ["uv", "run", "streamlit", "run", "app/main.py", "--server.port=8505", "--server.address=0.0.0.0"]

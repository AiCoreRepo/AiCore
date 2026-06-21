# syntax=docker/dockerfile:1.7
# ──────────────────────────────────────────────────────────────────────────────
# Body Analyzer — Python 3.11 + FastAPI + MediaPipe
#
# Build context: repo root (AiCore/)
# Usage in CD:   file: infra/docker/body-analyzer/Dockerfile
#                context: .
#
# Source: APP3005_AI/Playground/vertexVT/
#   • body_analyzer_api.py  — FastAPI app entry point
#   • body_analyzer.py      — Core body measurement logic
#   • models/               — Pre-trained MediaPipe model files
#   • requirements.body-analyzer.txt
#
# Security:
#   • Non-root user (appuser)
#   • No secrets baked in — all env vars come from Kubernetes Secret at runtime
#   • PYTHONDONTWRITEBYTECODE avoids .pyc clutter
# ──────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# ── System dependencies ───────────────────────────────────────────────────────
# libglib2.0-0, libgl1  → required by OpenCV / MediaPipe
# libgomp1             → OpenMP runtime for mediapipe's native extensions
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libgl1 \
        libgomp1; \
    rm -rf /var/lib/apt/lists/*

# ── Python dependencies ───────────────────────────────────────────────────────
# Copy requirements first — layer is cached unless requirements file changes.
COPY APP3005_AI/Playground/vertexVT/requirements.body-analyzer.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ── Application source ────────────────────────────────────────────────────────
COPY APP3005_AI/Playground/vertexVT/body_analyzer_api.py ./
COPY APP3005_AI/Playground/vertexVT/body_analyzer.py ./
COPY APP3005_AI/Playground/vertexVT/body_analyzer_helpers.py ./
COPY APP3005_AI/Playground/vertexVT/models ./models

# ── Runtime config ────────────────────────────────────────────────────────────
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# ── Non-root user ─────────────────────────────────────────────────────────────
# Fixed numeric uid/gid (10001) so Kubernetes can enforce runAsNonRoot.
RUN groupadd -r -g 10001 appgroup \
    && useradd -r -u 10001 -g appgroup -s /sbin/nologin appuser \
    && chown -R appuser:appgroup /app
USER appuser

EXPOSE 8898

HEALTHCHECK --interval=20s --timeout=10s --start-period=30s --retries=5 \
  CMD python -c \
    "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8898/health')" \
    || exit 1

CMD ["uvicorn", "body_analyzer_api:app", "--host", "0.0.0.0", "--port", "8898"]

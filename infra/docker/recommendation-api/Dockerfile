# syntax=docker/dockerfile:1.7
# ──────────────────────────────────────────────────────────────────────────────
# Recommendation API — Python 3.10 + FastAPI + PyTorch (CPU) + CLIP
#
# Build context: repo root (AiCore/)
# Usage in CD:   file: infra/docker/recommendation-api/Dockerfile
#                context: .
#
# Source: APP3005_AI/recommend_demo/
#   • app/             — FastAPI application (fusion_api.py entry point)
#   • scripts/         — Training helpers (needed at import time by the app)
#   • artifacts/       — Pre-built model artifacts (embeddings, weights)
#   • main_train_data.csv — Training data used at startup for recommendations
#   • requirements.api.txt — PyTorch CPU + CLIP + transformers
#
# NOTE: This is the HEAVIEST image (~3-4 GB) due to PyTorch + CLIP.
#       GHA layer cache (scope=recommendation-api) makes rebuilds fast
#       when only Python app code changes — the torch layer stays cached.
#
# Security:
#   • Non-root user
#   • HTTPS PyPI mirrors (already in requirements.api.txt from existing Dockerfile)
#   • No secrets baked in
# ──────────────────────────────────────────────────────────────────────────────
FROM python:3.10-slim AS runtime

WORKDIR /app

# ── Runtime env ───────────────────────────────────────────────────────────────
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Force CPU-only PyTorch wheels (avoids pulling 6 GB CUDA packages)
ENV PIP_INDEX_URL=https://pypi.org/simple
ENV PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu

# ── System dependencies ───────────────────────────────────────────────────────
# Use HTTPS mirrors (Debian Bookworm switched, older images may still use HTTP)
RUN set -eux; \
    if [ -f /etc/apt/sources.list ]; then \
      sed -i \
        's|http://deb.debian.org|https://deb.debian.org|g; \
         s|http://security.debian.org|https://security.debian.org|g' \
        /etc/apt/sources.list; \
    fi; \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      sed -i \
        's|http://deb.debian.org|https://deb.debian.org|g; \
         s|http://security.debian.org|https://security.debian.org|g' \
        /etc/apt/sources.list.d/debian.sources; \
    fi; \
    apt-get update; \
    apt-get install -y --no-install-recommends libglib2.0-0 libgl1 libgomp1; \
    rm -rf /var/lib/apt/lists/*

# ── Python dependencies ───────────────────────────────────────────────────────
# Pre-install build backend and numpy<2.0 constraint BEFORE the heavy packages.
# This avoids numpy 2.x ABI incompatibilities with torch 2.2.0.
RUN pip install --no-cache-dir setuptools wheel
RUN pip install --no-cache-dir "numpy>=1.26.0,<2.0"

# requirements.api.txt pins:
#   torch==2.2.0+cpu, torchvision==0.17.0+cpu, transformers==4.38.2,
#   open_clip_torch, sentence-transformers, fastapi, uvicorn, pandas, scikit-learn
COPY APP3005_AI/recommend_demo/requirements.api.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ── Patch transformers accelerate import ──────────────────────────────────────
# transformers 4.38.2 has an import that conditionally references accelerate.
# This patch (from the original Dockerfile.api) makes the import safe when
# accelerate is not installed.
COPY APP3005_AI/recommend_demo/scripts/patch_transformers_accelerate.py /tmp/
RUN python /tmp/patch_transformers_accelerate.py && rm /tmp/patch_transformers_accelerate.py

# ── Application source ────────────────────────────────────────────────────────
COPY APP3005_AI/recommend_demo/pyproject.toml ./
COPY APP3005_AI/recommend_demo/README.md ./
COPY APP3005_AI/recommend_demo/app ./app
COPY APP3005_AI/recommend_demo/scripts/__init__.py ./scripts/__init__.py
COPY APP3005_AI/recommend_demo/scripts/train_fusion_mlp.py ./scripts/train_fusion_mlp.py
COPY APP3005_AI/recommend_demo/artifacts ./artifacts
COPY APP3005_AI/recommend_demo/main_train_data.csv ./

# Install the package itself (no deps — already installed above)
RUN pip install --no-cache-dir -e . --no-deps

# ── Non-root user ─────────────────────────────────────────────────────────────
# Fixed numeric uid/gid (10001) so Kubernetes can enforce runAsNonRoot.
RUN groupadd -r -g 10001 appgroup \
    && useradd -r -u 10001 -g appgroup -s /sbin/nologin appuser \
    && chown -R appuser:appgroup /app
USER appuser

ENV PORT=8799
EXPOSE 8799

# start-period=90s: CLIP model loading + CSV parsing takes ~60-90 s on cold start
HEALTHCHECK --interval=15s --timeout=10s --start-period=90s --retries=10 \
  CMD python -c \
    "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8799/openapi.json')" \
    || exit 1

CMD ["sh", "-c", "uvicorn app.fusion_api:app --host 0.0.0.0 --port ${PORT:-8799}"]

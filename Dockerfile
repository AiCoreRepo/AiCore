# syntax=docker/dockerfile:1

# =========================
# Backend (NestJS)
# =========================
FROM node:20-bullseye-slim AS backend-builder

WORKDIR /app

COPY APP3005/aivestire-backend-tmp/package*.json ./
COPY APP3005/aivestire-backend-tmp/prisma ./prisma
RUN npm install

COPY APP3005/aivestire-backend-tmp/tsconfig*.json ./
COPY APP3005/aivestire-backend-tmp/nest-cli.json ./
COPY APP3005/aivestire-backend-tmp/src ./src
RUN node ./node_modules/prisma/build/index.js generate \
    && node ./node_modules/@nestjs/cli/bin/nest.js build
RUN ls -la /app/dist

FROM node:20-bullseye-slim AS backend

WORKDIR /app

COPY APP3005/aivestire-backend-tmp/package*.json ./
COPY APP3005/aivestire-backend-tmp/prisma ./prisma
COPY APP3005/aivestire-backend-tmp/scripts ./scripts
COPY APP3005_AI/recommend_demo/main_train_data.csv /app/seed/main_train_data.csv
RUN npm install --omit=dev && npm cache clean --force
RUN npx prisma generate

COPY --from=backend-builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/main"]

# =========================
# Frontend (Vite + Nginx)
# =========================
FROM node:18-bullseye-slim AS frontend-build

WORKDIR /app

COPY APP3005/frontend/package*.json ./
ENV NGROK_SKIP_POSTINSTALL=1
RUN npm install

COPY APP3005/frontend/ .

ARG VITE_API_URL=http://localhost:3002
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

RUN npm run build

FROM nginx:1.25-alpine AS frontend

COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY APP3005/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# =========================
# AI - Body Analyzer
# =========================
FROM python:3.11-slim AS body-analyzer

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libglib2.0-0 libgl1 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY APP3005_AI/Playground/vertexVT/requirements.txt ./
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

COPY APP3005_AI/Playground/vertexVT/body_analyzer_api.py ./
COPY APP3005_AI/Playground/vertexVT/body_analyzer.py ./
COPY APP3005_AI/Playground/vertexVT/models ./models

ENV PYTHONUNBUFFERED=1

EXPOSE 8898

CMD ["uvicorn", "body_analyzer_api:app", "--host", "0.0.0.0", "--port", "8898"]

# =========================
# AI - Recommendation API
# =========================
FROM python:3.10-slim AS recommendation-api

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_HTTP_TIMEOUT=1200
ENV UV_HTTP_RETRIES=5
ENV UV_INDEX_URL=https://pypi.org/simple
ENV UV_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu
ENV PIP_INDEX_URL=https://pypi.org/simple
ENV PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu

RUN set -eux; \
    if [ -f /etc/apt/sources.list ]; then \
      sed -i 's|http://deb.debian.org|https://deb.debian.org|g; s|http://security.debian.org|https://security.debian.org|g' /etc/apt/sources.list; \
    fi; \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      sed -i 's|http://deb.debian.org|https://deb.debian.org|g; s|http://security.debian.org|https://security.debian.org|g' /etc/apt/sources.list.d/debian.sources; \
    fi; \
    apt-get update; \
    apt-get install -y --no-install-recommends git libglib2.0-0 libgl1 libgomp1; \
    rm -rf /var/lib/apt/lists/*

ENV UV_VERSION=0.4.20
RUN pip install "uv==${UV_VERSION}"
RUN pip install setuptools wheel
RUN pip install "numpy<2.0"

WORKDIR /app

COPY APP3005_AI/recommend_demo/requirements.txt ./
RUN pip install -r requirements.txt
RUN python - <<'PY'
from pathlib import Path

root = Path('/usr/local/lib')
matches = list(root.rglob('transformers/integrations/accelerate.py'))
if matches:
    path = matches[0]
    text = path.read_text(encoding='utf-8')
    if 'from __future__ import annotations\\n' in text:
        text = text.replace('from __future__ import annotations\\n', 'from __future__ import annotations\n')
        path.write_text(text, encoding='utf-8')
        print(f'Fixed escaped newline in {path}')
    elif 'from __future__ import annotations' not in text.splitlines()[:3]:
        path.write_text('from __future__ import annotations\n' + text, encoding='utf-8')
        print(f'Patched {path}')
    else:
        print(f'No patch needed for {path}')
else:
    print('transformers accelerate.py not found; skip patch')
PY

COPY APP3005_AI/recommend_demo/pyproject.toml ./
COPY APP3005_AI/recommend_demo/README.md ./
COPY APP3005_AI/recommend_demo/app ./app
COPY APP3005_AI/recommend_demo/scripts ./scripts
COPY APP3005_AI/recommend_demo/artifacts ./artifacts
COPY APP3005_AI/recommend_demo/main_train_data.csv ./

RUN pip install -e . --no-deps

ENV PORT=8799
EXPOSE 8799

CMD ["sh", "-c", "uvicorn app.fusion_api:app --host 0.0.0.0 --port ${PORT:-8799}"]

# syntax=docker/dockerfile:1.7
# ──────────────────────────────────────────────────────────────────────────────
# Frontend — Vite + React (served by nginx)
#
# Build context: repo root (AiCore/)
# Usage in CD:   file: infra/docker/frontend/Dockerfile
#                context: .
#
# Build args (passed by CD workflow, sourced from GitHub Secrets):
#   VITE_API_URL              = /api  (relative — works behind any domain)
#   VITE_GOOGLE_CLIENT_ID     = <client-side OAuth ID, not a backend secret>
#   VITE_TRY_ON_DEFAULT_PROVIDER
#   VITE_ENABLE_TRY_ON_PACK_DEV_SKIP
#
# These are baked into the compiled JS bundle at build time.
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Install deps from lockfile — cache-friendly: only reruns when package*.json changes
ENV NGROK_SKIP_POSTINSTALL=1
COPY APP3005/frontend/package*.json ./
RUN npm ci --no-audit --fund=false

# Copy all frontend source
COPY APP3005/frontend/ ./

# Declare build-time variables with safe defaults.
# Real values are injected by the CD workflow via --build-arg.
ARG VITE_API_URL=/api
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_TRY_ON_DEFAULT_PROVIDER=gemini
ARG VITE_ENABLE_TRY_ON_PACK_DEV_SKIP=false

# Expose them as ENV so Vite can pick them up during build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_TRY_ON_DEFAULT_PROVIDER=${VITE_TRY_ON_DEFAULT_PROVIDER}
ENV VITE_ENABLE_TRY_ON_PACK_DEV_SKIP=${VITE_ENABLE_TRY_ON_PACK_DEV_SKIP}

RUN npm run build

# ── Stage 2: nginx runtime ────────────────────────────────────────────────────
# nginx:1.27-alpine — alpine keeps image <50 MB, 1.27 is current stable
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config (replaces with our production config)
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx config which routes /api → backend, /ai/body → body-analyzer, etc.
COPY APP3005/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled Vite dist into nginx's html root
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/ > /dev/null 2>&1 || exit 1

# nginx.conf uses variable-based proxy_pass (for /api, /ai/*), which needs a
# runtime DNS resolver. The committed value (127.0.0.11) is Docker Compose's
# embedded DNS and does NOT exist in Kubernetes (cluster DNS is e.g. 10.43.0.10),
# so proxied requests hang. Auto-detect the real nameserver from /etc/resolv.conf
# at startup so the same image works in BOTH Docker Compose and Kubernetes.
CMD ["/bin/sh", "-c", "NS=$(awk '/^nameserver/{print $2; exit}' /etc/resolv.conf); [ -n \"$NS\" ] && sed -i \"s/127.0.0.11/$NS/g\" /etc/nginx/conf.d/default.conf; exec nginx -g 'daemon off;'"]

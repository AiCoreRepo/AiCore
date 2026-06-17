# syntax=docker/dockerfile:1.7
# ──────────────────────────────────────────────────────────────────────────────
# Backend — NestJS (Node 20)
#
# Build context: repo root (AiCore/)
# Usage in CD:   file: infra/docker/backend/Dockerfile
#                context: .
#
# Security:
#   • Non-root user (appuser) in final image
#   • Dev dependencies stripped (--omit=dev)
#   • No .env, no secrets, no service_account.json baked in
#   • DATABASE_URL placeholder only needed for prisma generate at build time
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Copy only package manifests first — this layer is cache-friendly.
# Changes to source files won't bust the npm ci layer.
COPY APP3005/aivestire-backend-tmp/package*.json ./
COPY APP3005/aivestire-backend-tmp/prisma ./prisma

# Install ALL deps (including devDeps needed for tsc / nest build)
RUN npm ci --no-audit --fund=false

# Copy compile-time files
COPY APP3005/aivestire-backend-tmp/tsconfig*.json ./
COPY APP3005/aivestire-backend-tmp/nest-cli.json ./
COPY APP3005/aivestire-backend-tmp/src ./src

# prisma generate needs a non-empty DATABASE_URL at build time only.
# This value is never used at runtime — runtime gets it from Kubernetes Secret.
ENV DATABASE_URL="postgresql://build-placeholder:x@build-placeholder:5432/build"

RUN npm run build

# ── Stage 2: Production runtime ───────────────────────────────────────────────
FROM node:20-bullseye-slim AS runtime

WORKDIR /app

# Create non-root user with a FIXED numeric uid/gid (10001). A fixed numeric id
# lets Kubernetes verify `runAsNonRoot: true` at admission — with a name-only
# USER, kubelet cannot prove the user is non-root and refuses to start the pod.
RUN groupadd -r -g 10001 appgroup \
    && useradd -r -u 10001 -g appgroup -s /sbin/nologin appuser

# Copy only what prod needs to resolve packages
COPY APP3005/aivestire-backend-tmp/package*.json ./
COPY APP3005/aivestire-backend-tmp/prisma ./prisma
COPY APP3005/aivestire-backend-tmp/scripts ./scripts
# CSV seed data used by recommendation seeder script
COPY APP3005_AI/recommend_demo/main_train_data.csv /app/seed/main_train_data.csv

# Install ONLY production deps, then generate Prisma client for runtime
RUN npm ci --omit=dev --no-audit --fund=false \
    && npx prisma generate \
    && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# ── Known workaround: Bull lazyConnect bug ────────────────────────────────────
# Bull's queue module sets lazyConnect:true which prevents the worker from
# connecting to Redis on startup. This sed removes that flag from the compiled
# output. The `|| true` prevents failure if the pattern is not found (already fixed).
RUN sed -i 's/lazyConnect: true,\?//g' /app/dist/src/queues/queue.module.js || true

# Lock down file ownership
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=10s --start-period=60s --retries=5 \
  CMD node -e \
    "require('http').get('http://localhost:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]

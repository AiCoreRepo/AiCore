# 🏗️ AiVestire — Full Infrastructure Migration Plan
## Kubernetes · ArgoCD · GitHub Actions CI/CD · Orscope Server

> **Target Server:** 94.136.189.250 (6 vCPU / 12 GB RAM / 200 GB SSD · Mumbai)  
> **Prepared By:** Senior DevOps · Based on existing `docker-compose.yml` & codebase audit  
> **Goal:** Stable, secure, single-node Kubernetes cluster with GitOps and automated CI/CD  
> **Branch Strategy:** `test` branch → triggers CI/CD pipeline  

---

## Table of Contents

1. [What We Are Running](#1-what-we-are-running)
2. [Architecture Decision Record](#2-architecture-decision-record)
3. [Docker Compose Strategy (Final, Production-Safe)](#3-docker-compose-strategy-final-production-safe)
4. [Dockerfile Strategy (Per Service, Prod-Secure)](#4-dockerfile-strategy-per-service-prod-secure)
5. [Kubernetes Setup — What Goes Where](#5-kubernetes-setup--what-goes-where)
6. [Secrets Management](#6-secrets-management)
7. [ArgoCD GitOps Setup](#7-argocd-gitops-setup)
8. [Ingress + TLS Setup](#8-ingress--tls-setup)
9. [CI/CD Plan — GitHub Actions](#9-cicd-plan--github-actions)
10. [Folder Structure](#10-folder-structure)
11. [Step-by-Step Execution Order](#11-step-by-step-execution-order)

---

## 1. What We Are Running

Our app has 6 containers. Every decision below maps to these services:

| Service | Stack | Port | Description |
| :--- | :--- | :--- | :--- |
| `frontend` | Vite + React, Node.js server | `8080` | Web UI |
| `backend` | NestJS (Node 20) | `3000` | REST API, auth, payments |
| `backend-worker` | NestJS Bull queue consumer | — | Async job processor (same image as backend) |
| `body-analyzer` | Python 3.11, FastAPI | `8898` | AI body measurement service |
| `recommendation-api` | Python 3.10, FastAPI | `8799` | AI fashion recommendation |
| `redis` | Redis 7 Alpine | `6379` | Bull queue + app cache |
| `postgres` | PostgreSQL 15 | `5432` | Primary database (local on single node) |

> **Note on Database:** We do NOT have GCP Cloud SQL in this Orscope server setup.  
> PostgreSQL will run as a **StatefulSet** with a **PersistentVolumeClaim** on the local 200 GB SSD.

---

## 2. Architecture Decision Record

These are the critical design decisions and WHY we made them.

### 2.1 What Uses StatefulSet?

| Component | Type | Reason |
| :--- | :--- | :--- |
| `postgres` | **StatefulSet** | Needs stable storage, stable DNS name, single identity |
| `redis` | **StatefulSet** | Needs stable DNS for Bull queue connections |
| `backend` | Deployment | Stateless HTTP server, scales horizontally |
| `backend-worker` | Deployment | Stateless, runs same image with different CMD |
| `frontend` | Deployment | Stateless static file server |
| `body-analyzer` | Deployment | Stateless FastAPI |
| `recommendation-api` | Deployment | Stateless FastAPI (models are baked into image) |

### 2.2 What Uses Operator?

We will NOT use any heavy operators for now (no CloudNativePG, no Redis Operator).  
Reason: Single node, 28-day trial, simplicity is priority. Direct StatefulSets give us full control.

If we scale later:
- `CloudNativePG` operator for PostgreSQL HA
- `Redis Operator` for Redis Sentinel

### 2.3 Database Choice (Critical Decision)

**PostgreSQL runs IN-CLUSTER as a StatefulSet** (not Cloud SQL — no GCP).  
- PVC: 50 GB SSD for database volume  
- Backup: `pg_dump` via CronJob to a local `/backup` directory  
- Single replica only (no HA on a single node — acceptable for 28-day trial)

### 2.4 Cloud SQL Auth Proxy

NOT used. We are on Orscope VPS, not GCP. Remove all Cloud SQL proxy references.

### 2.5 Ingress

`ingress-nginx` with self-signed TLS or Let's Encrypt (via `cert-manager`).  
Since we have a raw IP (no domain), we start with self-signed cert and add domain later.

### 2.6 Secrets — Zero Secrets in Git

- **Kubernetes Secrets** for all sensitive values (DB password, JWT, API keys)
- **Sealed Secrets** (Bitnami) to encrypt secrets before committing to git  
- `.env` files are **NEVER committed** to git  
- `docker-compose.yml` never has hardcoded values — always references env vars

---

## 3. Docker Compose Strategy (Final, Production-Safe)

### Rule: Two compose files

```
docker-compose.yml          ← Production base (no local dev ports, no .env inline)
docker-compose.dev.yml      ← Dev overrides (add port mappings, hot reload, etc.)
```

### 3.1 Production docker-compose.yml (Final Version)

**Important rules we enforce:**
1. No hardcoded secrets in the file itself
2. All values come from environment variables (set by CI/CD or a `.env` file that is NEVER committed)
3. Healthchecks on every service
4. No unnecessary port exposure (only frontend port 3005 is exposed to host)

```yaml
# docker-compose.yml  (PRODUCTION — commit this to git, no secrets inside)
# Secrets come from .env file injected by CI/CD — NEVER commit .env

services:

  db:
    image: postgres:15-alpine
    container_name: postgres-db
    command: ["postgres", "-p", "5432"]
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network
    # No host port mapping — internal only

  redis:
    image: redis:7-alpine
    container_name: redis-server
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network
    # No host port mapping — internal only

  body-analyzer:
    image: ${REGISTRY}/aivestire-body-analyzer:${IMAGE_TAG:-latest}
    container_name: body-analyzer-api
    restart: unless-stopped
    environment:
      PYTHONUNBUFFERED: "1"
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8898/health')"]
      interval: 20s
      timeout: 10s
      retries: 5
      start_period: 30s
    networks:
      - app-network

  recommendation-api:
    image: ${REGISTRY}/aivestire-recommendation-api:${IMAGE_TAG:-latest}
    container_name: recommendation-api
    environment:
      RECOMMENDATION_COLLECTION_PATH: /app/main_train_data.csv
      PORT: "8799"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8799/openapi.json')"]
      interval: 15s
      timeout: 10s
      retries: 10
      start_period: 60s
    networks:
      - app-network

  backend:
    image: ${REGISTRY}/aivestire-backend:${IMAGE_TAG:-latest}
    container_name: nest-server
    command:
      - sh
      - -c
      - "node scripts/wait-for-services.mjs && node scripts/run-migrations.mjs && node dist/src/main.js"
    env_file:
      - .env          # .env is NEVER committed. Injected by CI/CD.
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      REDIS_HOST: redis
      REDIS_PORT: "6379"
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      FASTAPI_BODY_ANALYZE_URL: http://body-analyzer:8898/body_analyze_json
      FASTAPI_RECOMMENDATION_URL: http://recommendation-api:8799/recommendation/ai-decide
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      body-analyzer:
        condition: service_started
      recommendation-api:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
      interval: 15s
      timeout: 10s
      retries: 10
      start_period: 60s
    networks:
      - app-network

  backend-worker:
    image: ${REGISTRY}/aivestire-backend:${IMAGE_TAG:-latest}
    container_name: nest-worker
    command:
      - sh
      - -c
      - "IS_WORKER_PROCESS=true node dist/src/worker/main.js"
    env_file:
      - .env
    environment:
      NODE_ENV: production
      IS_WORKER_PROCESS: "true"
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      REDIS_HOST: redis
      REDIS_PORT: "6379"
      REDIS_PASSWORD: ${REDIS_PASSWORD}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      backend:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network

  frontend:
    image: ${REGISTRY}/aivestire-frontend:${IMAGE_TAG:-latest}
    container_name: aivestire-frontend
    environment:
      BACKEND_URL: http://backend:3000
    ports:
      - "127.0.0.1:3005:8080"   # Only frontend exposed to host (via nginx reverse proxy)
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### 3.2 Why Pre-built Images in Compose (Not `build:`)

In production, compose uses **pre-built images from the registry**.  
CI/CD (GitHub Actions) builds and pushes images. Compose just pulls and runs them.  
`build:` sections are only in `docker-compose.dev.yml` for local development.

This means:
- No build happens on the production server (saves time and memory)
- Rollbacks are easy: change `IMAGE_TAG` to previous SHA and `docker compose up -d`

---

## 4. Dockerfile Strategy (Per Service, Prod-Secure)

We split the single monolithic `Dockerfile` into **individual Dockerfiles per service**.  
Each lives at `infra/docker/<service>/Dockerfile`.

### 4.1 Security Rules for All Dockerfiles

1. ✅ Non-root user in final image (`addgroup/adduser`)
2. ✅ `--omit=dev` for npm (no dev dependencies in prod image)
3. ✅ No secrets or `.env` files copied into the image
4. ✅ `.dockerignore` per service directory
5. ✅ Multi-stage builds (builder → runtime)
6. ✅ Health check in every Dockerfile

### 4.2 infra/docker/backend/Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.4
FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY APP3005/aivestire-backend-tmp/package*.json ./
COPY APP3005/aivestire-backend-tmp/prisma ./prisma
RUN npm ci --ignore-scripts
COPY APP3005/aivestire-backend-tmp/tsconfig*.json ./
COPY APP3005/aivestire-backend-tmp/nest-cli.json ./
COPY APP3005/aivestire-backend-tmp/src ./src
RUN npx prisma generate && npx nest build

FROM node:20-bullseye-slim AS runtime
WORKDIR /app
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
COPY APP3005/aivestire-backend-tmp/package*.json ./
COPY APP3005/aivestire-backend-tmp/prisma ./prisma
COPY APP3005/aivestire-backend-tmp/scripts ./scripts
COPY APP3005_AI/recommend_demo/main_train_data.csv /app/seed/main_train_data.csv
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
# Fix Bull lazyConnect issue (known worker bug)
RUN sed -i 's/lazyConnect: true,\?//g' /app/dist/src/queues/queue.module.js || true
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=10s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "dist/src/main.js"]
```

### 4.3 infra/docker/frontend/Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.4
FROM node:18-bullseye-slim AS builder
WORKDIR /app
COPY APP3005/frontend/package*.json ./
ENV NGROK_SKIP_POSTINSTALL=1
RUN npm ci
COPY APP3005/frontend/ .
ARG VITE_API_URL=/api
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_TRY_ON_DEFAULT_PROVIDER=gemini
ARG VITE_ENABLE_TRY_ON_PACK_DEV_SKIP=false
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_TRY_ON_DEFAULT_PROVIDER=${VITE_TRY_ON_DEFAULT_PROVIDER}
ENV VITE_ENABLE_TRY_ON_PACK_DEV_SKIP=${VITE_ENABLE_TRY_ON_PACK_DEV_SKIP}
RUN npm run build

FROM node:20-bullseye-slim AS runtime
WORKDIR /app
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
COPY --from=builder /app/dist ./dist
COPY APP3005/frontend/docker-frontend-server.js ./server.js
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health',r=>process.exit(r.statusCode<400?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "server.js"]
```

### 4.4 Body Analyzer and Recommendation API

Same as defined in the original K8S plan (`infra/docker/body-analyzer/` and `infra/docker/recommendation-api/`).  
Key additions: non-root user, health check CMD baked in.

---

## 5. Kubernetes Setup — What Goes Where

> **Context:** Single-node Kubernetes cluster (k3s or kubeadm) on Orscope server.

### 5.1 Kubernetes Distro Choice: k3s

We use **k3s** (not full kubeadm). Reasons:
- Lightweight: Uses ~512 MB RAM vs ~2 GB for kubeadm
- Includes built-in LoadBalancer (ServiceLB) and storage provisioner (local-path)
- Single-command install
- ARM + x86 support
- ArgoCD works out of the box

Install command (run on server):
```bash
curl -sfL https://get.k3s.io | sh -
```

### 5.2 Namespaces

```
aivestire          ← All app services live here
argocd             ← ArgoCD GitOps controller
ingress-nginx      ← Ingress controller
cert-manager       ← TLS cert management
```

### 5.3 What Is a StatefulSet vs Deployment?

**StatefulSets** (for `postgres` and `redis`):
- Get stable DNS names: `postgres-0.postgres.aivestire.svc.cluster.local`
- PVC is tied to the pod — volume survives pod restarts
- Ordered startup/shutdown (important for databases)

**Deployments** (for all app services):
- Stateless — any replica is interchangeable
- Easy rolling updates
- Fast scaling

### 5.4 PostgreSQL StatefulSet

```yaml
# infra/k8s/base/postgres/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: aivestire
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_PASSWORD
            - name: POSTGRES_DB
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_DB
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "$(POSTGRES_USER)"]
            initialDelaySeconds: 5
            periodSeconds: 10
  volumeClaimTemplates:
    - metadata:
        name: postgres-data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: local-path    # k3s built-in storage
        resources:
          requests:
            storage: 50Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: aivestire
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
  clusterIP: None   # Headless — DNS resolves to pod IP
```

### 5.5 Redis StatefulSet

```yaml
# infra/k8s/base/redis/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: aivestire
spec:
  serviceName: redis
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          command:
            - redis-server
            - --appendonly
            - "yes"
            - --requirepass
            - $(REDIS_PASSWORD)
          env:
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: redis-secret
                  key: REDIS_PASSWORD
          ports:
            - containerPort: 6379
          resources:
            requests:
              cpu: "100m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          volumeMounts:
            - name: redis-data
              mountPath: /data
          readinessProbe:
            exec:
              command: ["redis-cli", "-a", "$(REDIS_PASSWORD)", "ping"]
            initialDelaySeconds: 5
            periodSeconds: 10
  volumeClaimTemplates:
    - metadata:
        name: redis-data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: local-path
        resources:
          requests:
            storage: 5Gi
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: aivestire
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
  clusterIP: None
```

### 5.6 Backend Deployment (with Prisma Migration initContainer)

```yaml
# infra/k8s/base/backend/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: aivestire
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0     # Zero downtime deploys
  template:
    metadata:
      labels:
        app: backend
    spec:
      initContainers:
        - name: run-migrations
          image: REGISTRY/aivestire-backend:TAG
          command: ["node", "scripts/run-migrations.mjs"]
          envFrom:
            - secretRef:
                name: backend-secret
      containers:
        - name: backend
          image: REGISTRY/aivestire-backend:TAG
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: backend-secret
          env:
            - name: NODE_ENV
              value: production
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: backend-secret
                  key: DATABASE_URL
            - name: REDIS_HOST
              value: redis
            - name: REDIS_PORT
              value: "6379"
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 60
            periodSeconds: 20
```

### 5.7 Backend Worker Deployment

Same image as `backend`, different command:

```yaml
# infra/k8s/base/backend-worker/deployment.yaml
spec:
  containers:
    - name: backend-worker
      image: REGISTRY/aivestire-backend:TAG
      command: ["node", "dist/src/worker/main.js"]
      env:
        - name: IS_WORKER_PROCESS
          value: "true"
      # ... same secrets, same DB/Redis env vars
```

### 5.8 Resource Summary (Fits 12 GB RAM)

| Service | CPU Request | RAM Request |
| :--- | :--- | :--- |
| k3s system + DNS + storage | ~400m | ~1.5 GB |
| ArgoCD | ~200m | ~512 MB |
| ingress-nginx | ~100m | ~128 MB |
| postgres | ~250m | ~512 MB |
| redis | ~100m | ~256 MB |
| backend | ~250m | ~512 MB |
| backend-worker | ~250m | ~512 MB |
| frontend | ~50m | ~128 MB |
| body-analyzer | ~500m | ~1 GB |
| recommendation-api | ~500m | ~1.5 GB |
| **TOTAL** | **~2.6 vCPU** | **~6.5 GB** |

Leaves ~3.4 vCPU and ~5.5 GB headroom. ✅

---

## 6. Secrets Management

### Rule: No secrets in Git, ever.

**Strategy: Kubernetes Secrets + Sealed Secrets (kubeseal)**

#### How It Works

1. You create a plain Kubernetes Secret YAML (locally)
2. `kubeseal` encrypts it using the cluster's public key → creates `SealedSecret`
3. You commit the `SealedSecret` to git (safe — only the cluster can decrypt it)
4. ArgoCD applies it → Kubernetes decrypts it back to a regular Secret

#### Install Sealed Secrets on Cluster

```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/latest/download/controller.yaml
# Install kubeseal CLI locally
brew install kubeseal
```

#### Create a Secret (Example: Backend)

```bash
# Step 1: Create plain secret YAML (DO NOT COMMIT THIS)
kubectl create secret generic backend-secret \
  --from-literal=DATABASE_URL="postgresql://postgres:password@postgres:5432/aivestire" \
  --from-literal=JWT_SECRET="your-jwt-secret" \
  --from-literal=REDIS_PASSWORD="your-redis-password" \
  --from-literal=ADMIN_JWT_SECRET="your-admin-jwt-secret" \
  --from-literal=CLOUDINARY_CLOUD_NAME="your-cloud-name" \
  --from-literal=CLOUDINARY_API_KEY="your-api-key" \
  --from-literal=CLOUDINARY_API_SECRET="your-api-secret" \
  --dry-run=client -o yaml > /tmp/backend-secret.yaml

# Step 2: Seal it (SAFE to commit)
kubeseal --format yaml < /tmp/backend-secret.yaml > infra/k8s/base/secrets/backend-sealed-secret.yaml

# Step 3: Commit infra/k8s/base/secrets/backend-sealed-secret.yaml
# Step 4: Delete the plain secret file
rm /tmp/backend-secret.yaml
```

#### Secrets We Need to Create

| Secret Name | Keys | Used By |
| :--- | :--- | :--- |
| `postgres-secret` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | postgres StatefulSet |
| `redis-secret` | `REDIS_PASSWORD` | redis StatefulSet |
| `backend-secret` | `DATABASE_URL`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `REDIS_PASSWORD`, `CLOUDINARY_*`, `GOOGLE_*`, `RAZORPAY_*`, `TWILIO_*`, `SMTP_*` | backend, backend-worker |
| `registry-secret` | Docker registry credentials | Image pull |

#### GitHub Secrets (for CI/CD)

These are set in **GitHub → Settings → Secrets and variables → Actions**:

| Secret Name | Value |
| :--- | :--- |
| `REGISTRY_URL` | Container registry URL (e.g., `ghcr.io/yourorg`) |
| `REGISTRY_TOKEN` | Personal access token with `write:packages` scope |
| `ORSCOPE_SSH_HOST` | `94.136.189.250` |
| `ORSCOPE_SSH_USER` | `developer` |
| `ORSCOPE_SSH_KEY` | The private key from cluster credentials doc |
| `KUBECONFIG_B64` | Base64-encoded kubeconfig from the server |
| `BACKEND_ENV_B64` | Base64-encoded `.env` file for backend |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (build arg for frontend) |

---

## 7. ArgoCD GitOps Setup

### How ArgoCD Fits In

```
Developer pushes to `test` branch
    ↓
GitHub Actions CI runs (build, test)
    ↓
GitHub Actions CD builds Docker images → pushes to GHCR
    ↓
GitHub Actions CD patches image tag in infra/k8s/overlays/test/
    ↓
ArgoCD detects git change (polling every 3 min)
    ↓
ArgoCD applies new manifests to k8s cluster
    ↓
Rolling update (zero downtime)
```

### Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### ArgoCD Application Manifest

```yaml
# infra/k8s/argocd/app-test.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: aivestire-test
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_ORG/AiCore
    targetRevision: test
    path: infra/k8s/overlays/test
  destination:
    server: https://kubernetes.default.svc
    namespace: aivestire
  syncPolicy:
    automated:
      prune: true       # Delete removed resources
      selfHeal: true    # Revert any manual kubectl changes
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
```

### Kustomize Overlay (test environment)

```yaml
# infra/k8s/overlays/test/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: aivestire

resources:
  - ../../base/namespace.yaml
  - ../../base/postgres
  - ../../base/redis
  - ../../base/backend
  - ../../base/backend-worker
  - ../../base/frontend
  - ../../base/body-analyzer
  - ../../base/recommendation-api
  - ../../base/ingress
  - ../../base/secrets      # SealedSecrets

# CI/CD patches this file with new image SHA tags:
images:
  - name: REGISTRY/aivestire-backend
    newTag: "latest"      # ← CI patches this
  - name: REGISTRY/aivestire-frontend
    newTag: "latest"      # ← CI patches this
  - name: REGISTRY/aivestire-body-analyzer
    newTag: "latest"      # ← CI patches this
  - name: REGISTRY/aivestire-recommendation-api
    newTag: "latest"      # ← CI patches this
```

---

## 8. Ingress + TLS Setup

### Install ingress-nginx

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
```

### Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
```

### Ingress Manifest

Since we have an IP address (no domain yet), we use a `nip.io` domain temporarily:  
`94.136.189.250.nip.io` → resolves to `94.136.189.250` automatically (no DNS needed).

```yaml
# infra/k8s/base/ingress/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aivestire-ingress
  namespace: aivestire
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "120"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - 94.136.189.250.nip.io
      secretName: aivestire-tls
  rules:
    - host: 94.136.189.250.nip.io
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 3000
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 8080
```

> **body-analyzer** and **recommendation-api** are ClusterIP only — never exposed externally.

---

## 9. CI/CD Plan — GitHub Actions

### Branch Strategy

| Branch | What triggers | What happens |
| :--- | :--- | :--- |
| `test` | Any `push` or `pull_request` | Full CI + CD (build images, deploy to cluster) |
| `dev-gcp-server-stable` | PR or push | CI only (build + test, no deploy) |
| `main` (future) | PR merge | Production deploy (when ready) |

### Workflow Files

We create **two workflow files**:

#### File 1: `.github/workflows/ci.yml` — Runs on every push to `test`

**What it does:**
1. Checks out code
2. Runs backend unit tests (Jest) with local Postgres + Redis
3. Builds backend (`nest build`)
4. Runs the `ci-smoke-check.mjs` health check
5. Lints code (non-blocking)

```yaml
# .github/workflows/ci.yml
name: CI — Build & Test

on:
  push:
    branches: [test]
  pull_request:
    branches: [test]

jobs:
  test-backend:
    name: Backend Test & Build
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: postgres
        ports: ["5432:5432"]
        options: --health-cmd "pg_isready -U postgres" --health-interval 10s --health-timeout 5s --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
        options: --health-cmd "redis-cli ping" --health-interval 10s --health-timeout 5s --health-retries 5

    defaults:
      run:
        working-directory: APP3005/aivestire-backend-tmp

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: APP3005/aivestire-backend-tmp/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run unit tests
        run: npm test --if-present

      - name: API smoke check
        env:
          DATABASE_URL: postgresql://postgres:postgres@127.0.0.1:5432/postgres
          REDIS_HOST: 127.0.0.1
          REDIS_PORT: "6379"
          JWT_SECRET: ci-test-secret
          ADMIN_JWT_SECRET: ci-admin-test-secret
          ADMIN_SECRET: ci-admin-secret
          NODE_ENV: test
          SKIP_TWILIO: "true"
        run: |
          npm run start:prod:ci &
          npm run ci:health-check

  lint-backend:
    name: Lint (non-blocking)
    runs-on: ubuntu-latest
    continue-on-error: true
    defaults:
      run:
        working-directory: APP3005/aivestire-backend-tmp
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: APP3005/aivestire-backend-tmp/package-lock.json
      - run: npm ci
      - run: npm run lint --if-present
```

#### File 2: `.github/workflows/cd-k8s.yml` — Runs on push to `test` (after CI passes)

**What it does:**
1. Builds Docker images for all 4 services (backend, frontend, body-analyzer, recommendation-api)
2. Tags with git commit SHA
3. Pushes to GitHub Container Registry (GHCR)
4. Updates image tags in `infra/k8s/overlays/test/kustomization.yaml`
5. Commits the updated kustomization file
6. ArgoCD auto-syncs and deploys

```yaml
# .github/workflows/cd-k8s.yml
name: CD — Build Images & Deploy to K8s

on:
  push:
    branches: [test]

jobs:
  build-and-deploy:
    name: Build Images & Update K8s Manifests
    runs-on: ubuntu-latest
    needs: []   # Runs independently; gate with CI workflow if needed

    env:
      REGISTRY: ghcr.io/${{ github.repository_owner }}
      IMAGE_TAG: ${{ github.sha }}

    steps:
      - uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.REGISTRY_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build & Push — Backend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/backend/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/aivestire-backend:${{ env.IMAGE_TAG }}
            ${{ env.REGISTRY }}/aivestire-backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build & Push — Frontend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/frontend/Dockerfile
          push: true
          build-args: |
            VITE_GOOGLE_CLIENT_ID=${{ secrets.VITE_GOOGLE_CLIENT_ID }}
          tags: |
            ${{ env.REGISTRY }}/aivestire-frontend:${{ env.IMAGE_TAG }}
            ${{ env.REGISTRY }}/aivestire-frontend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build & Push — Body Analyzer
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/body-analyzer/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/aivestire-body-analyzer:${{ env.IMAGE_TAG }}
            ${{ env.REGISTRY }}/aivestire-body-analyzer:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build & Push — Recommendation API
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/recommendation-api/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/aivestire-recommendation-api:${{ env.IMAGE_TAG }}
            ${{ env.REGISTRY }}/aivestire-recommendation-api:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Update Image Tags in K8s Manifests
        run: |
          # Update image tags in kustomization.yaml
          cd infra/k8s/overlays/test
          sed -i "s|newTag: \".*\" # backend|newTag: \"${{ env.IMAGE_TAG }}\" # backend|" kustomization.yaml
          sed -i "s|newTag: \".*\" # frontend|newTag: \"${{ env.IMAGE_TAG }}\" # frontend|" kustomization.yaml
          sed -i "s|newTag: \".*\" # body-analyzer|newTag: \"${{ env.IMAGE_TAG }}\" # body-analyzer|" kustomization.yaml
          sed -i "s|newTag: \".*\" # recommendation-api|newTag: \"${{ env.IMAGE_TAG }}\" # recommendation-api|" kustomization.yaml

      - name: Commit Updated Manifests
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add infra/k8s/overlays/test/kustomization.yaml
          git diff --staged --quiet || git commit -m "ci: update image tags to ${{ env.IMAGE_TAG }} [skip ci]"
          git push

      - name: Confirm Deploy Triggered
        if: always()
        run: |
          echo "✅ Deploy triggered for SHA: ${{ env.IMAGE_TAG }}"
          echo "ArgoCD will poll git in ~3 minutes and apply new manifests."
```

### CI/CD Flow Summary

```
git push → test branch
    ├── ci.yml → runs tests + smoke check
    └── cd-k8s.yml → builds images → pushes to GHCR
                   → updates kustomization.yaml
                   → commits [skip ci]
                   → ArgoCD polls → detects change
                   → applies to cluster
                   → pods rolling updated
```

---

## 10. ~~Drone CI~~ — Removed

> **Decision:** Drone CI has been removed from this plan.
>
> GitHub Actions fully handles both CI and CD:
> - **`ci.yml`** → runs tests, build checks, and smoke tests on every push
> - **`cd-k8s.yml`** → builds Docker images, pushes to GHCR, patches Kustomize manifests
> - **ArgoCD** → detects the manifest commit and auto-syncs to the cluster
>
> There is no role for a secondary CI tool. Drone adds operational overhead (extra server process, OAuth app, webhook wiring) with zero additional value in this setup.
>
> **Do not create a `.drone.yml` or install Drone on the server.**

---

## 10. Folder Structure

```
AiCore/                                    ← Monorepo root
│
├── .github/
│   └── workflows/
│       ├── ci.yml                         ← NEW: Backend CI (test + build)
│       ├── cd-k8s.yml                     ← NEW: Build images + deploy to K8s
│       └── gcp-vm-compose-deploy.yml      ← KEEP: Legacy fallback (do not delete)
│
├── infra/                                 ← NEW: All infrastructure code
│   ├── docker/                            ← Per-service Dockerfiles
│   │   ├── backend/Dockerfile
│   │   ├── frontend/Dockerfile
│   │   ├── body-analyzer/Dockerfile
│   │   └── recommendation-api/Dockerfile
│   │
│   └── k8s/                               ← Kubernetes manifests (GitOps source)
│       ├── base/                          ← Environment-agnostic base
│       │   ├── namespace.yaml
│       │   ├── postgres/
│       │   │   ├── statefulset.yaml
│       │   │   └── service.yaml
│       │   ├── redis/
│       │   │   ├── statefulset.yaml
│       │   │   └── service.yaml
│       │   ├── backend/
│       │   │   ├── deployment.yaml
│       │   │   ├── service.yaml
│       │   │   └── hpa.yaml
│       │   ├── backend-worker/
│       │   │   └── deployment.yaml
│       │   ├── frontend/
│       │   │   ├── deployment.yaml
│       │   │   └── service.yaml
│       │   ├── body-analyzer/
│       │   │   ├── deployment.yaml
│       │   │   └── service.yaml
│       │   ├── recommendation-api/
│       │   │   ├── deployment.yaml
│       │   │   └── service.yaml
│       │   ├── ingress/
│       │   │   ├── ingress.yaml
│       │   │   └── clusterissuer.yaml
│       │   └── secrets/
│       │       ├── backend-sealed-secret.yaml    ← SAFE: encrypted, commit ok
│       │       ├── postgres-sealed-secret.yaml
│       │       └── redis-sealed-secret.yaml
│       │
│       ├── overlays/
│       │   └── test/                     ← test branch environment
│       │       └── kustomization.yaml    ← Image tags patched here by CI/CD
│       │
│       └── argocd/
│           └── app-test.yaml            ← ArgoCD Application manifest
│
├── docker-compose.yml                   ← Production compose (pre-built images)
├── docker-compose.dev.yml               ← Dev compose (build: sections for local dev)
│
├── APP3005/                             ← Application source (unchanged)
├── APP3005_AI/                          ← AI services source (unchanged)
└── docs/
    ├── INFRA_K8S_CICD_MASTER_PLAN.md   ← THIS FILE
    ├── K8S_CLUSTER_CREDENTIALS.md
    └── K8S_KUBERNETES_DEPLOYMENT_PLAN.md
```

---

## 11. Step-by-Step Execution Order

Follow this exact order. Do not skip steps.

### Phase 1 — Server Setup (Do Once)

```
[ ] 1.1  SSH into Orscope server: ssh developer@94.136.189.250 -i keyfile.txt
[ ] 1.2  Install k3s: curl -sfL https://get.k3s.io | sh -
[ ] 1.3  Copy kubeconfig: sudo cat /etc/rancher/k3s/k3s.yaml
[ ] 1.4  Base64-encode kubeconfig → store in GitHub Secret KUBECONFIG_B64
[ ] 1.5  Install Sealed Secrets controller on cluster
[ ] 1.6  Install ArgoCD on cluster
[ ] 1.7  Install ingress-nginx on cluster
[ ] 1.8  Install cert-manager on cluster
```

### Phase 2 — Create Folder Structure (Local)

```
[ ] 2.1  Create infra/docker/ directories
[ ] 2.2  Create infra/k8s/base/ manifest files
[ ] 2.3  Create infra/k8s/overlays/test/ kustomization
[ ] 2.4  Create infra/k8s/argocd/app-test.yaml
[ ] 2.5  Create new docker-compose.yml (pre-built image format)
[ ] 2.6  Create docker-compose.dev.yml (build: sections for local dev)
```

### Phase 3 — Secrets Setup

```
[ ] 3.1  Generate all secrets locally
[ ] 3.2  Run kubeseal to create SealedSecrets
[ ] 3.3  Commit SealedSecrets to infra/k8s/base/secrets/
[ ] 3.4  Add all required secrets to GitHub Secrets UI
```

### Phase 4 — CI/CD Setup

```
[ ] 4.1  Create .github/workflows/ci.yml
[ ] 4.2  Create .github/workflows/cd-k8s.yml
[ ] 4.3  Push to test branch → verify CI runs and passes
[ ] 4.4  Verify Docker images appear in GHCR
[ ] 4.5  Verify kustomization.yaml gets updated commit
```

### Phase 5 — ArgoCD Deploy

```
[ ] 5.1  Apply argocd/app-test.yaml to cluster
[ ] 5.2  ArgoCD detects git manifest → syncs → pods start
[ ] 5.3  Watch pods: kubectl get pods -n aivestire -w
[ ] 5.4  Verify all pods Running
[ ] 5.5  Check ingress is working: curl http://94.136.189.250.nip.io/api/health
```

### Phase 6 — Validate & Monitor

```
[ ] 6.1  Check ArgoCD dashboard (port-forward or NodePort)
[ ] 6.2  Make a test commit to test branch → verify full pipeline runs end-to-end
[ ] 6.3  Verify rollback: change image tag to previous SHA in kustomization.yaml → ArgoCD auto-syncs
```

---

## Edge Cases & Known Issues

| Issue | What to Do |
| :--- | :--- |
| Recommendation API takes 60–90 seconds to start | `startupProbe` with `failureThreshold: 30` instead of `readinessProbe` |
| Bull worker lazyConnect bug | Already handled by `sed` patch in Dockerfile |
| Postgres StatefulSet volume not mounting | Verify `local-path` storageClass is installed (k3s default ✅) |
| ArgoCD image tag not updating | Check `[skip ci]` commit was pushed; verify argocd polling interval |
| Sealed Secrets cert rotation | Backup `sealed-secrets-key` Secret from cluster before expiry |
| OOM on 12 GB server | Don't run body-analyzer and recommendation-api with replicas > 1 |
| TLS with raw IP | Use `94.136.189.250.nip.io` for Let's Encrypt; or use self-signed cert |
| Service account JSON (Google Vertex AI) | Mount as a Kubernetes Secret volume, not env var |

---

> **Next Step:** Review this plan, then begin Phase 1 server setup.  
> Once Phase 1 is complete, share the kubeconfig output and we will begin creating manifest files.

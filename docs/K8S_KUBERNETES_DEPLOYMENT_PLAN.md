# 🚀 AiVestire — Kubernetes Deployment Plan
## GCP Spot VMs (Epyc/N2D) · ArgoCD · Ingress · GitHub Actions CI/CD

> **Last Updated:** June 2026  
> **Target:** Production-ready, zero-downtime Kubernetes deployment on GCP using cost-optimised Spot/Preemptible VMs (AMD EPYC N2D instances), with GitOps via ArgoCD, HTTPS via Ingress-NGINX, and a fully automated GitHub Actions CI/CD pipeline.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Services Inventory](#2-services-inventory)
3. [GCP Cluster & VM Choice (EPYC Spot VMs)](#3-gcp-cluster--vm-choice-epyc-spot-vms)
4. [Database Strategy — Cloud SQL Proxy vs StatefulSets](#4-database-strategy--cloud-sql-proxy-vs-statefulsets)
5. [Complete Folder Structure](#5-complete-folder-structure)
6. [Dockerfile Strategy (Per-Service)](#6-dockerfile-strategy-per-service)
7. [Kubernetes Manifests Design](#7-kubernetes-manifests-design)
8. [ArgoCD GitOps Setup](#8-argocd-gitops-setup)
9. [Ingress-NGINX & TLS](#9-ingress-nginx--tls)
10. [Secrets & Config Management](#10-secrets--config-management)
11. [GitHub Actions CI/CD Pipeline](#11-github-actions-cicd-pipeline)
12. [Deployment Flow (End-to-End)](#12-deployment-flow-end-to-end)
13. [Branch Strategy](#13-branch-strategy)
14. [Rollback Strategy](#14-rollback-strategy)
15. [Monitoring & Observability](#15-monitoring--observability)
16. [Security Hardening](#16-security-hardening)
17. [Step-by-Step Implementation Checklist](#17-step-by-step-implementation-checklist)

---

## 1. Architecture Overview

```
                        ┌─────────────────────────────────────────────────────┐
                        │              GitHub Repository                       │
                        │  main / uat-server branches                         │
                        │  ┌────────────┐   ┌───────────────────────────────┐ │
                        │  │ app code   │   │  infra/k8s/ manifests (GitOps)│ │
                        │  └────────────┘   └───────────────────────────────┘ │
                        └──────────────────────────┬──────────────────────────┘
                                                   │  GitHub Actions
                                     ┌─────────────▼──────────────┐
                                     │  CI: test → build → push   │
                                     │  Image → Artifact Registry  │
                                     │  CD: patch image tag in     │
                                     │      infra/k8s (gitops)     │
                                     └─────────────┬──────────────┘
                                                   │
                              ┌────────────────────▼────────────────────────┐
                              │         GCP GKE Cluster                      │
                              │  Node Pool: N2D (AMD EPYC) Spot VMs          │
                              │                                               │
                              │  ┌──────────────────────────────────────┐    │
                              │  │  ArgoCD (watches infra/k8s/ in git)  │    │
                              │  │  Auto-syncs new image tags → k8s     │    │
                              │  └──────────────────────────────────────┘    │
                              │                                               │
                              │  Namespaces:                                  │
                              │  ┌─────────────────────────────────────────┐ │
                              │  │  production  (main branch)              │ │
                              │  │  ┌──────────┐ ┌──────────┐             │ │
                              │  │  │ frontend │ │ backend  │             │ │
                              │  │  │ Deployment│ │Deployment│             │ │
                              │  │  └──────────┘ └──────────┘             │ │
                              │  │  ┌──────────┐ ┌───────────────────┐    │ │
                              │  │  │ backend  │ │  body-analyzer    │    │ │
                              │  │  │  worker  │ │  Deployment        │    │ │
                              │  │  └──────────┘ └───────────────────┘    │ │
                              │  │  ┌───────────────────────────────────┐  │ │
                              │  │  │  recommendation-api Deployment    │  │ │
                              │  │  └───────────────────────────────────┘  │ │
                              │  └─────────────────────────────────────────┘ │
                              │                                               │
                              │  ┌─────────────────────────────────────────┐ │
                              │  │  staging  (uat-server branch)           │ │
                              │  └─────────────────────────────────────────┘ │
                              │                                               │
                              │  Shared Infrastructure:                       │
                              │  ┌────────────────────────────────────────┐  │
                              │  │  ingress-nginx (LoadBalancer)           │  │
                              │  │  cert-manager (Let's Encrypt TLS)       │  │
                              │  │  Cloud SQL Auth Proxy (sidecar)         │  │
                              │  │  Redis (StatefulSet)                    │  │
                              │  └────────────────────────────────────────┘  │
                              └─────────────────────────────────────────────┘
```

---

## 2. Services Inventory

| Service | Language/Framework | Port | Docker Target | Role |
|---|---|---|---|---|
| `frontend` | Vite + React + Node | 8080 | `frontend` | UI served via Node.js |
| `backend` | NestJS (Node 20) | 3000 | `backend` | REST API + HTTP server |
| `backend-worker` | NestJS (Node 20) | — | `backend` | Bull queue consumer (no HTTP) |
| `body-analyzer` | Python 3.11 + FastAPI/Uvicorn | 8898 | `body-analyzer` | AI body measurement |
| `recommendation-api` | Python 3.10 + FastAPI/Uvicorn | 8799 | `recommendation-api` | AI fashion recommendation |
| `postgres` | PostgreSQL 15 | 5432 | Cloud SQL Proxy sidecar | Primary database |
| `redis` | Redis 7 Alpine | 6379 | StatefulSet | Queue + cache |

---

## 3. GCP Cluster & VM Choice (EPYC Spot VMs)

### Why N2D (AMD EPYC) Spot VMs?

- **N2D machines** use AMD EPYC processors — excellent price-performance for compute-heavy AI workloads
- **Spot VMs** are 60–91% cheaper than on-demand; GKE handles preemption gracefully via Pod Disruption Budgets
- **Strategy**: Run stateless services (frontend, backend, AI APIs) on Spot nodes; run Redis on a small on-demand node pool

### Node Pool Configuration (GKE)

```
Cluster name:     aivestire-prod
Region:           asia-south1 (Mumbai) OR us-central1
Kubernetes:       1.29+

Node Pool: spot-workloads (Spot VMs)
  Machine type: n2d-standard-4 (4 vCPU, 16GB RAM)
  Disk: 100GB SSD
  Nodes: 2–4 (autoscaler min=2, max=6)
  Use for: frontend, backend, backend-worker, body-analyzer, recommendation-api

Node Pool: infra-pool (On-demand — stable)
  Machine type: e2-standard-2 (2 vCPU, 8GB RAM)
  Nodes: 1–2
  Use for: Redis StatefulSet, ArgoCD
```

### Node Taints & Labels (so Spot pods don't land on infra nodes)

```yaml
# Spot node pool label/taint
nodeSelector:
  cloud.google.com/gke-spot: "true"
tolerations:
  - key: cloud.google.com/gke-spot
    operator: Equal
    value: "true"
    effect: NoSchedule
```

---

## 4. Database Strategy — Cloud SQL Proxy vs StatefulSets

### Decision: **Cloud SQL Auth Proxy (Sidecar) for PostgreSQL + StatefulSet for Redis**

#### PostgreSQL → Cloud SQL (Managed) + Auth Proxy Sidecar

**Why NOT a PostgreSQL StatefulSet in prod?**
- StatefulSets need Persistent Volumes — if a Spot node gets preempted, PV re-attach takes 5–10 min
- Cloud SQL handles backups, HA, failover, point-in-time recovery automatically
- Cloud SQL Auth Proxy handles IAM-based auth (no passwords in env files)

**Architecture:**
```
backend Pod
├── container: nestjs-backend    ←── connects to localhost:5432
└── container: cloud-sql-proxy  ←── proxies to Cloud SQL via IAM
    image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2
    args: ["--structured-logs", "--port=5432", "PROJECT:REGION:INSTANCE"]
    uses: Workload Identity (GKE SA ↔ GCP SA with Cloud SQL Client role)
```

**Same proxy sidecar in: backend, backend-worker**

#### Redis → StatefulSet (in-cluster)

**Why StatefulSet for Redis (not Cloud Memorystore)?**
- Redis is used for Bull job queues — data loss on eviction is acceptable (jobs re-queue)
- Keeping Redis in-cluster saves ~$50–100/month vs Cloud Memorystore
- Use 1-replica StatefulSet on the `infra-pool` (on-demand node) to avoid Spot preemption
- PVC with `ReadWriteOnce` SSD (10GB sufficient for queue data)

```
redis-0 (StatefulSet)   ← on infra-pool node (on-demand, never preempted)
  PVC: redis-data-redis-0 (10Gi SSD)
  Service: redis (ClusterIP, port 6379)
```

---

## 5. Complete Folder Structure

```
AiCore/                                    # Monorepo root
│
├── APP3005/                               # Main application
│   ├── frontend/                          # Vite React app
│   │   ├── Dockerfile                     # EXISTING (keep as-is)
│   │   └── ...
│   └── aivestire-backend-tmp/             # NestJS backend
│       ├── Dockerfile                     # EXISTING (keep as-is, per-service)
│       └── ...
│
├── APP3005_AI/                            # AI microservices
│   ├── Playground/vertexVT/               # Body analyzer FastAPI
│   └── recommend_demo/                    # Recommendation API
│
├── infra/                                 # ← NEW: All infrastructure code
│   │
│   ├── docker/                            # ← NEW: Production Dockerfiles (split per service)
│   │   ├── backend/
│   │   │   └── Dockerfile                 # NestJS backend only
│   │   ├── backend-worker/
│   │   │   └── Dockerfile                 # NestJS worker only (same image, diff CMD)
│   │   ├── frontend/
│   │   │   └── Dockerfile                 # Vite + Node server
│   │   ├── body-analyzer/
│   │   │   └── Dockerfile                 # Python 3.11 FastAPI
│   │   └── recommendation-api/
│   │       └── Dockerfile                 # Python 3.10 FastAPI
│   │
│   └── k8s/                               # ← NEW: Kubernetes manifests (GitOps source)
│       │
│       ├── base/                          # Base manifests (environment-agnostic)
│       │   ├── namespace.yaml
│       │   ├── frontend/
│       │   │   ├── deployment.yaml
│       │   │   ├── service.yaml
│       │   │   └── hpa.yaml
│       │   ├── backend/
│       │   │   ├── deployment.yaml        # includes cloud-sql-proxy sidecar
│       │   │   ├── service.yaml
│       │   │   ├── hpa.yaml
│       │   │   └── migrations-job.yaml    # Prisma migrate deploy (run-once Job)
│       │   ├── backend-worker/
│       │   │   ├── deployment.yaml
│       │   │   └── hpa.yaml
│       │   ├── body-analyzer/
│       │   │   ├── deployment.yaml
│       │   │   └── service.yaml
│       │   ├── recommendation-api/
│       │   │   ├── deployment.yaml
│       │   │   └── service.yaml
│       │   ├── redis/
│       │   │   ├── statefulset.yaml
│       │   │   ├── service.yaml
│       │   │   └── pvc.yaml
│       │   └── ingress/
│       │       ├── ingress.yaml
│       │       └── certificate.yaml       # cert-manager ClusterIssuer
│       │
│       ├── overlays/                      # Kustomize overlays per environment
│       │   ├── production/
│       │   │   ├── kustomization.yaml
│       │   │   ├── patches/
│       │   │   │   ├── backend-replicas.yaml      # replicas: 2
│       │   │   │   ├── backend-resources.yaml     # cpu/mem limits
│       │   │   │   └── images.yaml                # image tags (CI patches this)
│       │   │   └── secrets/
│       │   │       └── .gitkeep               # NEVER commit real secrets here
│       │   └── staging/
│       │       ├── kustomization.yaml
│       │       └── patches/
│       │           ├── backend-replicas.yaml      # replicas: 1
│       │           └── images.yaml
│       │
│       └── argocd/                        # ArgoCD Application manifests
│           ├── argocd-namespace.yaml
│           ├── app-production.yaml        # ArgoCD Application for production
│           └── app-staging.yaml           # ArgoCD Application for staging
│
├── .github/
│   └── workflows/
│       ├── gcp-vm-compose-deploy.yml      # EXISTING (keep for legacy/fallback)
│       ├── ci.yml                         # ← NEW: CI — test, build, lint
│       └── cd-k8s.yml                     # ← NEW: CD — build+push images, patch k8s tags
│
└── docs/
    ├── K8S_KUBERNETES_DEPLOYMENT_PLAN.md  # ← THIS FILE
    └── ...existing docs...
```

---

## 6. Dockerfile Strategy (Per-Service)

### Why Split Dockerfiles?

The current root `Dockerfile` uses multi-stage targets — this is good but has one problem: **every service build needs the entire monorepo context**, making CI slow and cache-inefficient.

**New approach**: Each service gets its own `Dockerfile` inside `infra/docker/<service>/` with a precise build context. CI builds and pushes each independently. This means:
- A change in `recommendation-api` only triggers rebuilding that image
- Build contexts are minimal (no sending 500MB AI data files when building frontend)
- Independent image versioning per service

### infra/docker/backend/Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.4
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Copy only package files first (layer cache)
COPY APP3005/aivestire-backend-tmp/package*.json ./
COPY APP3005/aivestire-backend-tmp/prisma ./prisma
RUN npm ci --ignore-scripts

COPY APP3005/aivestire-backend-tmp/tsconfig*.json ./
COPY APP3005/aivestire-backend-tmp/nest-cli.json ./
COPY APP3005/aivestire-backend-tmp/src ./src
RUN npx prisma generate && npx nest build

# ── Runtime image ───────────────────────────────────────────
FROM node:20-bullseye-slim AS runtime
WORKDIR /app

# Non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

COPY APP3005/aivestire-backend-tmp/package*.json ./
COPY APP3005/aivestire-backend-tmp/prisma ./prisma
COPY APP3005/aivestire-backend-tmp/scripts ./scripts
COPY APP3005_AI/recommend_demo/main_train_data.csv /app/seed/main_train_data.csv

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Patch lazyConnect (existing fix from your current Dockerfile)
RUN sed -i 's/lazyConnect: true,\?//g' /app/dist/src/queues/queue.module.js || true

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=10s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]
```

### infra/docker/backend-worker/Dockerfile

```dockerfile
# Same image as backend, different CMD
# Build identical to backend — share the same Docker image in registry
# Only CMD changes; controlled via Kubernetes deployment env var IS_WORKER_PROCESS=true
# In k8s: backend-worker Deployment overrides command:
#   command: ["node", "dist/src/worker/main.js"]
#   env: IS_WORKER_PROCESS=true
```

> **Key insight**: `backend` and `backend-worker` share **the same Docker image** (`aivestire-backend`). The worker deployment simply overrides the command in Kubernetes. No separate Dockerfile needed — saves build time, ensures consistent code base.

### infra/docker/frontend/Dockerfile

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

# ── Runtime ─────────────────────────────────────────────────
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

### infra/docker/body-analyzer/Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.4
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential libglib2.0-0 libgl1 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY APP3005_AI/Playground/vertexVT/requirements.txt ./
RUN pip install --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements.txt

COPY APP3005_AI/Playground/vertexVT/body_analyzer_api.py ./
COPY APP3005_AI/Playground/vertexVT/body_analyzer.py ./
COPY APP3005_AI/Playground/vertexVT/models ./models

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

ENV PYTHONUNBUFFERED=1
EXPOSE 8898

HEALTHCHECK --interval=20s --timeout=10s --retries=5 \
  CMD python -c "import sys,urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8898/health').status==200 else 1)" || exit 1

CMD ["uvicorn", "body_analyzer_api:app", "--host", "0.0.0.0", "--port", "8898"]
```

### infra/docker/recommendation-api/Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.4
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       git libglib2.0-0 libgl1 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir "uv==0.4.20" setuptools wheel "numpy<2.0"

WORKDIR /app

COPY APP3005_AI/recommend_demo/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY APP3005_AI/recommend_demo/scripts/patch_transformers_accelerate.py /tmp/
RUN python /tmp/patch_transformers_accelerate.py && rm /tmp/patch_transformers_accelerate.py

COPY APP3005_AI/recommend_demo/pyproject.toml ./
COPY APP3005_AI/recommend_demo/README.md ./
COPY APP3005_AI/recommend_demo/app ./app
COPY APP3005_AI/recommend_demo/scripts ./scripts
COPY APP3005_AI/recommend_demo/artifacts ./artifacts
COPY APP3005_AI/recommend_demo/main_train_data.csv ./

RUN pip install --no-cache-dir -e . --no-deps

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

ENV PORT=8799
EXPOSE 8799

HEALTHCHECK --interval=20s --timeout=10s --retries=10 --start-period=60s \
  CMD python -c "import sys,urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8799/openapi.json').status==200 else 1)"

CMD ["sh", "-c", "uvicorn app.fusion_api:app --host 0.0.0.0 --port ${PORT:-8799}"]
```

---

## 7. Kubernetes Manifests Design

### 7.1 Namespace

```yaml
# infra/k8s/base/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    app.kubernetes.io/managed-by: argocd
---
apiVersion: v1
kind: Namespace
metadata:
  name: staging
```

### 7.2 Backend Deployment (with Cloud SQL Proxy Sidecar)

```yaml
# infra/k8s/base/backend/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0      # zero-downtime rolling deploy
  template:
    metadata:
      labels:
        app: backend
    spec:
      serviceAccountName: aivestire-backend-sa  # Workload Identity SA
      
      # Prefer Spot nodes
      nodeSelector:
        cloud.google.com/gke-spot: "true"
      tolerations:
        - key: cloud.google.com/gke-spot
          operator: Equal
          value: "true"
          effect: NoSchedule
      
      # Pod anti-affinity (spread across nodes)
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: backend
                topologyKey: kubernetes.io/hostname
      
      initContainers:
        # Run Prisma migrations before backend starts (only runs on new deploys)
        - name: prisma-migrate
          image: REGISTRY/aivestire-backend:TAG   # same image
          command: ["node", "scripts/run-migrations.mjs"]
          envFrom:
            - secretRef:
                name: backend-secrets
            - configMapRef:
                name: backend-config
      
      containers:
        # ── Main NestJS API container ─────────────────────────
        - name: backend
          image: REGISTRY/aivestire-backend:TAG
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: backend-secrets
            - configMapRef:
                name: backend-config
          env:
            - name: DATABASE_URL
              value: "postgresql://postgres:$(DB_PASSWORD)@127.0.0.1:5432/aivestire"
            - name: REDIS_HOST
              value: "redis"
            - name: REDIS_PORT
              value: "6379"
            - name: NODE_ENV
              value: "production"
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
            failureThreshold: 5
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 60
            periodSeconds: 20
            failureThreshold: 3
        
        # ── Cloud SQL Auth Proxy sidecar ──────────────────────
        - name: cloud-sql-proxy
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.11
          args:
            - "--structured-logs"
            - "--port=5432"
            - "PROJECT_ID:REGION:INSTANCE_NAME"  # Replace with actual value
          securityContext:
            runAsNonRoot: true
          resources:
            requests:
              cpu: "50m"
              memory: "64Mi"
            limits:
              cpu: "200m"
              memory: "128Mi"
```

### 7.3 Backend Worker Deployment

```yaml
# infra/k8s/base/backend-worker/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-worker
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend-worker
  template:
    spec:
      serviceAccountName: aivestire-backend-sa
      containers:
        - name: backend-worker
          image: REGISTRY/aivestire-backend:TAG   # SAME image as backend!
          command: ["node", "dist/src/worker/main.js"]  # Override CMD
          env:
            - name: IS_WORKER_PROCESS
              value: "true"
            - name: DATABASE_URL
              value: "postgresql://postgres:$(DB_PASSWORD)@127.0.0.1:5432/aivestire"
            - name: REDIS_HOST
              value: "redis"
            - name: REDIS_PORT
              value: "6379"
          # No readiness/liveness HTTP probe (worker has no HTTP endpoint)
          # Use exec probe instead:
          livenessProbe:
            exec:
              command: ["node", "-e", "process.exit(0)"]
            periodSeconds: 30
          
        - name: cloud-sql-proxy  # Same proxy sidecar
          image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.11
          args: ["--structured-logs", "--port=5432", "PROJECT_ID:REGION:INSTANCE_NAME"]
```

### 7.4 Redis StatefulSet

```yaml
# infra/k8s/base/redis/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: production
spec:
  serviceName: "redis"
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      # Redis MUST be on stable on-demand node (not Spot — data loss risk)
      nodeSelector:
        cloud.google.com/gke-nodepool: infra-pool
      containers:
        - name: redis
          image: redis:7-alpine
          command: ["redis-server", "--appendonly", "yes", "--port", "6379"]
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
              command: ["redis-cli", "ping"]
            initialDelaySeconds: 5
            periodSeconds: 10
  volumeClaimTemplates:
    - metadata:
        name: redis-data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: premium-rwo   # GCP SSD
        resources:
          requests:
            storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: production
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
  clusterIP: None   # Headless service for StatefulSet DNS
```

### 7.5 HPA (Horizontal Pod Autoscaler)

```yaml
# infra/k8s/base/backend/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 6
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### 7.6 Pod Disruption Budget (Spot VM Safety)

```yaml
# infra/k8s/base/backend/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
  namespace: production
spec:
  minAvailable: 1    # Always keep at least 1 backend pod running during Spot eviction
  selector:
    matchLabels:
      app: backend
```

---

## 8. ArgoCD GitOps Setup

### How ArgoCD Works with This Setup

```
Git Push to main branch
  → GitHub Actions CI runs (build, test)
  → CI builds Docker image, pushes to Artifact Registry with SHA tag
  → CI commits updated image tag into infra/k8s/overlays/production/patches/images.yaml
  → ArgoCD detects change in git (polling every 3 min OR webhook)
  → ArgoCD applies new manifests to GKE cluster
  → Rolling update begins (maxUnavailable: 0 guarantees zero downtime)
```

### ArgoCD Application (Production)

```yaml
# infra/k8s/argocd/app-production.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: aivestire-production
  namespace: argocd
  annotations:
    argocd.argoproj.io/sync-wave: "0"
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_ORG/AiCore
    targetRevision: main
    path: infra/k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true        # Remove resources deleted from git
      selfHeal: true     # Auto-revert manual kubectl changes
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - RespectIgnoreDifferences=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas   # Don't fight HPA
```

### Kustomize Overlay (Production)

```yaml
# infra/k8s/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: production

resources:
  - ../../base/namespace.yaml
  - ../../base/frontend
  - ../../base/backend
  - ../../base/backend-worker
  - ../../base/body-analyzer
  - ../../base/recommendation-api
  - ../../base/redis
  - ../../base/ingress

# CI/CD patches this file with new image SHA tags:
images:
  - name: REGISTRY/aivestire-frontend
    newTag: "abc1234"          # ← CI patches this line
  - name: REGISTRY/aivestire-backend
    newTag: "abc1234"          # ← CI patches this line
  - name: REGISTRY/aivestire-body-analyzer
    newTag: "abc1234"          # ← CI patches this line  
  - name: REGISTRY/aivestire-recommendation-api
    newTag: "abc1234"          # ← CI patches this line

patches:
  - path: patches/backend-replicas.yaml
  - path: patches/backend-resources.yaml
```

---

## 9. Ingress-NGINX & TLS

### Architecture

```
Internet → GCP Load Balancer (Static IP)
         → ingress-nginx Service (LoadBalancer type in k8s)
         → Ingress rules (routing by path/host)
         → Backend/Frontend Services (ClusterIP)
```

### Ingress Manifest

```yaml
# infra/k8s/base/ingress/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aivestire-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "120"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "120"
    # Force HTTPS redirect
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    # Rate limiting (protect against abuse)
    nginx.ingress.kubernetes.io/limit-rps: "30"
    # cert-manager auto-TLS
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - api.aivestire.com        # Backend API domain
        - app.aivestire.com        # Frontend domain
      secretName: aivestire-tls
  rules:
    # Frontend — all traffic to frontend service
    - host: app.aivestire.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 8080
    
    # Backend API — proxy /api traffic
    - host: api.aivestire.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 3000
          # AI services (internal, called by backend — NOT exposed externally)
          # body-analyzer and recommendation-api are ClusterIP only (no ingress rule)
```

> **Security**: `body-analyzer` (port 8898) and `recommendation-api` (port 8799) are **never exposed externally**. They are ClusterIP services only, reachable only from within the cluster by the NestJS backend.

### cert-manager ClusterIssuer

```yaml
# infra/k8s/base/ingress/certificate.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: devops@aivestire.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: nginx
```

---

## 10. Secrets & Config Management

### Strategy: Kubernetes Secrets + External Secrets Operator (Optional)

For the initial setup, we use **manually created Kubernetes Secrets** (via `kubectl create secret` — never committed to git).

```bash
# One-time setup on cluster (run by admin, not CI):
kubectl create secret generic backend-secrets \
  --namespace=production \
  --from-literal=JWT_SECRET="..." \
  --from-literal=ADMIN_JWT_SECRET="..." \
  --from-literal=ADMIN_SECRET="..." \
  --from-literal=DB_PASSWORD="..." \
  --from-literal=CLOUDINARY_API_KEY="..." \
  --from-literal=CLOUDINARY_API_SECRET="..." \
  --from-literal=TWILIO_AUTH_TOKEN="..." \
  --from-literal=PAYU_MERCHANT_KEY="..." \
  --from-literal=PAYU_MERCHANT_SALT="..."
```

### ConfigMap (non-sensitive config)

```yaml
# infra/k8s/base/backend/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: production
data:
  NODE_ENV: "production"
  CORS_ORIGIN: "https://app.aivestire.com"
  FASTAPI_BODY_ANALYZE_URL: "http://body-analyzer:8898/body_analyze_json"
  FASTAPI_RECOMMENDATION_URL: "http://recommendation-api:8799/recommendation/ai-decide"
  AI_TIMING_LOGS: "true"
  VERTEX_TRYON_ENABLED: "false"
  SEED_LIMIT: "200"
```

### Google Service Account — Workload Identity

```bash
# GCP SA for Cloud SQL access (no JSON keys!)
gcloud iam service-accounts create aivestire-backend \
  --display-name="AiVestire Backend K8s"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:aivestire-backend@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Link GKE SA to GCP SA via Workload Identity
kubectl create serviceaccount aivestire-backend-sa --namespace production

gcloud iam service-accounts add-iam-policy-binding \
  aivestire-backend@PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="serviceAccount:PROJECT_ID.svc.id.goog[production/aivestire-backend-sa]"

kubectl annotate serviceaccount aivestire-backend-sa \
  --namespace production \
  iam.gke.io/gcp-service-account=aivestire-backend@PROJECT_ID.iam.gserviceaccount.com
```

---

## 11. GitHub Actions CI/CD Pipeline

### Pipeline Overview

```
PR / Push to main or uat-server branch
│
├── [ci.yml] Triggered on PR and push
│   ├── Job: lint          — ESLint backend
│   ├── Job: test-backend  — NestJS unit tests (with Postgres + Redis services)
│   ├── Job: build-check   — Verify all 4 Docker images build successfully
│   └── Job: frontend-lint — Frontend ESLint/TypeScript check
│
└── [cd-k8s.yml] Triggered only on push to main or uat-server
    ├── Job: build-and-push
    │   ├── Authenticate to GCP Artifact Registry (OIDC, no stored keys)
    │   ├── Build backend image (SHA tag)
    │   ├── Build frontend image (SHA tag, inject VITE_ build args)
    │   ├── Build body-analyzer image (SHA tag)
    │   ├── Build recommendation-api image (SHA tag)
    │   ├── Push all images to Artifact Registry
    │   └── Determine target overlay (production/staging)
    │
    └── Job: update-k8s-manifests
        ├── Check out repo (with write token)
        ├── Use kustomize to set new image tags in overlay
        ├── git commit + push image tag changes to same branch
        └── ArgoCD auto-detects git change → syncs cluster
```

### .github/workflows/ci.yml

```yaml
name: CI — Test & Build Check

on:
  pull_request:
    branches: [main, uat-server]
  push:
    branches: [main, uat-server]

jobs:
  test-backend:
    name: Backend Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: postgres
        ports: [5432:5432]
        options: --health-cmd "pg_isready -U postgres" --health-interval 10s --health-timeout 5s --health-retries 5
      redis:
        image: redis:7-alpine
        ports: [6379:6379]
        options: --health-cmd "redis-cli ping" --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: APP3005/aivestire-backend-tmp/package-lock.json
      - run: npm ci
        working-directory: APP3005/aivestire-backend-tmp
      - run: npm run build
        working-directory: APP3005/aivestire-backend-tmp
      - run: npm run test --if-present
        working-directory: APP3005/aivestire-backend-tmp
        env:
          DATABASE_URL: postgresql://postgres:postgres@127.0.0.1:5432/postgres
          REDIS_HOST: 127.0.0.1
          REDIS_PORT: 6379
          JWT_SECRET: ci-jwt-secret
          ADMIN_JWT_SECRET: ci-admin-secret
          ADMIN_SECRET: ci-admin-secret
          NODE_ENV: test

  lint-backend:
    name: Backend Lint
    runs-on: ubuntu-latest
    continue-on-error: true
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
        working-directory: APP3005/aivestire-backend-tmp
      - run: npm run lint --if-present
        working-directory: APP3005/aivestire-backend-tmp

  build-check:
    name: Docker Build Check (all images)
    runs-on: ubuntu-latest
    needs: [test-backend]
    strategy:
      matrix:
        service: [backend, frontend, body-analyzer, recommendation-api]
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - name: Build ${{ matrix.service }} image (no push)
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/${{ matrix.service }}/Dockerfile
          push: false
          cache-from: type=gha,scope=${{ matrix.service }}
          cache-to: type=gha,mode=max,scope=${{ matrix.service }}
```

### .github/workflows/cd-k8s.yml

```yaml
name: CD — Build, Push & Deploy to Kubernetes

on:
  push:
    branches:
      - main          # → production namespace
      - uat-server    # → staging namespace

permissions:
  contents: write         # To commit image tag updates
  id-token: write         # For OIDC GCP authentication

jobs:
  build-and-push:
    name: Build & Push Images to Artifact Registry
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.short-sha }}
      overlay: ${{ steps.env.outputs.overlay }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Set environment overlay
        id: env
        run: |
          if [ "${{ github.ref_name }}" = "main" ]; then
            echo "overlay=production" >> $GITHUB_OUTPUT
            echo "namespace=production" >> $GITHUB_OUTPUT
          else
            echo "overlay=staging" >> $GITHUB_OUTPUT
            echo "namespace=staging" >> $GITHUB_OUTPUT
          fi
      
      - name: Get short SHA
        id: meta
        run: echo "short-sha=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
      
      # OIDC auth — no stored GCP service account keys
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_CI_SERVICE_ACCOUNT }}
      
      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ vars.GCP_REGION }}-docker.pkg.dev --quiet
      
      - uses: docker/setup-buildx-action@v3
      
      # ── Build & push all images in parallel ──────────────────────────────
      - name: Build & Push backend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/backend/Dockerfile
          push: true
          tags: ${{ vars.GCP_REGISTRY }}/aivestire-backend:${{ steps.meta.outputs.short-sha }}
          cache-from: type=registry,ref=${{ vars.GCP_REGISTRY }}/aivestire-backend:cache
          cache-to: type=registry,ref=${{ vars.GCP_REGISTRY }}/aivestire-backend:cache,mode=max
      
      - name: Build & Push frontend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/frontend/Dockerfile
          push: true
          tags: ${{ vars.GCP_REGISTRY }}/aivestire-frontend:${{ steps.meta.outputs.short-sha }}
          build-args: |
            VITE_API_URL=/api
            VITE_GOOGLE_CLIENT_ID=${{ secrets.VITE_GOOGLE_CLIENT_ID }}
            VITE_TRY_ON_DEFAULT_PROVIDER=gemini
          cache-from: type=registry,ref=${{ vars.GCP_REGISTRY }}/aivestire-frontend:cache
          cache-to: type=registry,ref=${{ vars.GCP_REGISTRY }}/aivestire-frontend:cache,mode=max
      
      - name: Build & Push body-analyzer
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/body-analyzer/Dockerfile
          push: true
          tags: ${{ vars.GCP_REGISTRY }}/aivestire-body-analyzer:${{ steps.meta.outputs.short-sha }}
          cache-from: type=registry,ref=${{ vars.GCP_REGISTRY }}/aivestire-body-analyzer:cache
          cache-to: type=registry,ref=${{ vars.GCP_REGISTRY }}/aivestire-body-analyzer:cache,mode=max
      
      - name: Build & Push recommendation-api
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/recommendation-api/Dockerfile
          push: true
          tags: ${{ vars.GCP_REGISTRY }}/aivestire-recommendation-api:${{ steps.meta.outputs.short-sha }}
          cache-from: type=registry,ref=${{ vars.GCP_REGISTRY }}/aivestire-recommendation-api:cache
          cache-to: type=registry,ref=${{ vars.GCP_REGISTRY }}/aivestire-recommendation-api:cache,mode=max

  update-k8s-manifests:
    name: Update Kubernetes Image Tags (GitOps)
    runs-on: ubuntu-latest
    needs: build-and-push
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Install kustomize
        run: |
          curl -sL "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
          sudo mv kustomize /usr/local/bin/
      
      - name: Update image tags in overlay
        run: |
          OVERLAY=infra/k8s/overlays/${{ needs.build-and-push.outputs.overlay }}
          TAG=${{ needs.build-and-push.outputs.image-tag }}
          REGISTRY=${{ vars.GCP_REGISTRY }}
          
          cd $OVERLAY
          kustomize edit set image \
            "${REGISTRY}/aivestire-backend=${REGISTRY}/aivestire-backend:${TAG}" \
            "${REGISTRY}/aivestire-frontend=${REGISTRY}/aivestire-frontend:${TAG}" \
            "${REGISTRY}/aivestire-body-analyzer=${REGISTRY}/aivestire-body-analyzer:${TAG}" \
            "${REGISTRY}/aivestire-recommendation-api=${REGISTRY}/aivestire-recommendation-api:${TAG}"
      
      - name: Commit and push image tag update
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add infra/k8s/overlays/
          git commit -m "ci: deploy ${{ needs.build-and-push.outputs.image-tag }} to ${{ needs.build-and-push.outputs.overlay }} [skip ci]"
          git push
      
      # ArgoCD auto-syncs from here — no manual kubectl apply needed
      
      - name: Wait for ArgoCD sync (optional verification)
        run: |
          echo "ArgoCD will auto-sync within 3 minutes."
          echo "Monitor at: https://argocd.aivestire.com"
          echo "Deployed image tag: ${{ needs.build-and-push.outputs.image-tag }}"
          echo "Overlay: ${{ needs.build-and-push.outputs.overlay }}"
```

---

## 12. Deployment Flow (End-to-End)

```
Developer pushes to main branch
│
├── [~2 min] GitHub Actions: ci.yml
│   ├── NestJS tests pass
│   ├── Lint passes (non-blocking)
│   └── Build check all 4 images
│
├── [~8-15 min] GitHub Actions: cd-k8s.yml
│   ├── OIDC auth to GCP (no stored keys)
│   ├── Build backend image (with layer cache from registry)
│   ├── Build frontend image (inject VITE_ vars at build time)
│   ├── Build body-analyzer (Python — slowest, ~8 min first time, ~2 min cached)
│   ├── Build recommendation-api (Python — similar)
│   ├── Push all 4 images to Artifact Registry with SHA tag
│   ├── kustomize set image tags in infra/k8s/overlays/production/
│   └── git commit + push image tag changes
│
├── [~1-3 min] ArgoCD detects git change
│   ├── Pulls new manifests from GitHub
│   ├── Applies Kustomize render
│   └── Submits to Kubernetes API
│
└── [~2-5 min] Kubernetes rolling update
    ├── backend: new pod starts (initContainer: prisma migrate)
    ├── Wait for new pod readiness probe to pass
    ├── Route traffic to new pod
    ├── Terminate old pod
    └── Repeat for all services
    
Total: ~15-25 min (first deploy), ~8-12 min (cached builds)
```

---

## 13. Branch Strategy

| Branch | Environment | Namespace | Trigger |
|---|---|---|---|
| `main` | Production | `production` | Any push to `main` |
| `uat-server` | Staging | `staging` | Any push to `uat-server` |
| `feature/*` | — (CI only) | — | PRs to `main`/`uat-server` |

### Rules
- **Never push directly to `main`** — always use PRs
- PRs to `main` require CI passing
- Staging (`uat-server`) deploys first; validate, then merge to `main`
- The current `recommendation_model` branch → merge into `main` when stable

---

## 14. Rollback Strategy

### Instant Rollback via ArgoCD UI

```bash
# Option 1: ArgoCD UI — click "History & Rollback" → select previous sync
# This rolls back to any previous git commit's state

# Option 2: CLI rollback
argocd app rollback aivestire-production <revision-id>

# Option 3: Git revert (triggers new deploy via normal flow)
git revert HEAD
git push origin main
```

### Why This is Safe
- Each image has its own SHA-tagged version in Artifact Registry
- Kubernetes keeps the previous pod template until rolling update completes
- `maxUnavailable: 0` means **zero downtime** during both deploy and rollback

---

## 15. Monitoring & Observability

### What to Set Up

```
GKE Cluster → GCP Cloud Monitoring (auto-enabled)
           → GCP Cloud Logging (all pod stdout/stderr)

Additional:
├── Uptime checks in GCP → alert on /api/health down
├── Error budget alert → notify on 5xx rate > 1%
└── ArgoCD Notifications → Slack webhook on sync failure
```

### Health Endpoints Required (already exist)

- `GET /health` → NestJS backend (200 = healthy)
- `GET /openapi.json` → recommendation-api (200 = healthy)
- Frontend: `/` serves 200

---

## 16. Security Hardening

| Concern | Solution |
|---|---|
| No secrets in git | Kubernetes Secrets (manually created), Workload Identity (no JSON keys) |
| Container privileges | All containers run as non-root user (`appuser`) |
| AI services not public | `body-analyzer` and `recommendation-api` are ClusterIP only (no Ingress exposure) |
| HTTPS only | cert-manager + Let's Encrypt; force-redirect HTTP→HTTPS in Ingress |
| Rate limiting | `nginx.ingress.kubernetes.io/limit-rps: "30"` on Ingress |
| Image scanning | Enable GCP Artifact Registry vulnerability scanning |
| GCP auth | Workload Identity Federation for GitHub Actions (no stored service account JSON) |
| Network policies | Add `NetworkPolicy` to isolate namespaces |
| `.dockerignore` | Each Dockerfile has tight `.dockerignore` — no node_modules, .env, .git in images |

---

## 17. Step-by-Step Implementation Checklist

### Phase 1: GCP Infrastructure Setup (Day 1)

- [ ] Create GKE cluster (`gcloud container clusters create`) with 2 node pools
- [ ] Enable Workload Identity on cluster
- [ ] Create Cloud SQL instance (PostgreSQL 15) in same region
- [ ] Create GCP Service Account for backend (Cloud SQL Client role)
- [ ] Create GCP Artifact Registry repository
- [ ] Reserve static external IP for Ingress
- [ ] Configure DNS: `api.aivestire.com` and `app.aivestire.com` → static IP
- [ ] Create GCP Service Account for CI/CD with Workload Identity Federation from GitHub

### Phase 2: Create Folder Structure & Dockerfiles (Day 1-2)

- [ ] Create `infra/docker/` directory with all 4 Dockerfiles (split from root Dockerfile)
- [ ] Add `.dockerignore` per service context
- [ ] Verify each Dockerfile builds locally with `docker build -f infra/docker/<service>/Dockerfile .`
- [ ] Test `backend` and `backend-worker` share same image (worker uses CMD override)

### Phase 3: Kubernetes Base Manifests (Day 2-3)

- [ ] Create `infra/k8s/base/` with all service manifests
- [ ] Create `infra/k8s/overlays/production/` and `staging/` with Kustomize
- [ ] Create Redis StatefulSet + PVC on infra-pool (on-demand) node
- [ ] Create Ingress manifest + cert-manager ClusterIssuer
- [ ] Create PodDisruptionBudgets for all services
- [ ] Create HPA for backend and frontend

### Phase 4: Cluster Bootstrap (Day 3)

- [ ] Install `ingress-nginx` via Helm: `helm install ingress-nginx ingress-nginx/ingress-nginx`
- [ ] Install `cert-manager` via Helm: `helm install cert-manager jetstack/cert-manager --set installCRDs=true`
- [ ] Install ArgoCD: `kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml`
- [ ] Apply ArgoCD Application manifests (`infra/k8s/argocd/`)
- [ ] Create Kubernetes Secrets manually (`kubectl create secret generic backend-secrets`)
- [ ] Configure Workload Identity annotation on Kubernetes Service Account

### Phase 5: CI/CD Workflows (Day 4)

- [ ] Create `.github/workflows/ci.yml` (tests + build check)
- [ ] Create `.github/workflows/cd-k8s.yml` (build, push, update tags)
- [ ] Set up GitHub Secrets: `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_CI_SERVICE_ACCOUNT`, `VITE_GOOGLE_CLIENT_ID`
- [ ] Set up GitHub Variables: `GCP_REGISTRY`, `GCP_REGION`
- [ ] Test pipeline with a small commit to `uat-server` branch first
- [ ] Verify ArgoCD auto-sync picks up tag change
- [ ] Verify rolling update completes with zero downtime

### Phase 6: Validate Production (Day 5)

- [ ] Push to `main` branch
- [ ] Monitor ArgoCD dashboard for sync success
- [ ] Verify all pods are `Running` and `Ready`
- [ ] Test: `curl https://api.aivestire.com/health`
- [ ] Test: `curl https://api.aivestire.com/api/v1/tryon/health`
- [ ] Run a recommendation API test through the backend
- [ ] Simulate Spot VM preemption (drain a node) and verify no downtime
- [ ] Test rollback via ArgoCD

---

## GitHub Secrets & Variables Reference

### Secrets (sensitive)
| Secret | Value |
|---|---|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/PROJECT_NUM/locations/global/workloadIdentityPools/...` |
| `GCP_CI_SERVICE_ACCOUNT` | `ci-deploy@PROJECT_ID.iam.gserviceaccount.com` |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |

### Variables (non-sensitive)
| Variable | Example Value |
|---|---|
| `GCP_REGISTRY` | `asia-south1-docker.pkg.dev/PROJECT_ID/aivestire` |
| `GCP_REGION` | `asia-south1` |

> **Note**: All existing secrets (`GCP_INSTANCE_HOST`, `GCP_UAT_*`, etc.) from the old Docker Compose workflow can remain — the old `.github/workflows/gcp-vm-compose-deploy.yml` is kept as fallback.

---

## Key Principles Followed

1. **GitOps**: Single source of truth is Git. ArgoCD never deploys unless git changes
2. **Zero-downtime**: `maxUnavailable: 0` on all rolling updates + PDB for Spot safety
3. **Secret hygiene**: No secrets in git, no service account JSON files, Workload Identity everywhere  
4. **Service isolation**: AI services (body-analyzer, recommendation-api) are never internet-facing
5. **Cost optimisation**: Spot VMs for stateless workloads (60-91% saving), StatefulSet Redis (no Cloud Memorystore), Cloud SQL for database (managed HA)
6. **Minimal blast radius**: Each service is an independent Deployment — one bad deploy doesn't crash others
7. **Rollback in seconds**: Any ArgoCD-managed revision can be rolled back in one click

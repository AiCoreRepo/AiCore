# Secrets Setup Guide

> **Rule: No plain secrets ever touch Git. Only SealedSecrets are committed.**

All secrets are encrypted with [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets).
The cluster's public key encrypts them. Only the cluster can decrypt them.

---

## One-Time Cluster Setup

```bash
# Install sealed-secrets controller on the cluster
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/latest/download/controller.yaml

# Wait for it to be ready
kubectl -n kube-system rollout status deployment/sealed-secrets-controller

# Install kubeseal CLI on your local machine
brew install kubeseal
# Verify: kubeseal --version
```

---

## Required Secrets

### 1. `postgres-secret`

```bash
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER=aivestire \
  --from-literal=POSTGRES_PASSWORD="CHANGE_ME_STRONG_PASSWORD" \
  --from-literal=POSTGRES_DB=aivestire \
  --namespace aivestire \
  --dry-run=client -o yaml \
  | kubeseal --format yaml --namespace aivestire \
  > infra/k8s/base/secrets/postgres-sealed-secret.yaml

# Add to base/kustomization.yaml: - secrets/postgres-sealed-secret.yaml
```

### 2. `redis-secret`

```bash
kubectl create secret generic redis-secret \
  --from-literal=REDIS_PASSWORD="CHANGE_ME_STRONG_REDIS_PASSWORD" \
  --namespace aivestire \
  --dry-run=client -o yaml \
  | kubeseal --format yaml --namespace aivestire \
  > infra/k8s/base/secrets/redis-sealed-secret.yaml
```

### 3. `backend-secret`

This secret holds all NestJS env vars that are sensitive:

```bash
kubectl create secret generic backend-secret \
  --from-literal=DATABASE_URL="postgresql://aivestire:CHANGE_ME@postgres:5432/aivestire" \
  --from-literal=JWT_SECRET="CHANGE_ME_64CHAR_RANDOM_STRING" \
  --from-literal=JWT_EXPIRATION_TIME="24h" \
  --from-literal=JWT_REFRESH_EXPIRATION_TIME="7d" \
  --from-literal=ADMIN_JWT_SECRET="CHANGE_ME_64CHAR_RANDOM_STRING" \
  --from-literal=ADMIN_SECRET="CHANGE_ME_ADMIN_SECRET" \
  --from-literal=REDIS_PASSWORD="CHANGE_ME_STRONG_REDIS_PASSWORD" \
  --from-literal=CLOUDINARY_CLOUD_NAME="your-cloud-name" \
  --from-literal=CLOUDINARY_API_KEY="your-api-key" \
  --from-literal=CLOUDINARY_API_SECRET="your-api-secret" \
  --from-literal=GOOGLE_CLIENT_ID="your-google-client-id" \
  --from-literal=GOOGLE_CLIENT_SECRET="your-google-client-secret" \
  --from-literal=RAZORPAY_KEY_ID="your-razorpay-key" \
  --from-literal=RAZORPAY_KEY_SECRET="your-razorpay-secret" \
  --from-literal=TWILIO_ACCOUNT_SID="your-twilio-sid" \
  --from-literal=TWILIO_AUTH_TOKEN="your-twilio-token" \
  --from-literal=TWILIO_PHONE_NUMBER="+1234567890" \
  --from-literal=SMTP_HOST="smtp.gmail.com" \
  --from-literal=SMTP_PORT="587" \
  --from-literal=SMTP_USER="your@email.com" \
  --from-literal=SMTP_PASSWORD="your-app-password" \
  --namespace aivestire \
  --dry-run=client -o yaml \
  | kubeseal --format yaml --namespace aivestire \
  > infra/k8s/base/secrets/backend-sealed-secret.yaml
```

### 4. `registry-secret` (GHCR Image Pull)

```bash
# Create a GitHub PAT with: read:packages scope ONLY (minimum required)
# GitHub → Settings → Developer settings → Personal access tokens → Fine-grained
# Scope: Contents:read, Packages:read

kubectl create secret docker-registry registry-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_PAT_READ_PACKAGES \
  --docker-email=your@email.com \
  --namespace aivestire \
  --dry-run=client -o yaml \
  | kubeseal --format yaml --namespace aivestire \
  > infra/k8s/base/secrets/registry-secret.yaml
```

---

## After Creating Sealed Secrets

1. Add them to `infra/k8s/base/kustomization.yaml` under `resources:`
2. Commit the `*-sealed-secret.yaml` files (safe — only the cluster can decrypt)
3. **NEVER commit** the plain YAML files (`/tmp/*.yaml`)
4. Add `/tmp/*-secret-plain.yaml` to your `.gitignore` as a safety net

---

## Secret Rotation

To rotate a secret:
1. Create the plain secret with the new value (step above, new value)
2. Seal it with kubeseal (overwrites the old sealed file)
3. Commit and push → ArgoCD applies it → pods reload env vars

**Note:** Pods don't automatically restart when a Secret changes.
Run `kubectl rollout restart deployment/backend -n aivestire` to force reload.

---

## Generating Strong Passwords

```bash
# 64-char random password (for JWT_SECRET, ADMIN_JWT_SECRET)
openssl rand -hex 32

# 32-char random password (for POSTGRES_PASSWORD, REDIS_PASSWORD)
openssl rand -base64 24 | tr -d '/+=' | head -c 32
```

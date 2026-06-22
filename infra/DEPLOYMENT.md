# Aivestire — Manual Deployment Guide (k3s + GitHub Actions + ArgoCD)

A step-by-step manual you can follow top to bottom. Each step says **what you do**,
**the exact command**, and **how to know it worked**. Do the parts in order.

> Fill in these values wherever you see them:
>
> | Placeholder | Your value |
> |---|---|
> | `<SERVER_IP>` | your VM's public IP (the guide assumes `94.136.189.250`) |
> | `<GH_USERNAME>` | your GitHub username (e.g. `atul-rainaAI23`) |
> | `<GHCR_PAT>` | a GitHub token with `read:packages` (created in Step 5) |
>
> Fixed values already wired into the repo (do **not** change unless you know why):
> **GitHub org** `AiCoreRepo` · **GHCR path** `ghcr.io/aicorerepo` · **branch** `test`
> · **namespace** `aivestire` · **domain** `94.136.189.250.nip.io`

---

## 0. What you are building

```
  Browser ──HTTPS──► ingress-nginx ──► frontend (nginx, :8080) ──┬─► /api/*      → backend     (:3000)
   (Let's Encrypt TLS)                  the single router         ├─► /ai/body    → body-analyzer(:8898)
                                                                  ├─► /ai/recommend → recommendation-api(:8799)
                                                                  └─► /           → React SPA

  backend ──► postgres (:5432)   backend + worker ──► redis (:6379)   backend/worker/frontend ──► AI services
```

**GitOps flow:** you push code to `test` → **GitHub Actions CI** tests it → **CD**
builds Docker images to GHCR and writes the new image tags into
`infra/k8s/overlays/test/kustomization.yaml` → **ArgoCD** sees the git change and
applies it to the cluster. You never run `kubectl apply` for app updates — git is
the source of truth.

**The 6 things you must set up once (this guide):**
1. A server with k3s.
2. Cluster add-ons: ingress-nginx, cert-manager, sealed-secrets, ArgoCD.
3. The 4 secrets (postgres, redis, backend, registry) — as SealedSecrets.
4. GitHub repo settings (Actions permissions + 1 Actions secret).
5. Bootstrap the ArgoCD application.
6. Push to `test` and watch it deploy.

---

## 1. Install tools on YOUR laptop

You need these locally to create secrets and talk to the cluster.

```bash
# macOS (Homebrew)
brew install kubectl kubeseal kustomize

# Verify
kubectl version --client
kubeseal --version
kustomize version
```

`openssl` is already on macOS/Linux (used to generate passwords).

---

## 2. Provision the server and install k3s

SSH into your VM, then install k3s. **k3s ships with Traefik by default, but our
manifests use ingress-nginx**, so we disable Traefik.

```bash
# On the SERVER (SSH in first)
curl -sfL https://get.k3s.io | sh -s - --disable traefik --write-kubeconfig-mode 644

# Check the node is Ready (wait ~30s)
sudo k3s kubectl get nodes
```

**Success:** the node shows `STATUS: Ready`.

### Get the kubeconfig onto your laptop

```bash
# On the SERVER — print the config
sudo cat /etc/rancher/k3s/k3s.yaml
```

Copy it to your laptop, then **replace `127.0.0.1` with `<SERVER_IP>`**:

```bash
# On your LAPTOP
mkdir -p ~/.kube
# paste the file as ~/.kube/aivestire-config, then:
sed -i '' "s/127.0.0.1/<SERVER_IP>/" ~/.kube/aivestire-config   # macOS
export KUBECONFIG=~/.kube/aivestire-config

# Verify you can reach the cluster from your laptop
kubectl get nodes
```

> ⚠️ **Firewall (do this now):** open only **22, 80, 443** to the world. The k3s
> API (`6443`) should be restricted to your IP only. Never expose `5432`/`6379`.
> On most clouds this is a Security Group / firewall rule in the console.

---

## 3. Install the cluster add-ons

Run these from your laptop (KUBECONFIG set). Order matters.

### 3a. ingress-nginx (the HTTP entry point)

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml

# Wait until it's ready
kubectl -n ingress-nginx rollout status deploy/ingress-nginx-controller --timeout=180s
```

**Success:** the controller pod is `Running`. On k3s, its LoadBalancer Service is
auto-exposed on the node's ports 80/443.

### 3b. cert-manager (automatic HTTPS certificates)

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
kubectl -n cert-manager rollout status deploy/cert-manager-webhook --timeout=180s
```

### 3c. sealed-secrets controller (so secrets can be committed safely)

```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/latest/download/controller.yaml
kubectl -n kube-system rollout status deploy/sealed-secrets-controller --timeout=120s
```

### 3d. ArgoCD (the GitOps engine)

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd rollout status deploy/argocd-server --timeout=300s
```

Get the ArgoCD admin password (save it):

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d; echo
```

(Optional) open the ArgoCD UI from your laptop:

```bash
kubectl -n argocd port-forward svc/argocd-server 8081:443
# then visit https://localhost:8081  (user: admin)
```

---

## 4. Create the application namespace

The secrets must be sealed **for this namespace**, so create it first.

```bash
kubectl apply -f infra/k8s/base/namespace.yaml
kubectl get ns aivestire
```

**Success:** namespace `aivestire` exists.

---

## 5. Create the 4 secrets (the most important part)

> **Rule:** plain secrets NEVER get committed. We create a plain secret locally,
> pipe it through `kubeseal` (which encrypts it with the cluster's public key),
> and commit only the **encrypted** SealedSecret. Only your cluster can decrypt it.

First, generate strong passwords and **save them somewhere safe** — you'll reuse
the same Postgres/Redis passwords in the backend secret:

```bash
PG_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"
REDIS_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"
JWT="$(openssl rand -hex 32)"
ADMIN_JWT="$(openssl rand -hex 32)"
echo "PG_PASS=$PG_PASS"; echo "REDIS_PASS=$REDIS_PASS"; echo "JWT=$JWT"; echo "ADMIN_JWT=$ADMIN_JWT"
```

### 5a. postgres-secret

```bash
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER=aivestire \
  --from-literal=POSTGRES_PASSWORD="$PG_PASS" \
  --from-literal=POSTGRES_DB=aivestire \
  --namespace aivestire --dry-run=client -o yaml \
  | kubeseal --format yaml --namespace aivestire \
  > infra/k8s/base/secrets/postgres-sealed-secret.yaml
```

### 5b. redis-secret

```bash
kubectl create secret generic redis-secret \
  --from-literal=REDIS_PASSWORD="$REDIS_PASS" \
  --namespace aivestire --dry-run=client -o yaml \
  | kubeseal --format yaml --namespace aivestire \
  > infra/k8s/base/secrets/redis-sealed-secret.yaml
```

### 5c. backend-secret

`DATABASE_URL` must use the **same** `$PG_PASS`, and `REDIS_PASSWORD` the **same**
`$REDIS_PASS`. Replace every `your-...` value with your real provider keys.

```bash
kubectl create secret generic backend-secret \
  --from-literal=DATABASE_URL="postgresql://aivestire:${PG_PASS}@postgres:5432/aivestire" \
  --from-literal=JWT_SECRET="$JWT" \
  --from-literal=JWT_EXPIRATION_TIME="24h" \
  --from-literal=JWT_REFRESH_EXPIRATION_TIME="7d" \
  --from-literal=ADMIN_JWT_SECRET="$ADMIN_JWT" \
  --from-literal=ADMIN_SECRET="$(openssl rand -hex 16)" \
  --from-literal=REDIS_PASSWORD="$REDIS_PASS" \
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
  --namespace aivestire --dry-run=client -o yaml \
  | kubeseal --format yaml --namespace aivestire \
  > infra/k8s/base/secrets/backend-sealed-secret.yaml
```

### 5d. registry-secret (so the cluster can pull private images from GHCR)

Create a GitHub token first: **GitHub → Settings → Developer settings → Personal
access tokens → Fine-grained → scope: `Packages: read`**. That's your `<GHCR_PAT>`.

```bash
kubectl create secret docker-registry registry-secret \
  --docker-server=ghcr.io \
  --docker-username=<GH_USERNAME> \
  --docker-password=<GHCR_PAT> \
  --docker-email=admin@aivestire.com \
  --namespace aivestire --dry-run=client -o yaml \
  | kubeseal --format yaml --namespace aivestire \
  > infra/k8s/base/secrets/registry-secret.yaml      # overwrites the placeholder
```

### 5e. Tell kustomize about the 3 new secret files

Open [`infra/k8s/base/kustomization.yaml`](k8s/base/kustomization.yaml) and
**uncomment** these three lines (they're already there, commented):

```yaml
  - secrets/postgres-sealed-secret.yaml
  - secrets/redis-sealed-secret.yaml
  - secrets/backend-sealed-secret.yaml
  - secrets/registry-secret.yaml
```

### 5f. Commit the SealedSecrets

They are encrypted — safe to commit.

```bash
git add infra/k8s/base/secrets/*.yaml infra/k8s/base/kustomization.yaml
git commit -m "chore(k8s): add sealed secrets for aivestire"
```

> ✅ **Sanity check before pushing:** run `kustomize build infra/k8s/overlays/test
> > /dev/null && echo OK`. If it says `OK`, the manifests render.

---

## 6. Configure GitHub (Actions + GHCR)

1. **Actions write permission** — Repo → **Settings → Actions → General →
   Workflow permissions** → select **“Read and write permissions”** → Save.
   (The CD job commits image tags back to the `test` branch.)

2. **The one required Actions secret** — Repo → **Settings → Secrets and variables
   → Actions → New repository secret**:
   - Name: `VITE_GOOGLE_CLIENT_ID`
   - Value: your Google OAuth **client-side** ID (the public one used in the browser).

3. **GHCR is automatic** — the workflow logs in with the built-in `GITHUB_TOKEN`,
   so no extra registry secret is needed for *pushing*. After the first build,
   make the 4 packages **public** *or* keep them private (the cluster pulls them
   with `registry-secret` from Step 5d). Find them at
   `https://github.com/orgs/AiCoreRepo/packages`.

---

## 7. Confirm the server IP (only if it's not 94.136.189.250)

The domain and TLS host are hardcoded to `94.136.189.250.nip.io`. If your server
IP is different, update it in **two files**, commit, and push:

- [`infra/k8s/base/ingress/ingress.yaml`](k8s/base/ingress/ingress.yaml) — `tls.hosts` and `rules.host`
- (the email in [`clusterissuer.yaml`](k8s/base/ingress/clusterissuer.yaml) is already set to `admin@aivestire.com`)

`nip.io` magic: `<SERVER_IP>.nip.io` automatically resolves to `<SERVER_IP>` — no
DNS setup needed. When you buy a real domain later, point an A record at the IP
and swap the host here.

---

## 8. Push everything and bootstrap ArgoCD

```bash
# Push your branch (secrets + any IP change)
git push origin test

# Bootstrap ArgoCD to watch the repo (run ONCE)
kubectl apply -f infra/k8s/argocd/app-test.yaml
```

**Success:** `kubectl -n argocd get applications` shows `aivestire-test`.
ArgoCD now pulls `infra/k8s/overlays/test` from the `test` branch and applies it.

---

## 9. Trigger the first build (CI → CD → ArgoCD)

Any push to `test` that touches app code triggers the pipeline. To force a first
full build, make a trivial change (or just re-run the latest CI from the Actions
tab). Watch the stages:

1. **CI** (`CI — Build & Test`) — Actions tab → must finish **green**.
2. **CD** (`CD — Build Images & Deploy to K8s`) — starts automatically after CI
   succeeds on a **push**. It builds only the services that changed, pushes to
   GHCR, and commits new tags to `infra/k8s/overlays/test/kustomization.yaml`.
3. **ArgoCD** — within ~3 min it syncs the new tags to the cluster.

Watch ArgoCD and pods live:

```bash
watch kubectl -n aivestire get pods
# or, in the ArgoCD UI, the aivestire-test app turns Healthy + Synced
```

---

## 10. Verify the deployment

```bash
# All pods should be Running / Completed (backup job)
kubectl -n aivestire get pods

# TLS certificate issued? (READY must be True — can take 1-2 min)
kubectl -n aivestire get certificate
kubectl -n aivestire describe certificate aivestire-tls   # if not ready, read events

# Ingress has an address?
kubectl -n aivestire get ingress
```

Then hit the site:

```bash
# Frontend (the SPA)
curl -kI https://94.136.189.250.nip.io/

# API through the frontend nginx (note: /api is stripped before the backend)
curl -k  https://94.136.189.250.nip.io/api/health
```

**Success:** the frontend returns `200`, `/api/health` returns the backend's
health JSON, and the certificate is `READY=True`. Open the domain in a browser.

---

## 11. How the pieces connect (so you understand it)

- **Ingress** routes **everything** to the frontend nginx (`frontend:8080`). That
  nginx is the real router (see `APP3005/frontend/nginx.conf`):
  - `/api/*` → strips `/api` → `backend:3000` (the NestJS app has **no** `/api`
    prefix, which is why the strip matters).
  - `/ai/body` → `body-analyzer:8898`, `/ai/recommend` → `recommendation-api:8799`.
  - everything else → the React `index.html`.
- **Service discovery** is by name inside the namespace: `backend`, `redis`,
  `postgres`, `body-analyzer`, `recommendation-api` all resolve via cluster DNS.
- **backend → postgres** via `DATABASE_URL` (host `postgres:5432`); **backend +
  worker → redis** via `REDIS_HOST=redis`. These names come from the Services.
- **Secrets** are injected as env vars: the backend pulls all of `backend-secret`
  via `envFrom`; postgres/redis read their passwords from their own secrets.
- **NetworkPolicies** ensure only the API + worker (and the backup job) can reach
  Postgres/Redis — nothing else in the namespace can.

---

## 12. Day-2 operations (keep this handy)

**Deploy a code change:** just `git push origin test`. The pipeline does the rest.

**Roll back a bad deploy:**
```bash
# Option A: revert the image-tag commit and push
git revert <the "ci(k8s): update image tags" commit> && git push origin test
# Option B: in the ArgoCD UI → History → roll back to a previous Synced revision
```

**Restart a service** (e.g. after rotating a secret — pods don't auto-reload env):
```bash
kubectl -n aivestire rollout restart deploy/backend deploy/backend-worker
```

**Rotate a secret:** re-run the matching `kubeseal` command from Step 5 with the
new value, commit, push (ArgoCD applies it), then `rollout restart` the consumers.

**Tail logs:**
```bash
kubectl -n aivestire logs -f deploy/backend
kubectl -n aivestire logs -f deploy/recommendation-api
```

**Run a manual DB backup now** (the CronJob runs daily at 02:00 anyway):
```bash
kubectl -n aivestire create job --from=cronjob/postgres-backup manual-backup-1
kubectl -n aivestire logs -f job/manual-backup-1
```

**Restore from a backup:** copy the chosen `*.sql.gz` into the postgres pod and
`gunzip -c file.sql.gz | psql -U aivestire -d aivestire` (see the header in
[`postgres/backup-cronjob.yaml`](k8s/base/postgres/backup-cronjob.yaml)).

---

## 13. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Pod `CreateContainerConfigError` / `secret not found` | A SealedSecret wasn't created/committed, or kustomization line not uncommented | Re-do Step 5; confirm `kubectl -n aivestire get secret` lists `postgres-secret`, `redis-secret`, `backend-secret`, `registry-secret` |
| Pod `ImagePullBackOff` | `registry-secret` wrong, or package is private and token lacks `read:packages` | Re-create Step 5d, or make the GHCR package public |
| Pod `Pending` | Quota or node out of resources | `kubectl -n aivestire describe pod <name>` → read the event at the bottom |
| `/api/...` returns 404 | You hit the backend directly instead of through the frontend nginx | Always call `https://<host>/api/...` (the Ingress sends it to the frontend, which strips `/api`) |
| Certificate not `Ready` | Port 80 not reachable from internet (Let's Encrypt HTTP-01) | Open port 80; `kubectl -n aivestire describe certificaterequest` for the ACME error |
| CD didn't run after CI | CI ran on a PR, not a push | CD only deploys on **push** to `test` (security). Push to the branch directly. |
| ArgoCD `OutOfSync` and won't apply | Manual cluster edits | ArgoCD self-heals from git — change things in git, not with `kubectl edit` |

---

## 14. Security follow-ups (do these soon — see the review)

- [ ] **Firewall**: expose only 80/443 (+ SSH); restrict k3s API `6443`; never expose `5432`/`6379`.
- [ ] **Pin GitHub Actions to commit SHAs** (not floating `@v4` tags).
- [ ] **Add a Trivy image scan** gate in CI; flip `provenance: true` + SBOM in the build steps.
- [ ] **Ship `/backups` offsite** (restic/rclone → S3/GCS) — current dumps are on the same node.
- [ ] Consider a managed Postgres + a second node if uptime matters (single node = single point of failure).

---

## 15. Command cheat-sheet

```bash
export KUBECONFIG=~/.kube/aivestire-config

kubectl -n aivestire get pods,svc,ingress,certificate     # overall health
kubectl -n argocd get applications                        # GitOps status
kubectl -n aivestire logs -f deploy/backend               # logs
kubectl -n aivestire rollout restart deploy/backend       # reload env/secret
kustomize build infra/k8s/overlays/test | less            # see final manifests
```

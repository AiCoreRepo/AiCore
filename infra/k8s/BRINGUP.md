# Cluster Bring-up, ArgoCD/CI-CD & Observing with Lens

Goal of this doc: get **all pods running** via **CI/CD → ArgoCD**, with secrets
delivered safely, **no domain/TLS yet** (plain HTTP on the node IP), and a way to
**watch everything in Lens**. For the one-time cluster install (k3s, ingress-nginx,
cert-manager, sealed-secrets, ArgoCD) see [DEPLOYMENT.md](../DEPLOYMENT.md) §2–3.

Fixed values: org `AiCoreRepo` · images `ghcr.io/aicorerepo/*` · branch `test`
· namespace `aivestire`.

---

## 1. The CI/CD pipeline (what runs, when)

Two workflows, chained. **CI proves the code is good; CD builds, pushes, and writes
the new image tags into git; ArgoCD applies them.** You never `kubectl apply` app
updates by hand.

**`ci.yml` — on push/PR to `test`:**
| Job | What it does |
|---|---|
| `changes` | detects which paths changed (skips unneeded work) |
| `test-backend` | **TEST** — `npm ci` → build (prisma+nest) → unit tests → boots the API against throwaway Postgres/Redis → health smoke check |
| `lint-backend` | lint (non-blocking) |
| `ci-status` | the gate — green only if tests passed (or were correctly skipped) |

**`cd-k8s.yml` — auto-triggered when CI succeeds on a push (`workflow_run`):**
| Job | What it does |
|---|---|
| `guard` | runs only if CI `conclusion == success` **and** `event == push` (PRs never deploy) |
| `detect-changes` | which of the 4 services changed |
| `build-backend / build-frontend / build-body-analyzer / build-recommendation-api` | **BUILD + PUSH** each changed image to GHCR (parallel, per-service layer cache) |
| `update-manifests` | **DEPLOY** — `kustomize edit set image` writes the new SHA tags into `overlays/test/kustomization.yaml` and commits `[skip ci]` |

That commit is what ArgoCD watches → it syncs the new tags to the cluster.

> Pipeline is already wired correctly — nothing to change. You only need GitHub set
> up: Settings → Actions → **Read and write permissions**, and the
> `VITE_GOOGLE_CLIENT_ID` Actions secret (DEPLOYMENT.md §6).

---

## 2. Order of operations (do this once, in order)

The chicken-and-egg to remember: **ArgoCD can apply manifests immediately, but pods
only become `Running` once (a) their images exist in GHCR and (b) their Secrets
exist in the cluster.** So:

1. Cluster + add-ons installed (DEPLOYMENT.md §2–3).
2. **Apply the Secrets** to the cluster → §4 below.
3. **Connect ArgoCD to GitHub** (private repo creds) → §3 below.
4. **Produce the first images**: push any commit to `test` → CI → CD builds & pushes
   the 4 images and updates the tags. Confirm in `https://github.com/orgs/AiCoreRepo/packages`.
5. **Apply the ArgoCD Application** → it syncs everything:
   ```bash
   kubectl apply -f infra/k8s/argocd/app-test.yaml
   ```
6. **Watch + verify** → §5 (kubectl) and §6 (Lens).
7. **Open the app over HTTP** → §7.

---

## 3. Connect ArgoCD to GitHub (private repo)

`AiCoreRepo/AiCore` is private, so ArgoCD needs read credentials or it will show
`ComparisonError: authentication required`. Add a repo credential as a labeled
Secret (no argocd CLI needed). Use a GitHub PAT with **`repo` read / Contents:read**:

```bash
kubectl -n argocd create secret generic aivestire-repo \
  --from-literal=type=git \
  --from-literal=url=https://github.com/AiCoreRepo/AiCore \
  --from-literal=username=<GH_USERNAME> \
  --from-literal=password=<GH_PAT_repo_read>
kubectl -n argocd label secret aivestire-repo argocd.argoproj.io/secret-type=repository
```

Then apply the app (step 5 above). Verify the connection:
```bash
kubectl -n argocd get application aivestire-test \
  -o jsonpath='{.status.sync.status}{" / "}{.status.health.status}{"\n"}'
# want: Synced / Healthy
```

> Open the ArgoCD UI to watch syncs live:
> `kubectl -n argocd port-forward svc/argocd-server 8081:443` → https://localhost:8081
> (user `admin`, password: `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d`).

---

## 4. Provide secrets to pods (safely)

Secrets are **never in git** — only encrypted SealedSecrets, kept in your private
store `~/aivestire-sealed-secrets-private/` (created earlier). Apply them straight to
the cluster; the sealed-secrets controller decrypts each into a normal `Secret`:

```bash
kubectl apply -f ~/aivestire-sealed-secrets-private/postgres-sealed-secret.yaml
kubectl apply -f ~/aivestire-sealed-secrets-private/redis-sealed-secret.yaml
kubectl apply -f ~/aivestire-sealed-secrets-private/backend-sealed-secret.yaml
kubectl apply -f ~/aivestire-sealed-secrets-private/registry-sealed-secret.yaml

# Confirm the decrypted Secrets now exist:
kubectl -n aivestire get secret postgres-secret redis-secret backend-secret registry-secret
```

How each pod consumes them (already wired in the manifests — nothing to do):
- **postgres** → `secretKeyRef` from `postgres-secret` (user/pass/db)
- **redis** → `secretKeyRef` from `redis-secret` (password; probes use `REDISCLI_AUTH`)
- **backend / backend-worker** → `envFrom` the whole `backend-secret`
- **all images** → `imagePullSecrets: registry-secret` to pull from private GHCR

Because these are applied by hand (not in the kustomization), ArgoCD does **not**
manage or prune them — they persist independently. If you make the GHCR packages
public you can skip `registry-secret`.

---

## 5. Verify Kubernetes is correct (kubectl)

```bash
export KUBECONFIG=~/.kube/aivestire-config

# Everything in one shot
kubectl -n aivestire get all,pvc,ingress,netpol

# Pods — all should reach Running (StatefulSets first, then apps)
kubectl -n aivestire get pods -o wide
# Deployments (apps) — want READY 1/1 each
kubectl -n aivestire get deploy
# StatefulSets (postgres, redis) — want READY 1/1
kubectl -n aivestire get statefulset
# PVCs — postgres-data (50Gi), redis-data (5Gi), postgres-backups (10Gi) → Bound
kubectl -n aivestire get pvc
# Services — 4 ClusterIP + 2 headless (postgres/redis show CLUSTER-IP None)
kubectl -n aivestire get svc
# Ingress — has an ADDRESS (the node IP) once ingress-nginx assigns it
kubectl -n aivestire get ingress
```

What "correct" looks like:
- **5 Deployments** `1/1`: backend, backend-worker, body-analyzer, frontend, recommendation-api
- **2 StatefulSets** `1/1`: postgres, redis (each with its own bound PVC)
- **6 Services**: backend/frontend/body-analyzer/recommendation-api = ClusterIP;
  postgres/redis = `CLUSTER-IP None` (headless → stable pod DNS)
- **1 Ingress** routing `/` → `frontend:8080`
- **2 NetworkPolicies** (postgres/redis locked to api+worker)

If a pod is stuck, the reason is almost always images or secrets:
```bash
kubectl -n aivestire describe pod <name> | tail -25   # read the Events
kubectl -n aivestire logs <name>
```

---

## 6. See it all in Lens (visual)

**Install:**
```bash
brew install --cask lens        # Lens Desktop
# free fully-OSS alternative: brew install --cask openlens
```

**Connect the cluster:**
1. Make sure your kubeconfig points at the server (DEPLOYMENT.md §2 — `127.0.0.1`
   replaced with the node IP).
2. Lens → **Catalog → Clusters → + (Add) → "Add from kubeconfig"** → paste the
   contents of `~/.kube/aivestire-config` (or it auto-detects `~/.kube/config`).
3. Click the cluster to connect.

**Where to look (select namespace `aivestire` in the top filter):**
- **Workloads → Pods** — live status, restart counts, click a pod → **Logs** and
  **Shell** (exec) right in the UI.
- **Workloads → Deployments / StatefulSets** — replica health; scale with a slider.
- **Config → Secrets** — confirm `postgres/redis/backend/registry-secret` exist.
- **Network → Services** — see ClusterIP vs headless; **Network → Ingress** — routing.
- **Storage → Persistent Volume Claims** — the three PVCs, `Bound`.
- **Network → Network Policies** — the two data-tier locks.

> Live CPU/RAM graphs in Lens need metrics-server:
> `kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml`
> then (k3s self-signed kubelet certs) add `--kubelet-insecure-tls` to its args, or
> just rely on `kubectl top` once it's up.

---

## 7. Access the app (HTTP, no domain)

The Ingress is host-less HTTP, so it answers on the node IP directly — no DNS:
```bash
curl -I  http://<NODE_IP>/            # frontend SPA → 200
curl     http://<NODE_IP>/api/health  # routed through frontend nginx → backend
# in a browser:  http://<NODE_IP>/
```
`http://<NODE_IP>.nip.io/` works too. **Add a real domain + HTTPS later** by following
the commented steps in `infra/k8s/base/ingress/ingress.yaml` (install cert-manager,
re-add `clusterissuer.yaml`, uncomment the tls block + annotations).

---

## 8. Replicas & scaling

Every workload is `replicas: 1` on purpose — a single 6 vCPU / 12 GB node. Requests
sum to ~1.9 vCPU / ~4.4 GB, so there's headroom but not for big horizontal scaling
(the AI services alone want 1–1.5 GB each). To scale a stateless app when the node
allows:
```bash
kubectl -n aivestire scale deploy/frontend --replicas=2
```
Don't scale postgres/redis (single-writer; they're StatefulSets with one PVC each).
For real horizontal scale, add a node and/or move Postgres to a managed DB first.

---

## 9. Quick troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| ArgoCD `authentication required` | private repo, no creds | §3 repo secret |
| Pod `ImagePullBackOff` | image not built yet, or `registry-secret` missing/wrong | run CD (push to `test`); re-apply §4; or make GHCR packages public |
| Pod `CreateContainerConfigError` | a Secret isn't applied | §4 — apply the sealed secrets |
| App pod `Pending` | quota/resources | `kubectl -n aivestire describe pod <name>` → Events |
| Ingress has no ADDRESS | ingress-nginx not installed | DEPLOYMENT.md §3a |
| `/api/...` 404 | called the backend directly | always go through `http://<NODE_IP>/api/...` |
| ArgoCD keeps reverting a manual change | `selfHeal: true` | change it in git, not with `kubectl edit` |

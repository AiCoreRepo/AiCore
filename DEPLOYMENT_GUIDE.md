# 🚀 Deployment Guide: GitHub Actions + GCP VM + Docker Compose

This repo now uses:

- CI checks on `pull_request` to `recommendation_model` and `uat-server`.
- Deploy to a GCP VM via SSH on `push` to `recommendation_model` and `uat-server` after CI passes.
- Server deployment is done using your existing `docker-compose.yml`.

## Required GitHub secrets/variables

- `GCP_INSTANCE_HOST` (secret): Public IP/DNS for dev VM (`recommendation_model` branch fallback).
- `GCP_INSTANCE_USER` (secret): SSH user for dev VM.
- `GCP_INSTANCE_SSH_KEY` (secret): Private SSH key for dev VM.
- `GCP_UAT_INSTANCE_HOST` (secret): Public IP/DNS for UAT VM (`uat-server` branch).
- `GCP_UAT_INSTANCE_USER` (secret): SSH user for UAT VM.
- `GCP_UAT_INSTANCE_SSH_KEY` (secret): Private SSH key for UAT VM.
- `GCP_DEPLOY_PATH` (variable): Absolute path on dev VM containing the checked-out repository.
- `GCP_UAT_DEPLOY_PATH` (variable): Absolute path on UAT VM containing the checked-out repository.
- `GCP_SERVER_BASE_URL` (variable): Public URL for post-deploy API checks for dev branch.
- `GCP_UAT_SERVER_BASE_URL` (variable): Public URL for post-deploy API checks for UAT (for example `https://uat.aivestire.com`).
- `GCP_COMPOSE_FILE` (optional variable): Compose filename under deploy path. Defaults to `docker-compose.yml` if omitted.
- `GCP_UAT_COMPOSE_FILE` (optional variable): Compose filename for UAT VM.
- `GCP_COMPOSE_SERVICES` (optional variable): Space-separated services to deploy on dev.
- `GCP_UAT_COMPOSE_SERVICES` (optional variable): Space-separated services to deploy on UAT.
- `GCP_BACKEND_ENV_B64` (secret): Base64 `.env` content for backend on dev.
- `GCP_UAT_BACKEND_ENV_B64` (secret): Base64 `.env` content for backend on UAT.
- `GCP_SERVICE_ACCOUNT_JSON_B64` (optional secret): Base64-encoded Google service account JSON for dev.
- `GCP_UAT_SERVICE_ACCOUNT_JSON_B64` (optional secret): Base64-encoded Google service account JSON for UAT.
- `GCP_USE_LOCAL_INFRA` (optional variable): Set `true|false` to control db/redis compose defaults on dev.
- `GCP_UAT_USE_LOCAL_INFRA` (optional variable): Set `true|false` for UAT.

## CI checks included

- Backend install/test/build/lint.
- Local API smoke checks (`/`, `/health`, `/api/v1/tryon/health`).

## Server-side requirements

- VM has Docker and Docker Compose installed.
- VM has this repository checked out at `GCP_DEPLOY_PATH`.
- VM can authenticate pull/fetch for the repo when `git fetch/reset` runs.

## Deployment behavior

`deploy` job runs:

1. SSH into VM using provided host/user/key.
2. `git fetch` + `git reset --hard origin/<branch>` in `GCP_DEPLOY_PATH`.
3. Rewrite backend `.env` and inject `GOOGLE_SERVICE_ACCOUNT_JSON_B64` when the optional secret is configured.
4. `docker compose -f <compose file> pull`.
5. `docker compose -f <compose file> up -d --build <services>` (default includes `backend frontend body-analyzer recommendation-api`).
6. Post-deploy health checks against `GCP_SERVER_BASE_URL`.

## Notes

- If you want zero-bootstrapping on new VM, keep `GCP_DEPLOY_PATH` on a persistent volume and pre-clone the repository.
- If your VM is behind a reverse proxy and API base is not directly reachable, set `GCP_SERVER_BASE_URL` accordingly.
- To keep `docker compose down && docker compose up -d` working on the VM, store the Vertex credentials in `GCP_SERVICE_ACCOUNT_JSON_B64` / `GCP_UAT_SERVICE_ACCOUNT_JSON_B64` instead of relying on a manually copied `service_account.json` file.

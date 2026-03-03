# 🚀 Deployment Guide: GitHub Actions + GCP VM + Docker Compose

This repo now uses:

- CI checks on `pull_request` to `recommendation_model`.
- Deploy to a GCP VM via SSH on `push` to `recommendation_model` only after CI passes.
- Server deployment is done using your existing `docker-compose.yml`.

## Required GitHub secrets/variables

- `GCP_INSTANCE_HOST` (secret): Public IP or DNS of the VM.
- `GCP_INSTANCE_USER` (secret): SSH username on the VM.
- `GCP_INSTANCE_SSH_KEY` (secret): Private SSH key content (`-----BEGIN...` to `-----END...`).
- `GCP_DEPLOY_PATH` (variable): Absolute path on VM containing the checked-out repository.
- `GCP_SERVER_BASE_URL` (variable): Public URL for post-deploy API checks (for example `https://api.yourdomain.com`).
- `GCP_COMPOSE_FILE` (optional variable): Compose filename under deploy path. Defaults to `docker-compose.yml` if omitted.
- `GCP_COMPOSE_SERVICES` (optional variable): Space-separated services to deploy. Default is `backend frontend body-analyzer recommendation-api` (so recommendation model service is kept).

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
2. `git fetch` + `git reset --hard origin/recommendation_model` in `GCP_DEPLOY_PATH`.
3. `docker compose -f <compose file> pull`.
4. `docker compose -f <compose file> up -d --build <services>` (default includes `backend frontend body-analyzer recommendation-api`).
5. Post-deploy health checks against `GCP_SERVER_BASE_URL`.

## Notes

- If you want zero-bootstrapping on new VM, keep `GCP_DEPLOY_PATH` on a persistent volume and pre-clone the repository.
- If your VM is behind a reverse proxy and API base is not directly reachable, set `GCP_SERVER_BASE_URL` accordingly.

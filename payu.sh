#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_OVERRIDE_FILE="$ROOT_DIR/docker-compose.payu-test.override.yml"

usage() {
  cat <<'EOF'
Usage:
  bash payu.sh local up
  bash payu.sh dev up
  bash payu.sh prod up

  bash payu.sh <local|dev|prod> down
  bash payu.sh <local|dev|prod> build
  bash payu.sh <local|dev|prod> logs [tail]
  bash payu.sh <local|dev|prod> ps
  bash payu.sh <local|dev|prod> env
  bash payu.sh <local|dev|prod> seed-test-product
  bash payu.sh help

Examples:
  bash payu.sh local up
  bash payu.sh dev logs 200
  bash payu.sh prod env
  bash payu.sh dev seed-test-product
EOF
}

selected_env="${1:-help}"

case "$selected_env" in
  local|dev|prod)
    ;;
  help|-h|--help)
    usage
    exit 0
    ;;
  *)
    echo "Unknown environment: $selected_env" >&2
    usage >&2
    exit 1
    ;;
esac

ENV_FILE="$ROOT_DIR/.env.payu-$selected_env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

compose() {
  docker compose \
    --env-file "$ENV_FILE" \
    -f "$ROOT_DIR/docker-compose.yml" \
    -f "$COMPOSE_OVERRIDE_FILE" \
    "$@"
}

should_no_cache_build() {
  [[ "$selected_env" == "dev" || "$selected_env" == "prod" ]]
}

command="${2:-up}"

case "$command" in
  up)
    if should_no_cache_build; then
      compose build --no-cache backend backend-worker frontend
    fi
    compose up -d --force-recreate backend backend-worker frontend
    ;;
  down)
    compose down
    ;;
  build)
    if should_no_cache_build; then
      compose build --no-cache backend backend-worker frontend
    else
      compose build backend backend-worker frontend
    fi
    ;;
  logs)
    tail_lines="${3:-50}"
    compose logs -f --tail="$tail_lines" backend
    ;;
  ps)
    compose ps
    ;;
  env)
    docker exec nest-server printenv | grep -E '^(PAYU_ENV|PAYU_KEY|PAYU_SALT|PAYU_SUCCESS_URL|PAYU_FAILURE_URL|FRONTEND_URL)='
    ;;
  seed-test-product)
    compose exec backend node scripts/seed-one-rupee-product.js
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "Unknown command: $command" >&2
    usage >&2
    exit 1
    ;;
esac

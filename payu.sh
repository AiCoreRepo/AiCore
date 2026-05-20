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
  bash payu.sh <local|dev|prod> logs [tail] [services...]
  bash payu.sh <local|dev|prod> ps
  bash payu.sh <local|dev|prod> env [services...]
  bash payu.sh <local|dev|prod> seed-test-product
  bash payu.sh help

Examples:
  bash payu.sh local up
  bash payu.sh dev logs 200
  bash payu.sh dev logs 200 backend-worker
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

env_file_payment_mode="$(
  grep -E '^PAYU_ENV_OVERRIDE=' "$ENV_FILE" 2>/dev/null \
    | tail -n 1 \
    | cut -d= -f2- \
    | tr -d "\"'" \
    || true
)"
payment_mode="${PAYU_ENV_OVERRIDE:-$env_file_payment_mode}"
payment_mode="${payment_mode:-test}"

if [[ "$selected_env" != "prod" && ! "$payment_mode" =~ ^(test|sandbox)$ ]]; then
  echo "Refusing to run $selected_env with PAYU_ENV_OVERRIDE=$payment_mode. Payments must stay in PayU test mode outside prod." >&2
  echo "Use PAYU_VPA_ENV_OVERRIDE/PAYU_VPA_KEY_OVERRIDE/PAYU_VPA_SALT_OVERRIDE for live UPI verification only." >&2
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

default_debug_services=(backend backend-worker)

print_service_env() {
  local service="$1"
  echo "=== $service ==="
  compose exec -T "$service" /bin/sh -lc \
    "printenv | grep -E '^(PAYU_ENV|PAYU_KEY|PAYU_SALT|PAYU_VPA_ENV|PAYU_VPA_KEY|PAYU_VPA_SALT|PAYU_SUCCESS_URL|PAYU_FAILURE_URL|FRONTEND_URL|TWILIO_ACCOUNT_SID|TWILIO_PHONE_NUMBER|SKIP_TWILIO|SKIP_SMS_IN_DEV|REDIS_HOST|REDIS_PORT|REDIS_URL)=' | sort | sed -E 's/^(PAYU(_VPA)?_(KEY|SALT)=).+$/\1****/' || true"
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
    if [[ "${3:-}" =~ ^[0-9]+$ ]]; then
      tail_lines="$3"
      services=("${@:4}")
    else
      tail_lines="50"
      services=("${@:3}")
    fi

    if [[ "${#services[@]}" -eq 0 ]]; then
      services=("${default_debug_services[@]}")
    fi

    compose logs -f --tail="$tail_lines" "${services[@]}"
    ;;
  ps)
    compose ps
    ;;
  env)
    services=("${@:3}")

    if [[ "${#services[@]}" -eq 0 ]]; then
      services=("${default_debug_services[@]}")
    fi

    for service in "${services[@]}"; do
      print_service_env "$service"
    done
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

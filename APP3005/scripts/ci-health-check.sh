#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:3000}"
ENDPOINTS_RAW="${API_HEALTH_ENDPOINTS:-/,/api/v1/tryon/health}"
TIMEOUT_SECONDS="${HEALTH_CHECK_TIMEOUT_SECONDS:-5}"
MAX_RETRIES="${HEALTH_CHECK_MAX_RETRIES:-18}"
RETRY_DELAY_SECONDS="${HEALTH_CHECK_RETRY_DELAY_SECONDS:-3}"
REQUIRE_HEALTH_FIELD="${REQUIRE_HEALTH_FIELD:-true}"
REQUIRE_HEALTH_TRUE="${REQUIRE_HEALTH_TRUE:-false}"

cleanup() {
  local status=$?
  if [ -n "${BACKEND_PID-}" ] && ps -p "$BACKEND_PID" > /dev/null 2>&1; then
    kill "$BACKEND_PID" || true
    wait "$BACKEND_PID" || true
  fi
  exit "$status"
}
trap cleanup EXIT INT TERM

read -r -a ENDPOINTS <<< "$(echo "$ENDPOINTS_RAW" | tr ',' '\n' | xargs -n1 | tr '\n' ' ')"

if [ ${#ENDPOINTS[@]} -eq 0 ]; then
  echo "No API_HEALTH_ENDPOINTS configured."
  exit 1
fi

for endpoint in "${ENDPOINTS[@]}"; do
  if [ -z "$endpoint" ]; then
    continue
  fi

  endpoint_url="${API_BASE_URL%/}${endpoint}"
  echo "Checking endpoint: $endpoint_url"

  for attempt in $(seq 1 "$MAX_RETRIES"); do
    tmp_body=$(mktemp)
    status=$(curl -sS --max-time "$TIMEOUT_SECONDS" -o "$tmp_body" -w '%{http_code}' "$endpoint_url" || echo "000")

    if [[ "$status" =~ ^2[0-9][0-9]$ ]]; then
      if [[ "$endpoint" == *"health"* ]] && [[ "$REQUIRE_HEALTH_FIELD" == "true" ]]; then
        if ! python3 - "$tmp_body" "$REQUIRE_HEALTH_TRUE" <<'PY'
import json
import sys

body_path = sys.argv[1]
require_true = sys.argv[2].lower() == "true"

try:
    with open(body_path, "r", encoding="utf-8") as f:
        payload = json.load(f)
except (OSError, ValueError) as exc:
    print(f"Health endpoint is not valid JSON: {exc}")
    sys.exit(1)

if "healthy" not in payload:
    print('Health payload does not contain "healthy" field.')
    sys.exit(1)

if require_true and not payload.get("healthy"):
    print('Health endpoint returned healthy=false.')
    sys.exit(1)

print('Health payload validated.')
PY
        ; then
          rm -f "$tmp_body"
          echo "Endpoint reachable: $endpoint_url"
          break
        fi
      else
        rm -f "$tmp_body"
        echo "Endpoint reachable: $endpoint_url"
        break
      fi
    fi

    rm -f "$tmp_body"

    if [ "$attempt" -ge "$MAX_RETRIES" ]; then
      echo "Endpoint $endpoint_url failed with status $status after $MAX_RETRIES attempts"
      exit 1
    fi

    echo "Attempt $attempt failed (HTTP $status), retrying in ${RETRY_DELAY_SECONDS}s..."
    sleep "$RETRY_DELAY_SECONDS"
  done

done

echo "All API checks passed."

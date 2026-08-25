#!/usr/bin/env sh
# Temporary local keepalive for Render free-tier spin-down (~15 min idle).
# Usage:
#   BACKEND_URL=https://your-api.onrender.com ./scripts/keep-render-awake.sh
# Optional:
#   INTERVAL_SEC=600 PROCESSOR_URL=https://your-processor.onrender.com ./scripts/keep-render-awake.sh
# Stop with Ctrl+C. Prefer the GitHub Action for 24/7 pings.

set -eu

BACKEND_URL="${BACKEND_URL:-${NEXT_PUBLIC_API_URL:-}}"
PROCESSOR_URL="${PROCESSOR_URL:-}"
INTERVAL_SEC="${INTERVAL_SEC:-600}"

if [ -z "$BACKEND_URL" ]; then
  echo "Set BACKEND_URL (or NEXT_PUBLIC_API_URL) to your Render API origin." >&2
  exit 1
fi

BACKEND_URL="${BACKEND_URL%/}"
INTERVAL_SEC=$(printf '%s' "$INTERVAL_SEC" | tr -cd '0-9')
if [ -z "$INTERVAL_SEC" ] || [ "$INTERVAL_SEC" -lt 60 ]; then
  echo "INTERVAL_SEC must be an integer >= 60 (got: ${INTERVAL_SEC:-empty})" >&2
  exit 1
fi

ping_one() {
  label=$1
  url=$2
  if curl -fsS --connect-timeout 10 --max-time 90 "$url" >/dev/null; then
    echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') ok  $label  $url"
  else
    echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') fail $label  $url" >&2
  fi
}

echo "Pinging every ${INTERVAL_SEC}s (Ctrl+C to stop)"
echo "Backend: $BACKEND_URL/health"
if [ -n "$PROCESSOR_URL" ]; then
  echo "Processor: ${PROCESSOR_URL%/}/health"
fi

while true; do
  ping_one backend "$BACKEND_URL/health"
  if [ -n "$PROCESSOR_URL" ]; then
    ping_one processor "${PROCESSOR_URL%/}/health" || true
  fi
  sleep "$INTERVAL_SEC"
done

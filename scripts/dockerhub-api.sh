#!/usr/bin/env bash
# Shared Docker Hub API auth. Hub management APIs require Bearer JWT, not HTTP Basic.
# docker login can succeed with the same PAT while POST /repositories still returns 401.

dockerhub_login() {
  local username="${DOCKERHUB_USERNAME:?DOCKERHUB_USERNAME required}"
  local secret="${DOCKERHUB_TOKEN:?DOCKERHUB_TOKEN required}"

  local status
  status=$(curl -sS -o /tmp/dh-login.json -w "%{http_code}" \
    -X POST "https://hub.docker.com/v2/auth/token" \
    -H "Content-Type: application/json" \
    -d "{\"identifier\":\"${username}\",\"secret\":\"${secret}\"}")

  if [ "$status" != "200" ]; then
    status=$(curl -sS -o /tmp/dh-login.json -w "%{http_code}" \
      -X POST "https://hub.docker.com/v2/users/login/" \
      -H "Content-Type: application/json" \
      -d "{\"username\":\"${username}\",\"password\":\"${secret}\"}")
  fi

  if [ "$status" != "200" ]; then
    echo "Failed to authenticate with Docker Hub API (HTTP $status)."
    cat /tmp/dh-login.json 2>/dev/null || true
    echo ""
    echo "docker login can work while Hub API calls fail if auth is Basic instead of Bearer."
    echo "Check GitHub secrets:"
    echo "  DOCKERHUB_USERNAME = Hub username (not email)"
    echo "  DOCKERHUB_TOKEN    = Personal Access Token with Read, Write, Delete"
    echo "If 2FA is on, a PAT is required (account password will not work)."
    exit 1
  fi

  DOCKERHUB_BEARER=$(python3 -c "import json; d=json.load(open('/tmp/dh-login.json')); print(d.get('access_token') or d.get('token') or '')")
  if [ -z "$DOCKERHUB_BEARER" ]; then
    echo "Docker Hub login succeeded but no token was returned:"
    cat /tmp/dh-login.json
    exit 1
  fi
}

dockerhub_curl() {
  curl -sS -H "Authorization: Bearer ${DOCKERHUB_BEARER}" "$@"
}

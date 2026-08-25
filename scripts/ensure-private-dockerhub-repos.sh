#!/usr/bin/env bash
# Ensure Docker Hub repositories exist and are PRIVATE. Fails if a repo is public.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dockerhub-api.sh
source "${SCRIPT_DIR}/dockerhub-api.sh"

USERNAME="${DOCKERHUB_USERNAME:?DOCKERHUB_USERNAME required}"
: "${DOCKERHUB_TOKEN:?DOCKERHUB_TOKEN required}"
REPOS=("$@")

if [ ${#REPOS[@]} -eq 0 ]; then
  echo "Usage: ensure-private-repos.sh <repo> [repo...]"
  exit 1
fi

dockerhub_login

ensure_private() {
  local name="$1"
  local api="https://hub.docker.com/v2/namespaces/${USERNAME}/repositories/${name}/"

  echo "Checking ${USERNAME}/${name}..."

  local status
  status=$(dockerhub_curl -o /tmp/dh-repo.json -w "%{http_code}" "$api")

  if [ "$status" = "404" ]; then
    echo "Creating private repo ${USERNAME}/${name}..."
    local create_status
    create_status=$(dockerhub_curl -o /tmp/dh-create.json -w "%{http_code}" \
      -X POST "https://hub.docker.com/v2/namespaces/${USERNAME}/repositories" \
      -H "Content-Type: application/json" \
      -d "{\"namespace\":\"${USERNAME}\",\"name\":\"${name}\",\"description\":\"Shelf — private CI image\",\"is_private\":true}")
    if [ "$create_status" != "201" ] && [ "$create_status" != "200" ]; then
      echo "Failed to create repo (HTTP $create_status):"
      cat /tmp/dh-create.json
      echo ""
      if grep -qi "No more private repositories" /tmp/dh-create.json; then
        echo "Docker Hub Personal plans allow only 1 private repository."
        echo "Do not create a second private repo (UI will fail the same way)."
        echo "Put both images in the existing private repo using different tags, or upgrade to Pro."
      else
        echo "PAT must include Read, Write, Delete (needed to create/update repos)."
      fi
      exit 1
    fi
    echo "Created private repo ${USERNAME}/${name}"
    return 0
  fi

  if [ "$status" != "200" ]; then
    echo "Failed to fetch repo (HTTP $status):"
    cat /tmp/dh-repo.json
    exit 1
  fi

  local is_private
  is_private=$(python3 -c "import json; print(json.load(open('/tmp/dh-repo.json')).get('is_private', False))")

  if [ "$is_private" = "True" ] || [ "$is_private" = "true" ]; then
    echo "OK: ${USERNAME}/${name} is already private"
    return 0
  fi

  echo "Repo is PUBLIC — forcing private..."
  local patch_status
  patch_status=$(dockerhub_curl -o /tmp/dh-patch.json -w "%{http_code}" \
    -X PATCH "$api" \
    -H "Content-Type: application/json" \
    -d '{"is_private":true}')

  if [ "$patch_status" != "200" ]; then
    echo "Failed to set private (HTTP $patch_status):"
    cat /tmp/dh-patch.json
    echo ""
    echo "Docker Hub free plans may only allow a limited number of private repos."
    echo "Make ${USERNAME}/${name} private manually, or upgrade the Hub plan."
    exit 1
  fi

  is_private=$(python3 -c "import json; print(json.load(open('/tmp/dh-patch.json')).get('is_private', False))")
  if [ "$is_private" != "True" ] && [ "$is_private" != "true" ]; then
    echo "ERROR: ${USERNAME}/${name} is still public after PATCH. Refusing to push."
    exit 1
  fi

  echo "OK: ${USERNAME}/${name} is now private"
}

verify_private() {
  local name="$1"
  local api="https://hub.docker.com/v2/namespaces/${USERNAME}/repositories/${name}/"
  dockerhub_curl "$api" -o /tmp/dh-verify.json
  local is_private
  is_private=$(python3 -c "import json; print(json.load(open('/tmp/dh-verify.json')).get('is_private', False))")
  if [ "$is_private" != "True" ] && [ "$is_private" != "true" ]; then
    echo "ERROR: ${USERNAME}/${name} is PUBLIC after push. Aborting."
    exit 1
  fi
  echo "Verified private: ${USERNAME}/${name}"
}

MODE="${ENSURE_MODE:-ensure}"

for repo in "${REPOS[@]}"; do
  if [ "$MODE" = "verify" ]; then
    verify_private "$repo"
  else
    ensure_private "$repo"
  fi
done

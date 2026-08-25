#!/usr/bin/env bash
# Keep at most MAX_TAGS tags per Docker Hub repo.
# Always preserves protected tags (main, latest); deletes oldest others first.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=dockerhub-api.sh
source "${SCRIPT_DIR}/dockerhub-api.sh"

USERNAME="${DOCKERHUB_USERNAME:?DOCKERHUB_USERNAME required}"
: "${DOCKERHUB_TOKEN:?DOCKERHUB_TOKEN required}"
MAX_TAGS="${MAX_DOCKER_TAGS:-5}"
PROTECTED_TAGS="${PROTECTED_DOCKER_TAGS:-main,latest}"
REPOS=("$@")

if [ ${#REPOS[@]} -eq 0 ]; then
  echo "Usage: prune-dockerhub-tags.sh <repo> [repo...]"
  exit 1
fi

dockerhub_login

IFS=',' read -r -a PROTECTED <<< "$PROTECTED_TAGS"

is_protected() {
  local tag="$1"
  local p
  for p in "${PROTECTED[@]}"; do
    if [ "$tag" = "$p" ]; then
      return 0
    fi
  done
  return 1
}

prune_repo() {
  local name="$1"
  local api="https://hub.docker.com/v2/namespaces/${USERNAME}/repositories/${name}/tags/?page_size=100&ordering=-last_updated"

  echo "Pruning ${USERNAME}/${name} (max ${MAX_TAGS} tags)..."

  local status
  status=$(dockerhub_curl -o /tmp/dh-tags.json -w "%{http_code}" "$api")

  if [ "$status" != "200" ]; then
    echo "Failed to list tags for ${name} (HTTP $status)"
    cat /tmp/dh-tags.json
    exit 1
  fi

  # Output: tag last_updated (newest first from API ordering)
  python3 - <<'PY' >/tmp/dh-tag-list.txt
import json
data = json.load(open("/tmp/dh-tags.json"))
results = data.get("results") or []
for t in results:
    name = t.get("name") or ""
    updated = t.get("last_updated") or ""
    if name:
        print(f"{name}\t{updated}")
PY

  local total
  total=$(wc -l < /tmp/dh-tag-list.txt | tr -d ' ')
  echo "Found ${total} tags"

  if [ "$total" -le "$MAX_TAGS" ]; then
    echo "OK: under limit (${total}/${MAX_TAGS})"
    return 0
  fi

  # Decide keep set: all protected that exist, then newest non-protected until MAX_TAGS
  : >/tmp/dh-keep.txt
  local kept=0

  # Pass 1: protected
  while IFS=$'\t' read -r tag _updated; do
    if is_protected "$tag"; then
      echo "$tag" >> /tmp/dh-keep.txt
      kept=$((kept + 1))
    fi
  done < /tmp/dh-tag-list.txt

  if [ "$kept" -gt "$MAX_TAGS" ]; then
    echo "ERROR: ${kept} protected tags exceed MAX_TAGS=${MAX_TAGS}. Reduce PROTECTED_DOCKER_TAGS."
    exit 1
  fi

  # Pass 2: newest non-protected
  while IFS=$'\t' read -r tag _updated; do
    if [ "$kept" -ge "$MAX_TAGS" ]; then
      break
    fi
    if is_protected "$tag"; then
      continue
    fi
    if grep -qxF "$tag" /tmp/dh-keep.txt; then
      continue
    fi
    echo "$tag" >> /tmp/dh-keep.txt
    kept=$((kept + 1))
  done < /tmp/dh-tag-list.txt

  echo "Keeping (${kept}):"
  cat /tmp/dh-keep.txt | sed 's/^/  - /'

  # Delete the rest
  while IFS=$'\t' read -r tag _updated; do
    if grep -qxF "$tag" /tmp/dh-keep.txt; then
      continue
    fi
    echo "Deleting tag: ${USERNAME}/${name}:${tag}"
    local del_status
    del_status=$(dockerhub_curl -o /tmp/dh-del.json -w "%{http_code}" \
      -X DELETE \
      "https://hub.docker.com/v2/namespaces/${USERNAME}/repositories/${name}/tags/${tag}/")
    if [ "$del_status" != "204" ] && [ "$del_status" != "200" ]; then
      echo "Warning: failed to delete ${tag} (HTTP $del_status)"
      cat /tmp/dh-del.json || true
      echo ""
    else
      echo "Deleted ${tag}"
    fi
  done < /tmp/dh-tag-list.txt

  # Final count
  status=$(dockerhub_curl -o /tmp/dh-tags-after.json -w "%{http_code}" "$api")
  if [ "$status" = "200" ]; then
    local after
    after=$(python3 -c "import json; print(len(json.load(open('/tmp/dh-tags-after.json')).get('results') or []))")
    echo "After prune: ${after} tags (limit ${MAX_TAGS})"
    if [ "$after" -gt "$MAX_TAGS" ]; then
      echo "ERROR: still over limit after prune"
      exit 1
    fi
  fi
}

for repo in "${REPOS[@]}"; do
  prune_repo "$repo"
done

echo "Prune complete."

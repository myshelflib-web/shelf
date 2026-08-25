#!/usr/bin/env sh
# Installs a local git pre-push hook that runs lint + typecheck + tests.
set -e
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
HOOK="$ROOT/.git/hooks/pre-push"

mkdir -p "$ROOT/.git/hooks"
cat > "$HOOK" <<EOF
#!/usr/bin/env sh
set -e
cd "$ROOT"
./scripts/pre-push-check.sh
EOF
chmod +x "$HOOK"
echo "Installed pre-push hook at .git/hooks/pre-push"
echo "It will run: npm run check"

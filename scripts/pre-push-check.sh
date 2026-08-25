#!/usr/bin/env sh
# Optional local gate: run before pushing (also enforced in GitHub Actions)
set -e
echo "Running lint, typecheck, and tests..."
npm run check
echo "All checks passed."

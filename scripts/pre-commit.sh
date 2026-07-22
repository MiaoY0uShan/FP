#!/usr/bin/env bash
# Pre-commit hook: ensure lint, test, and install-pack sync all pass.
# Install: ln -s ../../scripts/pre-commit.sh .git/hooks/pre-commit
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== lint-fp ==="
node scripts/lint-fp.js

echo "=== lint-release ==="
node scripts/lint-release.js

echo "=== sync check ==="
powershell.exe -NoProfile -Command "./scripts/sync-install-packs.ps1 -Check"

echo "=== tests ==="
node --test test/router-contract.test.js test/evidence-ledger-contract.test.js test/metrics-collect.test.js test/install-pack-contract.test.js

echo "All pre-commit checks passed."

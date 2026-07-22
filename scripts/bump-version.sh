#!/usr/bin/env bash
# Bump all version files in the FP repository.
# Usage: ./scripts/bump-version.sh 0.4.15
set -euo pipefail

NEW_VERSION="${1:-}"
if [ -z "$NEW_VERSION" ]; then
    echo "Usage: bump-version.sh <x.y.z>" >&2
    exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Bumping to $NEW_VERSION..."

# Root and canonical
echo "$NEW_VERSION" > "$ROOT/VERSION"
cp "$ROOT/VERSION" "$ROOT/fp/VERSION"

# Gemini extension
TMP=$(mktemp)
jq ".version = \"$NEW_VERSION\"" "$ROOT/install/gemini-cli/fp/gemini-extension.json" > "$TMP"
mv "$TMP" "$ROOT/install/gemini-cli/fp/gemini-extension.json"

# Universal .fp-package
echo "$NEW_VERSION" > "$ROOT/install/universal/.fp-package/VERSION"

echo "Done. Run ./scripts/sync-install-packs.ps1 next."

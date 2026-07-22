#!/usr/bin/env bash
# FP GCM Helper — retrieve API keys from OS credential store (macOS/Linux)
# Usage: ./gcm-get.sh "target-name"
set -euo pipefail
TARGET="${1:-}"
if [ -z "$TARGET" ]; then
    echo "Usage: gcm-get.sh <target-name>" >&2
    exit 1
fi

# macOS Keychain
if command -v security &>/dev/null; then
    PASS=$(security find-generic-password -ws "$TARGET" 2>/dev/null || true)
    if [ -n "$PASS" ]; then
        echo "$PASS"
        exit 0
    fi
fi

# Linux Secret Service via secret-tool
if command -v secret-tool &>/dev/null; then
    PASS=$(secret-tool lookup fp-target "$TARGET" 2>/dev/null || true)
    if [ -n "$PASS" ]; then
        echo "$PASS"
        exit 0
    fi
fi

# git credential-manager fallback
if command -v git &>/dev/null; then
    PASS=$(echo -e "protocol=https\nhost=$TARGET\n" | git credential-manager get 2>/dev/null | grep '^password=' | cut -d= -f2- || true)
    if [ -n "$PASS" ]; then
        echo "$PASS"
        exit 0
    fi
fi

# Environment variable fallback
ENVNAME=$(echo "$TARGET" | tr '[:lower:]-' '[:upper:]_')
if [ -n "${!ENVNAME:-}" ]; then
    echo "${!ENVNAME}"
    exit 0
fi

echo "No credential found for: $TARGET" >&2
exit 1

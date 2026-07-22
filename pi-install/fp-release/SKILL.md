---
name: fp-release
description: "FP release workflow: bump version, lint, sync install packs, run tests, commit, tag, and push to GitHub. Use when the user wants to publish a new FP release or after making changes to fp/ source files."
---

# FP Release Workflow

Releases FP to GitHub with all required checks. Follow steps in order.

## Pre-flight

Check current state:
```bash
cd ~/Desktop/github/fpskill && echo "=== Current version ===" && cat VERSION && echo "=== Uncommitted changes ===" && git status --short && echo "=== Last tag ===" && git tag --sort=-creatordate | head -3
```

## Step 1: Bump Version

Update ALL version files. Never skip any:

```bash
cd ~/Desktop/github/fpskill

# Root VERSION
echo "NEW_VERSION" > VERSION
cp VERSION fp/VERSION

# Gemini extension
TMP=$(mktemp) && jq ".version = \"NEW_VERSION\"" install/gemini-cli/fp/gemini-extension.json > "$TMP" && mv "$TMP" install/gemini-cli/fp/gemini-extension.json

# Universal package
echo "NEW_VERSION" > install/universal/.fp-package/VERSION
```

Or use the bump script:
```bash
bash scripts/bump-version.sh NEW_VERSION
```

## Step 2: Sync Install Packs

Always run after changing any file in `fp/`:

```bash
powershell.exe -NoProfile -Command "./scripts/sync-install-packs.ps1"
```

Verify sync:
```bash
powershell.exe -NoProfile -Command "./scripts/sync-install-packs.ps1 -Check"
```

Must output `ok:` for all 40+ targets.

## Step 3: Lint

```bash
node scripts/lint-fp.js
node scripts/lint-release.js
```

Both must exit 0.

## Step 4: Test

```bash
node --test test/router-contract.test.js test/evidence-ledger-contract.test.js test/metrics-collect.test.js test/install-pack-contract.test.js
```

Must show `pass 75, fail 0`.

## Step 5: Commit and Tag

```bash
cd ~/Desktop/github/fpskill
git add -A
git commit -m "vNEW_VERSION: <brief description of changes>"
git tag -a vNEW_VERSION -m "vNEW_VERSION: <brief description>"
```

## Step 6: Push

```bash
git push origin main --tags
```

## Common Pitfalls

- **Sync check fails in CI:** Forgot to run `sync-install-packs.ps1` after editing `fp/` source files. The sync script copies `fp/` to all 13 `install/` targets. Any edit to `fp/` requires a sync.
- **Version mismatch in CI:** The sync script does NOT update `install/gemini-cli/fp/gemini-extension.json` or `install/universal/.fp-package/VERSION`. These must be bumped manually or via `bump-version.sh`.
- **Tests fail:** Usually a required behavior marker was removed from `fp/SKILL.md` or `fp/AGENTS.md`. The test file `router-contract.test.js` checks for exact phrases. Check which test failed and grep for the expected pattern.

## Quick Release (all-in-one)

When changes are ready and the version is already bumped:
```bash
cd ~/Desktop/github/fpskill && \
  powershell.exe -NoProfile -Command "./scripts/sync-install-packs.ps1" && \
  powershell.exe -NoProfile -Command "./scripts/sync-install-packs.ps1 -Check" && \
  node scripts/lint-fp.js && \
  node scripts/lint-release.js && \
  node --test test/router-contract.test.js test/evidence-ledger-contract.test.js test/metrics-collect.test.js test/install-pack-contract.test.js && \
  echo "All checks passed. Ready to commit."
```

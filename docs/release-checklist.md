# Release Checklist

`VERSION` is the release-version source of truth. A release tag must equal `v$(VERSION)`.

## Before Tagging

```text
node scripts/lint-fp.js
node scripts/lint-release.js
node scripts/lint-contracts.js --ledger fp/examples/password-reset.evidence-ledger.json --brief fp/examples/password-reset.compiled-execution-brief.json
node --test
sh test/posix-installer-smoke.sh
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-install-packs.ps1 -Check
git diff --check
```

Verify:

- root `fp/` is canonical and all generated pack copies match it;
- every `SKILL.md` begins with `---` and no text file has a UTF-8 BOM;
- Gemini metadata equals `VERSION`;
- universal plus every dedicated tool asset is built and contains its entrypoint;
- every ZIP contains `LICENSE`, `THIRD_PARTY_NOTICES.md`, and `VERSION` inside the FP-owned namespace, and standalone release assets retain the same notices without overwriting project-root files;
- `TEST_FP.md` is identical in every pack;
- debug-only remains read-only, distributed delegation rejects authority/DAG/writer/cleanup violations, and unknown metrics remain unknown;
- background learning rejects train/holdout leakage, single-case permanent promotion, negative-control/invariant failures, holdout regression, no-improvement underfit, self-evaluation, stale provenance, shadow failure, and missing rollback;
- release workflow runs validation before publishing;
- PowerShell and POSIX lifecycle checks cover install, verify, idempotency, tamper refusal, and ownership-safe uninstall;
- exact-host discovery results name the tested version and report authentication/timeouts as blocked or not-run instead of implied passes (see `host-smoke-2026-07-14.md` for the current machine);
- no database, daemon, scheduler, required MCP/provider, or autonomous executor was introduced.

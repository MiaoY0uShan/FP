# Migration

## ZeroToHero v0.3.x -> FP v0.4.0

This is a full product rename, not a second parallel router. After migration, only FP should remain discoverable.

| Before | Now |
|---|---|
| `ZeroToHero` | `FP` |
| `zerotohero/` | `fp/` |
| skill name `zerotohero` | `fp` |
| internal names `zerotohero-*` | `fp-*` |
| `ZeroToHero: <task>` | optional `FP: <task>` or `$fp <task>` |
| `zerotohero-*.zip` | `fp-*.zip` |
| `zerotohero-worktree-v1` | `fp-worktree-v1` |
| `.zerotohero/artifacts/` | `.fp/artifacts/` |

Use the universal installer's explicit migration mode. A normal install fails closed when it finds a legacy router so FP cannot silently run beside ZeroToHero:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-FP.ps1 -MigrateLegacy
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-FP.ps1 -Verify
```

```sh
sh ./INSTALL-FP.sh --migrate-legacy
sh ./INSTALL-FP.sh --verify
```

Known ZeroToHero paths are backed up under a dated `.fp-backups/<timestamp>/legacy-zerotohero/` snapshot before removal. Existing `.zerotohero-backups/` recovery history and unrelated project content must be preserved. Do not delete project-owned `AGENTS.md`, `GEMINI.md`, `.aider.conf.yml`, or tool configuration blindly; migration removes only known paths and exact managed entries, never broad text matches.

The universal installer migrates project-local installations. A user-level skill such as `~/.codex/skills/zerotohero/` must be migrated in that same user-level scope: stage and verify `fp`, reload the host, then back up and remove the old skill. Do not leave both names discoverable.

## Continuations Fail Closed Across The Rename

The continuation fingerprint namespace and parent-owned artifact root changed. A continuation created by ZeroToHero v0.3.x is historical evidence, not FP write authority. FP v0.4.0 must reject resume or replay from `zerotohero-worktree-v1`, even when the repository appears unchanged.

To continue safely:

1. Reload the host so it discovers FP rather than ZeroToHero.
2. Capture the current repository root, base revision, and tracked/untracked worktree state with `fp-worktree-v1`.
3. Create a new FP brief and ledger generation that references the old record as historical input only.
4. Rerun the last relevant observed check before authorizing any write.

Do not copy the old fingerprint into the new ledger or mechanically rewrite a legacy continuation. If the current state cannot be re-established, stop and rebaseline with the user. Legacy Markdown/JSON may still be read for metrics or audit context, but it cannot authorize continuation writes.

## Earlier Xskill Installations

FP migration mode also detects known Xskill paths. Those paths are backed up separately under `.fp-backups/<timestamp>/legacy-xskill/`; users still on Xskill do not need to install an intermediate ZeroToHero release.

## 0.1.5 -> 0.1.6

The historical post-run layer changed:

- `semantic-memory` became `schema-memory`;
- `automate-after-stable` and `learn-after-run` became `adaptive-improvement`;
- `evidence-ledger` became an explicit internal module.

Historical installations should remove those retired directories before copying the current portable bundle.

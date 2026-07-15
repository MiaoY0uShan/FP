# Migration

## Xskill -> ZeroToHero (0.3.0)

This is a full product rename, not a second parallel router.

| Before | Now |
|---|---|
| `Xskill` | `ZeroToHero` |
| `xskill/` | `zerotohero/` |
| skill name `xskill` | `zerotohero` |
| internal names `xskill-*` | `zerotohero-*` |
| `Xskill: <task>` | `ZeroToHero: <task>` |
| `xskill-*.zip` | `zerotohero-*.zip` |

Use the universal installer's explicit migration mode; keeping both routers active is rejected:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-ZEROTOHERO.ps1 -MigrateLegacy
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-ZEROTOHERO.ps1 -Verify
```

```sh
sh ./INSTALL-ZEROTOHERO.sh --migrate-legacy
sh ./INSTALL-ZEROTOHERO.sh --verify
```

Known legacy paths are copied under `.zerotohero-backups/<timestamp>/legacy-xskill/` before removal. Do not delete project-owned `AGENTS.md`, `GEMINI.md`, or tool configuration blindly; the installer does not perform broad text replacement.

Canonical Evidence Ledger v1 is now JSON. Legacy Markdown/JSON remains readable by the metrics collector for one migration cycle with a warning, but strict validation requires `schema_version: "1.0.0"`.

## 0.1.5 -> 0.1.6

The historical post-run layer changed:

- `semantic-memory` became `schema-memory`;
- `automate-after-stable` and `learn-after-run` became `adaptive-improvement`;
- `evidence-ledger` became an explicit internal module.

Historical installations should remove those retired directories before copying the current portable bundle.

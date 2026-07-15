# FP Universal Pack

This archive is staged: extracting it does not install anything until you run the installer.

## Windows

Double-click `INSTALL-FP.cmd`, then verify in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-FP.ps1 -Verify
```

## macOS/Linux

```sh
sh ./INSTALL-FP.sh
sh ./INSTALL-FP.sh --verify
```

To remove a verified installation without deleting project-owned instructions:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-FP.ps1 -Uninstall
```

```sh
sh ./INSTALL-FP.sh --uninstall
```

The installer safely merges project instructions, backs up changed files, rejects ambiguous configurations before payload writes, and records the ownership needed for verification and uninstall. Uninstall refuses modified owned files and preserves project files plus `.fp-backups/`. Then reload the AI tool and work normally. The exact coverage tiers and legacy migration commands are in the source repository's [INSTALL.md](https://github.com/MiaoY0uShan/FP/blob/main/INSTALL.md).

If the installer reports legacy Xskill paths, rerun explicitly and then verify:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-FP.ps1 -MigrateLegacy
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-FP.ps1 -Verify
```

```sh
sh ./INSTALL-FP.sh --migrate-legacy
sh ./INSTALL-FP.sh --verify
```

The package supplies tool-specific entries for Codex, Claude Code, Gemini/Antigravity, Copilot, Cursor, Windsurf, Cline, Roo Code, OpenCode, Kiro, Qoder, and Aider; shared `AGENTS.md`/Agent Skills entries cover compatible hosts such as OpenClaw, Pi, Zed, Hermes, Devin, Junie, Amp, Jules, and CodeWhale. Unlisted tools can consume `AGENTS.md` or `FP.md` manually.

After verification, `.fp-package`, the three `INSTALL-FP.*` files, and this README are staging artifacts. You may remove them or keep them for the next update; they are not application source.

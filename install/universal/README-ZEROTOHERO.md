# ZeroToHero Universal Pack

This archive is staged: extracting it does not install anything until you run the installer.

## Windows

Double-click `INSTALL-ZEROTOHERO.cmd`, then verify in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-ZEROTOHERO.ps1 -Verify
```

## macOS/Linux

```sh
sh ./INSTALL-ZEROTOHERO.sh
sh ./INSTALL-ZEROTOHERO.sh --verify
```

To remove a verified installation without deleting project-owned instructions:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-ZEROTOHERO.ps1 -Uninstall
```

```sh
sh ./INSTALL-ZEROTOHERO.sh --uninstall
```

The installer safely merges project instructions, backs up changed files, rejects ambiguous configurations before payload writes, and records the ownership needed for verification and uninstall. Uninstall refuses modified owned files and preserves project files plus `.zerotohero-backups/`. Then reload the AI tool and work normally. The exact coverage tiers and legacy migration commands are in the source repository's [INSTALL.md](https://github.com/MiaoY0uShan/ZeroToHero/blob/main/INSTALL.md).

If the installer reports legacy Xskill paths, rerun explicitly and then verify:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-ZEROTOHERO.ps1 -MigrateLegacy
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-ZEROTOHERO.ps1 -Verify
```

```sh
sh ./INSTALL-ZEROTOHERO.sh --migrate-legacy
sh ./INSTALL-ZEROTOHERO.sh --verify
```

The package supplies tool-specific entries for Codex, Claude Code, Gemini/Antigravity, Copilot, Cursor, Windsurf, Cline, Roo Code, OpenCode, Kiro, Qoder, and Aider; shared `AGENTS.md`/Agent Skills entries cover compatible hosts such as OpenClaw, Pi, Zed, Hermes, Devin, Junie, Amp, Jules, and CodeWhale. Unlisted tools can consume `AGENTS.md` or `ZEROTOHERO.md` manually.

After verification, `.zerotohero-package`, the three `INSTALL-ZEROTOHERO.*` files, and this README are staging artifacts. You may remove them or keep them for the next update; they are not application source.

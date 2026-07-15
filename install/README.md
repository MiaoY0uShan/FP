# ZeroToHero Install Packs

`universal/` is the only beginner path: extract it into a project root, run `INSTALL-ZEROTOHERO.cmd` on Windows or `sh ./INSTALL-ZEROTOHERO.sh` on macOS/Linux, run verify mode, and reload. The same package provides ownership-checked uninstall mode. See the single normative guide and compatibility matrix in [`../INSTALL.md`](../INSTALL.md).

Dedicated folders are advanced, namespaced packs. They do not provide the universal installer's safe merge and preflight behavior.

| Pack | Entry point |
|---|---|
| `universal/` | thin entries for all supported tools + canonical `zerotohero/` |
| `codex/` | `.agents/skills/zerotohero/SKILL.md` |
| `claude-code/` | `.claude/skills/zerotohero/SKILL.md` |
| `gemini-cli/` | `zerotohero/GEMINI.md` extension |
| `github-copilot-cli/` | `.github/instructions/zerotohero.instructions.md` + custom agent |
| `cursor/` | `.cursor/rules/zerotohero.mdc` |
| `windsurf/` | `.windsurf/rules/zerotohero.md` |
| `cline/` | `.clinerules/zerotohero.md` |
| `roo-code/` | `.roo/rules/zerotohero.md` |
| `opencode/` | `.opencode/skills/zerotohero/SKILL.md` |
| `kiro/` | `.kiro/steering/zerotohero.md` |
| `github-copilot-editor/` | `.github/instructions/zerotohero.instructions.md` |
| `aider/` | `AIDER-CONFIG-SNIPPET.yml` + `CONVENTIONS.md` |

Root `zerotohero/` is the source of truth. Generated copies are never edited by hand:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-install-packs.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-install-packs.ps1 -Check
```

Every pack includes `TEST_ZEROTOHERO.md` and must pass the same route behavior, not merely contain the same brand name.

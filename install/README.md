# FP Install Packs

`universal/` is the only beginner path: extract it into a project root, run `INSTALL-FP.cmd` on Windows or `sh ./INSTALL-FP.sh` on macOS/Linux, run verify mode, and reload. The same package provides ownership-checked uninstall mode. See the single normative guide and compatibility matrix in [`../INSTALL.md`](../INSTALL.md).

Dedicated folders are advanced, namespaced packs. They do not provide the universal installer's safe merge and preflight behavior.

| Pack | Entry point |
|---|---|
| `universal/` | thin entries for all supported tools + canonical `fp/` |
| `codex/` | `.agents/skills/fp/SKILL.md` |
| `claude-code/` | `.claude/skills/fp/SKILL.md` |
| `gemini-cli/` | `fp/GEMINI.md` extension |
| `github-copilot-cli/` | `.github/instructions/fp.instructions.md` + custom agent |
| `cursor/` | `.cursor/rules/fp.mdc` |
| `windsurf/` | `.windsurf/rules/fp.md` |
| `cline/` | `.clinerules/fp.md` |
| `roo-code/` | `.roo/rules/fp.md` |
| `opencode/` | `.opencode/skills/fp/SKILL.md` |
| `kiro/` | `.kiro/steering/fp.md` |
| `github-copilot-editor/` | `.github/instructions/fp.instructions.md` |
| `aider/` | `AIDER-CONFIG-SNIPPET.yml` + `CONVENTIONS.md` |

Root `fp/` is the source of truth. Generated copies are never edited by hand:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-install-packs.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-install-packs.ps1 -Check
```

Every pack includes `TEST_FP.md` and must pass the same route behavior, not merely contain the same brand name.

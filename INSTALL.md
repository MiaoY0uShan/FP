# Install FP

No account, API key, database, or background service is required.

## Recommended: One Safe Universal Package

1. Download `fp-universal-v{version}.zip` from Releases.
2. Extract its contents into the project root.
3. Run the installer for your operating system.
4. Run verification. The same installer also provides ownership-checked uninstall mode.
5. Reload the AI tool and work normally.

Windows install (or just double-click `INSTALL-FP.cmd`):

```powershell
.\INSTALL-FP.cmd
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-FP.ps1 -Verify
# Later, to remove this verified installation:
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-FP.ps1 -Uninstall
```

macOS/Linux:

```sh
sh ./INSTALL-FP.sh
sh ./INSTALL-FP.sh --verify
# Later, to remove this verified installation:
sh ./INSTALL-FP.sh --uninstall
```

The installer, not extraction, performs the installation. It writes namespaced adapter files, merges exact managed blocks into `AGENTS.md` and `GEMINI.md`, safely adds Aider's `read` entry, and records owned/managed files in `fp/.install-manifest.json`. Changed project-owned files are backed up under `.fp-backups/`. Corrupt markers, unsupported Aider YAML, ambiguous legacy state, or a pre-existing FP-owned path without a valid manifest stops the run before payload files are written.

After reload, FP activates automatically when the user's goal is engineering work and stays dormant for casual conversation or other non-engineering goals. `FP:` and `$fp` are optional explicit invocations, not prerequisites.

## Upgrading From ZeroToHero Or Xskill

If a ZeroToHero v0.3.x or earlier Xskill installation is detected, inspect the paths printed by the installer and rerun explicitly:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-FP.ps1 -MigrateLegacy
```

```sh
sh ./INSTALL-FP.sh --migrate-legacy
```

Known legacy paths are backed up before removal. The installer never performs a broad text replacement.

## Compatibility Matrix

"Native" means the universal installer writes a tool-specific project entrypoint. "Standard" means that host officially supports the shared `AGENTS.md` or Agent Skills convention used by the package. "Manual" means the workflow is usable, but this release does not claim automatic activation or plugin parity.

| Tool | Universal entrypoint | Tier |
|---|---|---|
| Codex | `.agents/skills/fp/SKILL.md` + `AGENTS.md` | Native |
| Claude Code | `.claude/skills/fp/SKILL.md` | Native |
| Gemini CLI | managed `GEMINI.md` | Native |
| Antigravity | `.agents/rules/fp.md` | Native |
| GitHub Copilot CLI/editor | `.github/instructions/fp.instructions.md` + `AGENTS.md` | Native |
| Cursor | `.cursor/rules/fp.mdc` | Native |
| Windsurf | `.windsurf/rules/fp.md` | Native |
| Cline | `.clinerules/fp.md` | Native |
| Roo Code | `.roo/rules/fp.md` | Native |
| OpenCode | `.opencode/skills/fp/SKILL.md` + `AGENTS.md` | Native |
| Kiro | `.kiro/steering/fp.md` | Native |
| Qoder | `.qoder/rules/fp.md` + `AGENTS.md` | Native |
| OpenClaw | `.agents/skills/fp/SKILL.md` | Standard |
| Pi | `.agents/skills/fp/SKILL.md` | Standard |
| Aider | managed `.aider.conf.yml` -> `FP.md` | Native |
| Zed | root `AGENTS.md` | Standard |
| Hermes Agent, Devin, Junie, Amp, Jules, CodeWhale, Swival and other `AGENTS.md` readers | root `AGENTS.md` | Standard |
| Another unlisted host | point custom instructions at `AGENTS.md`/`FP.md`, or use the copy-paste asset | Manual fallback |

The matrix describes instruction discovery only. It does not claim lifecycle hooks, slash commands, marketplaces, or host runtimes that FP does not ship. Standard/manual rows should be smoke-tested in the exact host version used by the project.

## Advanced: Smaller Tool-Specific Packages

Use these only when you understand the tool's project layout. The universal installer is the safe default because it can merge and verify project-owned files. Dedicated archives use `README-FP.md`, so extraction cannot replace a project's root `README.md`.

| Tool | Asset | Install |
|---|---|---|
| Codex | `fp-codex-v{version}.zip` | Unzip into project root |
| Claude Code | `fp-claude-code-v{version}.zip` | Unzip into project root |
| Gemini CLI | `fp-gemini-cli-v{version}.zip` | Unzip, then install/open the bundled extension |
| GitHub Copilot CLI | `fp-github-copilot-cli-v{version}.zip` | Unzip into project root |
| Cursor | `fp-cursor-v{version}.zip` | Unzip into project root |
| Windsurf | `fp-windsurf-v{version}.zip` | Unzip into project root |
| Cline | `fp-cline-v{version}.zip` | Unzip into project root |
| Roo Code | `fp-roo-code-v{version}.zip` | Unzip into project root |
| OpenCode | `fp-opencode-v{version}.zip` | Unzip into project root |
| Kiro | `fp-kiro-v{version}.zip` | Unzip into project root |
| GitHub Copilot in VS Code | `fp-github-copilot-editor-v{version}.zip` | Unzip into project root |
| Aider | `fp-aider-v{version}.zip` | Advanced manual snippet; universal installer is recommended |
| Any agent | `fp-copy-paste-v{version}.md` | Paste once as project instructions |

## Verify Behavior

After installer verification, ask:

```text
Rename one README section title without changing anything else.
```

Expected: a tiny brief with task, read/touch, done-when, verification, and result--not a long workflow. Then try the relevant pressure prompts in `TEST_FP.md`.

Explicit invocation is optional:

```text
FP: <task or idea>
$fp <task or idea>
```

## Update Or Remove

To update, extract the new universal package over the installer files, rerun the installer, run `-Verify`/`--verify`, and reload. Do not update by copying staged payload files directly.

To remove FP, run `-Uninstall` or `--uninstall` from the matching universal package. Uninstall first verifies every owned file and the manifest, then removes only verified FP-owned files and exact managed entries. It fails before writing if owned content was modified. Project files and `.fp-backups/` are preserved; an Aider entry that existed before installation remains user-owned. Pre-existing namespaced collisions are rejected during installation instead of being overwritten.

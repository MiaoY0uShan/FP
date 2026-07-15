# Install ZeroToHero

No account, API key, database, or background service is required.

## Recommended: One Safe Universal Package

1. Download `zerotohero-universal-v{version}.zip` from Releases.
2. Extract its contents into the project root.
3. Run the installer for your operating system.
4. Run verification. The same installer also provides ownership-checked uninstall mode.
5. Reload the AI tool and work normally.

Windows install (or just double-click `INSTALL-ZEROTOHERO.cmd`):

```powershell
.\INSTALL-ZEROTOHERO.cmd
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-ZEROTOHERO.ps1 -Verify
# Later, to remove this verified installation:
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-ZEROTOHERO.ps1 -Uninstall
```

macOS/Linux:

```sh
sh ./INSTALL-ZEROTOHERO.sh
sh ./INSTALL-ZEROTOHERO.sh --verify
# Later, to remove this verified installation:
sh ./INSTALL-ZEROTOHERO.sh --uninstall
```

The installer, not extraction, performs the installation. It writes namespaced adapter files, merges exact managed blocks into `AGENTS.md` and `GEMINI.md`, safely adds Aider's `read` entry, and records owned/managed files in `zerotohero/.install-manifest.json`. Changed project-owned files are backed up under `.zerotohero-backups/`. Corrupt markers, unsupported Aider YAML, ambiguous legacy state, or a pre-existing ZeroToHero-owned path without a valid manifest stops the run before payload files are written.

## Upgrading From Xskill

If an old Xskill installation is detected, inspect the paths printed by the installer and rerun explicitly:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-ZEROTOHERO.ps1 -MigrateLegacy
```

```sh
sh ./INSTALL-ZEROTOHERO.sh --migrate-legacy
```

Known legacy paths are backed up before removal. The installer never performs a broad text replacement.

## Compatibility Matrix

"Native" means the universal installer writes a tool-specific project entrypoint. "Standard" means that host officially supports the shared `AGENTS.md` or Agent Skills convention used by the package. "Manual" means the workflow is usable, but this release does not claim automatic activation or plugin parity.

| Tool | Universal entrypoint | Tier |
|---|---|---|
| Codex | `.agents/skills/zerotohero/SKILL.md` + `AGENTS.md` | Native |
| Claude Code | `.claude/skills/zerotohero/SKILL.md` | Native |
| Gemini CLI | managed `GEMINI.md` | Native |
| Antigravity | `.agents/rules/zerotohero.md` | Native |
| GitHub Copilot CLI/editor | `.github/instructions/zerotohero.instructions.md` + `AGENTS.md` | Native |
| Cursor | `.cursor/rules/zerotohero.mdc` | Native |
| Windsurf | `.windsurf/rules/zerotohero.md` | Native |
| Cline | `.clinerules/zerotohero.md` | Native |
| Roo Code | `.roo/rules/zerotohero.md` | Native |
| OpenCode | `.opencode/skills/zerotohero/SKILL.md` + `AGENTS.md` | Native |
| Kiro | `.kiro/steering/zerotohero.md` | Native |
| Qoder | `.qoder/rules/zerotohero.md` + `AGENTS.md` | Native |
| OpenClaw | `.agents/skills/zerotohero/SKILL.md` | Standard |
| Pi | `.agents/skills/zerotohero/SKILL.md` | Standard |
| Aider | managed `.aider.conf.yml` -> `ZEROTOHERO.md` | Native |
| Zed | root `AGENTS.md` | Standard |
| Hermes Agent, Devin, Junie, Amp, Jules, CodeWhale, Swival and other `AGENTS.md` readers | root `AGENTS.md` | Standard |
| Another unlisted host | point custom instructions at `AGENTS.md`/`ZEROTOHERO.md`, or use the copy-paste asset | Manual fallback |

The matrix describes instruction discovery only. It does not claim lifecycle hooks, slash commands, marketplaces, or host runtimes that ZeroToHero does not ship. Standard/manual rows should be smoke-tested in the exact host version used by the project.

## Advanced: Smaller Tool-Specific Packages

Use these only when you understand the tool's project layout. The universal installer is the safe default because it can merge and verify project-owned files. Dedicated archives use `README-ZEROTOHERO.md`, so extraction cannot replace a project's root `README.md`.

| Tool | Asset | Install |
|---|---|---|
| Codex | `zerotohero-codex-v{version}.zip` | Unzip into project root |
| Claude Code | `zerotohero-claude-code-v{version}.zip` | Unzip into project root |
| Gemini CLI | `zerotohero-gemini-cli-v{version}.zip` | Unzip, then install/open the bundled extension |
| GitHub Copilot CLI | `zerotohero-github-copilot-cli-v{version}.zip` | Unzip into project root |
| Cursor | `zerotohero-cursor-v{version}.zip` | Unzip into project root |
| Windsurf | `zerotohero-windsurf-v{version}.zip` | Unzip into project root |
| Cline | `zerotohero-cline-v{version}.zip` | Unzip into project root |
| Roo Code | `zerotohero-roo-code-v{version}.zip` | Unzip into project root |
| OpenCode | `zerotohero-opencode-v{version}.zip` | Unzip into project root |
| Kiro | `zerotohero-kiro-v{version}.zip` | Unzip into project root |
| GitHub Copilot in VS Code | `zerotohero-github-copilot-editor-v{version}.zip` | Unzip into project root |
| Aider | `zerotohero-aider-v{version}.zip` | Advanced manual snippet; universal installer is recommended |
| Any agent | `zerotohero-copy-paste-v{version}.md` | Paste once as project instructions |

## Verify Behavior

After installer verification, ask:

```text
Rename one README section title without changing anything else.
```

Expected: a tiny brief with task, read/touch, done-when, verification, and result--not a long workflow. Then try the relevant pressure prompts in `TEST_ZEROTOHERO.md`.

Manual trigger is optional:

```text
ZeroToHero: <task or idea>
```

## Update Or Remove

To update, extract the new universal package over the installer files, rerun the installer, run `-Verify`/`--verify`, and reload. Do not update by copying staged payload files directly.

To remove ZeroToHero, run `-Uninstall` or `--uninstall` from the matching universal package. Uninstall first verifies every owned file and the manifest, then removes only verified ZeroToHero-owned files and exact managed entries. It fails before writing if owned content was modified. Project files and `.zerotohero-backups/` are preserved; an Aider entry that existed before installation remains user-owned. Pre-existing namespaced collisions are rejected during installation instead of being overwritten.

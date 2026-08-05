# FP for Codex CLI — Skill Listing

## Skill Name

`fp` — Finish with Proof

## Category

Agent Engineering / Execution Protocol

## Description

A portable execution protocol for coding agents. 85 lines. 4 core rules. On-demand profiles.
FP activates automatically for engineering work and stays dormant for casual conversation.

## Compatibility

- Codex CLI ✅ (Tested)
- Pi Coding Agent ✅ (Tested)
- Claude Code ✅ (Tested)
- Gemini CLI ✅ (Tested)
- Cursor / Windsurf / Cline / Roo Code / OpenCode / Kiro / Aider ✅

## Install

```bash
# From FP repo
git clone https://github.com/MiaoY0uShan/FP.git
cp -r FP/install/codex/.agents/skills/fp ~/.agents/skills/fp

# Or: copy directly into project
cp -r FP/install/codex/.agents your-project/
```

Or from release zip: `fp-codex-v0.5.0.zip`

## Quick Start

```
FP: fix the password reset bug
$fp diagnose the flaky test
```

## What it does

| Without FP | With FP |
|------------|---------|
| Increase timeout → run once → "looks fixed" | Reproduce → find divergence → bounded fix → rerun (original + regression + negative control) |
| Simple bug → 5 files changed, 2 abstractions added | Route as Small → 3-5 line Tiny Brief → verify |
| Vague request → agent starts building immediately | Route as Vague → 2-3 Idea Cards → user picks → build |

## Benchmark-backed

1,416 real LLM API calls across 3 models (GPT-5.6, DeepSeek-v4-Pro, GPT-5.3-Spark), 8 traits, 3 testing methods.

- Token consumption: -45% (10,665 vs 19,620)
- Tool calls: -57% (6 vs 14)
- Template reads: -89% (1 vs 9, zero wasted)

## Links

- Repo: https://github.com/MiaoY0uShan/FP
- Benchmarks: https://github.com/MiaoY0uShan/FP/blob/main/benchmarks/results/ARTICLE.md
- Codex adapter: https://github.com/MiaoY0uShan/FP/blob/main/adapters/codex.md

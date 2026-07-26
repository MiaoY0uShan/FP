<p align="center">
  <img src="docs/assets/fp-social-preview.jpg" alt="FP — Finish with Proof. Route the risk, bound the work, verify the result." width="100%">
</p>

<h1 align="center">FP — Finish with Proof</h1>

<p align="center"><strong>Make coding agents finish with proof — not vibes.</strong></p>

<p align="center">
  A portable execution protocol for coding agents. 77 lines. 3 core rules. On-demand profiles.
</p>

<p align="center">
  <a href="https://github.com/MiaoY0uShan/FP/stargazers"><img src="https://img.shields.io/github/stars/MiaoY0uShan/FP?style=social" alt="GitHub stars"></a>
  <a href="https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml"><img src="https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml/badge.svg" alt="Validate"></a>
  <a href="https://github.com/MiaoY0uShan/FP/releases"><img src="https://img.shields.io/github/v/release/MiaoY0uShan/FP" alt="Latest release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-22c55e.svg" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://github.com/MiaoY0uShan/FP/releases/latest"><strong>Download</strong></a> ·
  <a href="#the-three-rules">3 Rules</a> ·
  <a href="INSTALL.md">Install</a> ·
  <a href="README.zh-CN.md">中文</a> ·
  <a href="benchmarks/results/ARTICLE.md">Benchmarks</a>
</p>

---

**No proof, no done.** FP activates automatically for engineering work and stays dormant for casual conversation. Three rules, on-demand profiles, zero ceremony creep.

---

## The Three Rules

**1. Diagnose before patching.** Gather evidence. Find root cause. Do not guess.

**2. Verify before claiming done.** Run the tests. See them pass. "Implemented" is not "done."

**3. Be concise and actionable.** First line = result. Last line = next step or verdict. No filler.

For complex work, FP provides on-demand profiles: live systems, multi-agent coordination, provider compatibility, delegated execution, cross-session continuation, and more. They load only when the condition matches — not by default.

> **Non-reasoning model?** Use [`fp-minimal/`](fp-minimal/SKILL.md) — just the three rules. No router, no profiles.

---

## Evidence-Based Design (v0.5.0)

This version was optimized through **1,416 real LLM API calls** across 3 models, 8 traits, and 3 testing methods. Every design decision is backed by benchmark data.

### Cross-Model Blind Eval

| Model | 🥇 Winner | Score | 🥈 | Score | Key Insight |
|-------|----------|-------|------|-------|-------------|
| gpt-5.3-codex-spark (non-reasoning) | v-minimal | **3.08** | v0 | 3.01 | Weak models need simple instructions |
| gpt-5.6-sol (reasoning) | v-final | **3.57** | v0 | 3.49 | Reasoning models leverage structure |
| deepseek-v4-pro (reasoning) | v-final | **3.14** | v0 | 2.97 | DeepSeek needs structure even more (v-minimal: 2.46, 7 blockers) |

**v-final (77 lines) wins on both reasoning models. v-minimal (3 rules) wins on non-reasoning models. v2 Concise-Max (sacrificing safety for speed) is always worst.**

### E2E Multi-Turn (with real tools)

| Metric | Old (162 lines) | New (77 lines) | Improvement |
|--------|----------------|---------------|-------------|
| Token consumption | 19,620 | 10,665 | **-45%** |
| Tool calls | 14 | 6 | -57% |
| FP template files read | 9 (3 wasted) | 1 (0 wasted) | **-89%** |
| Profile loading | Random | On-demand ✅ | — |

### Templates: 35 → 7

28 templates were never referenced by any on-demand profile. They were dead weight — archive, not delete. The multi-turn test proved agents wasted tokens reading them by default.

### Simulation vs. Reality

Our simulation predicted v7 Adaptive-Plus would win at 4.73. Real blind eval showed the opposite — all "optimized" versions performed worse than baseline due to **prompt interference**: adding instructions to an already-balanced system prompt degrades performance. The simulation couldn't model this because it treated each instruction as an independent linear contributor.

Full methodology: [`benchmarks/results/ARTICLE.md`](benchmarks/results/ARTICLE.md)

---

## Quick Start

```text
Fix the intermittent authentication test.
```

Without FP: increase timeout → run once → "looks fixed."

With FP: reproduce → find first divergence → bounded fix → rerun original + regression + negative control → verdict with evidence.

### Install

1. Download [`fp-universal-v0.5.0.zip`](https://github.com/MiaoY0uShan/FP/releases/tag/v0.5.0)
2. Extract and run the installer
3. Reload your agent — FP activates automatically

```powershell
.\INSTALL-FP.cmd -Verify   # Windows
sh ./INSTALL-FP.sh --verify  # macOS / Linux
```

Explicit invocations: `FP: fix the bug` or `$fp diagnose the failure`

[Full install matrix](INSTALL.md) · [Copy-paste fallback](fp-copy-paste.md)

---

## Protocol

| Route | Trigger | Behavior |
|-------|---------|----------|
| **Small** | One file, ≤5 lines, cause known, no new interface | Tiny Brief + verify |
| **Medium** | Multi-file, >5 lines, or added tests | Execution Brief + evidence |
| **Vague** | Requirements underspecified | Idea Cards → user picks → Medium |
| **Large** | Architectural, multi-module, migration | Decompose → risk-reducing modules |

Small is NOT the default. Multi-file = Medium minimum.

### On-Demand Profiles

| Condition | Profile |
|-----------|---------|
| Retry/loop/encoding suspect | `provider-compatibility/SKILL.md` |
| Multi-agent, parallel writers | `templates/multi-agent-review-protocol.md` |
| Remote/stateful target | `skills/live-system/SKILL.md` |
| Unknown failure, diagnosis only | `skills/debug-incident/SKILL.md` |
| Cross-session continuation | `skills/continuation/SKILL.md` |
| Delegated execution | `delegated-execution/SKILL.md` |
| Vague/risky/large requirements | `question-requirements/SKILL.md` |

Profiles load **only when the condition matches** — never by default. This was the #1 source of wasted tokens in the old version.

---

## Reuse Ladder

Before creating anything: does it need to exist? → already in codebase? → standard library? → native platform? → installed dependency? → one line? → only then add minimum new code.

---

## What You Get

| Capability | What it prevents |
|---|---|
| **Risk-matched routing** | Turning one-line fixes into ceremony — or treating incidents like one-line fixes |
| **Debug before patch** | Speculative edits that hide the real cause |
| **Reuse before creation** | Unnecessary abstractions, dependencies, files |
| **Bounded delegation** | Runaway subagents, overlapping writers |
| **On-demand profiles** | Token waste from loading specialized knowledge for simple tasks |
| **First-and-last-line gate** | Responses where you can't tell what happened or what's next |

---

## Works Where You Work

**Codex · Claude Code · Gemini CLI · Pi · GitHub Copilot · Cursor · Windsurf · Cline · Roo Code · OpenCode · Kiro · Aider · and more**

One canonical router. No per-agent methodology.

---

## Run the Benchmarks

```bash
# Full blind eval (requires API keys in env)
node benchmarks/real-eval-v2.mjs all --versions v0,v-final,v-minimal --trials 2 --model gpt-5.6-sol

# Simulation only (no API calls)
node benchmarks/score-final.mjs

# Multi-turn with real tools
node benchmarks/multi-turn-harness-v2.mjs --versions v0,v-final

# E2E comparison
node benchmarks/e2e-test.mjs
```

Set `FP_API_KEY` and `DEEPSEEK_API_KEY` environment variables before running real evals.

---

## FAQ

**Does every task become ceremony?** No. Small tasks get a Tiny Brief. Profiles load on-demand — a simple bug fix loads zero FP templates.

**Non-reasoning models?** Use `fp-minimal/SKILL.md`. Three rules. The benchmark data shows this outperforms the full protocol on weaker models.

**Why 77 lines?** Because 162 lines caused the agent to waste 45% of its tokens reading FP's own templates. The benchmark data showed exactly which parts added value and which didn't.

**Can a subagent declare done?** No. Parent owns integration and reruns critical checks.

**Is this autonomous self-modifying AI?** No. Reusable changes require independent evidence, bounded evaluation, and rollback.

---

## Trust Model

- Secrets must be redacted from all output. Use `<REDACTED>`.
- Destructive operations need explicit boundaries and confirmation.
- Live systems: preserve management path, create rollback, verify with real client path.
- API keys stored in OS credential store, never in plaintext config.

---

## Develop

```bash
node --test test/*.test.js                           # Contract tests
node scripts/run-response-evals.mjs validate         # Eval validation
node benchmarks/score-final.mjs                      # Simulated benchmark
```

---

**Languages:** [English](README.md) · [中文](README.zh-CN.md)

**License:** MIT

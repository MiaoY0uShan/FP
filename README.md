<p align="center">
  <img src="docs/assets/fp-social-preview.jpg" alt="FP — Finish with Proof" width="100%">
</p>

<h1 align="center">FP — Finish with Proof</h1>

<p align="center"><strong>One file. Your coding agent stops guessing and starts proving.</strong></p>

<p align="center">
  <a href="https://github.com/MiaoY0uShan/FP/stargazers"><img src="https://img.shields.io/github/stars/MiaoY0uShan/FP?style=social" alt="GitHub stars"></a>
  <a href="https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml"><img src="https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml/badge.svg" alt="Validate"></a>
  <a href="https://github.com/MiaoY0uShan/FP/releases"><img src="https://img.shields.io/github/v/release/MiaoY0uShan/FP" alt="Latest release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-22c55e.svg" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://github.com/MiaoY0uShan/FP/releases/latest"><strong>Download</strong></a> ·
  <a href="#four-rules">4 Rules</a> ·
  <a href="INSTALL.md">Install</a> ·
  <a href="README.zh-CN.md">中文</a> ·
  <a href="benchmarks/results/ARTICLE.md">Benchmarks</a>
</p>

---

Your coding agent says "done." You trust it. CI fails. You dig in. The agent guessed. It never ran the test. It never checked the root cause. It just... declared victory.

FP makes that impossible. Drop one file into any coding agent. Four rules. The agent proves its work — or it doesn't get to say "done."

---

## What FP Actually Solves

We blind-tested FP across **63 real-world scenarios** with two independent judges (GPT-5.6-Sol + DeepSeek-v4-Pro). Here's what the data shows:

**Zero critical failures.** FP scored 0 blockers. The same agent without FP hit 3. That's the difference between shipping and getting paged.

**The agent picks the right approach.** Route classification — knowing when a task needs a quick fix vs. a full execution brief — improved by **+11%** (3.32 vs 2.99). This is FP's single biggest contribution: the agent stops over-engineering small tasks and stops under-engineering complex ones.

**Goal fidelity: best in class.** 4.61 out of 5. When the agent hits a wall, it reports what it tried and what's left. It never quietly swaps in something easier and calls it done.

<details>
<summary><strong>Full rankings — 8 versions, 378 observations each, dual judge</strong></summary>

> Inter-judge agreement: |Δ| = 0.56, Pearson r = 0.71

| Rank | Version | Weighted | Blockers | vs Baseline |
|------|---------|----------|----------|-------------|
| 🥇 | **v-final (FP)** | **4.12** | **0** | +0.03 |
| 🥇 | v-coding | 4.12 | 1 | -0.01 |
| 🥉 | v0 (no FP) | 4.10 | 3 | baseline |
| 4 | v-pre053 | 4.08 | 2 | -0.03 |
| 5 | v-tf2 | 4.07 | 0 | -0.01 |
| 6 | v-core | 4.05 | 2 | -0.04 |
| 7 | v-host2 | 3.93 | 0 | -0.13 |
| 8 | v-host | 3.57 | 0 | -0.49 |

Per-trait breakdown:

| Trait | FP | No FP | Delta |
|-------|-----|-------|-------|
| Route precision | 3.32 | 2.99 | **+0.33** |
| Goal fidelity | 4.61 | 4.58 | +0.03 |
| Debug-first | 4.37 | 4.42 | -0.05 |
| Evidence | 4.36 | 4.39 | -0.03 |
| Concision | 4.16 | 4.26 | -0.10 |
| Multi-agent | 3.71 | 3.52 | **+0.19** |
| Safety | 4.89 | 4.83 | +0.06 |

4,100+ real LLM API calls. 13 evaluation dimensions. 3 testing methods. Full methodology: [`benchmarks/results/ARTICLE.md`](benchmarks/results/ARTICLE.md). Reproducible: [`benchmarks/README.md`](benchmarks/README.md).

</details>

---

## Without FP vs. With FP

```
You: Fix the intermittent auth test.
Agent: I increased the timeout. Looks fixed.
You: ...it failed again in CI.
```

```
You: Fix the intermittent auth test.
Agent: Root cause: race between token refresh and session check.
       Fix: acquire lock before refresh.
       Evidence: 50/50 runs pass. Original symptom + regression + negative control verified.
       Done.
```

---

## Four Rules

That's the whole product. Everything else loads on demand.

**1. Lock the goal.** Your stated goal is the fixed bar. The agent optimizes the path, never the goal. Blocked? It reports what it tried and what's left — it never quietly swaps in something easier.

**2. Diagnose before patching.** Evidence first. Root cause first. No guessing.

**3. Verify before claiming done.** Run the tests. Watch them pass. "Implemented" ≠ "done."

**4. Be concise and actionable.** First line = result. Last line = next step. Nothing in between that doesn't earn its keep.

---

## Install

```powershell
# Windows
.\INSTALL-FP.cmd -Verify

# macOS / Linux
sh ./INSTALL-FP.sh --verify
```

Or copy [`fp-copy-paste.md`](fp-copy-paste.md) into your agent's system prompt. That's it.

FP activates automatically for engineering work. Stays silent for everything else.

[Full install matrix →](INSTALL.md)

---

## Works Everywhere

**Claude Code · Codex · Gemini CLI · Pi · GitHub Copilot · Cursor · Windsurf · Cline · Roo Code · OpenCode · Kiro · Aider**

One file. Every agent. When other skills are installed, FP routes to the best specialist and keeps its verification gates binding on the result.

---

## What You Get

### Routing

The agent classifies the task before touching code. This is FP's highest-value trait (+11% over baseline).

| Route | When | What happens |
|-------|------|-------------|
| **Small** | One file, ≤5 lines, cause known | Tiny brief → verify → done |
| **Medium** | Multi-file or new tests | Execution brief → evidence → done |
| **Vague** | Requirements unclear, or user says "问我问题" | fp cool → then Medium |
| **Large** | Architecture or migration | Decompose → ship risk-reducing modules |

Small is not the default. Multi-file = Medium minimum.

### On-Demand Profiles

Zero overhead by default. Profiles load only when triggered.

| Trigger | Profile |
|---------|---------|
| Retry / encoding issue | Provider compatibility |
| Multi-agent / parallel writes | Multi-agent coordination |
| Remote / stateful target | Live system operations |
| Unknown failure | Debug incident |
| Cross-session work | Continuation |
| Delegated subtasks | Delegated execution |
| Vague / risky requirements | Question requirements |
| Codebase analysis | Codebase analysis (tree-sitter / vector) |

### Development Discipline

FP ships with five discipline modules — all active by default. Each is independent. Remove any that don't fit your team.

**Research-First (底层开发思维)** — Search GitHub before building. Reuse > reference > build from scratch. Cross-compare open-source solutions.

**Module Boundaries (模块边界)** — Confirm target file before coding. Don't pile new features into oversized files. Splitting is a design action before building, not cleanup after shipping.

**Doc Sync (文档同步)** — Doc sync is part of dev close, not an afterthought. Check before saying "done." Rewrite current docs to reflect current rules — don't stack revision patches.

**Pre-Commit Cleanup (临时残留代码清理)** — Auto-check for leftover temp code before commit. Debug prints, temp files, one-off scripts → clean up. Production code, regression tests → never touch.

**Four Iron Rules (四条铁律)** — "How would I write this from scratch?" is the default stance, not an absolute prohibition. Root-cause over patching (principle). Self-documenting code (principle). No residue (principle). Deployment parity (hard rule — no exceptions). Deviations need a stated reason, not a silent slide.

> **Want less?** Use [`fp-minimal/`](fp-minimal/SKILL.md) for non-reasoning models — just the four rules, no router. Or use [`fp/presets/core.md`](fp/presets/core.md) for routing without discipline. The default install gives you everything; remove what you don't need.

---

## The Discovery That Changed Our Approach

We tested 8 variants. Two findings shaped the product:

**Principles beat commands.** Our first version used absolute language — "never patch," "dare to rewrite." We measured it. The softer version ("default to root-cause, but state your reason if you deviate") scored **4.12 with 0 blockers**. The absolute version scored **4.08 with 2 blockers**. Models execute principles with better judgment than they execute commands.

**Prompt interference is real.** Adding instructions to a balanced prompt *degrades* performance. We proved this twice — a Coding Discipline section (+4 lines) and a Test-First sentence (+1 line) both regressed route precision by 0.23–0.30 points. That's why FP loads profiles on demand instead of packing everything into one file.

---

## FAQ

**Does FP add ceremony?** No. A simple bug fix loads zero FP templates. Small tasks get a one-sentence brief, then fix and verify. Profiles are on-demand — the #1 source of wasted tokens in every previous version was loading things the task didn't need. FP solved that.

**My model isn't GPT-5.6.** Use [`fp-minimal/`](fp-minimal/SKILL.md) for non-reasoning models. Benchmark-proven to outperform the full protocol on weaker models.

**Can a subagent declare done?** No. Parent owns integration and reruns critical checks.

**How do I reproduce the benchmark?** Set `FP_API_KEY`, run `node benchmarks/real-eval-v2.mjs all`. Fixed parameters, dual-judge blinding, deterministic scenarios. Full docs: [`benchmarks/README.md`](benchmarks/README.md).

---

## Develop

```bash
node --test test/*.test.js                           # Contract tests
node scripts/run-response-evals.mjs validate         # Eval validation
node benchmarks/real-eval-v2.mjs all                 # Full blind eval
node benchmarks/multi-turn-harness-v2.mjs            # Multi-turn E2E
```

---

<p align="center"><strong>No proof, no done.</strong></p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">中文</a>
  <br>
  <a href="LICENSE">MIT License</a>
</p>

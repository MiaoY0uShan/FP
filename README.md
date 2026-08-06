<p align="center">
  <img src="docs/assets/fp-social-preview.jpg" alt="FP — Finish with Proof" width="100%">
</p>

<h1 align="center">FP — Finish with Proof</h1>

<p align="center"><strong>4 rules. Development discipline. Your agent stops guessing and starts proving.</strong></p>

<p align="center">
  <a href="https://github.com/MiaoY0uShan/FP/stargazers"><img src="https://img.shields.io/github/stars/MiaoY0uShan/FP?style=social" alt="GitHub stars"></a>
  <a href="https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml"><img src="https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml/badge.svg" alt="Validate"></a>
  <a href="https://github.com/MiaoY0uShan/FP/releases"><img src="https://img.shields.io/github/v/release/MiaoY0uShan/FP" alt="Latest release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-22c55e.svg" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://github.com/MiaoY0uShan/FP/releases/latest"><strong>Download</strong></a> ·
  <a href="#the-four-rules">4 Rules</a> ·
  <a href="INSTALL.md">Install</a> ·
  <a href="README.zh-CN.md">中文</a> ·
  <a href="benchmarks/results/ARTICLE.md">Benchmarks</a>
</p>

---

Every coding agent can write code. Almost none can prove it works.

FP is a portable protocol that makes any coding agent finish with evidence — not vibes. It drops into Claude Code, Codex, Gemini CLI, Cursor, Windsurf, Copilot, and a dozen more. No framework. No SDK. One file.

---

## The Four Rules

**1. Lock the goal.** Your stated goal is the fixed bar. The agent optimizes the path, never the goal. Blocked? It reports what it tried and what's left — it never quietly swaps in something easier.

**2. Diagnose before patching.** Evidence first. Root cause first. No guessing.

**3. Verify before claiming done.** Run the tests. Watch them pass. "Implemented" ≠ "done."

**4. Be concise and actionable.** First line = result. Last line = next step. Nothing in between that doesn't earn its keep.

> That's it. Everything else loads on demand — only when the task needs it.

---

## What happens without FP

```
You: Fix the intermittent auth test.
Agent: I increased the timeout. Looks fixed.
You: ...it failed again in CI.
```

## What happens with FP

```
You: Fix the intermittent auth test.
Agent: Root cause: race between token refresh and session check.
       Fix: acquire lock before refresh.
       Evidence: 50/50 runs pass. Original symptom + regression + negative control verified.
       Done.
```

---

## The Numbers

We didn't just build this. We measured it. **4,100+ real LLM API calls** across 6 prompt variants, 13 evaluation dimensions, 63 blind-eval scenarios, and 3 testing methods — single-turn blind eval, multi-model cross-validation, and multi-turn E2E with real tool calls.

### Blind Eval — 63 Scenarios, Dual Judge

> 252 observations per version. Two independent judges (GPT-5.6-Sol + DeepSeek-v4-Pro). Inter-judge agreement: |Δ| = 0.56, Pearson r = 0.71.

| Rank | Version | Weighted | Blockers | vs Baseline |
|------|---------|----------|----------|-------------|
| 🥇 | **v-final (FP)** | **4.12** | **0** | +0.03 |
| 🥈 | v0 (no FP) | 4.09 | 2 | baseline |

FP's clearest edge: **route classification +0.60** over bare baseline. The agent picks the right-sized response for the task — not too much ceremony, not too little rigor.

### The Discovery That Saved Us

We tested 6 variants. Two lessons changed everything:

**Prompt interference is real.** Adding instructions to an already-balanced 85-line prompt *degrades* performance. We proved this twice — a Coding Discipline section (+4 lines) and a Test-First sentence (+1 line) both regressed the route trait by 0.23–0.30 points. The 85-line surface is at capacity. New capabilities live in on-demand modules, not the core.

**Simulation lies.** Our simulation predicted a "v7 Adaptive-Plus" would score 4.73. Real blind eval: it was the worst performer. Simulations treat instructions as independent linear contributors. Real models don't work that way.

### Multi-Turn E2E — Real Tool Calls

| Metric | Old (162 lines) | FP (85 lines) | Change |
|--------|-----------------|----------------|--------|
| Tokens | 19,620 | 10,665 | **−45%** |
| Tool calls | 14 | 6 | **−57%** |
| Template reads | 9 (3 wasted) | 1 (0 wasted) | **−89%** |

Action-level harness with real file I/O, test execution, and deterministic acceptance predicates. The agent doesn't just talk about fixing the bug — it actually fixes it, and we verify the fix works.

---

## Install

```powershell
# Windows
.\INSTALL-FP.cmd -Verify

# macOS / Linux
sh ./INSTALL-FP.sh --verify
```

Or just copy [`fp-copy-paste.md`](fp-copy-paste.md) into your agent's system prompt.

That's it. FP activates automatically for engineering work. Stays silent for everything else.

[Full install matrix →](INSTALL.md)

---

## Works Everywhere

**Claude Code · Codex · Gemini CLI · Pi · GitHub Copilot · Cursor · Windsurf · Cline · Roo Code · OpenCode · Kiro · Aider**

One file. Every agent.

When other skills are installed, FP routes to the best specialist and keeps its verification gates binding on the result. Coordination without duplication.

---

## Protocol

| Route | When | What happens |
|-------|------|-------------|
| **Small** | One file, ≤5 lines, cause known | Tiny brief → verify → done |
| **Medium** | Multi-file or new tests | Execution brief → evidence → done |
| **Vague** | Requirements unclear, or user says "问我问题" | fp cool → Medium |
| **Large** | Architecture or migration | Decompose → ship risk-reducing modules |

Small is not the default. Multi-file = Medium minimum.

### On-Demand Profiles

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

Profiles load **only when triggered**. A simple bug fix loads zero extra files. This was the #1 source of wasted tokens in every previous version.

### Four Iron Rules (四条铁律)

Before changing code, think "how would I write this from scratch?" — not "how do I patch on top?"

1. **No patching** — find the root cause, dare to rewrite. Never stack if-guards, clone-and-tweak, or add bypass switches
2. **Self-documenting code** — names express *what*; comments only for *why* and business rules. No explanatory comments, no commented-out blocks
3. **No residue** — no backups, no leftover files, no dead code. Fix mistakes, don't preserve intermediate states
4. **Deployment parity** — server and local source md5 must match exactly

The iron rules are the quality floor beneath the discipline sections: single source of truth, unified pipeline, root-cause debugging, document filtering, and quality braking are all corollaries. Every line is written as its final form — each iteration gets cleaner, never messier.

---

## FAQ

**Does every task become ceremony?** No. Small tasks get a tiny brief — one sentence of context, then fix and verify. Profiles are on-demand. A simple bug fix reads zero FP templates.

**Non-reasoning models?** Use [`fp-minimal/`](fp-minimal/SKILL.md) — just the four rules, no router. Benchmark-proven to outperform the full protocol on weaker models.

**Why did the core grow past 85 lines?** The v0.5.0 benchmark proved 85 lines was optimal for the four core rules + router. v0.5.2 adds development discipline (research-first, module boundaries, doc sync, pre-commit cleanup) directly into the core — a user-driven decision to prioritize always-on discipline over the benchmark-proven line ceiling.

**Can a subagent declare done?** No. Parent owns integration and reruns critical checks.

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

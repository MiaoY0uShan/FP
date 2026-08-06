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

### Development Mindset (底层开发思维)

No reinventing the wheel.

1. Before starting a project or major plan, search GitHub for existing projects, docs, implementations, and source code
2. When a mature project exists, evaluate its license, maintenance status, security risks, and adaptation cost before reusing
3. Simple bug fixes, clear small changes, or offline tasks are exempt from mandatory research
4. Study and decompose open-source projects extensively — reuse directly when applicable, reference when valuable
5. Cross-compare multiple open-source solutions — take strengths, discard weaknesses

### Module Boundaries (模块边界)

1. Before any coding task, confirm which module, component, service, hook, script, or test file the code belongs in
2. Oversized files: only allow small bug fixes, minor style tweaks, interface adaptation, and low-risk patches — split complex new capabilities into new files with clear responsibilities
3. Never pile new features, temporary validation logic, fake data, or one-off code into already-large files for convenience
4. When a requirement would make a large file grow further, the agent should split it by responsibility — no need to ask unless the split would change product behavior, data structures, compatibility, or expand scope significantly
5. Splitting is a design action before building, not a remediation after shipping

### Doc Sync (文档同步)

1. When features, business logic, API contracts, data structures, product interactions, or module responsibilities change, check whether related README, dev standards, API docs, and status docs need updating
2. Doc sync is part of dev close — don't wait for user reminders. Check before saying "done," before tests pass, before commit
3. Internal implementation detail changes that don't affect usage, interfaces, data, interactions, or module boundaries: state "no doc update needed"
4. If stale docs would mislead future agents or developers, update or archive them — don't leave expired docs on the default reading path
5. Prioritize updating current execution entry points and module READMEs; archived design/plan docs only get archival notes, not current execution status
6. Update current docs by rewriting the body to reflect current rules — don't stack "revision notes" or "previously was" patches at the top
7. Only record historical revision notes in archived docs, migration notes, changelogs, or when the user explicitly wants history preserved

### Pre-Commit Cleanup (临时残留代码清理)

1. Before commit after dev is done and tests pass, automatically check for leftover temporary code from this round
2. Clearly temporary content: the agent cleans it up without asking the user
3. Safe to clean: debug prints, temp files, one-off scripts, temp mocks, temp APIs, hardcoded fake data, temp switches, temp comments, and unreferenced validation code
4. Do NOT clean: production code, regression tests, fixtures, docs, critical runtime logs, and intentionally preserved diagnostic logs
5. Uncertain items: list separately with file location, purpose, risk, and recommendation — let the user decide
6. When the user asks for git commit: first check and clean temp residue, then run tests, then commit
7. When starting the next feature and prior residue may remain: remind the user whether to clean up before proceeding

### Four Iron Rules (四条铁律)

Before changing code, think "how would I write this from scratch?" — this is the default stance, not an absolute prohibition.

1. **No patching** (principle) — default to root-cause resolution. Rewriting beats stacking patches, but when blast radius, time constraints, or downstream contracts make rewriting far costlier than the benefit, a local patch needs a stated reason and cleanup plan
2. **Self-documenting code** (principle) — names express *what*; comments only for *why* and business rules. Commented-out code blocks count as residue
3. **No residue** (principle) — no backups, no leftover files, no dead code. Clean up intermediate states proactively; when uncertain, annotate rather than silently keep
4. **Deployment parity** (hard rule) — source and deployed artifact hashes must match exactly, no exceptions

The core is not "absolute prohibition" but "default stance" — deviations require an explicit reason, not a silent slide. Single source of truth, unified pipeline, root-cause debugging, and quality braking are all corollaries. Every line is written as its final form — each iteration gets cleaner, never messier.

---

## Strategy Tiers

One size doesn't fit all. Pick the enforcement level that matches your team:

| Tier | What's included | Best for | File |
|------|----------------|----------|------|
| **Core** | 4 rules + routing + safety + on-demand profiles | Teams that want verification protocol without code-style opinions | [`fp/presets/core.md`](fp/presets/core.md) |
| **Strict** | Core + development discipline + four iron rules | Solo developers or teams wanting maximum discipline | [`fp/SKILL.md`](fp/SKILL.md) (default) |
| **Team** | Core + pick-your-discipline modules | Team leads who want to enable specific disciplines | [`fp/presets/team.md`](fp/presets/team.md) |

To use a tier: copy the corresponding file as your agent's skill file. The Strict tier is the default install.

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

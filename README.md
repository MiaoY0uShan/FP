<p align="center">
  <img src="docs/assets/fp-banner.svg" alt="FP turns ambiguous tasks, parallel agents, and limited examples into verified progress" width="100%">
</p>

<p align="center"><sub>
  <a href="README.zh-CN.md">中文</a> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.ar.md">العربية</a> ·
  <a href="README.pt.md">Português</a> ·
  <a href="README.ru.md">Русский</a> ·
  <a href="README.ja.md">日本語</a>
</sub></p>

# FP

**The patch is not the finish line. Proof is.**

[![Validate](https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml/badge.svg)](https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/MiaoY0uShan/FP)](https://github.com/MiaoY0uShan/FP/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e.svg)](LICENSE)

Most coding agents rush from prompt to patch. FP makes yours find the real task, bound every delegation, and finish with evidence a parent agent can independently verify. It learns from prior runs — not by turning one lucky anecdote into permanent law, but through a gated refinement pipeline backed by cross-validated evidence.

FP activates automatically for engineering work and stays dormant for casual conversation. `FP:` and `$fp` remain optional explicit invocations.

No daemon. No database. Install it, reload your agent, and work normally.

---

## How it works

```text
request
-> route the actual risk
-> freeze scope, authority, and acceptance
-> map the blast radius (MCP-preferred, grep-fallback)
-> navigate the codebase like a Zettelkasten (entry point → call chain → local graph)
-> execute or delegate bounded work
-> run observed checks
-> validate the Evidence Ledger
-> optionally refine patterns from fleeting → literature → permanent
```

Small work stays small. Incidents restore service before polishing. Unknown causes trigger diagnosis before patches. Before adding code, FP walks a short reuse ladder:

```text
1. Does this need to exist?      no → skip it (YAGNI)
2. Already in the codebase?     yes → reuse it
3. Standard library does it?    yes → use it
4. Native platform feature?     yes → use it
5. Installed dependency?        yes → use it
6. One clear line is enough?    yes → write one line
7. Only then                    → add the minimum new code that works
```

## Routes

FP uses a compressed 4-route model with layered profiles:

| Route | When | What happens |
| --- | --- | --- |
| **Urgent / High-Stakes** | Incidents, grills, protocol changes | Confirm intent → act within authority. Incidents restore before repairing. |
| **Read-Only Diagnosis** | Unknown failures or proactive scans | Debug-first: hypothesis → probe → authorized fix. Audit: per-target baseline → P0/P1/P2 report. |
| **Build** | Clear or vague implementation | Small → Tiny Brief. Medium → Execution Brief + Ledger. Vague → Idea Cards. Large → minimum modules → final brief. |
| **Close** | Every task | Pass with matched evidence → one verdict → stop. |

Profiles layer onto these routes: **live-system**, **multi-agent**, **delegated-execution**, **provider-compatibility** (spend/boundary safety), **external-context** (versioned retrieval), **memory-graph** (blast-radius and cluster retrieval for FP's own schema/lesson cards), **codebase-analysis** (code-review-graph MCP preferred, grep-fallback), and **Zettelkasten conventions** (card-box writing discipline for FP's internal memory).

## Graph in your favor

FP builds two kinds of graphs. Neither needs a database.

### FP's own memory: typed card graph

Schema cards and lesson cards form a typed graph via `[[wikilink]]` references and YAML frontmatter edges (`depends_on`, `informs`, `next`, `previous`, `generalizes`, `conflicts_with`, `supersedes`). A zero-dependency Node.js script (`fp/contracts/memory-graph.js`) builds the graph, computes blast radius before card updates, finds relevant clusters by keyword, detects hub/bridge cards via centrality analysis, and runs incremental SHA-256 diffs. See [Memory Graph Traversal](fp/templates/memory-graph-traversal.md).

Card writing follows Zettelkasten (Luhmann's slip-box) principles: atomicity (one pattern per card, ≤50 lines), bidirectional links (forward links authored, backlinks computed), Folgezettel sequences (`next`/`previous` edges), MOC (Map of Content) index cards at N≥3 cards per theme, and a refinement pipeline (fleeting note → literature note → permanent note). See [Zettelkasten Conventions](fp/templates/zettelkasten-conventions.md).

### The user's codebase: blast-radius navigation

When code-review-graph MCP is available, FP calls `get_minimal_context_tool` (~100 tokens) to orient, then `detect_changes_tool` / `get_impact_radius_tool` for blast-radius analysis, `get_knowledge_gaps_tool` for untested hotspots, and the 27 other MCP tools for architecture, semantic search, and risk scoring. ~82x token reduction vs reading full files. When MCP is unavailable, FP falls back to grep-based protocols (`codebase-impact-map.md`).

Navigation follows Zettelkasten-inspired protocols: entry points as MOC index notes, call chains as Folgezettel sequences, blast radius as local graph view, and serendipity via surprising cross-community connections. See [Repository Zettelkasten Navigation](fp/templates/repository-zettelkasten-navigation.md) for all 8 protocols.

## Distributed, not chaotic

```text
parent / integrator
|-- bounded investigation A       read-only
|-- bounded investigation B       read-only
|-- evidence reviewer             independent task + session
|-- integration reviewer          independent task + session
+-- candidate learner             read-only, proposal only
             → bound evidence + verdicts

one writer → parent reruns critical checks → canonical ledger
```

Every child task receives a bounded envelope with authority ceilings, dependency IDs, file/resources, iteration/attempt/time/depth limits, idempotency key, and stop conditions. Leaves cannot delegate, deploy, message externally, promote memory, or mutate live state.

## Learn without memorizing the accident

FP refines patterns through a gated pipeline:

```text
fleeting note (Evidence Ledger unverified_claim)
→ literature note (lesson card, observation status)
→ permanent note (schema card, promoted/active status)
```

Promotion requires 2–4 independent positive cases, leave-one-out cross-validation, blind evaluation, near-neighbor negative controls, zero-tolerance invariants, shadow observations, and tested rollback. Paraphrases and sibling agents from one session count as one independent experience.

See [Generalization Gate](fp/generalization-gate/SKILL.md) and [Evidence Ledger schema](fp/contracts/evidence-ledger.v1.schema.json).

## Install

One archive. One installer. One read-only verification.

1. Download the latest `fp-universal-v{version}.zip` from [Releases](https://github.com/MiaoY0uShan/FP/releases).
2. Extract it into the project root.
3. On Windows, run `INSTALL-FP.cmd`. On macOS/Linux, run `sh ./INSTALL-FP.sh`.
4. Verify with `INSTALL-FP.cmd -Verify` on Windows or `sh ./INSTALL-FP.sh --verify` on macOS/Linux, then reload your agent.

[Install guide](INSTALL.md) | [Migration from ZeroToHero or Xskill](MIGRATION.md) | [Copy-paste fallback](fp-copy-paste.md)

## Develop

Canonical source in `fp/`. Generated host packs in `install/` for 18+ agents. All copies refreshed by script — never hand-edit `install/`.

```text
node scripts/lint-fp.js
node scripts/lint-release.js
node scripts/lint-contracts.js --ledger fp/examples/password-reset.evidence-ledger.json --brief fp/examples/password-reset.compiled-execution-brief.json
node --test
powershell -NoProfile -File scripts/sync-install-packs.ps1 -Check
```

## FAQ

### Does every task become a ceremony?

No. A one-line fix stays one line. FP scales its process weight to task risk.

### Can a subagent declare the whole task complete?

No. The parent reruns critical checks and owns the final claim.

### Does it learn from one successful run?

It records one observation. One anecdote is not a schema. The refinement pipeline requires independent evidence.

### Does it need Hermes, Context7, code-review-graph, or another service running?

No. Their useful protocol ideas were adapted into portable local contracts (typed-agent delegation, bounded context retrieval, blast-radius analysis, MCP tool contracts). Their daemons, databases, and backends are not dependencies. When code-review-graph MCP is available, FP uses it automatically for ~82x token reduction; when absent, grep-based fallback protocols produce the same output.

### Will FP install a missing MCP automatically?

Only after explicit approval. FP automatically calls a task-required MCP that is already available; a missing MCP gets a bounded acquisition brief first.

### Is this autonomous self-modifying AI?

No. Background agents propose frozen candidates. Independent evaluators test them against hidden holdouts. Promotion requires declared authority, machine evidence, shadow observations, and rollback.

## Influences

FP remains an original implementation. Its design was sharpened by studying [Superpowers](https://github.com/obra/superpowers) (fresh implementer/reviewer task chains), [Hermes Agent](https://github.com/NousResearch/hermes-agent) (bounded task/result envelopes), [Ponytail](https://github.com/DietrichGebert/ponytail) (seven-rung reuse ladder), [Context7](https://github.com/upstash/context7) (versioned external retrieval), [Grill Me](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me) (decision DAG), and [code-review-graph](https://github.com/tirth8205/code-review-graph) (typed node-edge graph, blast-radius traversal, community detection, betweenness centrality, incremental SHA-256 update).

Exact revisions, adopted behaviors, and exclusions are in [docs/upstream-influences.md](docs/upstream-influences.md). License provenance is in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Formerly Xskill. See [MIGRATION.md](MIGRATION.md).

---

**Language editions:** [English](README.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md)

## License

MIT. Use it, inspect it, improve it, and keep the notice.

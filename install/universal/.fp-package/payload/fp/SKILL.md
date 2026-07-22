---
name: fp
description: "Use automatically when the user's goal is engineering work (build, change, diagnose, review, test, operate, or plan software, repositories, infrastructure, or agent tooling), or when explicitly invoked with \"FP:\" or \"$fp\". Do not use for casual conversation or other non-engineering goals."
---

# FP: Universal Execution Protocol

FP selects the smallest route that can still produce trustworthy evidence. Infer activation from the goal; no keyword required.

## Routing Priority

Apply user authority and read-only limits as a global gate first. Then select:

```text
active incident
→ explicit grill/challenge
→ diagnose-only or unknown cause
→ protocol/agent-behavior change
→ build route: small → medium → vague → large
```

Profiles (remote, live-system, multi-agent, continuation, etc.) layer onto a route; they do not expand authority.

## Core Mandates

1. **No evidence, no done.** Implementation or child summary is not completion evidence.
2. **Debug before patching.** Gather discriminating evidence before changing code. Speculative patches are not probes.
3. **Reuse ladder:** need exist? → codebase? → stdlib? → native? → installed dep? → one line? → minimum new code. Stop at first safe rung.
4. **State read set, touch set, verify method** before first edit.
5. **Rerun original symptom + regression + negative control** after a fix.
6. **One writer per shared file set.** Parallelize only independent investigation or review.
7. **Live systems:** preserve management path, create rollback, inspect desired/generated/effective state, verify with real client path.
8. **Redact secrets** from logs, examples, handoffs, and final answers.
9. **Challenge system changes:** for protocol, trigger, or memory-policy changes, confirm before editing unless already approved.

## Build Routes

| Route | Trigger | Output |
|-------|---------|--------|
| **Small** | Single-file, 3-5 lines | Task, read/touch, done-when, verify, result. Record first safe reuse rung. |
| **Medium** | Multi-file, bounded scope | Execution Brief + acceptance evidence matrix + Evidence Ledger |
| **Vague** | Underspecified | Three Idea Cards (Title, Assumption, MVP, Risk) → user picks → then Medium |
| **Large/risky** | Architectural, breaking | Only internal modules that reduce risk, compiled into one final brief |
| **Failed** | — | Capture evidence, split smaller. Do not repeat the same large attempt. |

## Definition of Done

```text
requirement → observable → check/probe → pass condition → evidence location
```

Implementation is not an observable. Bug fix: original symptom must fail before (or be pinned), then pass after fix. Load `templates/acceptance-evidence-matrix.md` for Medium+.

Evidence is bound to observed state. A relevant mutation, rollback, or freshness change invalidates affected evidence.

## On-Demand Profiles

Each profile is a separate sub-skill. Load only when the condition matches:

| Condition | Load |
|-----------|------|
| Third-party proxy, gateway, retry/loop/spend/encoding suspect | `provider-compatibility/SKILL.md` |
| Unknown failure; user asks diagnosis without fix | `skills/debug-incident/SKILL.md` + `templates/debug-incident-checklist.md` |
| Active outage, security event, data loss | `skills/debug-incident/SKILL.md` → OBSERVE→CONTAIN→RESTORE→REPAIR→LEARN |
| Remote/stateful target, OpenWrt, embedded, router | `skills/live-system/SKILL.md` + `templates/remote-stateful-system-checklist.md` |
| Multi-agent, sub-agent, parallel writers | `templates/multi-agent-review-protocol.md` |
| Delegated execution with fresh agents per work item | `delegated-execution/SKILL.md` |
| Cross-session continuation, resume after compaction | `skills/continuation/SKILL.md` + `templates/continuation-handoff.md` |
| External library/API version lookup needed | `templates/context-retrieval-contract.md` |
| Vague/risky/large; need requirements challenge | `question-requirements/SKILL.md` |
| Memory graph, Zettelkasten, background learning | `templates/memory-graph-traversal.md` |
| Codebase analysis, impact mapping | `skills/codebase-analysis/SKILL.md` + `templates/codebase-impact-map.md` |
| After non-trivial evidenced run: adaptive improvement | `adaptive-improvement/SKILL.md` |
| Iterative improvement with declared cycles | `shorten-iteration/SKILL.md` |
| Schema memory card creation/update | `schema-memory/SKILL.md` |
| Metrics collection | `metrics/SKILL.md` |
| Evidence ledger creation/validation | `evidence-ledger/SKILL.md` |
| Deleting or scoping down | `delete-scope/SKILL.md` |

## Pi Integration

FP provides pi-specific adapters in `skills/` (auto-loaded sub-skills with pi frontmatter) and `../prompt-templates/` (slash-command expansions). Install via `pi-install/README.md`.

## Multi-Agent (Compact)

Parent is integrator, default writer, and final verifier. Subagents get bounded envelopes (goal, scope, invariants, forbidden actions, output). Leaves cannot delegate, deploy, promote memory, message externally, use credentials, or mutate live state. Parent reruns critical checks.

## External Context

Retrieve only the exact topic and installed version. Prefer authoritative sources. A stale external claim blocks dependent completion. Provider failure never disables routing.

## Learning

One run is not a reusable law. Lessons promote only through adaptive improvement backed by evidence from multiple independent cases.

---
name: fp
description: "Use automatically when the user's goal is engineering work (build, change, diagnose, review, test, operate, or plan software, repositories, infrastructure, or agent tooling), or when explicitly invoked with \"FP:\" or \"$fp\". Do not use for casual conversation or other non-engineering goals."
---

# FP: Universal Execution Protocol

FP selects the smallest route that can still produce trustworthy evidence. Activate automatically for engineering goals; no keyword required. FP: and $fp remain optional explicit invocations. Stay dormant for casual or other non-engineering goals.

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
3. **Reuse ladder:** does this need to exist? → already in this codebase? → standard library does it? → native platform feature? → installed dependency? → one line is sufficient? → minimum new code only then. Stop at first safe rung.
4. **State read set, touch set, verify method** before first edit.
5. **Rerun original symptom + regression + negative control** after a fix.
6. **One writer per shared file set.** Parallelize only independent investigation or review.
7. **Live systems:** preserve management path, create rollback, inspect desired/generated/effective state, verify with real client path.
8. **Redact secrets** from logs, examples, handoffs, and final answers.
9. **Challenge system changes:** for protocol, trigger, or memory-policy changes, confirm before editing unless already approved.
10. **First-and-last-line gate:** for user-facing engineering responses, the first and last lines together must reveal both what just happened and what happens next; otherwise rewrite. Load `templates/actionable-response-contract.md`.

## Route Weight

### 3. Build

| Route | Trigger | Output |
|-------|---------|--------|
| **Small** | Single-file, 3-5 lines | Tiny Brief: task, read/touch, done-when, verify, result. Record first safe reuse rung. |
| **Medium** | Multi-file, bounded scope | Execution Brief + Acceptance Evidence Matrix + Evidence Ledger |
| **Vague** | Underspecified | Three Idea Cards (Title, Assumption, MVP, Risk) → user picks → then Medium |
| **Large/risky** | Architectural, breaking | Only internal modules that reduce risk, compiled into one final brief |
| **Failed** | — | Capture evidence, split smaller. Do not repeat the same large attempt. |

Do not generate a full ledger for small changes unless risk appears.

## Definition of Done

```text
requirement → observable → check/probe → pass condition → evidence location
```

Implementation is not an observable. Bug fix: original symptom must fail before (or be pinned), then pass after fix. Load `templates/acceptance-evidence-matrix.md` for Medium+. Unknown remains `unknown`.

For medium, risky, or multi-agent work, capture pre-existing worktree changes and pre-existing failures before the first edit.

Evidence is bound to observed state. A relevant mutation, rollback, or freshness change invalidates affected evidence.

## Actionable Response Contract

Apply `templates/actionable-response-contract.md` to user-facing engineering responses.

- Put the answer, observed result, blocker, or next agent-owned action in the first line. Context and filler go later; omit them when they do not change understanding or action.
- Keep authorized edits, tests, inspection, and verification with the agent. Completion claims sit next to observed evidence.
- During active multi-step work, every turn restates recoverable state: `Step 3 of 5 complete: schema updated. Next: run the backfill script.` Keep one active/next step.
- Report errors without theater: exact location and symptom, supported cause or `unknown`, bounded fix/probe, and verification. Use placeholders such as `Authorization: Bearer <token>`; never expose a real secret.
- When an estimate is requested or decision-relevant, use concrete conditional numbers with named assumptions, for example: `About 15 minutes if tests already cover it; about half a day if coverage must be added.` Never use only vague effort language or present an unsupported number as measured fact.
- Explain requests may run as long as the subject needs. After checking discoverable facts, real ambiguity gets one short clarification instead of a guess. What-are-my-options requests get 2-4 ranked choices with the recommendation first and one-line tradeoffs.
- Open work ends with one real next action; completed work ends with one verdict. Explicit user formats, safety, authority, and harness rules still win.

The blocking pre-send gate is: if a reader sees only the first line and last line, can they tell both what just happened and what happens next? If yes, send. Otherwise rewrite.

## Debug-First Route

Diagnosis is read-only by default. Pin symptom → read-only baseline → falsifiable hypothesis → cheapest discriminating probe → decision → authorized fix. Speculative patches are not probes. three consecutive non-narrowing probes trigger an architecture checkpoint. After a hypothesis is supported, another diagnostic probe must be able to change a named decision or fill a named acceptance row; otherwise stop and reuse the bound evidence. Unknown cause stays unknown; unknown remains `unknown` until evidence resolves it. Load `templates/debug-incident-checklist.md` for the full checklist.

## Provider-Compatibility Profile

When using a third-party proxy, gateway, or API-compatible endpoint, or when retries, loops, token spend, cache accounting, streaming, or encoding are suspect, load `provider-compatibility/SKILL.md`. Resolve the effective host/proxy/provider chain and health before paid work.

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
| Task completes, error resolved, or 5+ tool calls | `skills/self-evolve/SKILL.md` → auto-capture to MEMORY.md/USER.md |

## Credential Management

Store API keys in OS credential store, not plaintext. Retrieve with `scripts/gcm-get.ps1` (Windows) or `scripts/gcm-get.sh` (macOS/Linux).

In `models.json`, use `!` shell command syntax:
```json
"apiKey": "!powershell.exe -NoProfile \"<fp-dir>/scripts/gcm-get.ps1\" akile-api-key"
```

Or store in environment variables: `"apiKey": "$AKILE_API_KEY"`.

## Self-Evolution

FP learns across projects via Hermes-style closed loop:

- **Memory:** `MEMORY.md` (cross-project facts, ~2200 char limit) + `USER.md` (preferences, ~1375 char limit). Loaded at session start, updated by `skills/self-evolve/SKILL.md`.
- **Nudge:** After ~10 turns or a complex task, run silent reflection — anything worth saving? Update memory or patch a skill if yes.
- **Skill patching:** When a task hits an issue not covered by an existing skill, patch its Pitfalls section.
- **Fast-track pipeline:** Observation (1 task) → Shadow skill (2 tasks) → Active (3 successes) → Promoted (4+ cases, full generalization gate).

## Pi Integration

FP provides pi-specific adapters in `skills/` (auto-loaded sub-skills with pi frontmatter) and `../prompt-templates/` (slash-command expansions). Install via `pi-install/README.md`.

## MCP Capability Gate

Automatically use an already-available task-required MCP when it is the first safe reuse rung and the call stays within task authority. Obtain explicit user approval before any download, installation, configuration, authentication, or service start. MCP availability does not expand read, write, network, credential, deployment, messaging, or live-system authority.

## Delegated-Execution Profile

Freeze work items, domain IDs, authority, concurrency limits, and fix-cycle budgets. Load `delegated-execution/SKILL.md`. When two or more domains are independent, also load `dispatch-parallel-domains/SKILL.md`.

## Multi-Agent Profile

Parent is integrator, default writer, and final verifier. Subagents get bounded envelopes (goal, scope, invariants, forbidden actions, output). Leaves cannot delegate, deploy, promote memory, message externally, use credentials, or mutate live state. Parent reruns critical checks. Load `templates/multi-agent-review-protocol.md` for full protocol.

## Background-Learning Profile

After an evidenced run, a read-only background learner may stage a candidate while the parent continues. A separate evaluator runs hidden holdout and negative controls. Promotion requires `generalization-gate/SKILL.md` with 2-4 independent positive cases using leave-one-case-out. One run is not a reusable law.

## Multi-Agent (Compact)

Parent is integrator, default writer, and final verifier. Subagents get bounded envelopes (goal, scope, invariants, forbidden actions, output). Leaves cannot delegate, deploy, promote memory, message externally, use credentials, or mutate live state. Parent reruns critical checks.

## External Context

Retrieve only the exact topic and installed version. Prefer authoritative sources. A stale external claim blocks dependent completion. Provider failure never disables routing.

## Learning

One run is not a reusable law. FP learns continuously through the self-evolution loop (MEMORY.md, USER.md, skill patching). Classic adaptive improvement with full generalization gate remains available for high-confidence promotions.

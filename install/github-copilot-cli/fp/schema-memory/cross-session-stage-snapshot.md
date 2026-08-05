---
# Populate these fields only after evidence supports each relationship.
# Edge types: depends_on, informs, next, previous, generalizes, conflicts_with, supersedes
related-schemas:
  depends_on: []
  informs: []
  next: []
  previous: []
  generalizes: []
  conflicts_with: []
  supersedes: []

# Keywords describing the class of work this schema applies to.
task-types: ["cross-session", "handoff", "stage", "resume", "long-running"]

is_moc: false
---

# Schema Memory Card

## Schema Name

Cross-Session Stage Snapshot

## Trigger

A project spans multiple sessions or handoffs (long-running builds, hardware bring-up, multi-day migrations) and the next session must resume without state loss.

## Problem Pattern

Reconstructing project state from chat history, git log, or timestamps silently drops verified facts, revives superseded plans, and burns the first 30-60 minutes of every session on re-discovery.

## Common Failure Modes

- Plans masquerading as completed work ("built" recorded as "verified on device").
- Stale rollback references that no longer restore anything.
- Blocked items with no classification, so sessions retry hardware-blocked work.
- More than one "next step", so the resuming session re-plans instead of executing.

## Recommended Execution Pattern

Keep ONE always-rewritten stage file (`阶段.md` / `stage.md`) per project: verified facts only; explicit stage numbering (S1→S2→…) with acceptance criteria per stage; rollback point with SHA-256 and the exact restore command; blockers classified (`FIRMWARE_BLOCKED` / `WAITING_HARDWARE` / `USER_ACTION_REQUIRED` / `HOST_DRIVER_BLOCKED`); exactly one next step. Backing up the current snapshot is a mandatory precondition of every rewrite; then rewrite (never append) at each stage completion. Template: `fp/templates/stage-based-cross-session-handoff.md` (`.en.md` for English).

## Context Budget Pattern

On resume, read the stage file first and start from "the one next step" — target resume-to-work under 2 minutes. Do not re-read prior session transcripts or walk git history unless the stage file itself is corrupt.

## TDD / Verification Pattern

A stage is complete only when its acceptance criteria pass with observable evidence. Artifact integrity is re-verified from SHA256SUMS (fresh verify) before trusting any recorded artifact.

## Files Or Modules Usually Involved

Project-root stage file (`阶段.md` / `stage.md`); `fp/templates/stage-based-cross-session-handoff.md`; `fp/skills/continuation/SKILL.md`.

## Files Or Modules Usually Avoided

Chat history exports, git reflog archaeology, timestamp-based reconstruction.

## Evidence Required

Two independent long-running projects resuming across sessions with zero state loss and measured resume time.

## Source Evidence References

- [[L004-cross-session-stage-state]] — source lesson (status: observation).
- Redmi 12R kernel project: 30+ handoffs, stages S2→S34, zero state loss, resume within 2 minutes.
- Lenovo Y700 project: `阶段.md` in active use.
- Negative control: sessions that skipped the stage file wasted 40+ minutes on state reconstruction.

## Owner / Origin

User field projects (Android kernel bring-up), 2026. Candidate card prepared 2026-08-04 from L004.

## Last Validated

2026-08-04 — independent read-only evaluator ran leave-one-case-out on the two recorded cases: fold 1 (derived from Redmi 12R, held-out Lenovo Y700) `non_inferior`; fold 2 (derived from Lenovo, held-out Redmi) `improved` vs the reconstruct-from-history baseline. Invariants pass; complexity within budget; negative control partially observed (trigger boundary declared and bounded, but a field abstention on a near-neighbor case has not yet been observed).

## Invalidation Trigger

Multi-agent parallel writers to the same stage file (single-agent serial projects only), or a host-native cross-session state mechanism that verifiably supersedes file snapshots.

## Supersedes

None.

## Stop Conditions

Do not let the stage file grow into a log — always rewrite. Do not apply to single-session tasks. Do not store secrets in the snapshot.

## Promotion History

- 2026-08-04 — CANDIDATE prepared from [[L004-cross-session-stage-state]].
- 2026-08-04 — Generalization gate run with the required role separation (candidate author: assistant session; independent evaluator: fresh read-only delegation; parent approver: user). Fold verdicts `non_inferior` / `improved`; invariants pass; complexity atomic. State: **SHADOW** — narrow, expiring, non-authoritative per `fp/generalization-gate/SKILL.md`.
- Shadow → active conditions: (1) at least three post-freeze qualifying observations, each recording baseline-vs-candidate resume time in the same metric and unit; (2) at least one observation from a non-Android-kernel long-running project, to break domain clustering; (3) at least one observed near-neighbor abstention (a single-session task or parallel-writer scenario where the pattern is correctly withheld); (4) one severe false trigger rejects or rolls back the card immediately. Rollback: git revert of this file.

## Backlinks (computed — do not author)

Cards that reference this card in their `related-schemas` YAML frontmatter or body wikilink references. Populated by the graph traversal protocol (`fp/archive/templates/memory-graph-traversal.md`) via `memory-graph.js`. Do not manually maintain.

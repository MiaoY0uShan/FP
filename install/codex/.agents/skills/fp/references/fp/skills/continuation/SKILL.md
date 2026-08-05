---
name: fp-continue
description: "Cross-session task continuation and handoff. Use when resuming incomplete work from a previous session, after context compaction, or when a task spans multiple sessions. Provides structured handoff fingerprints and resume protocols."
---

# FP Continuation Profile

Load `../templates/continuation-handoff.md` for the full handoff template.

For multi-session projects with many handoffs (long-running builds, hardware bring-up), keep ONE always-rewritten stage snapshot instead of reconstructing state from chat history or git log: load `../templates/stage-based-cross-session-handoff.md` (English twin: `stage-based-cross-session-handoff.en.md`) — verified facts only, rollback point with restore command, classified blockers, exactly one next step. Evidence: `../lessons-learned/L004-cross-session-stage-state.md`.

## Resume Protocol

1. Compile structured Evidence Ledger `continuation` block before session end.
2. Capture versioned `fp-worktree-v1` fingerprint.
3. On resume: reload router, compute current state, resolve evidence references.
4. Continue only the exact next action after a match.
5. Never auto-replay writes. Corrupt or stale continuation → fail closed for mutation.

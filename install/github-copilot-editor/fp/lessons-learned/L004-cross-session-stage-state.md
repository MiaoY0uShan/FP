# Lesson: Cross-Session State Needs Immutable Stage Snapshots

## Status

observation

Two independent multi-session embedded-kernel projects (Redmi 12R, Lenovo Y700) used this pattern with no state loss over 30+ session handoffs across 4 weeks.

## Context

When a project spans multiple AI sessions (e.g., kernel compilation, ROM building, embedded device work) and the agent must resume from exactly where the previous session ended.

## Related

- [[L001-remote-stateful-service-chain]](related_to) — both address remote/stateful systems where "what happened" ≠ "what the code says"
- [[L003-record-target-precedence]](related_to) — the stage file uses explicit write-and-replace semantics to prevent stale state

## Anti-Pattern

Relying on git log, chat history, or file modification timestamps to reconstruct project state after a session boundary. These sources are:
- chat history: truncated or compacted by the agent runtime
- git log: shows what was committed, not what was verified or abandoned
- file timestamps: no context on which build was which

Result: the next session wastes 30-60 minutes re-discovering state, re-running dead-end probes, or worse, continues from a stale assumption.

## Correction

Use a single `stage.md` file as the cross-session handoff:

1. **One file, always rewritten.** Every major stage completion replaces the file. Never append. Never have `stage-v2.md`, `stage-old.md` side files as the live state. Old versions go to `backups/` with date suffixes.

2. **Only verified facts.** No plans masquerading as completed work. Distinguish `built` from `verified on device`.

3. **Explicit stage numbering.** S1→S2→S3 with immutable completion evidence per stage. A stage is not complete until its acceptance criteria pass.

4. **Rollback points.** Always preserve the last known-good artifact path, SHA-256, and exact restoration command.

5. **Blocked items with classification.** Use explicit categories:
   - `FIRMWARE_BLOCKED` — hardware/firmware limitation, not a software bug
   - `WAITING_HARDWARE` — external peripheral not yet connected
   - `USER_ACTION_REQUIRED` — needs human intervention (e.g., phone call test)
   - `HOST_DRIVER_BLOCKED` — PC-side dependency missing

6. **Next-step is always exactly one action.** Not a list of 10 possible things. The next session reads the file and executes the first line of "下一步" without re-discovering.

## Evidence

### Run 1 — Redmi 12R custom kernel (2026-07)
- 30+ session handoffs across S2→S34 (33 stages)
- Kernel compilation, KMI verification, eBPF uprobe testing, USB Gadget enumeration
- Zero state loss. Each session resumed from the exact stage file within 2 minutes.
- Backup chain: `backups/stage-md-pre-lineage-20260728.md`, `backups/stage-md-pre-prune-20260728.md`, etc.

### Run 2 — Lenovo Y700 stock-equivalent kernel (2026-07)
- Fresh project, reused the stage pattern from 12R
- S0 (read-only device inventory) → S1 (stock-equivalent build) in 2 sessions
- File: `C:\Users\fp\Desktop\github\lenovo\阶段.md`

### Generalization checks
- Two independent devices (Xiaomi/Qualcomm vs Lenovo/Qualcomm), different kernel versions (5.10 vs 6.12), different deployment paths (fastboot vs 9008)
- Both used the same file format and handoff conventions
- Negative control: sessions that tried to continue without reading the stage file first wasted 40+ minutes re-probing

## Reuse Trigger

When a task is classified as `Large` (architectural, multi-module, multi-session), or when the current session's context window will not contain the full project history.

## Safety Boundary

- This pattern applies to **single-agent**, **serial** projects. Multi-agent, parallel-writer scenarios need additional concurrency control (see `templates/multi-agent-review-protocol.md`).
- The stage file must never contain secrets, IMEI, serial numbers, or user communication payloads.
- The "always rewrite" rule is safe only when the previous version is backed up first.

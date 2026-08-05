# Stage-State Handoff Template

> The single authoritative cross-session handoff snapshot. Rewrite this file at the end of every major stage; delete anything outdated, duplicated, or superseded by newer evidence.
> Final completion criteria are governed solely by the goal file (`目标.md` / `GOAL.md`).

## Current Snapshot

- Date: `YYYY-MM-DD`.
- Current stage: `S<N>-<stage-name>`.
- Verdict: `<PASS / IN_PROGRESS / BLOCKED>`.
- Route summary: <one sentence describing the current technical route>.

## Verified Evidence

### <Category 1>

- Fact: <specific, reproducible evidence>
- Hash/path: <artifact path and SHA-256 when applicable>

### <Category 2>

- ...

## Artifact List

- `<path>` — SHA-256 `xxxx`
- Full list: `<path>/SHA256SUMS` (`N` entries, fresh verify PASS)

## Rollback Point

- Last stable version: `<path>` — SHA-256 `xxxx`
- Restore command: `<exact command>`

## Current Blockers

| Blocker | Class | Notes |
|---|---|---|
| `<item>` | `FIRMWARE_BLOCKED` / `WAITING_HARDWARE` / `USER_ACTION_REQUIRED` / `HOST_DRIVER_BLOCKED` | <reason> |

Class definitions:

- `FIRMWARE_BLOCKED` — hardware/firmware limitation; software cannot fix it
- `WAITING_HARDWARE` — external peripheral not yet available
- `USER_ACTION_REQUIRED` — needs human action (e.g. a live call test)
- `HOST_DRIVER_BLOCKED` — PC-side dependency missing

## The One Next Step

<One sentence, executable. The next session reads this and starts immediately.>

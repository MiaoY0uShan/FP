# Lesson: Stateful UI Handoffs Need Durable Client State

## Status

observation

This legacy card predates the v0.3 generalization contract and is not promoted reusable policy.

## Context
When a UI moves selected files, draft input, wizard state, or a pending import into another route, project, upload, or container-backed process.

## Related
- [[L001-remote-stateful-service-chain]](generalizes) — this is a client-side instance of the broader remote-stateful pattern. The same staged-runtime loop (map boundaries, persist before navigate, verify from client boundary, prove negative controls) applies.
- [[L003-record-target-precedence]](mitigated_by) — record precedence prevents stale handoff data from corrupting the updated target when a user changes the destination mid-task.

## Anti-Pattern

- Store payloads only in module globals, component state, or transient router state.
- Navigate before asynchronous persistence completes.
- Treat missing state as an unrecoverable project failure.
- Validate source/build output but not the served runtime.

## Correction

1. Map producer, storage, consumer, cleanup, refresh, and runtime boundaries.
2. Submit before navigation or persist browser file/blob state durably and await the write.
3. Treat stale/missing client handoff as recoverable UX when safe.
4. Rebuild/restart the served runtime and verify happy and negative paths from the browser/client boundary.

## Evidence

- A 2026-05-25 MiroFish repair replaced transient pending uploads with awaited IndexedDB persistence and verified the rebuilt served frontend.
- The same failure pattern is common whenever route navigation destroys in-memory browser state; negative-path verification guards the general boundary.

## Reuse Trigger
Apply to selected files, pending uploads, wizard/draft state, import/project creation, or any handoff that must survive navigation, refresh, rebuild, or a runtime boundary.

## Safety Boundary
Do not persist secrets or regulated payloads merely for convenience; choose storage lifetime and cleanup from the product/security requirement.

## Backlinks (computed — do not author)

> community-14 | leaf | in_degree=2 out_degree=2 | rebuilt 2026-07-19

- [[L001-remote-stateful-service-chain]](generalizes)
- [[L003-record-target-precedence]](mitigated_by)

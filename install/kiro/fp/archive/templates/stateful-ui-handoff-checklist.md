# Stateful UI Handoff Checklist

Use this checklist when a frontend flow carries selected files, pending uploads, wizard data, draft input, project creation state, or job-start state across a route, view, or runtime boundary.

## Before Editing

- Capture the exact user-visible error, console log, API response, and route.
- Identify the producer, storage, consumer, cleanup path, and ownership of the handoff state.
- Decide whether state must survive navigation, refresh, tab restore, app rebuild, or container restart.
- Identify browser `File`/blob data, auth-scoped data, cache keys, backend job IDs, retention, and security constraints.
- Define recoverable behavior for missing or stale state.

## Change Plan

- Persist the handoff or submit/create the backend job before navigating.
- Await asynchronous persistence before route transition.
- Use a durable browser store for file/blob handoffs that must survive navigation/refresh.
- Keep keys explicit and cleanup idempotent.
- Treat plausible stale-client state as recoverable: clear safely, explain specifically, and return to the source flow.
- Avoid broad workflow rewrites for a narrow boundary failure.

## Verification

- Run the focused build, typecheck, and/or unit test.
- Verify the served runtime, not source files alone.
- Rebuild/restart containerized delivery before browser/API checks.
- Test a fresh happy path and missing/stale negative paths.
- Inspect served module/bundle output when stale frontend delivery was plausible.
- Verify refresh/navigation behavior and cleanup/retention boundaries.

## Evidence Minimum

```text
Visible error:
Producer / storage / consumer / cleanup:
Persistence and security boundary:
Change:
Build/typecheck:
Served-runtime verification:
Negative-path verification:
Cleanup/retention verification:
Residual risk:
```

## Stop Conditions

- The exact error source is unknown; switch to debug-first.
- Required data cannot be persisted safely or legally.
- Runtime verification still serves old code after rebuild/restart.

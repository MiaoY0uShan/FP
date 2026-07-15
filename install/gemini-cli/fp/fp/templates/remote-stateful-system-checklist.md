# Remote / Stateful System Checklist

Use this checklist only when a task changes a running host, network path, service chain, database, queue, cache, CI agent, router, firewall, DNS stack, proxy, or production-like environment.

For OpenWrt, BusyBox, embedded Linux, Wi-Fi, procd, or ubus work, also use `openwrt-live-system-verification-profile.md`.

## Before Editing

- Define the intended request path in one line.
- Identify bypass paths that must remain blocked or unchanged.
- Confirm the management path that must stay reachable.
- Capture current config and generated/effective runtime state.
- Capture service status, process IDs when useful, and listening ports.
- Capture ownership evidence for processes, interfaces, files, locks, sockets, and generated resources the change may create or remove.
- Create a backup, snapshot, export, or rollback command before the first write.
- Decide which logs or configs may contain secrets and should not be copied verbatim.

## Change Plan

- Change the smallest layer that can prove progress.
- Prefer one service or one boundary per loop.
- Validate syntax or dry-run before restart when available.
- Define restart order from upstream dependencies to client-facing entrypoints.
- Avoid changing client network settings unless that is the explicit task.
- Avoid broad refactors while recovering a live system.

## Verification

- Confirm every touched service is running after restart.
- Confirm generated/effective config matches the intended config.
- Verify internal hops, not only the final endpoint.
- Verify from at least one external client path when clients are affected.
- Verify negative controls, such as blocked ports, disabled bypasses, rejected domains, denied auth, or stopped services.
- Run a protocol-level check, not only ping or process status.
- Prove stop/start/restart/reload leaves no duplicate workers or leaked owned resources.
- Record exact commands or probes and their result.

## Rollback And Handoff

- Record backup or snapshot location.
- Record what was deliberately not changed.
- Record residual risks and when to revisit them.
- Redact secrets from summaries, examples, and logs.
- Do not mark complete until runtime behavior matches the intended path and bypass checks pass.

## Evidence Minimum

```text
Baseline:
Backup:
Change:
Syntax/dry-run:
Restart:
Runtime status:
Internal verification:
External verification:
Negative controls:
Resource ownership/leak proof:
Rollback path:
Secrets redacted:
Residual risk:
```

## Stop Conditions

- The management path becomes unstable.
- The rollback path is missing or untested for a risky change.
- Verification exposes a different root cause than the current edit targets.
- Logs or diffs would expose secrets that cannot be safely redacted.

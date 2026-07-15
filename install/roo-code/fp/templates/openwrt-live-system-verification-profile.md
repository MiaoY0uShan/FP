# OpenWrt / Live-System Verification Profile

Layer this profile on `remote-stateful-system-checklist.md` for routers, OpenWrt/iStoreOS, BusyBox, Wi-Fi, firewall, procd, ubus, or embedded Linux work.

## Target Capability Probe

Record target-observed behavior before relying on a feature:

- model, firmware, kernel, architecture, uptime, clock, and overlay free space;
- relevant `uci changes`, exported desired config, generated config, and effective state;
- shell syntax (`sh -n`) and executable permissions;
- BusyBox applet behavior through a tiny semantic input/output test, not `--help` or exit code alone;
- actual availability and semantics of `flock`, `mkfifo`, `jsonfilter`, `ubus`, `iw`, and procd interfaces;
- foreign binary architecture, version, hash, loader, and library compatibility;
- packet-filter/BPF compilation for the target data-link type, followed by a real-frame probe.

## Resource Ownership Manifest

Capture before, during, and after lifecycle tests:

| Type | Identity | Owner Proof | Expected Count | Cleanup Proof |
|---|---|---|---|---|
| process | PID / PPID / cmdline | ... | ... | ... |
| interface | name / type / wiphy / ifindex | ... | ... | ... |
| file | path / type / mode | ... | ... | ... |
| socket/listener | address / inode | ... | ... | ... |
| procd instance | service / instance | ... | ... | ... |
| UCI change | package / section / option | ... | ... | ... |

Never kill a process or remove an interface/file from a name match alone; prove ownership.

## Verification Ladder

1. Syntax, permissions, architecture, and hashes.
2. Desired, generated, and effective configuration.
3. procd instance, PID/PPID/cmdline, interfaces, listeners, and health timestamps.
4. Internal protocol-level behavior.
5. Real external client behavior.
6. Negative controls such as reject/allow, bypass, stale state, and partial failure.
7. Stop/start/restart/reload recovery semantics.
8. Resource-leak and duplicate-worker audit.
9. LuCI/ubus/API state agrees with effective runtime behavior.
10. Rollback restores config, enable state, management access, and functional behavior.

`ready`, a successful restart, a live PID, or an HTTP 200 is never enough when a real authentication, association, forwarding, filtering, or DNS request is available.

## Lifecycle And Leak Scenarios

- Stopped baseline has no owned workers, helpers, private interfaces, FIFOs, PID files, locks, sockets, or temporary files.
- Normal start matches the exact resource manifest.
- Stop removes only owned resources.
- Five consecutive restarts leave no old PID and do not increase process, interface, FD, listener, or temporary-file counts.
- Missing dependency or invalid filter enters a bounded degraded state without a respawn storm or half-created resources.
- A child crash restores only the intended instance.
- Wi-Fi reload recreates resources once and finishes with a real client request, not a synthetic ready flag.
- Loss and recovery of one radio is reflected accurately and creates no duplicate monitor.
- Concurrent event/approval paths cannot reinsert stale pending state after approval.
- External same-name resources and stale unowned PIDs remain untouched.
- Service restart does not reload the AP unless explicitly required; an authorized Wi-Fi reload must recover allowed clients.
- Rollback and failed exits leave UCI, service enable state, management path, and policy lists consistent.
- Temporary diagnostics, staged binaries, monitors, FIFOs, PID files, and logs are removed at handoff.

## Stop Conditions

- Capability behavior differs from the assumed implementation.
- Management access, rollback, or ownership proof is uncertain.
- Functional readiness cannot be proved from a real affected client.
- Lifecycle checks reveal duplicate or leaking resources.

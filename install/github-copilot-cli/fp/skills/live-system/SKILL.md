---
name: fp-live-system
description: "Remote, stateful, or embedded system operations. Use when working with routers, OpenWrt, embedded Linux, VMs, containers, remote servers, or any target where a restart or 'ready' label is not proof of function. Provides management path preservation and verification protocols."
---

# FP Live-System Profile

For remote/stateful targets, load `../templates/remote-stateful-system-checklist.md`.
For OpenWrt/embedded Linux/routers, also load `../templates/openwrt-live-system-verification-profile.md`.

## Core Rules

1. **Preserve management path** — never lock yourself out.
2. **Create rollback point** before any write.
3. **Inspect desired/generated/effective state** — config file ≠ running state.
4. **Verify with real client path** — a service restart or `ready` label is not proof.
5. **Track resource ownership** — prove stop/restart/reload don't leak processes, sockets, or locks.
6. **Redact secrets** from all output.

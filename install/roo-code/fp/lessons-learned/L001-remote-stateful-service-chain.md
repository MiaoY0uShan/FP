# Lesson: Remote Stateful Service Chains Need Runtime Proof

## Status

observation

This legacy card predates the v0.3 generalization contract and is not promoted reusable policy.

## Context
When changing a remote or stateful system such as a router, DNS chain, firewall, service mesh, package manager cache, CI runner, database, or production-like host.

## Related
- [[L002-stateful-ui-handoffs]](generalizes) — UI handoffs are a special case of remote statefulness where the "remote" is a browser across a navigation boundary, and the "state" lives in client-side persistence (IndexedDB, file/blob handles) instead of a server process.

## Anti-Pattern (The Trap)
Treating remote configuration like ordinary repository code:

- editing desired config without proving the live runtime state;
- changing multiple layers before a rollback point exists;
- trusting UI fields or static files without checking generated config and listening ports;
- validating only from the host itself, not from an external client path;
- exposing secrets while collecting logs or command output;
- declaring success after a service restart without black-box behavior checks.
- trusting a target command's exit status without proving its BusyBox/platform semantics;
- deleting same-name resources without proving ownership;
- treating a health label as functional readiness.

## Correction (The Fix)
Use a staged runtime loop:

1. Identify the intended request path and the hidden bypass paths.
2. Capture current config and runtime state before editing.
3. Create a backup or rollback point before the first write.
4. Change one layer at a time unless a single atomic change is safer.
5. Validate syntax before restart when the service supports it.
6. Restart in dependency order and confirm every touched service is running.
7. Verify both internal hops and external client behavior.
8. Prove negative controls, such as blocked bypass ports or disabled services.
9. Record the backup path, checks run, and residual risk.
10. Run semantic micro-tests for target capabilities instead of trusting help text or exit status.
11. Track process/interface/file/socket ownership and prove stop/restart/reload does not leak or duplicate resources.
12. Treat readiness as functional only after a real affected client and a negative control pass.
13. Redact or avoid secrets in logs, diffs, and final summaries.

## Evidence
A 2026-05-25 iStoreOS DNS-chain repair used this pattern:

- backed up router configs before each change set;
- separated roles for AdGuard Home, mosdns, SmartDNS, OpenClash, and dnsmasq;
- checked generated runtime configs, process status, listening ports, and firewall isolation;
- verified internal DNS hops with `nslookup`;
- verified external client behavior from Windows;
- used non-sandbox `curl.exe` for Schannel-sensitive HTTPS checks;
- recorded backup paths and validation results in the handoff document;
- avoided printing full proxy node secrets in the final record.

A later OpenWrt device-admission run independently showed that BusyBox-compatible commands can return success while ignoring assumed sorting semantics, and that `ready`/restart evidence can disagree with real Wi-Fi association. This second run supports promoting target capability micro-tests and functional readiness into the reusable lesson.

## Reuse Trigger
Apply this lesson when the work touches a running host, network path, firewall, DNS, proxy, database, queue, cache, CI agent, or any system where a successful file edit is not enough evidence.

## Safety Boundary
Do not turn every repository edit into production ceremony. Apply the full live-system profile only when runtime state, external clients, or rollback genuinely matter.

## Backlinks (computed — do not author)

> community-14 | leaf | in_degree=2 out_degree=1 | rebuilt 2026-07-19

- [[L002-stateful-ui-handoffs]](generalizes)
- [[L003-record-target-precedence]](related_to)

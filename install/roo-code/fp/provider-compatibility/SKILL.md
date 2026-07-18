---
name: fp-provider-compatibility
description: "Use only when routed by FP for an agent host using a non-native model provider, API-compatible endpoint, gateway, or local proxy, or when loops, retries, token spend, cache accounting, streaming, tool calls, or encoding are suspect."
---

# FP Provider Compatibility

Treat an agent host, proxy, and model provider as separate systems. API-format compatibility is not behavioral equivalence, and an inference endpoint is not a subagent runtime.

## Entry And Authority Gate

Load this profile when any of the following applies:

- the host is pointed at a third-party or API-compatible provider;
- a gateway or local proxy sits between the host and provider;
- retries, repeated tool calls, background agents, token spend, cache reporting, streaming, or encoding are suspect;
- the requested model may be remapped before it reaches the wire.

Unknown-cause work stays on the read-only diagnosis route. Inspect local configuration, versions, health, redacted logs, transcripts, request counters, and provider documentation first. No paid probe, direct provider call, proxy failover, configuration write, login, or secret use occurs without the authority already granted for that exact action. Never print an API key or authorization header.

Load `../templates/provider-compatibility-and-spend-guard.md`. Record `provider_compatibility_evidence` when this profile affects completion.

## Resolve The Effective Chain

Resolve and record the effective chain in order:

```text
agent host + version
-> process environment and selected settings
-> local proxy/gateway + version + health
-> wire protocol and endpoint
-> requested model -> effective wire model
-> provider
```

Environment overrides and live takeover state win over a UI selection. If a configured loopback proxy is not listening, fail preflight before any paid work. A healthy process or HTTP 200 is not semantic completion: require a valid terminal stop reason, complete incremental UTF-8 stream, parsable usage, and a successful tool call/result round trip.

Compare the installed versions and exact protocol fields with current official compatibility documentation. Record ignored, remapped, partially supported, and unsupported fields. An unknown model that silently falls back is a compatibility failure unless the frozen brief explicitly accepts that effective model.

## Retry Ownership And Spend Budget

Freeze one request, token, and subagent budget before execution: maximum logical requests, physical attempts, input tokens, output tokens, active subagents, cumulative subagent threads, turns, and time. The first crossed ceiling stops new work; successful sibling requests do not erase an overrun.

Prefer a single retry owner. When retries exist at multiple nested layers, calculate retry multiplication as the product of `(max_retries + 1)` for every host, proxy, SDK, and failover layer. If that worst case exceeds the physical-attempt ceiling, do not start delegated or paid execution. A displayed retry count is not enough; reconcile observed per-attempt IDs when available.

Never retry permanent 4xx authentication, payment, validation, or unsupported-feature failures. After any visible model output, tool result, or possible mutation, do not replay the whole request; reconcile state first. Disable unlimited retry watchdogs, restored loops, scheduled loops, and automatic interrupted-turn continuation unless the brief explicitly bounds and authorizes them.

## Semantic Loop Breaker

Fingerprint every tool action from the canonical tool name, redacted normalized arguments, relevant state version, and observation hash. Two executions of the same semantic tool action with the same state and observation consume the default allowance; stop before a third. A changed timestamp alone is not progress.

Track whether each turn adds evidence, changes a named decision, advances an acceptance row, or changes authorized state. Three non-narrowing iterations stop the run and trigger an architecture/observability checkpoint. Also stop on repeated permanent errors, a crossed request/token/thread budget, an unavailable proxy, stale authority, or a user stop.

Subagents inherit smaller per-task budgets. Delegated-execution leaves cannot spawn descendants, run scheduled loops, resume an old agent as a fresh stage, or continue after the parent budget is exhausted.

## Cache And Accounting

Do not infer provider caching from an Anthropic-style `cache_control` field or a gateway dashboard. Record the provider's actual cache semantics and raw usage fields. Reconcile, without double counting:

```text
logical host responses
-> host retry attempts and subagent/background requests
-> proxy requests and retries
-> provider request IDs and raw usage
-> provider invoice or billing ledger
```

Use hashes rather than raw prompts. Preserve canonical-body and stable-prefix hashes, wire model, tool-schema hash, stable user/cache partition, status, attempt owner, stop reason, cache hit/miss tokens, and output tokens. Provider billing is authoritative for charged usage; host and proxy totals remain diagnostic estimates. An unresolved discrepancy remains explicit and blocks cost claims.

## Encoding Gate

Decode captured bytes with strict UTF-8 and classify corruption at the first divergent boundary: model bytes, proxy stream, tool output, shell bridge, or terminal rendering. Do not confuse a console code-page decode error with model output. Validate both streaming and non-streaming paths, incremental decoding across chunk boundaries, SSE comments/empty lines, and the Unicode sentinel in the checklist.

Tool-output corruption may be isolated and repaired without claiming model corruption. Any unresolved replacement character in the model or proxy stream blocks semantic completion.

## Closure

For a diagnosis, report supported causes, falsified causes, unknowns, and the smallest safe configuration options; do not mutate external configuration. For authorized execution, completion requires budgets within bounds, no triggered loop breaker, a usable compatibility status, strict UTF-8 evidence, semantic stream/tool completion, and reconciled or explicitly partially reconciled accounting. FP can bound and expose compatibility failures; it cannot make a provider implement protocol features the provider does not support.

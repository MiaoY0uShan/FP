# FP adapters

FP is agent-agnostic. Adapters describe how each agent should discover and apply the same routing rules.

Default behavior:

```text
Infer FP from the user's goal. Activate it automatically for engineering work and keep it dormant for casual or other non-engineering goals. `FP:` and `$fp` are optional, never required.
```

Optional explicit invocation:

```text
FP: <task or idea>
$fp <task or idea>
```

Expected behavior:

- small change -> 3-5 line brief plus validation result
- medium task -> compact Execution Brief plus Evidence Ledger
- large, vague, architectural, or risky task -> full chain
- failed task -> Failure-to-Smaller-Task Protocol and a smaller brief
- protocol or agent-behavior change -> confirm intent and boundaries before editing
- unknown cause or diagnose-only -> debug-first, read-only evidence before edits
- multi-agent -> ordinary children for independent investigation/review; delegated execution for bounded writing agents; one shared-file writer; parent verification

Runtime selection is capability-driven. [`../fp/contracts/agent-runtime-registry.v1.json`](../fp/contracts/agent-runtime-registry.v1.json) indexes current official evidence across native, extension, unverified, model-API-only, and retired surfaces. [`../fp/templates/agent-runtime-adapters.md`](../fp/templates/agent-runtime-adapters.md) maps portable spawn/join/status/follow-up/cancel semantics. Installed tools always win over the registry hint.

When a host uses a third-party model, compatible endpoint, gateway, or proxy, apply the provider-compatibility profile as a separate layer. The model provider never selects the subagent runtime; the host does.

Adapters stay thin and point to the canonical router. The only normative native/standard/manual coverage matrix is in [`../INSTALL.md`](../INSTALL.md); do not infer support merely from a file existing in a package.

Agent-local skill directories such as `.agents/skills/` are local configuration unless a repository explicitly opts in.

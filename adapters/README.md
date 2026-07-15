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
- multi-agent -> independent review, one shared-file writer, parent verification

Adapters stay thin and point to the canonical router. The only normative native/standard/manual coverage matrix is in [`../INSTALL.md`](../INSTALL.md); do not infer support merely from a file existing in a package.

Agent-local skill directories such as `.agents/skills/` are local configuration unless a repository explicitly opts in.

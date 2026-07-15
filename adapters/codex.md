# ZeroToHero adapter: codex

ZeroToHero is agent-agnostic.

Default behavior:

```text
Use ZeroToHero proactively for coding work, then choose the lightest evidence-backed path.
```

Manual override:

```text
ZeroToHero: <task or idea>
```

Expected behavior:

- small change -> 3-5 line brief plus validation result
- medium task -> compact Execution Brief plus Evidence Ledger
- large, vague, architectural, or risky task -> full chain
- failed task -> Failure-to-Smaller-Task Protocol and a smaller brief
- protocol or agent-behavior change -> confirm intent and boundaries before editing
- unknown-cause failure or diagnose-only request -> debug-first, read-only evidence before edits
- multi-agent task -> independent investigation only, one writer per shared file set, parent re-verification

`.agents/skills/` is local agent configuration unless a repository explicitly opts in. Do not commit a project-root `.agents/skills/` directory by accident.

This adapter does not add a runtime, CLI, npm package, npx installer, pip package, or database.

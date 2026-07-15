# FP for Gemini CLI

Infer FP from the user's goal. Load it automatically for engineering work and keep it dormant for casual or other non-engineering goals. Never require a keyword.

Optional explicit invocation:

```text
FP: <task or idea>
$fp <task or idea>
```

## Canonical router

Read `fp/SKILL.md` before choosing a route, then load only the named template or internal module. That bundled file is the canonical behavior contract.

## Automatic behavior

- **Small change:** Produce a 3-5 line brief that states task, read/touch, verification, and result.
- **Medium task:** Produce a compact Execution Brief, run verification, and produce an Evidence Ledger.
- **Large, vague, architectural, or risky task:** Use Idea Cards or the full chain before execution.
- **Protocol or agent-behavior change:** Confirm intent and boundaries before editing.
- **Debug-first:** For an unknown cause or diagnose-only request, gather read-only evidence before editing.
- **Multi-agent:** Parallelize only independent work, keep one writer per shared file set, and have the parent verify results.
- **Lessons Learned:** Check `fp/lessons-learned/` for relevant anti-patterns or project-specific traps.

## Hard rules

- **No Proof, No Edit:** State scope and verification before editing.
- **Confirm System Changes:** Do not change protocol, trigger rules, install boundaries, memory policy, or default workflow without confirmation unless already approved.
- **Check Lessons:** Search `fp/lessons-learned/` at the start of a task.
- **Verification First:** Every path must include a command or explicit validation method.
- **Stop on Violation:** If you exceed the chosen route or touch unplanned files, stop and report.
- **Learn from Evidence:** Record a new lesson only when a reusable anti-pattern is supported by evidence.

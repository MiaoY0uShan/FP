---
name: fp-debug
description: "Debug-first diagnosis protocol for unknown failures. Use when the cause is unknown, a bug needs diagnosis before fixing, or the user asks 'what's wrong' without requesting a fix. Provides structured hypothesis-probe-decision loop with evidence tracking."
---

# FP Debug-First Diagnosis

Load `../templates/debug-incident-checklist.md` for the full checklist.

## Route

```text
pin symptom → read-only baseline → falsifiable hypothesis
→ cheapest discriminating probe → decision → authorized fix
→ original reproduction + regression + negative control
```

## Rules

1. Read-only until a cause is supported and user authorizes a fix.
2. Keep at most two active hypotheses; run one discriminating probe at a time.
3. Speculative patches are never probes.
4. Three consecutive non-narrowing probes → architecture/observability checkpoint.
5. After hypothesis is supported, extra probes must change a named decision or fill a named acceptance row. Otherwise stop and reuse evidence.

**Active incident variant:** `OBSERVE → CONTAIN → RESTORE → REPAIR → LEARN`
Preserve evidence, access, and rollback. Restore service before permanent repair.

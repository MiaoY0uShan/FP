---
name: fp-metrics
description: "Use only when routed by FP after a canonical Evidence Ledger and when measurement or a comparable baseline matters."
---

# FP: Metrics

Metrics expose missing evidence; they do not manufacture proof that FP is efficient.

## Use When

- A canonical Evidence Ledger exists.
- The user asks for measurement, a release needs evaluation, or adaptive improvement needs quantitative support.
- Planned files and required checks can be obtained from the Execution Brief.

Skip trivial work. Without a required-check contract, verified task count is `unknown`. Without verified progress, TVP is undefined. Without a comparable baseline, make no improvement or efficiency claim.

## Metrics

```text
TVP = exact_context_tokens / verified_tasks_completed
Context Load Proxy = files_read + observed_skills_loaded + observed_reports_used
Proxy TVP = context_load_proxy / verified_tasks_completed
Scope Creep Rate = unplanned_files_touched / files_touched
Verification Rate = tasks whose required checks all passed / completed tasks
Rework Rate = failed_or_reopened_tasks / completed tasks
```

Counts must come from `metrics_inputs`, the brief, or ledger arrays. Missing values stay `unknown`/`null`; never hardcode defaults.

For one task, verified progress requires all of:

- `result=pass`;
- a brief with at least one required check;
- every required check was run and passed;
- no failed check;
- at least one evidenced verified claim;
- no contract, scope, or context-budget violation.

## Evaluation Quality

When comparing approaches, hold task, agent/model, repository revision, and acceptance checks constant; use fresh isolated workspaces, repeat runs, preserve raw artifacts, and score functional verification/safety separately from tokens or lines changed. Disclose contamination, timeouts, sample size, and limitations.

## Procedure

1. Validate the canonical ledger and brief.
2. Read observed metric inputs; do not estimate missing counts.
3. Calculate only defined metrics.
4. State facts separately from comparisons.
5. Recommend adaptive improvement only when evidence supports a reusable change.

Run:

```text
node fp/metrics/collect.js <evidence-ledger.json> [execution-brief.json]
```

Use `templates/metrics-report.md` for a manual report. The collector supports legacy Markdown for one migration cycle and prints a warning; JSON v1 is canonical.

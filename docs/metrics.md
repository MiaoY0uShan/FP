# ZeroToHero Metrics

Metrics are conservative: missing inputs are `unknown`, zero is used only when zero was observed, and division with no verified progress is undefined.

## Verified Progress Gate

A task counts only when `result=pass`, the brief supplies required checks, all required checks passed, at least one claim has evidence, and no failed check or contract/scope/context violation remains.

## Formulas

```text
TVP = exact_context_tokens / verified_tasks_completed
Context Load Proxy = files_read + observed_skills_loaded + observed_reports_used
Proxy TVP = context_load_proxy / verified_tasks_completed
Scope Creep Rate = unplanned_files_touched / files_touched
Verification Rate = tasks whose required checks all passed / completed tasks
Rework Rate = failed_or_reopened_tasks / completed tasks
```

Proxy inputs come from ledger `metrics_inputs`; they are never hardcoded.

## Claims ZeroToHero May Make

- The route constrained scope and checks.
- Required checks did or did not pass.
- Scope drift was observed.
- A comparable repeated evaluation improved or worsened a metric.

It may not claim token, time, code, or quality improvement from one anecdote or without a baseline.

## Comparable Evaluation

Hold task, acceptance checks, agent/model, and repository revision constant. Use fresh isolated workspaces and repeated runs. Preserve raw outputs/workspaces for rescoring. Score functional evidence and safety separately from tokens, latency, or changed lines. Disclose baseline contamination, timeouts, sample size, and limits.

Run:

```text
node zerotohero/metrics/collect.js <ledger.json> [brief.json]
```

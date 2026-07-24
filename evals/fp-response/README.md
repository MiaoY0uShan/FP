# FP Response Evaluations

This harness compares behavior, not response length. It evaluates whether FP makes results, evidence, and the real next action easier to recover without weakening authority, safety, correctness, or agent autonomy.

## Free validation

```bash
node scripts/run-response-evals.mjs validate
node scripts/run-response-evals.mjs validate --runner-config evals/fp-response/runners.example.json
node scripts/run-response-evals.mjs plan --trials 3
```

These commands make no model calls.

## Run isolated conditions

Use the same pinned runner, model, cases, trial count, budget policy, and runner isolation for every condition.

```bash
node scripts/run-response-evals.mjs run \
  --runner fixed-model \
  --condition baseline \
  --trials 3 \
  --budget-usd 10 \
  --runner-config path/to/runners.json \
  --output evals/fp-response/results/responses.jsonl

node scripts/run-response-evals.mjs run \
  --runner fixed-model \
  --condition candidate \
  --condition-file fp/templates/actionable-response-contract.md \
  --trials 3 \
  --budget-usd 10 \
  --runner-config path/to/runners.json \
  --output evals/fp-response/results/responses.jsonl
```

Runner commands are argv arrays executed with `shell: false`, so the harness does not depend on POSIX `sh` and does not interpolate prompts into a shell command. Each runner must declare `isolated: true` and pin `model`. An unmetered runner is rejected unless `--allow-unmetered` is supplied and the provider account has a separate hard cap.

Runs are resumable. Existing `(case, trial, condition, runner, model)` rows are skipped.

## Blind and judge

```bash
node scripts/run-response-evals.mjs blind \
  evals/fp-response/results/responses.jsonl \
  --output evals/fp-response/results/blinded.jsonl \
  --key-output evals/fp-response/results/blind-key.jsonl
```

Keep the key away from the evaluator. Score each blinded response with the dimensions in `rubric.md`, then restore the condition field with the key and write score rows:

```json
{"case_id":"direct-answer","trial":1,"condition":"candidate","runner":"fixed-model","model":"pinned-model","correctness":5,"authority_safety":5,"evidence_fidelity":5,"autonomy":5,"actionability":5,"concision":5,"blocker":false,"notes":"Direct and complete."}
```

Apply the release gate:

```bash
node scripts/run-response-evals.mjs score evals/fp-response/results/scores.jsonl
```

Exit code `0` means release-pass, `2` means a valid comparison that failed the release gate, and `1` means invalid inputs or execution failure.

## Negative controls

The catalog includes direct-answer, casual, detailed-explanation, ranked-options, and output-only negative controls. They guard against over-applying the candidate response shape where the task or explicit format should win.

## Isolation contract

- Disable user plugins, hooks, memory, instructions, and output styles in the external runner.
- Pin exact CLI and model versions outside this repository and record them with results.
- Never compare different cases, trials, runners, models, rubrics, or isolation settings.
- Paid runs require their own authority and budget; CI runs only free validation and unit tests.

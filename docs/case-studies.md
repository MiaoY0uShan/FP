# ZeroToHero Case Studies And Evaluation Status

The five early self-use files under `examples/case-studies/` illustrate scope and evidence shapes. Their former `characters / 4` comparison against a monolithic prompt was not a controlled agent baseline, so the percentage-reduction claim is retired.

They may demonstrate:

- which route/resources were selected;
- declared scope and stop conditions;
- the intended evidence shape.

They do not prove lower tokens, latency, cost, rework, or higher quality.

## Required Future Benchmark

A valid comparison must hold constant:

- task and acceptance checks;
- agent/model and tool permissions;
- repository revision;
- fresh isolated workspace/context;
- timeout and retry policy.

It must repeat runs, preserve raw transcripts/workspaces, report contamination and failures, and score functional verification/safety separately from token, latency, or changed-line metrics. Results remain preliminary until an external or independently reproducible batch exists.

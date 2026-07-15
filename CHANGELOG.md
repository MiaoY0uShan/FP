# Changelog

## v0.4.0 — FP rename and goal-matched activation

- Renamed the current product, skill identifiers, canonical source path, install packs, managed entries, and release assets from ZeroToHero to FP.
- Made activation goal-based: FP loads automatically for engineering work, stays dormant for casual or other non-engineering goals, and keeps `FP:` plus `$fp` as optional explicit invocations.
- Added fail-closed migration from ZeroToHero v0.3.x and earlier Xskill installations so two branded routers cannot remain active together.
- Moved continuation fingerprints and parent-owned artifacts to the FP namespace; pre-0.4.0 continuations require a fresh baseline before any write can resume.
- Preserved dated ZeroToHero validation and host-smoke records as historical evidence rather than rewriting past runs under the new name.
- Updated the canonical schema ID and release version to v0.4.0.

## v0.3.1 — Retired-module routing correction

- Replaced retired `learn-after-run` references with the evidence-gated `adaptive-improvement` route.
- Removed the retired `semantic-memory` context-retrieval route; missing architecture context now uses minimal local discovery, explicit user decisions, or the external-context contract as appropriate.
- Added a regression contract that prevents retired module names from returning to the canonical ZeroToHero bundle.
- Added a release gate that requires the version tag and `origin/main` to resolve to the same commit before assets can be published.

## v0.3.0 — ZeroToHero rename and reliability contracts

- Renamed the product, skill identifiers, source path, install packs, and release assets from Xskill to ZeroToHero.
- Added bounded distributed task/result envelopes with authority/tool ceilings, DAG/depth/time/iteration limits, stable result ordering, idempotency, writer leases, cancellation propagation, evidence references, and terminal cleanup gates.
- Bound every distributed gate to distinct observed commands and independent reviewer task/session identities; derived direct-parent scope, URL boundaries, concurrency, dependency timing, attempts, cancellation, summary, artifact, and lease outcomes from machine data.
- Added the `generalization-gate` skill and machine learning-candidate contract: finite-case leave-one-out, hidden independent evaluators, negative controls, invariants, baseline comparison, complexity budgets, shadow/expiry, approval, provenance, and rollback.
- Added recomputable source-ledger snapshots, producer/stage/subject/hash evidence binding, same-unit baseline/candidate measurements, independent oracles, applied-target hashing, and trusted-clock future-shadow checks.
- Prevented single-run schema/automation promotion and machine-rejected leakage, overfit, underfit, negative transfer, self-evaluation, stale sources, and user-owned background curation.
- Added debug-first and active-incident routes with original-symptom and three-failed-hypothesis gates.
- Added acceptance evidence, seven-rung reuse, multi-agent single-writer/re-review, OpenWrt/live-system, external-context, and safe-continuation profiles.
- Made Evidence Ledger v1 JSON the canonical machine contract with a zero-dependency linter.
- Repaired metrics so missing inputs stay unknown and no baseline produces no efficiency claim.
- Added behavior/contract tests, BOM/frontmatter checks, generated-pack parity, and validation-before-release.
- Added one universal pack plus dedicated packs for Codex, Claude Code, Gemini CLI, GitHub Copilot, Cursor, Windsurf, Cline/Roo Code, OpenCode, Kiro, and Aider.
- Added fail-closed PowerShell/POSIX uninstall with manifest ownership, namespace-collision protection, project-file preservation, and lifecycle tests.
- Rewrote the README with an original Ponytail-inspired concrete-story rhythm, a distributed-agent walkthrough, honest finite-evidence claims, and a single recommended install path.

## v0.2.5 — Routing and package validation

- Added tiered task routing, proactive activation, and release-packaging checks.
- Synchronized the core bundle across supported host packs and restored required skill frontmatter.
- Tightened generated documentation validation and merged the release-packaging work into `main`.

## v0.2.4 — One-download release kit and keynote README

- Rewrote README around Hero, Enemy, Demo, Magic, Proof, Workflow, Install, Examples, Philosophy, and Credits.
- Made proactive activation the default user experience in the README.
- Clarified that `ZeroToHero: <task>` is a manual override, not the default path.
- Added one total release kit that contains the complete repo package, universal release package, four agent-specific packages, copy-paste fallback, release notes, and git commands.
- Kept ZeroToHero portable: no CLI, npm, npx, pip, database, runtime, or automatic executor.

## v0.2.3 — Proactive ZeroToHero activation

- Made proactive activation the default behavior for non-trivial coding tasks.
- Downgraded `ZeroToHero: <task>` to a manual override instead of the primary user interface.
- Updated `zerotohero/SKILL.md` and `zerotohero/AGENTS.md` with automatic trigger rules.
- Updated README, START_HERE, INSTALL, TEST_ZEROTOHERO, install packs, copy-paste fallback, and adapter-facing instructions.
- Kept ZeroToHero portable: no CLI, npm, npx, pip, database, runtime, or automatic executor.

## v0.2.2 — ZeroToHero router and Idea Cards

- Added top-level `zerotohero/SKILL.md` router.
- Changed the default user trigger to `ZeroToHero: <task or idea>`.
- Added Idea Cards for vague user intent.
- Added `zerotohero/templates/idea-cards.md`.
- Added `zerotohero/examples/dumb-simple-install.idea-cards.md`.
- Added `docs/router.md`.
- Upgraded Context Budget Contract to support agent-estimated budgets with confidence and assumptions.
- Updated README, START_HERE, INSTALL, install packs, test instructions, adapter docs, and release checklist.
- Kept ZeroToHero portable: no CLI, npm, npx, pip, database, runtime, or automatic executor.


## v0.2.1 — One zip per agent

- Added one-zip-per-agent release assets for Codex, Claude Code, Gemini CLI, and GitHub Copilot CLI.
- Added copy-paste fallback for unsupported agents.
- Added `TEST_ZEROTOHERO.md` for install verification.
- Added `dist/README.md` and `dist/zerotohero-copy-paste.md`.
- Simplified README around: pick agent → download one zip → unzip → say one sentence.
- Updated `START_HERE.md`, `INSTALL.md`, `install/README.md`, `docs/portable-install.md`, and `docs/release-checklist.md`.
- Kept ZeroToHero portable: no CLI, npm, npx, pip, database, runtime, or automatic executor.

## v0.2.0 — Dumb-simple install

- Added `START_HERE.md` for the shortest possible install path.
- Added `INSTALL.md` with copy-only instructions for Codex, Claude Code, Gemini CLI, and GitHub Copilot CLI.
- Added `install/README.md` so release users can pick one folder and start.
- Simplified README around a 30-second start path.
- Moved complex protocol details lower in the README.
- Clarified the single usage sentence: `Use ZeroToHero to compile this task before editing code: <task>`.
- Kept ZeroToHero portable: no CLI, npm, npx, pip, database, runtime, or automatic executor.

## v0.1.11 follow-up — Self-use evidence case studies

This was an untagged documentation follow-up before v0.2.0; the v0.1.11 tag itself introduced the adapter release below.

- Added preliminary self-use evidence to README.
- Added five repository-maintenance case studies.
- Added docs/case-studies.md with token reduction method and results.
- Added case-study examples under examples/case-studies and zerotohero/examples/case-studies.
- Clarified that these are preliminary self-use cases, not an external 10-task benchmark.


## v0.1.11 — Agent-agnostic adapters

- Added ready-made install packs for Codex, Claude Code, Gemini CLI, and GitHub Copilot CLI.
- Moved the agent contract into `zerotohero/AGENTS.md` so users do not need to copy a separate root `AGENTS.md`.
- Added `adapters/` documentation.
- Added `docs/execution-protocol.md`.
- Added single-folder `zerotohero` skill packs for Codex and Claude Code.
- Added Gemini CLI extension pack.
- Added GitHub Copilot CLI custom agent pack.
- Kept ZeroToHero portable: no ZeroToHero CLI, npm, npx, pip, database, runtime, token tracker, graph engine, or automatic executor.


## v0.1.9 — Contracts layer

- Added Context Budget Contract template and JSON contract.
- Added Context Diet Map template and example.
- Added Failure-to-Smaller-Task Protocol template and example.
- Added JSON Evidence Ledger audit example.
- Upgraded the compiled Execution Brief to include contract, diet map, failure protocol, and evidence handoff.
- Updated README, AGENTS.md, zerotohero README, design docs, metrics docs, and validation.
- Kept ZeroToHero portable: no CLI, runtime, database, npm, npx, pip, token tracker, graph engine, or automatic executor.

## v0.1.8 — Metrics layer

- Added `metrics` skill.
- Added `metrics-report.md` template.
- Added `password-reset.metrics-report.md` example.
- Added `docs/metrics.md`.
- Defined TVP: `total_context_tokens / verified_tasks_completed`.
- Added proxy TVP for portable runs without exact token counts.
- Added supporting metrics: Scope Creep Rate, Verification Rate, Rework Rate, Context Load Size, and Iteration Half-life.
- Updated evidence-ledger and adaptive-improvement to use metrics as an evidence-backed handoff.
- Updated compiled Execution Brief to include metrics to record.
- Kept ZeroToHero portable: no CLI, runtime, database, npm, npx, pip, token tracker, or automatic benchmark runner.

## v0.1.7 — Compiled Execution Brief

- Clarified that ZeroToHero is a portable task compiler, not a prompt pack.
- Made the compiled Execution Brief the primary output of the workflow.
- Upgraded `optimize-path` to compile upstream ZeroToHero outputs into the final brief.
- Added `compiled-execution-brief.md` template.
- Strengthened `execution-brief.md` with real goal, MVP scope, module boundaries, files to read/touch/avoid, TDD micro-loops, checks, and evidence requirements.
- Added `password-reset.compiled-execution-brief.json` example.
- Updated README, AGENTS.md, zerotohero README, design docs, usage example, release checklist, and validation workflow.
- Kept ZeroToHero portable: no CLI, runtime, npm, npx, pip, database, graph engine, or automatic executor.

## v0.1.6 — Schema memory and adaptive improvement

- Replaced semantic-memory with schema-memory.
- Merged automate-after-stable and learn-after-run into adaptive-improvement.
- Added evidence-ledger skill.
- Added schema memory cards.
- Added adaptive improvement reports.
- Added automation candidate template.
- Added evidence-based promotion rules.
- Clarified that ZeroToHero learns from evidence, not confidence.

## v0.1.5 — Small-batch optimize path

- Upgraded optimize-path with small-batch quick response, agile working increments, lean waste removal, and minimal safety buffers.
- Upgraded shorten-iteration to split large or failed selected paths into TDD micro-loops.

## v0.1.4 — First-principles scope deletion

- Upgraded delete-scope with first-principles reasoning and Occam's Razor.
- Added MVP nucleus output.

## v0.1.3 — Semantic architecture sketch

- Added semantic-architecture skill.

## v0.1.2 — Five Whys requirement challenge

- Upgraded question-requirements with Five Whys and inversion thinking.

## v0.1.1 — Self-iteration layer

- Added learn-after-run skill and iteration learning note template.

## v0.1.0 — Portable skill bundle

- Initial portable release.

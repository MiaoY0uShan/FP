# Changelog

## v0.4.9 — Route-first architecture, portable integrations, and release hardening

This release consolidates the development previously tagged from v0.4.9 through v0.4.17 and v2.0.0 into the single supported release after v0.4.8.

- Removed machine-specific absolute paths from tracked Gemini, MCP, VS Code, and POSIX test configuration.
- Hardened release packaging with synchronized install packs, version checks, pre-commit validation, checksums, and main/tag equality gates.

### Adaptive improvement and credential management

- **Self-evolution skill** `skills/self-evolve/SKILL.md`: Hermes-inspired closed learning loop with three subsystems:
  - **Memory:** `MEMORY.md` (cross-project facts, ~2200 char limit) + `USER.md` (preferences, ~1375 char limit). Loaded at session start, updated automatically.
  - **Skill:** auto-patching Pitfalls sections when tasks hit uncovered issues. Skill creation when same pattern appears in 2+ tasks.
  - **Nudge:** after ~10 turns or complex task (5+ tool calls), silent reflection decides what's worth saving.
  - **Fast-track pipeline:** Observation (1 task) → Shadow (2 tasks) → Active (3 successes) → Promoted (4+ cases).
- **GCM credential scripts:** `scripts/gcm-get.ps1` (Windows: cmdkey, CredentialManager module, git-credential-manager, env, ~/.fp/credentials fallbacks) + `scripts/gcm-get.sh` (macOS Keychain, Linux secret-tool, git-credential-manager, env).
- **Nudge prompt template:** `/fp-nudge` — manual reflection trigger.
- Core SKILL.md: added Self-Evolution and Credential Management sections.
- On-Demand table: added `skills/self-evolve/SKILL.md` for task-completion auto-capture.

### Pi-native integration: auto-load sub-skills, prompt templates, install target

- **4 new pi auto-load sub-skills** in `skills/`: `fp-debug` (debug-first + incident), `fp-live-system` (remote/stateful/OpenWrt), `fp-continue` (cross-session handoff), `fp-codebase` (codebase analysis with MCP/grep). Each has proper frontmatter for pi's description-based auto-loading.
- **4 pi prompt templates** in `prompt-templates/`: `/fp-cards` (Idea Cards), `/fp-brief` (Execution Brief), `/fp-evidence` (Evidence Ledger), `/fp-small` (Small route). Type `/` in pi's editor to expand.
- **Pi install target** in `pi-install/README.md` with step-by-step setup.
- Core SKILL.md now includes Pi Integration section with references to pi-specific adapters.
- On-Demand table updated to reference new sub-skills alongside existing templates.

### Core slim-down: route-first architecture

- **Core SKILL.md reduced 74%** (350 → 90 lines): kept routing priority, core mandates, build routes, and definition of done. All 14 profiles moved to on-demand sub-skills and templates.
- **AGENTS.md reduced 80%** (120 → 50 lines): minimal bootstrap that delegates detail to SKILL.md.
- **On-Demand Profile table**: 17 conditions mapped to their sub-skills/templates (provider-compatibility, debug-first, live-system, multi-agent, continuation, codebase-analysis, memory-graph, etc.). Profiles load only when their condition matches.
- Combined core context footprint: ~400 lines → ~100 lines per session (75% reduction).
- All existing sub-skills and templates preserved unchanged.

## v0.4.8 — Zettelkasten/Obsidian-inspired conventions and repository navigation

- Added `fp/templates/zettelkasten-conventions.md` — FP card-box writing conventions: atomicity (one pattern per card, ≤50 lines), bidirectional links (every card must link out, backlinks are computed), Folgezettel sequences (`next`/`previous` edges for narrative order), MOC (Map of Content index cards at N≥3 cards per theme), refinement pipeline (fleeting → literature → permanent), serendipity traversal, and card size constraints.
- Added `fp/templates/repository-zettelkasten-navigation.md` — eight protocols for navigating code repositories like a Zettelkasten: (1) Entry Point as MOC, (2) Folgezettel Code Navigation along call chains, (3) Local Graph View via blast-radius, (4) Serendipity Discovery via surprising connections, (5) Refinement Pipeline from code patterns to FP schema cards, (6) Per-Task Note linking evidence to cards, (7) Graph View as Dashboard for memory health, (8) Atomic Module Verification.
- Enhanced `fp/templates/schema-memory-card.md` — added `next`/`previous` Folgezettel edges, `informs` edge type, and `is_moc` boolean for MOC cards.
- Enhanced `fp/contracts/memory-graph.v1.schema.json` — added `next`/`previous` edge types and `is_moc` node property.
- Enhanced `fp/contracts/memory-graph.js` — `buildGraph` parses `is_moc` + `next`/`previous` edges; `syncBacklinks` displays MOC status in computed backlinks section.
- Enhanced `fp/schema-memory/SKILL.md` — added Refinement Pipeline (Zettelkasten stages mapped to FP artifacts), MOC Creation Guide (when and how to create index cards), and Zettelkasten convention references.
- Enhanced `fp/templates/memory-graph-traversal.md` — added Section 7 (Serendipity Traversal: walk different edge types from the same seed) and Section 8 (Folgezettel Navigation: forward/backward along `next`/`previous` edges).
- Enhanced `fp/templates/context-diet-map.md` — added `## Zettelkasten Navigation Source` section (entry point, Folgezettel chain, local graph depth, serendipity alerts, files outside graph).
- Enhanced `fp/templates/codebase-impact-map.md` — added `## Zettelkasten Annotations` section (MOC entry points, Folgezettel chains, surprising connections, refinement candidates, protocols used).
- Enhanced `fp/templates/execution-brief.md` — added navigation style, graph tool used, local graph depth, and navigation protocols to File And Context Budget.
- Enhanced `fp/lessons-learned/README.md` — added Refinement Pipeline section (Zettelkasten stages mapped to FP artifacts, transition triggers, promotion workflow).
- Enhanced `fp/SKILL.md` Memory-Graph Profile with Zettelkasten conventions reference and repository navigation protocol.
- Synced to `fp/CLAUDE.md`, `fp/AGENTS.md`, `fp/README.md`.

## v0.4.7 — code-review-graph MCP integration for user codebase analysis

- Added `fp/templates/codebase-impact-map.md` — protocol template for computing blast radius, test coverage, risk scoring, and dependency clusters of user code changes. Supports both MCP and grep-fallback sources.
- Added `fp/templates/code-review-graph-mcp-contract.md` — full acquisition-and-usage contract mapping all 30 code-review-graph MCP tools to task-oriented categories (orientation, change analysis, deep dive, architecture, risk/quality, refactoring, maintenance). Includes tool selection protocol, fallback rules, authority gates, and acquisition brief following the existing FP MCP Capability Profile pattern.
- Added Codebase-Analysis Profile to `fp/SKILL.md` — layered onto Build or Read-Only Diagnosis routes when reviewing/modifying user code. Prefers code-review-graph MCP when available (~82x token reduction via `get_minimal_context_tool` etc.); falls back to grep-based `codebase-impact-map.md` when MCP is unavailable.
- Enhanced `fp/templates/context-diet-map.md` with `## Codebase Impact Source` section — records MCP tool used, fallback method, token savings estimate, and impact map reference.
- Enhanced `fp/templates/execution-brief.md` with `## Codebase Analysis Contract` section — records MCP availability, primary analysis tool, tools used, test gaps, and risk scoring.
- Synced codebase-analysis profile to `fp/CLAUDE.md`, `fp/AGENTS.md`, and `fp/README.md`.

## v0.4.6 — Graph-structured memory with code-review-graph inspired analysis

- Added typed memory graph: schema cards and lesson cards now form a connected graph via `[[wikilink]]` references in lesson cards and `related-schemas` YAML frontmatter in schema cards. Nine edge types: `depends_on`, `informs`, `conflicts_with`, `supersedes`, `generalizes`, `caused_by`, `mitigated_by`, `related_to`, `references`.
- Added `fp/contracts/memory-graph.v1.schema.json` — JSON Schema v1 for the typed memory graph, covering nodes, edges, blast-radius results, cluster detection, hub reports, and incremental diffs.
- Added `fp/contracts/memory-graph.js` (1522 lines, zero-dependency) — graph operations library: `buildGraph` (scan cards + parse frontmatter/wikilinks), `blastRadius` (BFS traversal on directed edges), `findCommunities` (connected components), `labelPropagation` (lightweight community detection with modularity scoring), `betweennessCentrality` (Brandes' algorithm), `detectHubsAndBridges` (in-degree heuristic + removal test), `incrementalUpdate` (SHA-256 hash diff), `findRelevantCluster` (keyword-scored cluster retrieval), `syncBacklinks` (write computed fields back to source cards), `graphToDot` (Graphviz export), `validateGraph` (referential integrity + dead-link detection). All adapted from code-review-graph's SQLite graph, Leiden community detection, and betweenness centrality; re-expressed as FP-native zero-dependency Node.js scripts following the `evidence-ledger.js` pattern.
- Added `fp/templates/memory-graph-traversal.md` — agent protocol for blast-radius checks, cluster retrieval, hub/bridge detection, incremental updates, DOT visualization, and context-diet-map integration.
- Added Memory-Graph Profile to `fp/SKILL.md` — layered onto medium+ tasks involving schema/lesson cards. Guides agents through graph-aware retrieval, update blast-radius, and cluster retrieval.
- Enhanced `fp/templates/schema-memory-card.md` with YAML frontmatter (`related-schemas`, `task-types`) and computed `## Backlinks` section.
- Enhanced `fp/schema-memory/SKILL.md` with Graph-Aware Retrieval (one-hop edge following), Update Blast-Radius (pre-update traversal), Cluster Retrieval (keyword-based `memory-graph.js` query), and graph-enriched context-diet-map handoff.
- Enhanced `fp/lessons-learned/README.md` with mandatory `[[wikilink]]` graph convention, typed edge table, backlinks protocol, and cross-directory edge rules.
- Added typed `## Related` sections with `[[wikilink]]` edges to all three legacy lesson cards (L001, L002, L003), forming the first connected memory component.
- Added YAML frontmatter with `task-types` to the example validation-bug schema card.
- Enhanced `fp/semantic-architecture/SKILL.md` with memory-graph bridge: when module mapping reveals recurring patterns, check the memory graph for relevant schema/lesson cards.
- Enhanced `scripts/lint-contracts.js` with `--memory-graph` flag for automated graph validation in CI.
- Synced memory-graph references to `fp/CLAUDE.md` (Core Rule 12 + Memory Graph section), `fp/AGENTS.md` (Learning And Records bullet), and `fp/README.md` (Route-Selected Resources).
- Recorded code-review-graph audit baseline in `docs/upstream-influences.md`.
- Updated all generated backlinks to example and lesson cards via `sync-backlinks`.

## v0.4.5 — Delegated execution and provider spend safety

- Added host-capability-driven delegated execution: fresh implementer, task reviewer, conditional fixer/re-reviewer, final integration reviewer, and parent verification.
- Added an explicit independent-problem-domain fan-out/fan-in skill with one-writer leases and bounded active/cumulative threads.
- Added an official-source runtime registry covering native, extension, unverified, model-API-only, and retired surfaces across Codex, Claude Code, Gemini CLI, Copilot, Kimi/Qwen/CodeBuddy/Qoder/ZCode/Comate/CodeArts, and other mainstream tools.
- Added provider compatibility and spend gates for host/proxy/provider health, nested retry multiplication, request/token/subagent budgets, semantic loop breaking, provider-native cache accounting, strict UTF-8 boundaries, and stream/tool completion.
- Added machine-contract and negative-control tests for fresh sessions, review/fix chains, serial writer handoff, retry bombs, budget overruns, loops, and encoding failures.

## v0.4.4 — Decision-relevant verification and safe remote retry

- Added a decision-relevance gate: after a diagnostic hypothesis is supported, another diagnostic probe must be able to change a named decision or fill a named acceptance row; decision-neutral corroboration reuses the bound evidence and stops.
- Kept verification safety explicit: edits, deployments, rollbacks, ambiguous writes, and freshness changes invalidate affected evidence, while original reproduction, sibling regression, negative controls, external-client, rollback, cleanup, and parent integration checks remain mandatory.
- Added user-stop precedence: cancel pending probes and background work, reuse already-observed terminal evidence, and report unknowns without running another command merely to improve closure.
- Added remote ambiguous-write reconciliation: never blindly replay a possibly-applied write after timeout; perform one bounded read-only reconciliation and classify `applied | not_applied | split | unknown` first.
- Separated steady-state runtime dependencies from operator/deployment paths so a temporary workstation does not silently become a resident dependency.
- Fixed shared-path handling in the PowerShell and POSIX ZeroToHero migration gates, and added cross-platform installer integration to the validation workflow.
- Added automatic use of already-available task-required MCPs within existing authority and the reuse ladder.
- Added an explicit acquisition gate for missing MCPs: exact provenance/version/scope/permissions/rollback must be shown before user-approved download or installation; authentication, credentials, configuration changes, restarts, and resident services remain separately authorized.
- Added router contracts and pressure prompts covering evidence reuse, changed-state invalidation, ambiguous remote writes, and user-directed stop.

## v0.4.3 — Compressed router, multi-device coordination, and batch regression

- Compressed the 10-route tree into 4 behavior-based routes: Urgent/High-Stakes, Read-Only Diagnosis (debug-first + audit/survey), Build (Small/Medium/Vague/Large), and Close (pass/fail). Every original route is preserved as a sub-route or scale tier; no behavior was removed.
- Added an Audit / Survey route under Read-Only Diagnosis: read-only per-target baseline, cross-target comparison, P0/P1/P2 triaged report. A one-target audit degenerates to a read-only survey. Targets are not mutated until the user approves specific findings.
- Added Multi-Device Coordination: the one-writer rule applies per target, not globally. Parallel read-only probes across targets are safe. Cross-target dependencies must be mapped before writes. Every multi-device task ends with a cross-target smoke test from the consumer's perspective.
- Added Batch Regression Verification: after multiple fixes, re-run every originally-failed check, run at least one negative control, verify cross-target dependency edges from the consumer side, and produce a single `repair-verdict` block. Missing or still-broken items remain as open items, not silent successes.
- Added a Skill-tool loading pointer to fp/CLAUDE.md so hosts that only receive the lightweight CLAUDE.md reference know that the full router and templates require loading the FP skill via the Skill tool.
- Synchronized the compressed router and new sections to fp/CLAUDE.md, fp/AGENTS.md, fp-copy-paste.md, dist/fp-copy-paste.md, and docs/router.md.

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

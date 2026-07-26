# Evidence Ledger

For auditable medium, debug, incident, live-system, multi-agent, continuation, or risky work, JSON v1 is the machine record. The normative contract is the JSON Schema **plus** `contracts/evidence-ledger.js`; the schema validates structure and portable conditionals, while the semantic validator closes authority, paths/globs, evidence references, route/profile, completion, and resume-state rules.

Markdown is an optional human view. It never upgrades evidence and must not contradict JSON.

## Canonical JSON v1

```json
{
  "schema_version": "1.0.0",
  "task_id": "T001",
  "task": "Concrete task",
  "route": "medium",
  "phase": "execute",
  "profiles": [],
  "mode": "execute",
  "write_authorized": true,
  "scope": {
    "case_sensitive": true,
    "allowed_read": ["src/example.js", "test/example.test.js"],
    "allowed_network_read": [],
    "allowed_touch": ["src/example.js", "test/example.test.js"],
    "out_of_scope_routes": ["billing"]
  },
  "acceptance": {
    "required_checks": [
      {
        "id": "focused-tests",
        "command": "node --test test/example.test.js",
        "pass_condition": "Command exits 0 and the focused behavior assertions pass",
        "expected_exit_codes": [0]
      }
    ],
    "required_claim_ids": ["claim-focused-behavior"],
    "rows": [
      {
        "id": "focused-behavior",
        "kind": "functional",
        "requirement": "The requested behavior works",
        "observable": "Focused assertions pass",
        "check_id": "focused-tests",
        "pass_condition": "Command exits 0 and the focused behavior assertions pass",
        "evidence_location": "commands_run[0]",
        "status": "pass",
        "evidence_ref": "/commands_run/0"
      }
    ]
  },
  "result": "pass",
  "files_read": ["src/example.js", "test/example.test.js"],
  "files_touched": ["src/example.js", "test/example.test.js"],
  "commands_run": [
    {
      "id": "focused-tests",
      "command": "node --test test/example.test.js",
      "result": "pass",
      "evidence": "Focused suite reported all assertions passing",
      "exit_code": 0,
      "expected_exit_codes": [0],
      "pass_condition": "Command exits 0 and the focused behavior assertions pass",
      "provenance": "observed"
    }
  ],
  "verified_claims": [
    {
      "id": "claim-focused-behavior",
      "claim": "The requested behavior passes its focused regression",
      "evidence": "The observed focused suite passed",
      "evidence_refs": ["/commands_run/0"],
      "provenance": "observed"
    }
  ],
  "unverified_claims": [],
  "scope_violations": [],
  "context_budget_violations": [],
  "remaining_risk": "No broader integration claim was made",
  "decision": "complete",
  "next_action": "No action inside the approved scope",
  "recommended_next_skill": null,
  "metrics_inputs": {
    "skills_loaded": null,
    "reports_generated_or_used": null,
    "exact_context_tokens": null,
    "failed_attempts": null,
    "reopened_tasks": null,
    "time_to_first_verified_slice_seconds": null,
    "tdd_micro_loops_to_first_verified_slice": null
  }
}
```

Delete optional blocks that do not apply. Never leave placeholders in a final ledger.

## Route/Profile Additions

- `debug`: record structured experiments. A write requires a supported cause; three consecutive non-narrowing rejected/unknown probes require `debug_checkpoint` before a fourth hypothesis. Completion also requires `debug_evidence` with the causal chain, first divergence, an explicit wait decision, and shared-boundary direct/sibling evidence when applicable.
- `incident`: completed work requires `incident_evidence` for OBSERVE, CONTAIN, RESTORE, REPAIR, and LEARN.
- `openwrt` execution: `remote_stateful_evidence.applies=true`; real client, negative control, lifecycle, resource ownership, management path, rollback, and secret-redaction evidence cannot be `not_applicable`.
- OpenWrt plan-only: use `phase=plan`, `mode=report_only`, zero touched files, and planned acceptance rows. Do not fabricate execution evidence.
- `external_context`: required unknown/stale claims block dependent completion. Every record carries structured `freshness_basis.kind/value`; `current` requires a concrete version, tag, versioned page, commit, or update timestamp rather than `latest`/`current` self-assertion.
- `multi_agent`: completion requires `parent_authority`, one structured `delegations` envelope per child, one-writer evidence, bounded concurrency/depth/time/iterations, stable task-input result order, idempotency, cancellation propagation, passing spec/quality verdicts, re-review, parent rerun, released leases, and terminal agents. Child grants must be a subset of parent authority; leaf and read-only children cannot escalate, no child receives a live-system mutation lease, and proposal/check references must resolve to observed evidence.
- `delegated_execution`: also requires `multi_agent`, an observed available host runtime, unique task/session IDs for every fresh stage, a passing implementer/reviewer/fixer/re-review chain per frozen work item, a fresh final integration reviewer, bounded cumulative threads, serial writer-lease handoff, and parent integration evidence.
- `provider_compatibility`: completion records the host/proxy/provider chain, derived nested retry multiplier, frozen/observed request-token-subagent budgets, semantic loop guard, provider-native cache/accounting fields, strict UTF-8 classification, and stream/tool semantic completion. Report-only diagnosis may record a detected failure; successful paid execution may not close across an exceeded or unexplained gate.
- `background_learning`: also requires `multi_agent`, an agent-created `learning_evidence` candidate, separate read-only candidate/evaluator delegations, hidden holdout coverage, negative controls, invariants, baseline comparison, complexity budget, shadow state, approval, provenance, and rollback. Only `active` claims generalization.
- `continuation`: only incomplete work may carry it. JSON Pointer references must resolve, and resumed writes require a matching `fp-worktree-v1` rehydration.
- `self_iteration`: record each observed finding, bounded change, rerun checks, evidence references, and verdict.
- `deferred_items`: record only deliberate shortcuts that are safe now but have a known ceiling. Include the exact location, shortcut, ceiling, observable upgrade trigger, evidence, and an `evidence_ref` resolving to an observed command or verified claim; a deferred item cannot replace a required current fix.

### Debug completion shape

```json
{
  "debug_evidence": {
    "causal_chain": [
      "producer creates the effective input",
      "shared boundary transforms it",
      "direct consumer exposes the failure"
    ],
    "first_divergence": "The direct caller input first differs from the valid sibling input before the shared boundary",
    "wait_evidence": {
      "applies": true,
      "strategy": "condition",
      "condition_predicate": "the result event has been published",
      "polling_interval_ms": 25,
      "deadline_ms": 2000,
      "final_observation": "the result event was observed before the deadline"
    },
    "shared_boundary_evidence": {
      "applies": true,
      "boundary": "shared parser input/output contract",
      "direct_evidence_ref": "/commands_run/1",
      "sibling_evidence_ref": "/commands_run/2"
    }
  }
}
```

For a fixed wait, use `strategy=fixed`, `duration_ms`, and a substantive `justification` that elapsed time itself is the behavior under test. When waiting or a shared boundary genuinely does not apply, use `applies=false` with a concrete reason rather than fabricating evidence.

### Deferred item shape

```json
{
  "deferred_items": [
    {
      "location": "src/cache.js in-memory cache",
      "shortcut": "Retain the bounded in-memory implementation",
      "ceiling": "Safe below 1000 live entries per process",
      "upgrade_trigger": "Observed live entries reach 800",
      "evidence": "The bounded-volume check passed at the documented ceiling",
      "evidence_ref": "/commands_run/0"
    }
  ]
}
```

### Distributed delegation shape

```json
{
  "parent_authority": ["read", "write", "execute_checks", "delegate", "memory_propose"],
  "delegation_artifact_root": ".fp/artifacts",
  "delegations": [
    {
      "id": "blind-evaluator",
      "parent_id": null,
      "task_id": "evaluate-candidate",
      "session_id": "evaluation-session-a",
      "task_input_index": 0,
      "goal": "Evaluate the frozen candidate on hidden cases",
      "role": "learning_evaluator",
      "status": "completed",
      "read_only": true,
      "granted_authority": ["read", "execute_checks"],
      "toolsets": ["filesystem-read", "test-runner"],
      "context_refs": ["brief:learning-plan", "cases:hidden-fold-1"],
      "allowed_resources": ["fp/**", "test/**"],
      "owned_paths": [],
      "depends_on": [],
      "max_iterations": 8,
      "iterations_used": 3,
      "max_attempts": 2,
      "timeout_seconds": 300,
      "max_spawn_depth": 0,
      "workspace": "isolated evaluation workspace",
      "idempotency_key": "evaluate-candidate-fold-1",
      "attempts_used": 1,
      "summary_budget": { "unit": "words", "limit": 300 },
      "artifact_path": ".fp/artifacts/blind-evaluator.md",
      "artifact_persistence": "parent_only",
      "proposal_evidence_refs": ["/commands_run/0"],
      "check_evidence_refs": ["/commands_run/1"],
      "files_touched": [],
      "mutation_lease": null,
      "result_summary": "The hidden fold passed without authority or scope expansion",
      "started_at": "2026-07-14T00:00:00Z",
      "finished_at": "2026-07-14T00:01:00Z",
      "exit_reason": "Bounded evaluation completed"
    }
  ]
}
```

Direct children use `parent_id=null`. Only `orchestrator` may own children or receive `delegate`; all other roles use `max_spawn_depth=0`. Child authority, resources, and remaining depth are intersected with the direct parent envelope and root ledger scope. Writer ownership patterns must not overlap, and every writer carries a holder/path/time-bound lease with bound release evidence. Artifact paths are parent-persisted logical outputs under the reserved artifact root; a child cannot use them as a hidden source-write channel. Completion derives dependency order, concurrency, timeout, cancellation, lease, retry, result-order, and actual summary-budget gates from envelopes and observed evidence.

### Provider compatibility shape

The complete structural contract is `contracts/evidence-ledger.v1.schema.json`; use `templates/provider-compatibility-and-spend-guard.md` to gather it. The top-level evidence block contains:

```json
{
  "profiles": ["provider_compatibility"],
  "provider_compatibility_evidence": {
    "chain": "host/version -> intermediaries -> protocol -> requested/effective model -> provider",
    "retry_budget": "layers plus derived product of every max_retries + 1",
    "spend_budget": "maximum and observed requests, attempts, tokens, and subagent threads",
    "loop_guard": "semantic-action fingerprint, ceilings, observations, and trigger",
    "accounting": "host/proxy/provider counts, provider-native cache fields, discrepancy",
    "encoding": "strict UTF-8 boundary classification and replacement-character counts",
    "semantic_completion": "stop reason, incremental stream, and tool round trip"
  }
}
```

Every nested block carries an observed `/commands_run/<index>` evidence reference. Do not copy these explanatory strings into a final ledger; populate the exact schema fields with observed values.

### Learning and generalization shape

```json
{
  "learning_evidence": {
    "candidate_id": "validation-boundary-v1",
    "kind": "schema",
    "target": "fp/schema-memory/SKILL.md",
    "target_hash": "sha256:<64 lowercase hex>",
    "candidate_frozen_at": "2026-07-14T01:00:00Z",
    "created_by": "agent",
    "state": "active",
    "proposal_origin_delegation_id": "candidate-agent",
    "holdout_context_refs": ["holdout:case-a", "holdout:case-b"],
    "trigger_invariant": "Repeated validation failures cross independent task families",
    "non_trigger_boundary": "One-off preferences and prompt variants do not trigger",
    "cases": [
      {
        "id": "case-a",
        "kind": "positive",
        "task_family": "authentication",
        "task_id": "task-a",
        "session_id": "session-a",
        "source_ledger_hash": "sha256:<64 lowercase hex>",
        "source_ledger_snapshot": {
          "schema_version": "1.0.0",
          "task_id": "task-a",
          "session_id": "session-a",
          "input_fingerprint": "sha256:<64 lowercase hex>",
          "observed_at": "2026-07-14T00:00:00Z",
          "outcome": "pass",
          "evidence_ref": "/commands_run/0"
        },
        "input_fingerprint": "sha256:<64 lowercase hex>",
        "expected_behavior": "Apply the bounded rule",
        "evidence_ref": "/commands_run/0",
        "result": "pass"
      }
    ],
    "folds": [
      {
        "id": "fold-a-held-out",
        "training_case_ids": ["case-b"],
        "holdout_case_ids": ["case-a"],
        "holdout_blinded": true,
        "holdout_context_ref": "holdout:case-a",
        "baseline_evidence_ref": "/commands_run/1",
        "candidate_evidence_ref": "/commands_run/2",
        "oracle_evidence_ref": "/commands_run/3",
        "metric": "holdout-pass-rate",
        "direction": "higher_is_better",
        "baseline_score": 0,
        "candidate_score": 1,
        "tolerance": 0,
        "comparison": "improved",
        "evaluator_delegation_id": "blind-evaluator-a"
      }
    ],
    "negative_control_case_ids": ["negative-neighbor"],
    "invariant_case_ids": ["authority-invariant"],
    "complexity": {
      "unit": "rules",
      "baseline": 1,
      "candidate": 2,
      "max_delta": 1,
      "baseline_evidence_ref": "/commands_run/9",
      "candidate_evidence_ref": "/commands_run/10"
    },
    "shadow": {
      "required": true,
      "status": "pass",
      "required_successes": 3,
      "observed_successes": 3,
      "observed_failures": 0,
      "expires_at": null,
      "observations": [
        { "id": "future-a", "task_id": "future-task-a", "session_id": "future-session-a", "source_ledger_hash": "sha256:<snapshot hash>", "source_ledger_snapshot": { "schema_version": "1.0.0", "task_id": "future-task-a", "session_id": "future-session-a", "input_fingerprint": "sha256:<64 lowercase hex>", "observed_at": "2026-07-14T02:00:00Z", "outcome": "pass", "evidence_ref": "/commands_run/4" }, "input_fingerprint": "sha256:<64 lowercase hex>", "observed_at": "2026-07-14T02:00:00Z", "evidence_ref": "/commands_run/4", "result": "pass" },
        { "id": "future-b", "task_id": "future-task-b", "session_id": "future-session-b", "source_ledger_hash": "sha256:<different snapshot hash>", "source_ledger_snapshot": { "schema_version": "1.0.0", "task_id": "future-task-b", "session_id": "future-session-b", "input_fingerprint": "sha256:<different 64 lowercase hex>", "observed_at": "2026-07-14T02:10:00Z", "outcome": "pass", "evidence_ref": "/commands_run/5" }, "input_fingerprint": "sha256:<different 64 lowercase hex>", "observed_at": "2026-07-14T02:10:00Z", "evidence_ref": "/commands_run/5", "result": "pass" },
        { "id": "future-c", "task_id": "future-task-c", "session_id": "future-session-c", "source_ledger_hash": "sha256:<third snapshot hash>", "source_ledger_snapshot": { "schema_version": "1.0.0", "task_id": "future-task-c", "session_id": "future-session-c", "input_fingerprint": "sha256:<third 64 lowercase hex>", "observed_at": "2026-07-14T02:20:00Z", "outcome": "pass", "evidence_ref": "/commands_run/6" }, "input_fingerprint": "sha256:<third 64 lowercase hex>", "observed_at": "2026-07-14T02:20:00Z", "evidence_ref": "/commands_run/6", "result": "pass" }
      ]
    },
    "approval": { "status": "approved", "authority_source": "recorded user/parent authority", "approved_by": "parent" },
    "rollback": { "plan": "Restore the prior content hash", "evidence_ref": "/commands_run/7" },
    "activation_evidence_ref": "/commands_run/8",
    "source_context_ids": [],
    "stale": false,
    "generalization_verdict": "pass"
  }
}
```

Every referenced learning command carries a `learning_binding` for the frozen candidate hash, stage, subject, and variant. Baseline/candidate commands also carry matching metric measurements; comparison is derived from score, direction, and tolerance, and a distinct oracle command anchors expected behavior. For two to four positive cases, every fold is exact leave-one-case-out. All active candidates need at least two distinct source-ledger hashes, tasks, sessions, and families; full hidden holdout coverage; at least one measured improvement; no regression; a passing near-neighbor negative control and invariant; three distinct future shadow observations; approval; an applied target whose bytes match `target_hash`; current provenance; and tested rollback. One case can only create an expiring shadow checklist.

## Completion Rules

- `pass` requires observed passing checks and observed claims with resolvable evidence references.
- `complete` requires `result=pass`, every required check/claim, acceptance rows in the correct state, and zero recorded violations.
- `report_only` means no write authority and no touched files.
- Repository reads/writes and URL reads must match their separate root scopes. `allowed_network_read=[]` means no network resources; an agent's `network_read` authority never creates its own allowlist.
- A command pass must satisfy its explicit exit-code expectation. A non-zero exit can pass a negative control only when declared in advance.
- Legacy Markdown/JSON is parse-only, warned, and never counted as verified progress.
- Unknown values stay unknown. No baseline means no efficiency claim.

## Human View

Keep only task/result, files read/touched, command evidence, experiments, verified/unverified claims, violations, risk, decision, and next action. Include IDs and evidence references so it can be checked against JSON.

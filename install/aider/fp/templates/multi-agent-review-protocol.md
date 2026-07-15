# Multi-Agent Review Protocol

Use only when independent investigation or review materially reduces risk or elapsed time.

## Ownership

- Parent/integrator: owns scope, shared writes, integration, final checks, and final claims.
- Evidence reviewer: read-only; attempts to falsify the acceptance and completion evidence.
- Integration reviewer: read-only; checks cross-file, packaging, runtime, rollback, and cleanup consistency.
- Specialist: replaces or supplements a reviewer only for a distinct bounded risk.

Default to parent plus at most two reviewers and a concurrency ceiling of three. One writer owns each shared file set. Parallel writers must have disjoint files and no shared generated output. A live target has exactly one mutation lease, held by the parent. Exceeding a declared concurrency, depth, iteration, or time limit fails explicitly rather than silently dropping work.

Child authority and capabilities must be a subset of the parent authority intersected with the task envelope. A child cannot gain write, deploy, credential, messaging, memory, delegation, or live-system rights that the parent did not explicitly possess and pass down. Read-only reviewers remain read-only even if their tools could technically mutate.

For canonical Evidence Ledger v1, record the authority ceiling and every child task/result envelope as machine data:

```json
{
  "parent_authority": ["read", "write", "execute_checks", "delegate"],
  "delegation_artifact_root": ".fp/artifacts",
  "delegations": [
    {
      "id": "evidence-review",
      "parent_id": null,
      "task_id": "review-acceptance",
      "session_id": "review-session-acceptance",
      "task_input_index": 0,
      "goal": "Falsify the completion evidence without editing",
      "role": "evidence_reviewer",
      "status": "completed",
      "read_only": true,
      "granted_authority": ["read"],
      "toolsets": ["filesystem-read", "test-runner"],
      "context_refs": ["brief:T001", "ledger:T001"],
      "allowed_resources": ["test/example.test.js", "src/example.js"],
      "owned_paths": [],
      "depends_on": [],
      "max_iterations": 8,
      "iterations_used": 2,
      "max_attempts": 2,
      "timeout_seconds": 300,
      "max_spawn_depth": 0,
      "workspace": "isolated review workspace",
      "idempotency_key": "review-acceptance-T001",
      "attempts_used": 1,
      "summary_budget": { "unit": "words", "limit": 300 },
      "artifact_path": ".fp/artifacts/evidence-review.md",
      "artifact_persistence": "parent_only",
      "proposal_evidence_refs": ["/commands_run/0"],
      "check_evidence_refs": ["/commands_run/1"],
      "files_touched": [],
      "mutation_lease": null,
      "result_summary": "The acceptance evidence passed independent falsification",
      "started_at": "2026-07-14T00:00:00Z",
      "finished_at": "2026-07-14T00:01:00Z",
      "exit_reason": "Bounded review completed"
    }
  ]
}
```

Direct children use `parent_id=null`. Only an `orchestrator` may own descendants or receive `delegate`; leaves and reviewers use `max_spawn_depth=0`. The validator rejects parent/dependency cycles, unsuccessful or late dependencies, authority/resources/depth outside either the root or direct-parent ceiling, leaf or read-only mutation, any delegated live-system mutation, overlapping writer paths, artifact paths outside the reserved parent-owned root, non-contiguous or out-of-order task results, observed concurrency/iteration/attempt/time overruns, actual summary overflow, stale or unbound leases, broken cancellation cascade, non-terminal children, and dangling or unbound evidence. Children return long output for parent persistence at the declared logical artifact path; they do not write that path themselves.

One logical task has one result envelope. `attempts_used` records how many idempotent attempts ran and cannot exceed `max_attempts`; the separately bound idempotency command proves retry behavior. Results are stored and integrated in `task_input_index` order, not completion order. Parent cancellation recursively cancels descendants. `multi_agent_evidence` names distinct read-only spec and quality reviewers and points to separate observed commands for spec, quality, cancellation, idempotency, lease cleanup, context isolation, and parent integration. Each command carries a `multi_agent_binding` for the run, producer, gates, and covered task IDs; booleans or prose alone never close a gate.

## Task-Local Context Envelope

```md
Role:
Bounded question:
Goal / acceptance condition:
Exact files or resources allowed:
Allowed tools / capability ceiling:
Authority ceiling:
Parent task / dependency IDs:
Relevant evidence supplied:
Invariants to preserve:
Checks to run:
Forbidden actions:
Output path or response format:
Summary budget:
Parent-only artifact path for full logs/diffs:
Proposal evidence references:
Stop and report when:
```

For background learning, use one read-only `learning_candidate` and separate read-only `learning_evaluator` delegations. Candidate context excludes hidden holdout and expected-answer data. Neither role may receive `memory_promote`; the parent owns shadow/active promotion and rollback.

Do not send raw conversation history when this envelope is enough. Do not disclose another reviewer's conclusion before an independent first pass. Return only status, conclusions, evidence pointers, and unverified items within the summary budget; put long logs, diffs, or raw findings at the declared artifact path so the parent can inspect them without flooding its context.

## Durable Progress Ledger

Use for long tasks, handoffs, or likely context compaction.

```md
Current route and phase:
Accepted scope:
Owner / mutation lease:
Decisions with evidence:
Completed checks and results:
Open findings by severity:
Unverified claims:
Next exact action:
Stale work to cancel:
```

Store decisions and evidence, not a transcript. Respect the newest explicit record destination.

## Review Gates

Each reviewer returns:

```md
Spec verdict: pass | fail | insufficient_evidence
Quality verdict: pass | fail | insufficient_evidence
Findings: severity, evidence, affected acceptance row, required action
Checks independently run:
Unverified claims:
```

- Critical/high findings block completion.
- A fixed blocking finding must be re-reviewed.
- Rejected findings need counter-evidence, not preference.
- Conflicting reviews are resolved by a new discriminating check, not majority vote.
- The parent independently reruns critical checks and performs a final integration diff/release review.

## Shutdown Gate

Before final response, confirm all subagents are terminal, stale tasks and descendants are cancelled, workspace leases are released, idempotent retries did not duplicate side effects, results were integrated in declared order, and no poller, temporary deployment, diagnostic helper, or background resource remains.

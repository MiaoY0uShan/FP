# Execution Brief

This is the medium-task output of FP.

Use it for focused changes that need more than a tiny brief. For small changes, use the tiny brief. For large, vague, architectural, or risky work, run the full chain first and compile the result into this shape.

## Markdown form

```md
# Execution Brief

## Selected Idea Card
Only include this if Idea Cards were used.

## Task

## Real Goal

## MVP Scope

## Must Not Do

## Workspace Baseline

## Acceptance Evidence Matrix

## Reuse Decisions

## Delegation Plan

## Delegated Execution Plan

## Provider Compatibility And Spend Plan

## Learning Evaluation Plan

## Files To Read

## Files To Touch

## Files To Avoid

## Checks

## Evidence To Capture

## Stop Condition
```

## Confirm-first form

Use this before protocol, trigger, install-boundary, memory-policy, or default-workflow changes:

```md
Inferred goal:
Assumptions to challenge:
Proposed files/areas:
Confirmation needed:
```

After confirmation, use the tiny or medium brief that fits the approved change.

## Tiny brief form

Use this for small clear changes:

```md
Task:
Read/touch:
Done when:
Verify:
Result after execution:
```

Keep the stop/must-not boundary on the read/touch line so the form stays five lines.

## JSON form

```json
{
  "task_id": "",
  "selected_idea_card": null,
  "task": "",
  "route": "medium",
  "phase": "execute",
  "profiles": [],
  "mode": "execute",
  "write_authorized": true,
  "parent_authority": [],
  "delegations": [],
  "delegated_execution_plan": null,
  "provider_compatibility_plan": null,
  "learning_plan": null,
  "real_goal": "",
  "mvp_scope": "",
  "must_not_do": [],
  "workspace_baseline": {
    "repository_root": "absolute repository root or an explicit not_git marker",
    "branch": "branch name, detached, or not_git",
    "revision": "observed revision, unborn, or not_git",
    "pre_existing_changes": [
      {
        "path": "repository/relative/path",
        "owner": "user | other_agent | unknown"
      }
    ],
    "pre_existing_failures": [
      {
        "check": "exact baseline check",
        "result": "fail | error | blocked",
        "evidence": "observed pre-edit result"
      }
    ],
    "isolation_decision": "current_worktree | isolated_worktree | not_applicable",
    "isolation_reason": "why this isolation choice preserves existing work"
  },
  "acceptance_evidence_matrix": [
    {
      "id": "",
      "kind": "functional | negative_control | lifecycle | rollback | management_path | security | other",
      "requirement": "",
      "observable": "",
      "check_id": "",
      "check_or_probe": "",
      "pass_condition": "",
      "evidence_location": "",
      "status": "planned",
      "evidence_ref": null
    }
  ],
  "reuse_decisions": [
    {
      "capability": "",
      "first_safe_rung": "codebase | stdlib | native | installed_dependency | one_line | minimum_new_code",
      "choice": "",
      "evidence": ""
    }
  ],
  "files_to_read": [],
  "files_to_touch": [],
  "files_to_avoid": [],
  "checks": [
    {
      "id": "",
      "command": "",
      "pass_condition": "",
      "expected_exit_codes": [0]
    }
  ],
  "evidence_to_capture": [],
  "stop_condition": ""
}
```

For `multi_agent`, replace the empty delegation fields with the pre-edit parent ceiling, a reserved `delegation_artifact_root` under `.fp/artifacts`, and one task-local envelope per child. Each planned child records `id`, `parent_id`, `task_id`, `session_id`, `task_input_index`, `role`, `read_only`, `granted_authority`, `toolsets`, `context_refs`, `allowed_resources`, `owned_paths`, `depends_on`, `max_iterations`, `max_attempts`, `timeout_seconds`, `max_spawn_depth`, `workspace`, and `idempotency_key`. The Evidence Ledger must preserve these stable fields and add observed result, lease, parent-only artifact, and bound evidence fields.

For `delegated_execution`, freeze work items rather than guessing runtime-created child IDs:

```json
{
  "delegated_execution_plan": {
    "runtime_host_id": "",
    "spawn_strategy": "parent_only",
    "max_active_concurrency": 1,
    "max_total_threads": 5,
    "final_review_required": true,
    "work_items": [
      {
        "id": "T001",
        "domain_id": "",
        "allowed_resources": [],
        "owned_paths": [],
        "max_fix_cycles": 1
      }
    ]
  }
}
```

For `provider_compatibility`, freeze the effective chain and fail-closed budgets before any paid or delegated execution:

```json
{
  "provider_compatibility_plan": {
    "host_id": "",
    "intermediaries": [],
    "provider_id": "",
    "protocol": "",
    "requested_model": "",
    "accepted_effective_models": [],
    "retry_layers": [],
    "max_physical_attempts_per_logical_request": 1,
    "max_logical_requests": 0,
    "max_physical_attempts": 0,
    "max_input_tokens": 0,
    "max_output_tokens": 0,
    "max_subagent_threads": 0,
    "max_identical_semantic_actions": 2,
    "max_non_narrowing_iterations": 3,
    "paid_probe_authorized": false
  }
}
```

For `background_learning`, also set:

```json
{
  "learning_plan": {
    "candidate_id": "",
    "kind": "checklist | schema | skill_patch | automation",
    "target": "",
    "target_hash": "sha256:<64 lowercase hex>",
    "candidate_frozen_at": "<RFC3339 timestamp>",
    "holdout_context_refs": [],
    "evaluation_method": "leave_one_out_or_full_holdout_coverage",
    "evaluation_metric": "<frozen metric>",
    "evaluation_unit": "<frozen unit>",
    "evaluation_direction": "higher_is_better | lower_is_better",
    "evaluation_tolerance": 0,
    "holdouts_hidden": true,
    "negative_controls_required": true,
    "invariant_checks_required": true,
    "oracle_required": true,
    "measurements_required": true,
    "activation_hash_required": true,
    "complexity_unit": "rules | lines | tokens | checks",
    "complexity_max_delta": 0,
    "min_shadow_successes": 3,
    "rollback_required": true,
    "source_freshness_required": true
  }
}
```

After execution, use canonical Evidence Ledger v1 JSON. A human Markdown view is optional and must agree with the JSON source of truth.

# Failure-to-Smaller-Task Protocol

Use when a task fails, blocks, exceeds its budget, or becomes too large.

Do not blindly retry the same task.

## Failed Task

## Failure Type
- [ ] failing check
- [ ] unclear requirement
- [ ] context budget exceeded
- [ ] scope boundary exceeded
- [ ] missing dependency
- [ ] environment issue
- [ ] coupling discovered
- [ ] other

## Root Cause

## Evidence

## Smaller Verified Tasks

1.
2.
3.

## New Context Budget
- Max files to read:
- Max files to touch:
- Files to avoid:

## New Verification
- First check to run:
- Evidence required:

## Stop Condition

## JSON form

```json
{
  "failed_task": "",
  "failure_type": "",
  "root_cause": "",
  "evidence": [],
  "smaller_tasks": [],
  "new_context_budget": {
    "max_files_to_read": 0,
    "max_files_to_touch": 0,
    "files_to_avoid": []
  },
  "new_verification": [],
  "stop_condition": ""
}
```

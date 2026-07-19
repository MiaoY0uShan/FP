# Context Diet Map

Use this to decide what context is necessary and what context should be excluded.

This is not general memory. This is context reduction.

## Task

## Relevant Context
- Files:
- Modules:
- Schema cards:
- Prior reports:

## Irrelevant Context
- Files:
- Modules:
- Prior reports:

## Files To Read

## Files To Avoid

## Required Schema Cards

## Forbidden Context

## Codebase Impact Source

- MCP tool: (e.g., `detect_changes_tool`, `get_impact_radius_tool`, or "none" for manual)
- Fallback method: (e.g., `grep-based impact map`, or "N/A" when MCP is available)
- Token savings estimate: (from MCP `context_savings` field, or "unknown" for grep)
- Impact map reference: (path to `codebase-impact-map.md` output, or "none")

## Reason

Explain why the excluded context is not needed for this task.

## JSON form

```json
{
  "task": "",
  "relevant_nodes": [],
  "irrelevant_nodes": [],
  "files_to_read": [],
  "files_to_avoid": [],
  "required_schema_cards": [],
  "forbidden_context": [],
  "codebase_impact_source": {
    "mcp_tool": "",
    "fallback_method": "",
    "token_savings_estimate": "",
    "impact_map_reference": ""
  },
  "reason": ""
}
```

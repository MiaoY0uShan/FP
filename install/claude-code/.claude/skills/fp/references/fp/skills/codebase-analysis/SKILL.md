---
name: fp-codebase
description: "Codebase analysis and impact mapping. Use when reviewing, modifying, or understanding user code where the blast radius spans multiple files. Provides code-review-graph MCP integration and grep-fallback protocols for computing change impact."
---

# FP Codebase Analysis

Prefer code-review-graph MCP when available. Start with `get_minimal_context_tool`. Fall back to grep-based discovery when MCP is unavailable.

## MCP Route

1. `get_minimal_context_tool` (~100 tokens) → community names and entry points
2. `detect_changes_tool` → risk-scored functions, affected flows, test gaps
3. `get_impact_radius_tool` → blast radius
4. `get_architecture_overview_tool` → hub/bridge nodes
5. `semantic_search_nodes_tool` → semantic queries

Load `../templates/code-review-graph-mcp-contract.md` for the full 30-tool map.

## Grep Fallback

1. `git diff` → extract changed symbols
2. `grep -rn` for callers/importers
3. `Glob` for test files
4. Mark `source: grep-fallback` in impact map

Load `../templates/codebase-impact-map.md` for the output template.

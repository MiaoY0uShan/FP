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

## Tree-sitter MCP Tier (fallback)

When code-review-graph MCP is unavailable but a tree-sitter code-search MCP is installed (e.g. nendotools/tree-sitter-mcp, cocoindex-code, claude-context), prefer it over grep for symbol lookup, call chains, and structural queries. Mark `source: tree-sitter-mcp` in the impact map. For repos over ~500k LOC or when structural queries return thousands of hits, prefer a hybrid vector-search MCP (claude-context, cocoindex-code) over tree-sitter alone.

## Grep Fallback

1. `git diff` → extract changed symbols
2. `grep -rn` for callers/importers
3. `Glob` for test files
4. Mark `source: grep-fallback` in impact map

Load `../templates/codebase-impact-map.md` for the output template.

## Post-Fix Triple Critique (on-demand, Medium+ only)

After a Medium or larger fix lands, optionally dispatch three parallel read-only review agents in independent domains — Reuse (ladder violations), Quality (defect patterns), Efficiency (waste) — then aggregate; the parent verifies critical findings itself. Never run this for Small routes or by default.

## Standards vs Spec Paired Review (on-demand, PR scope only)

For PR-scope review, dispatch two parallel read-only reviewers with disjoint scopes: Standards (this repo's documented conventions, style, patterns) and Spec (the originating issue / PRD acceptance criteria). Report the two verdicts side by side — standards divergence is not spec divergence; do not average them. Never run for Small routes.

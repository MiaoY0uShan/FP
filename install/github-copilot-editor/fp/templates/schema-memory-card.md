---
# Populate these fields only after evidence supports each relationship.
# Edge types: depends_on, informs, next, previous, generalizes, conflicts_with, supersedes
# Each value is a list of schema card filenames (without .md extension).
# Example:
#   depends_on: ["validation-logic-bug-fix"]
#   informs: ["api-security-pattern", "token-gateway-guard"]   # MOC uses this to list sub-cards
#   next: ["dns-debugging"]                                     # Folgezettel forward
#   previous: ["remote-system-basics"]                          # Folgezettel backward
#   generalizes: ["token-validation", "form-validation"]
#   conflicts_with: ["zero-trust-auth"]
#   supersedes: ["old-validation-pattern"]
related-schemas:
  depends_on: []
  informs: []
  next: []
  previous: []
  generalizes: []
  conflicts_with: []
  supersedes: []

# Keywords describing the class of work this schema applies to.
# Used for cluster retrieval via memory-graph.js.
# Keep at most 5 keywords. Example: ["bug", "validation", "auth", "token"]
# Leave empty for MOC (index) cards — they serve as navigation hubs, not task matchers.
task-types: []

# Set to true when this card is a Map of Content (index card).
# MOCs list sub-cards via informs, have no task-types, and serve as navigation starting points.
# Create a MOC when 3 or more cards share a theme.
is_moc: false
---

# Schema Memory Card

## Schema Name

## Trigger

## Problem Pattern

## Common Failure Modes

## Recommended Execution Pattern

## Context Budget Pattern

## TDD / Verification Pattern

## Files Or Modules Usually Involved

## Files Or Modules Usually Avoided

## Evidence Required

## Source Evidence References

## Owner / Origin

## Last Validated

## Invalidation Trigger

## Supersedes

## Stop Conditions

## Promotion History

## Last Updated Because

## Backlinks (computed — do not author)

Cards that reference this card in their `related-schemas` YAML frontmatter
or `[[wikilink]]` body references. Populated by the graph traversal
protocol (`fp/templates/memory-graph-traversal.md`) via `memory-graph.js`.

Format:
- `[[card-name]](edge_type)` — reason: "why this card links here"

This section is computed during blast-radius analysis. Do not manually
maintain it; stale backlinks will be detected by `validateGraph()`.

Keep the card within the repository's context budget. If it grows beyond one compact reusable pattern, consolidate or reject the addition instead of silently expanding memory.

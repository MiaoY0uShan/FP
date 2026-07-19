# FP Lessons Learned

This directory stores candidate observations and promoted reusable anti-patterns—not raw conversation memory. Only cards whose status is `promoted` may act as reusable policy.

## Workflow

1. Search only for lessons relevant to the current task and inspect each card's status.
2. Apply only `promoted` cards in the Execution Brief. Treat `observation` and `bounded_shadow` cards as task-local hypotheses until fresh evidence supports them.
3. A failure starts as an `observation` in the Evidence Ledger or Adaptive Improvement Report.
4. A severe one-off may create only a narrow expiring `bounded_shadow`; it does not become a reusable law.
5. Promote a Lesson Card only after `generalization-gate` passes distinct task/session evidence, holdouts, negative controls, invariants, shadow, approval, and rollback.
6. Revalidate promoted lessons when new evidence contradicts them or source provenance becomes stale.

Do not create a Lesson Card merely because a check failed once. Do not store secrets, raw logs, or long transcripts.

## Lesson Card

```md
# Lesson: <title>

## Status
observation | bounded_shadow | promoted

## Context

## Related
List related cards using typed `[[wikilink]]` references.
See Graph Convention below for edge types and format.

## Anti-Pattern

## Correction

## Evidence
- independent run/evidence reference 1
- independent run/evidence reference 2
- generalization, negative-control, invariant, shadow, and rollback references

## Backlinks (computed — do not author)
Cards that reference this lesson via `[[wikilink]]`. Populated by the blast-radius
protocol in `fp/templates/memory-graph-traversal.md`. Do not manually maintain.

## Reuse Trigger

## Safety Boundary
What this lesson must not cause agents to over-apply.
```

## Graph Convention: Wikilinks and Backlinks

All lesson cards MUST use `[[wikilink]]` references in the `## Related` section to connect to related lessons, schema cards, or evidence artifacts. Each reference is a typed edge in the FP memory graph (`fp/contracts/memory-graph.v1.schema.json`).

### Edge types for lessons

| Edge type | Meaning | When to use |
|---|---|---|
| `caused_by` | This lesson was caused by the pattern in the referenced lesson | A failure in L001 created the conditions for L002 |
| `mitigated_by` | The referenced lesson or schema prevents this anti-pattern | L003 (record precedence) mitigates state corruption from L002 |
| `related_to` | Shared domain or risk surface, no causal direction | Two lessons about remote systems |
| `generalizes` | This lesson subsumes the referenced one | A broader anti-pattern that covers a narrower one |
| `supersedes` | This lesson replaces the referenced one | A newer observation with stricter evidence |

### Wikilink format

```markdown
## Related
- [[card-filename-without-path]](edge_type) — brief reason for the connection
```

Examples:

```markdown
## Related
- [[L001-remote-stateful-service-chain]](generalizes) — UI handoffs are a special
  case of remote statefulness where the "remote" is a browser across a navigation
  boundary.
- [[L003-record-target-precedence]](mitigated_by) — record precedence prevents
  stale handoff data from corrupting the updated target.
```

### Backlinks convention

Each lesson card SHOULD include a `## Backlinks (computed — do not author)` section.
Backlinks are populated by the blast-radius protocol: when `memory-graph.js build`
scans all lesson cards, it collects inbound `[[wikilink]]` references to each card
and records them. The backlinks section is a cache for human readers, not the
canonical source — the canonical source is the source cards' own `## Related` sections.

### Cross-directory edges

- A lesson card may reference a schema card via `[[schema-card-name]](edge_type)`.
- A schema card references other cards via its `related-schemas` YAML frontmatter block (see `fp/templates/schema-memory-card.md`), not via body wikilinks.
- The graph boundary is `fp/` — wikilinks only reference files within `fp/lessons-learned/`, `fp/schema-memory/`, or `fp/examples/`. Do not wikilink to external URLs or non-FP files.

### Graph tooling

The `[[wikilink]]` references are parsed by `fp/contracts/memory-graph.js` to build the memory graph. Run:
```bash
node fp/contracts/memory-graph.js build          # rebuild graph from source cards
node fp/contracts/memory-graph.js validate        # check referential integrity
node fp/contracts/memory-graph.js blast-radius L001  # compute blast radius
```
See `fp/templates/memory-graph-traversal.md` for the full protocol.

## Promoted Lessons

- None yet under the v0.3 evidence standard.

## Legacy Observations Awaiting Revalidation

- `L001-remote-stateful-service-chain.md`: live systems need target capability probes, rollback, effective-state proof, real clients, negative controls, and ownership/leak evidence.
- `L002-stateful-ui-handoffs.md`: stateful UI handoffs need durable client state, recoverable stale state, and served-runtime proof.
- `L003-record-target-precedence.md`: explicit record-target replacement supersedes earlier targets; an additional target does not silently replace them.

These cards predate the v0.3 generalization contract. They remain searchable as bounded historical observations, but agents must not inject them as global policy until each card links evidence that passes the current promotion gate.

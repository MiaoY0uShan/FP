# Memory Graph Traversal Protocol

Use this protocol to traverse the FP memory graph when a task justifies it. The graph is maintained by `memory-graph.js` — a zero-dependency script at `fp/contracts/memory-graph.js` that scans schema and lesson cards, builds a typed node-edge graph, and provides blast-radius, clustering, hub detection, and incremental update commands.

**Do not use this protocol for small or single-file tasks.** The graph protocol adds context cost that is only justified when:

- the task spans multiple modules or has real coupling risk,
- the task involves updating an existing schema card or promoted lesson,
- the task type has known failure patterns that may involve related schemas,
- or the evidence ledger shows rework caused by missed dependencies.

## When to Load This Template

Load when:

- `optimize-path/SKILL.md` is active and the Context Diet Map lists one or more schema cards.
- `schema-memory/SKILL.md` is active and the task updates or creates a schema card.
- A promoted lesson is being modified and blast-radius effects need checking.
- The multi-agent review protocol is active with a medium+ scope task.

---

## Prerequisites

The agent must have a prior graph snapshot. Run `build` once to create it:

```bash
node fp/contracts/memory-graph.js build
```

This produces `fp/contracts/memory-graph.snapshot.json`. The snapshot is rebuilt fresh each time — there is no incremental write-back to the snapshot; it is always derived from the source markdown cards.

---

## 1. Blast-Radius Protocol

**Use when:** updating or invalidating a schema card or promoted lesson. Goal: find every card that may need review after the change.

### Procedure

1. **Identify the seed node.** Determine the `node_id` of the card being changed. The `node_id` is the filename without `.md`, e.g. `L001-remote-stateful-service-chain`.

2. **Run blast-radius:**
   ```bash
   node fp/contracts/memory-graph.js blast-radius <nodeId> --depth 1
   ```

   The output contains:
   - `forward_fanout`: nodes the seed points TO (outgoing edges)
   - `reverse_fanout`: nodes that point TO the seed (inbound dependents)
   - `affected_nodes`: union of both, deduplicated

3. **Classify affected nodes by edge type:**
   - `depends_on` edges from affected nodes to the seed → **highest priority** (these cards may break)
   - `informs` edges → **medium priority** (complementary context may be stale)
   - `generalizes` / `supersedes` → **lower priority** (hierarchy may need adjustment)
   - `conflicts_with` / `related_to` → **review only if the semantic content changed substantially**

4. **Bound the review:**
   - Read only the `## Schema Name`, `## Trigger`, and `## Problem Pattern` sections of each affected card.
   - For each affected card, decide: needs update, needs evidence recheck, or unaffected.
   - Do NOT re-read the full card unless the blast-radius actually impacts it.

5. **Record in the evidence ledger:** under `verified_claims`, note the blast-radius check: which cards were rechecked, which were marked unaffected, and the edge types involved.

### Depth Limit

Default depth is 1 (direct neighbors only). Expand to depth 2 ONLY when:

- A directly affected card is a `hub` (in_degree >= 3) AND its own blast radius would cascade.
- The change involves a `critical_hub` (in_degree >= 5) node.

Even at depth 2, only read the trigger/name of second-ring cards; do not recurse further.

### When to Skip

Skip blast-radius when:
- The card being changed has zero inbound edges (run `node memory-graph.js stats` to confirm).
- The change is purely cosmetic (typo fix, heading rename that does not alter semantics).
- The task is a Small route change to a non-promoted card.

---

## 2. Cluster Retrieval Protocol

**Use when:** a task matches a recurring class of work and related schemas may reduce context or prevent known failure modes.

Goal: find the connected component of schemas relevant to this task type.

### Procedure

1. **Extract task-type keywords** from the task description. Parse the task for domain terms: e.g. "validation", "bug", "auth", "token", "DNS", "router", "UI", "handoff", "refactor". Keep at most 3-5 keywords.

2. **Run cluster retrieval:**
   ```bash
   node fp/contracts/memory-graph.js cluster validation bug auth --max-cards 5
   ```

   The output is a scored list of matching nodes with their relevance reasons.

3. **Interpret the results:**
   - `keyword_match` nodes (score >= 1): the `task_types` field or `schema_name` directly matched your keywords.
   - `one_hop_from:<nodeId>` nodes (score < 1): neighbors of directly-matched nodes, included via edge expansion.

4. **Prune by task fit:**
   - For each returned node, read its `## Trigger` and `## Problem Pattern` sections.
   - Discard cards whose trigger does not match the current task.
   - Keep cards whose problem pattern could plausibly apply.

5. **Bound the load:**
   - Maximum 5 cards in the final cluster.
   - For a small cluster (<= 2 cards), also check `fp/lessons-learned/` manually for `[[wikilink]]` references to any cluster card (the graph already includes these if edges exist).

### When to Skip

Skip cluster retrieval when:
- The task is a small, single-file change (Tiny Brief route).
- No schema card has `task_types` matching any task keyword.
- The Context Budget Contract's `max files to read` would be exceeded by loading extra cards.

---

## 3. Hub Detection Protocol

**Use when:** prioritizing which cards to re-evaluate after a multi-card change, or when archiving stale cards.

### Terminology

- **Hub** (`in_degree >= 3`): Many other cards reference this card. Its evidence is foundational.
- **Critical hub** (`in_degree >= 5`): Extremely high connectivity. Changing it may cascade.
- **Bridge**: Removing this node would disconnect the graph into multiple components. It is the sole connection between two otherwise separate groups.

### Procedure

1. **Run hub detection:**
   ```bash
   node fp/contracts/memory-graph.js hubs
   ```

2. **Interpret results:**
   - Hubs are sorted by `in_degree` descending. Address the highest-degree hubs first.
   - Bridges list the `connects_communities` they sit between. A bridge card constrains both communities.

3. **Hub protocol:**
   - A hub card should be re-evaluated BEFORE any of its dependents.
   - When a hub card's evidence is invalidated, the blast radius is larger — always run blast-radius on it.
   - A hub card that is also `promoted` or `active` is a foundational pattern; its `## Safety Boundary` and `## Stop Conditions` carry extra weight.

4. **Bridge protocol:**
   - Never archive a bridge card without first checking both communities it connects.
   - A bridge card's `## Problem Pattern` may apply to BOTH communities — read it in full.

5. **When archiving or demoting:** Never archive a hub card without first re-evaluating every `depends_on` dependent.

### Complexity Note

Bridge detection is O(n * (V + E)) — for very large graphs (hundreds of nodes), this may be slow. FP's memory graph is expected to have tens of nodes; the cost is negligible. If the graph grows substantially, bridge detection can be restricted to hub nodes only.

---

## 4. Incremental Update Protocol

**When:** a task changed source cards and the memory graph snapshot may be stale. Goal: only re-check cards whose content or blast-radius has changed, not the entire graph.

### Procedure

1. **Before making any source changes, save a baseline:**
   ```bash
   node fp/contracts/memory-graph.js build
   ```

2. **Make changes** to the source card files (add/remove `[[wikilink]]` references, update YAML frontmatter, change schema content).

3. **After changes, compute the diff:**
   ```bash
   node fp/contracts/memory-graph.js incremental
   ```

   This rebuilds the graph and compares against the last snapshot. The output contains:
   - `changed_nodes`: nodes whose `content_hash` changed
   - `hash_diffs`: old → new hash for each changed node
   - `affected_nodes`: nodes in the blast-radius of changed nodes
   - `needs_review`: subset of affected nodes that likely need re-evaluation (hub nodes, depends_on dependents)

4. **Review strategy:**
   - Read `needs_review` nodes first — these are the highest risk.
   - For `affected_nodes` not in `needs_review`, read only the `## Trigger` to confirm no semantic impact.
   - Nodes in `changed_nodes` that are NOT in `needs_review` may still need their own verification, but don't cascade.

5. **After review, rebuild the snapshot:**
   ```bash
   node fp/contracts/memory-graph.js build
   ```

### What This Analogizes

This is the FP equivalent of code-review-graph's "re-parse only changed files" — an adaptation acknowledged in `docs/upstream-influences.md`. Instead of re-validating every schema card after a change, we only re-check the cards whose content hash changed plus the cards in their blast radius.

---

## 5. Integration with Context Diet Map

When a task uses the graph protocol, the results feed into the Context Diet Map (`fp/templates/context-diet-map.md`):

| Context Diet Map Field | Populated From |
|---|---|
| `relevant_nodes` | Cluster retrieval result — node IDs of matched cards |
| `required_schema_cards` | Cluster cards with `depends_on` or `informs` edge to a matched card |
| `files_to_read` | Source file paths of cluster cards (one hop expansion) |
| `files_to_avoid` | Cards from the cluster that were pruned (trigger mismatch) |
| `reason` | "graph cluster retrieval: `<keywords>` → `<N>` cards matched, `<M>` relevant after pruning" |

### Graph-Enriched Context Diet

When the graph protocol is used, append to the Context Diet Map:

```markdown
## Graph Traversal Results

- Seed node(s): <list>
- Blast-radius depth: <n>
- Cluster keywords: <keywords>
- Cards loaded via graph: <count>
- Cards pruned (trigger mismatch): <list>
- Hub cards in cluster: <list>
- Bridge cards in cluster: <list>
```

---

## 6. Dot Export (Visualization)

For architecture or memory-cleanup tasks, export the graph for visualization:

```bash
node fp/contracts/memory-graph.js dot > memory-graph.dot
```

Render with Graphviz: `dot -Tpng memory-graph.dot -o memory-graph.png`

The DOT output uses:
- **Node colors:** lightblue = schema_card, lightyellow = lesson_card, lightgreen = evidence_ledger, lightgray = template
- **Edge colors:** red = depends_on/caused_by, blue = informs/mitigated_by, purple = supersedes, green = generalizes, orange = conflicts_with, gray = related_to/references
- **Edge styles:** solid = foundational edges, dashed = informational edges, dotted = conflict/related edges
- **Bold borders:** hub nodes (penwidth=2), bridge nodes (peripheries=2)

---

## 7. Serendipity Traversal (Accidental Discovery)

Zettelkasten's power comes from traversing *different edge types* to the same node. This protocol deliberately walks non-obvious paths.

### Procedure

1. Pick a seed node relevant to the current task.
2. Traverse each edge type from the seed in sequence:
   - `depends_on` — what foundation does this card assume?
   - `informs` — what complementary context exists?
   - `next` / `previous` — what was the author thinking before/after?
   - `generalizes` — is there a broader or narrower pattern?
3. Check the seed's **backlinks** (`node memory-graph.js blast-radius <nodeId>` reverse fan-out).
4. Check the seed's **community** (`node memory-graph.js communities` → find cards sharing the same `community_id`).
5. For any interesting node found, repeat steps 2-4 (depth 2 max).

### When to use
- After the primary cluster retrieval, to find cards you wouldn't have explicitly searched for.
- When a task involves cross-domain concerns (e.g., security + validation + remote systems).
- Before finalizing a schema update, to check for unexpected blast-radius effects.

---

## 8. Folgezettel Navigation (Sequence Traversal)

FP supports `next` and `previous` edges to encode the narrative order of cards. This follows Zettelkasten's tradition of placing follow-up cards physically adjacent.

### Forward navigation (following the author's thinking)
```bash
node fp/contracts/memory-graph.js blast-radius <nodeId> --depth 1
```
Filter the `forward_fanout` for `next` edge type. Read cards in sequence.

### Backward navigation (tracing the thought origin)
Filter `reverse_fanout` for `previous` edge type. Read backward to find the thought that led to this card.

### When to use
- Understanding how a pattern evolved over time.
- When a `depends_on` chain is too abstract — `next` gives the narrative version.
- Tracing a sequence of related lessons (e.g., L001 → L002 → L003 via Folgezettel rather than semantic edges).

### Difference from semantic edges
- `depends_on` = "This card's correctness depends on that card being true."
- `next` = "After writing that card, I wrote this one as a follow-up thought."
- Both are traversable; they serve different discovery goals.

---

## Rules

1. **Rebuild before analysis.** Always run `node fp/contracts/memory-graph.js build` before traversing if any source card may have changed.
2. **One hop by default.** Expand only when the second ring would change a named decision.
3. **Record evidence.** Every graph-traversal action that changes a decision must be recorded in the evidence ledger.
4. **Skip for small tasks.** Do not load this protocol or run graph commands for Tiny Brief routes.
5. **The graph is derived, not authored.** The snapshot is rebuilt from source cards. Never edit `memory-graph.snapshot.json` directly. Edit the source markdown cards.
6. **Isolated nodes are expected.** During early adoption, most nodes will be isolated (no edges yet). This is normal; the graph grows edges as cards adopt `[[wikilink]]` and YAML frontmatter.

# Zettelkasten Conventions for FP

FP's memory system (schema cards, lesson cards, evidence-ledger records) follows Zettelkasten (Luhmann's slip-box) principles adapted for an AI agent protocol. These conventions guide agents in *writing*, *linking*, and *navigating* FP knowledge cards.

---

## 1. Atomicity

**A card contains one reusable pattern.** If the card content exceeds a single "problem → solution" pair, split it into two.

**Self-check:** Can you state this card's trigger in one sentence?
- Good: "Use when a validation bug involves token expiry."
- Bad: "Use when debugging validation, auth, billing, or token issues, and also for form validation."

**Size signal:** Card body (excluding YAML frontmatter and `## Backlinks`) should not exceed 50 lines. A longer card often means it's trying to cover too much — split and create a **MOC** (Map of Content) instead.

**What to split, what to merge:**
- Split: a card describing both "how to debug DNS issues" AND "how to configure DNS zones"
- Merge: two cards both describing "how to reproduce a validation bug" from slightly different angles

---

## 2. Bidirectional Links

**Every card MUST have at least one `[[wikilink]]` reference**, unless it is a pure index card (MOC). A card with zero links is an orphan — it cannot be discovered by graph traversal.

**When you write a link, answer: "Why are these two cards adjacent?"** The answer *is* the edge type.

| Why adjacent? | Edge type |
|---|---|
| "This card assumes the pattern in that card is correct" | `depends_on` |
| "This card provides complementary context for that card" | `informs` |
| "This card is the next step in my thinking" | `next` |
| "This card was the previous step in my thinking" | `previous` |
| "This card is a broader version of that card" | `generalizes` |
| "These cards recommend contradictory approaches" | `conflicts_with` |
| "This card replaces that older card" | `supersedes` |
| "This pattern caused that failure" | `caused_by` |
| "The referenced card prevents this anti-pattern" | `mitigated_by` |
| "Shared domain, no causal direction" | `related_to` |

**Backlinks are computed, not authored.** `memory-graph.js sync` automatically writes the `## Backlinks` section. You do not write backlinks manually. Zettelkasten's backlinks were always emergent — the card author never knew who would link back to their card. We preserve this: *forward links are authored; reverse links are discovered*.

**Schema cards** use YAML frontmatter for edges:
```yaml
related-schemas:
  depends_on: ["card-a"]
  informs: ["card-b"]
```

**Lesson cards** use body wikilinks:
```markdown
## Related
- [[card-a]](depends_on) — reason goes here
```

---

## 3. Folgezettel (Sequences)

Zettelkasten placed cards in a physical sequence. When you had a follow-up thought to card A, you created card B and placed it after A — regardless of whether they shared a topic. The sequence captured your *trajectory of thinking*.

In FP, Folgezettel is encoded through `next` / `previous` edges.

**When to use Folgezettel:**
- You write card A about remote system debugging.
- While writing it, you realize there's a narrower sub-pattern about DNS specifically.
- You create card B for the DNS sub-pattern and add `next: ["card-b"]` to card A.
- A reader following the `next` chain sees your thinking unfold.

**When NOT to use Folgezettel:**
- If card B depends on the content of card A for its correctness → use `depends_on`
- If card B is just related → use `related_to`
- If card B is a broader/narrower version → use `generalizes`

**Format:**
```yaml
related-schemas:
  next: ["next-card-id"]
  previous: ["previous-card-id"]   # usually only one
```

In body wikilinks: `[[next-card]](next)` with a short reason.

**Folgezettel vs. semantic edges:** Semantic edges (`depends_on`, `informs`) form the *argument structure*. Folgezettel edges (`next`, `previous`) form the *narrative structure*. Both are useful for different traversals.

---

## 4. MOC (Map of Content / Index Cards)

When a topic accumulates **3 or more cards**, create a MOC — a navigation hub that lists them.

**MOC conventions:**
- `task_types` is empty — the MOC itself doesn't match any task type; it's a navigation starting point.
- `is_moc: true` in YAML frontmatter.
- Use `informs` edges to list sub-cards. (The MOC informs readers about its sub-cards.)
- Sub-cards should *not* have `depends_on` back to the MOC — the MOC depends on the sub-cards' existence for its purpose, but sub-cards are self-contained.
- `## Schema Name` describes the topic, e.g., "Remote System Patterns" or "Validation Bug Fix Patterns."

**When to create a MOC:**
- After writing the 3rd card on a related theme.
- When you notice `memory-graph.js stats` shows a growing community without a hub node.
- When cluster retrieval returns 3+ cards for a keyword search.

**MOC structure template:**
```markdown
# Schema Memory Card — MOC

## Schema Name: Remote System Patterns

## Trigger
Use when working on any remote or stateful system (routers, VMs, containers, DNS, firewalls).

## Problem Pattern
This MOC groups patterns for remote system work. See individual sub-cards for specific anti-patterns and corrections.

## Recommended Execution Pattern
Check the `informs` list below for relevant sub-cards based on the specific problem:
- DNS issues → L001
- Browser/client state → L002
- Record destination management → L003
```

---

## 5. Refinement Pipeline

Zettelkasten refines notes through stages: **fleeting** → **literature** → **permanent**. FP has an analogous pipeline:

| Zettelkasten stage | FP equivalent | Where |
|---|---|---|
| **Fleeting note** | A raw observation from a task | `evidence-ledger` `unverified_claims` array |
| **Literature note** | A captured anti-pattern with contextual evidence | `lessons-learned/` card, `status: observation` |
| **Permanent note** | A generalized, evidence-backed schema | `schema-memory/` card, `status: promoted` or `active` |

**Refinement workflow:**

1. **Capture (fleeting):** After a task, the evidence ledger contains `unverified_claims`. Example: `"validation bugs in token expiry tend to involve off-by-one boundary checks."`

2. **Observe (literature):** If a second independent task produces a similar observation → create a `lessons-learned/` card with `status: observation`. Link it back to both evidence ledgers via `[[wikilink]]`.

3. **Generalize (permanent):** After the lesson card passes through `generalization-gate/SKILL.md` (2-4 independent cases, holdout, negative controls, invariants, shadow) → promote to a `schema-memory/` card with `status: promoted` or `active`.

4. **Link back:** Every permanent card MUST `[[wikilink]]` back to its source lesson card(s) and at least one source evidence ledger.

**Agents should check the pipeline at task completion:**
- Do any `unverified_claims` in this evidence ledger match an existing lesson or schema card? → Link them.
- Does any observation appear in a second task? → Create a lesson card.
- Is any lesson card accumulating evidence? → Route through `generalization-gate`.

---

## 6. Serendipity (Accidental Discovery)

Zettelkasten's power came from *traversing different edge types* to arrive at the same node from unexpected directions.

**Protocol for intentional serendipity:**

1. Pick a node relevant to the current task.
2. Traverse one hop via its `depends_on` edges — what foundation does this card assume?
3. Traverse one hop via its `informs` edges — what complementary context exists?
4. Traverse one hop via its `next` / `previous` edges — what was the author thinking before/after?
5. Traverse its **backlinks** (`## Backlinks (computed)`) — who references this card, and from what angle?
6. Look at the *community* this card belongs to (`community_id` from `memory-graph.js communities`) — are there cards in the same community you haven't read yet?

**Also use:** `node fp/contracts/memory-graph.js blast-radius <nodeId> --depth 2`
This follows *all* edge types to depth 2 and often surfaces cards you wouldn't have explicitly searched for.

**For user code repositories,** serendipity is served by the MCP tool `get_surprising_connections_tool` (or manual cross-community grep). A function called by three unrelated modules is a discovery signal.

---

## 7. Card Size Constraint

**Card body SHOULD NOT exceed 50 lines** (excluding YAML frontmatter and `## Backlinks`).

This is not a hard rule — it's a signal. A long card is often trying to be two cards.

**Remedy for long cards:**
1. Identify the distinct sub-topics within the card.
2. Extract each sub-topic into its own card.
3. Create a MOC with `informs` edges to the sub-cards.
4. The original long card becomes the MOC (or is retired if a sub-card now covers its core topic).

---

## 8. Navigation Patterns

### Task-oriented navigation (finding relevant cards)
```bash
node fp/contracts/memory-graph.js cluster <keywords>
```
→ Returns cards scored by keyword match + one-hop neighbors. This is the primary entry.

### Trajectory navigation (following thinking)
Follow `next` edges forward, `previous` edges backward. This is the author's narrative.

### Argument navigation (understanding dependencies)
Follow `depends_on` to find prerequisites. Follow `informs` for context. Follow `generalizes` for the broader pattern.

### Surprise navigation (discovery)
Walk different edge types from the same seed. Use `blast-radius --depth 2`. Check the backlinks.

### Dashboard navigation (health)
```bash
node fp/contracts/memory-graph.js stats     # overview
node fp/contracts/memory-graph.js hubs       # what's central
node fp/contracts/memory-graph.js validate   # what's broken
```
- High isolated node count → cards need links
- Many hub nodes → knowledge base is maturing
- Bridge nodes → check both communities

---

## Rules

1. **Atomicity first.** One pattern per card. Split before the card exceeds 50 lines.
2. **Link or orphan.** Every card must have at least one outbound link.
3. **Forward links are authored; backlinks are computed.** Use `memory-graph.js sync`, not manual backlinks.
4. **MOC at 3.** When three cards share a theme, create a MOC.
5. **Fleeting → literature → permanent.** Don't skip stages. Evidence first.
6. **Serendipity is traversal, not search.** Walk edges you wouldn't normally walk.
7. **The graph IS the discovery mechanism.** You don't need to know all cards. The graph reveals them.

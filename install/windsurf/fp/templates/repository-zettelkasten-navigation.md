# Repository Zettelkasten Navigation

Use these protocols to navigate a user code repository like a Zettelkasten — entry points as MOC (index notes), code dependencies as bidirectional links, call chains as Folgezettel sequences, and blast-radius as local graph view. All protocols prefer code-review-graph MCP when available and fall back to grep/Glob/git when not.

**Load this template when:** the task involves understanding, reviewing, or modifying a repository whose structure is not yet mapped. Do NOT use for single-file changes where the blast radius is trivially the file itself.

---

## Protocol 1: Entry Point as MOC

In Zettelkasten, a Map of Content (MOC) is an index note that lists sub-notes under a theme. In a code repository, the equivalent is an **entry point file** — `main.go`, `app.ts`, `index.js`, `__init__.py`.

### MCP path
```text
get_minimal_context_tool → read `entry_points` list
```

### Grep fallback
```bash
git ls-files | grep -E "(^|/)main\.|(^|/)index\.|(^|/)app\.|(^|/)__init__\.|(^|/)cmd/"
```

### How to navigate
1. Identify 1-3 entry points relevant to the task.
2. Treat each entry point as an **MOC note**: read ONLY its imports and top-level function/class signatures. Do NOT read function bodies yet.
3. From the import list, select the most relevant module for the current task.
4. Drill down into that module and repeat: read imports and signatures first, then bodies only when they match the task.

**Key insight:** You read 5% of the code (imports + signatures) to decide which 10% of the code to read fully. The 85% out of scope is never opened.

---

## Protocol 2: Folgezettel Code Navigation

In Zettelkasten, Folgezettel is the sequence of cards that follow a thought. In code, the equivalent is a **call chain** — the sequence from caller to function to callee.

### Forward (follow what this function calls)
1. MCP: `query_graph_tool(query_type="callees", node_name=X)` → list of functions X calls
2. Focus on the callee most relevant to the task
3. Read that callee's signature and body
4. Recurse: what does *that* function call?
5. Stop at depth 3 or when you hit a framework/library boundary (imports from `node_modules/`, `site-packages/`, stdlib)

### Backward (find who calls this function)
1. MCP: `query_graph_tool(query_type="callers", node_name=X)` → list of callers
2. This is the **backlink** view — who depends on this function?
3. If callers > 5, this is a hub. Read its signature, then read the top 3 callers by relevance.
4. If callers = 0, this may be dead code.

### Grep fallback
```bash
# Forward: what does X call?
grep -rn "function_name(" --include="*.ext"
# Backward: who calls X?
grep -rn "import.*module_name\|require.*module_name" --include="*.ext"
```

**Key insight:** You follow the chain, not the directory tree. Directory structure is physical layout; call chain is logical structure. Read logical, not physical.

---

## Protocol 3: Local Graph View

Obsidian's local graph shows only nodes within 1-2 hops of the current note. In code, this is the **blast radius** of a change.

### MCP path
```text
get_impact_radius_tool(changed_files=[...], max_depth=2)
→ `impacted_files` list
→ `impacted_functions` with confidence scores
→ `context_savings` estimate (tokens saved vs reading full changed files)
```

### Grep fallback
Follow `codebase-impact-map.md` — sections 1-4 (change identification, caller discovery, test coverage, read set).

### How to use the local graph
1. The `impacted_files` list IS your `files_to_read`. No more "manually decide what to read."
2. Explicitly write the complement: "There are {N} files in the repository. {M} are in the blast radius. The remaining {N-M} are outside the local graph and are skipped."
3. Choose a max depth:
   - **depth 1**: direct callers + direct callees. Suitable for small changes.
   - **depth 2**: + transitive callers/callees. Suitable for medium reviews.
   - **depth 3**: only for hub functions (≥15 callers) or when depth-2 evidence is insufficient.
4. Record the depth decision in the execution brief.

**Key insight:** The local graph replaces the manual `## Files To Read` / `## Files To Avoid` in the Context Diet Map. It's the same output, computed from the dependency graph rather than guessed.

---

## Protocol 4: Serendipity Discovery

Zettelkasten's power comes from arriving at the same card via different edge types. In code, this means finding **unexpected cross-module coupling**.

### MCP path
```text
get_surprising_connections_tool → cross-community edges with "surprise scores"
```

### Grep fallback
1. Take a changed symbol.
2. `grep -rn "symbol" --include="*.ext"` across the entire repository.
3. For each hit, ask: "Does this file belong to the same module/community as the symbol's home file?"
4. If the answer is "no — this feels unexpected," flag it.

### What to do with discoveries
- A function called by 3 unrelated modules → may need to be split or it's a legitimate utility.
- A direct import between modules that should be decoupled → architectural concern.
- A symbol that appears in many files but has no test references → untested hub.
- Record surprising discoveries as `unverified_claims` in the evidence ledger — they may become future schema/lesson cards.

---

## Protocol 5: Refinement Pipeline

Zettelkasten refines notes: **fleeting** → **literature** → **permanent**. FP applies this to code patterns discovered during navigation.

### Stage mapping
| Zettelkasten | FP artifact | When |
|---|---|---|
| Fleeting note | `evidence-ledger` `unverified_claims` | During any task — "this pattern looks suspicious" |
| Literature note | `lessons-learned/` card, `observation` | When the same pattern appears in a second independent task |
| Permanent note | `schema-memory/` card, `promoted`/`active` | After passing `generalization-gate` |

### Agent workflow during code navigation
1. **Spot a pattern:** e.g., "every time a validation bug occurs, it involves off-by-one date comparisons."
2. **Capture as fleeting:** Record as `unverified_claim` in the current evidence ledger.
3. **Link upward:** Is there already a lesson or schema card about this pattern? → Add `[[wikilink]]` from the evidence ledger (or note the connection).
4. **Promote when repeated:** If a second task produces the same claim → convert to a lesson card.
5. **Generalize when evidenced:** After `generalization-gate` → promote to schema card.

---

## Protocol 6: Per-Task Note

In Zettelkasten, every day starts with a fleeting note. In FP, every task has an **evidence ledger** — that's your fleeting note.

### At task completion, ask three questions:

1. **Link up:** Does any observation in this evidence ledger relate to an existing schema or lesson card?
   - If yes → add `[[wikilink]]` from the evidence to the card (or note the connection in the ledger).
2. **New pattern?** Does any observation represent a pattern worth capturing?
   - If yes and it's the first occurrence → keep as `unverified_claim`.
   - If yes and this is the second or later occurrence → create a lesson card.
3. **Cards to refresh?** Did this task touch files or topics covered by any schema or lesson card?
   - Run `node fp/contracts/memory-graph.js blast-radius <card-id>` for any card whose domain overlaps.
   - Update the card if the evidence contradicts or strengthens it.

---

## Protocol 7: Graph View as Dashboard

Zettelkasten users periodically review the graph to find orphan cards, growing clusters, and structural holes. FP agents can do the same with `memory-graph.js`.

### Dashboard commands
```bash
node fp/contracts/memory-graph.js stats       # overview: nodes, edges, hubs, communities
node fp/contracts/memory-graph.js hubs         # central cards (in-degree ≥ 3)
node fp/contracts/memory-graph.js communities  # cluster structure
node fp/contracts/memory-graph.js validate     # dead links, orphans, hash mismatches
```

### What to watch for
| Signal | Meaning | Action |
|---|---|---|
| High isolated node count | Cards with no links — undiscoverable | Add `[[wikilink]]` references or consider archiving |
| Increasing hub count | Knowledge base is maturing, foundational patterns exist | Hub cards need deeper evidence before modification |
| Bridge nodes | Cards connecting separate communities | Review both communities before changing a bridge |
| Growing community | A theme is accumulating cards | Consider creating a MOC for navigation |
| Orphaned evidence | `unverified_claims` repeated across ledgers | Route to refinement pipeline |

### For user code repositories
```text
MCP: list_graph_stats_tool → file count, node count, community count, language breakdown
MCP: get_hub_nodes_tool → most-connected functions (architectural hotspots)
MCP: get_bridge_nodes_tool → chokepoint functions (betweenness centrality)
MCP: get_knowledge_gaps_tool → untested hotspots, isolated nodes, thin communities
```

---

## Protocol 8: Atomic Module Verification

Zettelkasten cards are atomic enough that verifying one card doesn't require reading the whole box. The same principle applies to code modules.

### How to verify atomically
1. **Identify the module boundary** from `get_architecture_overview_tool` (MCP) or `semantic-architecture/SKILL.md` (manual).
2. **Read only:**
   - Files within the module.
   - The module's public interface (exports, public API signatures).
   - Direct importers of the module (one hop out).
3. **Do NOT read:**
   - Files two modules away from the target.
   - Internal implementation of dependency modules (unless the blast radius says so).
   - Framework or library internals.

### Verification scope
| Scope | What to verify |
|---|---|
| Within module | Changed functions + their tests |
| Module boundary | Does the public API contract still hold? Are exports unchanged? |
| Direct importers | Do the callers still compile/function? (Read only the import line + call site) |
| Beyond module | Skip — unless blast radius explicitly includes them |

**Key insight:** The traditional approach is "read all files imported by the changed file." The Zettelkasten approach is "read only the parts of imported files that are in the blast radius." A 200-line dependency file may only have 3 relevant lines — read those, skip the rest.

---

## Rules

1. **Entry point first.** Before reading any file, identify the MOC (entry points). Read signatures before bodies.
2. **Follow the logical chain, not the physical tree.** Directory layout is physical. Call chain is logical. Prefer logical.
3. **Local graph over global graph.** The blast radius defines your reading scope. Explicitly skip files outside it.
4. **MCP preferred, grep fallback.** Both paths produce the same structural output. Record which path was used.
5. **Depth 2 by default.** Expand to depth 3 only for hub functions or insufficient evidence.
6. **Capture fleeting observations.** Every task's evidence ledger is a fleeting note. Link observations upward.
7. **Dashboard periodically.** Run `memory-graph.js stats` after significant card additions or updates.
8. **Atomic verification.** Don't read the whole repository to verify one module. Read the module + its boundary.

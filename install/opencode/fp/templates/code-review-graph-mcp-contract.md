# code-review-graph MCP Contract

Acquisition, usage, and fallback contract for the [code-review-graph](https://github.com/tirth8205/code-review-graph) MCP server. Follows the `context-retrieval-contract.md` and MCP Capability Profile patterns in `fp/SKILL.md`.

## When to Use

Load this contract when:
- The task involves reviewing, modifying, or understanding **user code** (not FP's own internals).
- The blast radius of changes is larger than a single file.
- A code-review-graph MCP server is or could be available.

## Tool Map: Task → MCP Tool + Fallback

### Phase 1: Orientation (always first)

| Task | MCP Tool | Tokens | Fallback |
|---|---|---|---|
| Understand codebase shape | `get_minimal_context_tool` | ~100 | `git ls-files \| wc -l` + glob for top-level dirs |
| List registered repos | `list_repos_tool` | ~50 | `git remote -v` |
| Graph health check | `list_graph_stats_tool` | ~100 | manual file count |

### Phase 2: Change Analysis

| Task | MCP Tool | Fallback |
|---|---|---|
| Review a PR/diff with risk scoring | `detect_changes_tool` | `codebase-impact-map.md` (grep) |
| Compute blast radius of changed files | `get_impact_radius_tool` | `codebase-impact-map.md` (grep) |
| Find affected execution flows | `get_affected_flows_tool` | manual flow tracing |
| Get token-optimised review context | `get_review_context_tool` | read files directly |

### Phase 3: Deep Dive

| Task | MCP Tool | Fallback |
|---|---|---|
| Find callers/callees of a function | `query_graph_tool` (callers/callees) | `grep -rn "symbol("` |
| Find tests for a function | `query_graph_tool` (tests) | Glob for `*.test.*`, grep for symbol |
| Trace execution from entry point | `traverse_graph_tool` | read files in call order |
| Search code by meaning | `semantic_search_nodes_tool` | `grep -i` (keyword only) |

### Phase 4: Architecture Analysis

| Task | MCP Tool | Fallback |
|---|---|---|
| Architecture overview (communities) | `get_architecture_overview_tool` | manual module map |
| Find hub nodes (architectural hotspots) | `get_hub_nodes_tool` | manual call-count analysis |
| Find bridge/chokepoint nodes | `get_bridge_nodes_tool` | manual dependency analysis |
| List communities | `list_communities_tool` | manual directory grouping |
| Inspect a single community | `get_community_tool` | read community's top files |
| Execution flow with criticality | `list_flows_tool` + `get_flow_tool` | manual flow tracing |

### Phase 5: Risk And Quality

| Task | MCP Tool | Fallback |
|---|---|---|
| Find knowledge gaps (untested hotspots) | `get_knowledge_gaps_tool` | `codebase-impact-map.md` (test coverage section) |
| Find large/complex functions | `find_large_functions_tool` | `wc -l` per file |
| Detect surprising cross-community edges | `get_surprising_connections_tool` | manual dependency audit |
| Generate review questions | `get_suggested_questions_tool` | N/A (skip) |

### Phase 6: Refactoring (write-authorized tasks only)

| Task | MCP Tool | Fallback |
|---|---|---|
| Preview a rename | `refactor_tool` (preview_rename) | manual grep-and-replace |
| Detect dead code | `refactor_tool` (detect_dead_code) | manual import analysis |
| Refactoring suggestions | `refactor_tool` (suggest) | N/A (skip) |
| Apply a previewed refactoring | `apply_refactor_tool` | manual edit |

### Maintenance And Multi-Repo

| Task | MCP Tool | Fallback |
|---|---|---|
| Build/update the graph | `build_or_update_graph_tool` | N/A (MCP only) |
| Run post-processing | `run_postprocess_tool` | N/A (MCP only) |
| Compute vector embeddings | `embed_graph_tool` | N/A (skip feature) |
| Search across repos | `cross_repo_search_tool` | search each repo separately |
| Generate wiki | `generate_wiki_tool` | N/A (skip feature) |

---

## Tool Selection Protocol

1. **Always start with `get_minimal_context_tool`** — ~100 tokens. The response tells you the codebase's community structure, entry points, and scale. Use this to decide which community/area to investigate next.

2. **For review tasks, use `detect_changes_tool`** with the changed files or commit SHA. This returns risk-scored functions, affected flows, and test gaps in one call. It is the single most powerful review tool.

3. **For targeted queries, use `query_graph_tool`** — find callers, callees, tests, imports, or inheritance for a specific node. Narrower and cheaper than `traverse_graph_tool`.

4. **For architectural understanding, use `get_architecture_overview_tool`** — community structure with coupling warnings and hub nodes. Then drill into specific communities with `get_community_tool`.

5. **For semantic search, use `semantic_search_nodes_tool`** — searches by meaning, not just keyword. Requires embeddings to be computed first (`embed_graph_tool`).

6. **For knowledge gaps, use `get_knowledge_gaps_tool`** — identifies isolated nodes, untested hotspots, thin communities, and structural weaknesses.

---

## Fallback Rules

When code-review-graph MCP is unavailable:

1. **Load `codebase-impact-map.md`** — the grep/Glob/git-diff protocol that produces the same structural output.
2. **Record the fallback** — in the evidence ledger, note which MCP tools would have been used and why they were unavailable.
3. **Token cost is higher** — expect ~82x more context usage without the MCP. This is acceptable for one-off reviews but should trigger an acquisition suggestion for repeated use.
4. **Confidence is lower** — grep-based call detection has false negatives (dynamic calls, reflection, DI containers). Flag `confidence: medium` in the impact map when grep is the source.
5. **Do not let MCP absence block the task** — the grep fallback is sufficient for most tasks. Only flag `unverified` for acceptance rows that genuinely require semantic search or flow analysis that grep cannot provide.

---

## Authority

- The code-review-graph MCP operates **entirely locally**. It reads the user's codebase from disk, builds a graph in `.code-review-graph/`, and serves it via MCP. No source code is sent to any external service.
- **Embedding providers** (if enabled) are the exception — they receive text embeddings. Use only after user approval and with awareness of data exposure.
- MCP availability does not expand write, deploy, credential, messaging, or live-system authority.
- Refactoring tools (`refactor_tool`, `apply_refactor_tool`) are write operations. They require explicit write authorization in the task's scope.

---

## Acquisition Brief

If code-review-graph MCP would benefit the task but is not installed, present this acquisition brief before any download or installation:

```
Name: code-review-graph
Source: https://github.com/tirth8205/code-review-graph
Pinned version: latest stable release (check releases page)
Install: pip install code-review-graph (Python 3.10+ required)
MCP server: code-review-graph serve (on-demand; no resident process unless crg-daemon is started)
Init: code-review-graph init (auto-detects and configures Claude Code, Codex, Cursor, Windsurf, etc.)
Verification: code-review-graph --version, then one minimal MCP tool call
Data exposure: local-only graph; no source code leaves the machine (embedding providers are opt-in and separate)
Permissions: reads repository files; writes only to .code-review-graph/ and MCP configuration files
Rollback: pip uninstall code-review-graph; remove MCP config entry
```

Do not download or install without explicit user approval. Approval to install does not imply approval to enable embedding providers, start the daemon, or configure resident services.

---

## Evidence

Record every MCP call:

| Tool Name | Arguments | Result Summary | Token Savings | Timestamp |
|---|---|---|---|---|
| get_minimal_context_tool | `{repo_path: "."}` | 3 communities, 12 entry points | ~500 saved vs manual scan | ... |
| detect_changes_tool | `{changed_files: [...]}` | 5 functions, 2 test gaps, MED risk | ~2k saved vs full file read | ... |

In the evidence ledger, record MCP usage under `commands_run` with `multi_agent_binding: mcp.code-review-graph`.

---

## Integration With Other FP Templates

- **`codebase-impact-map.md`**: Populated from MCP results when available, or from grep when not. The `Source` field distinguishes them.
- **`context-diet-map.md`**: The `## Codebase Impact Source` section records which MCP tools were used and their token savings estimates.
- **`execution-brief.md`**: The `## Codebase Analysis Contract` section records MCP availability and the primary analysis tool used.
- **`multi-agent-review-protocol.md`**: Risk scoring and dependency clusters from the impact map feed into reviewer dispatch and review depth decisions.
- **`memory-graph-traversal.md`**: Unrelated. code-review-graph analyzes user code; memory-graph analyzes FP's own schema/lesson cards.

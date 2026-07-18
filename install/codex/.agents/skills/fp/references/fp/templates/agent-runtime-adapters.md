# Agent Runtime Adapters

Use this contract only with `fp-delegated-execution` or `fp-dispatch-parallel-domains`. FP carries orchestration semantics, not a bundled scheduler, daemon, model, or CLI.

## Capability Detection

Before dispatch, inspect the tools and agent metadata actually exposed by the current host. Record this capability vector:

```text
host_id / installed version
spawn_fresh
parallel_dispatch
join_or_result_return
status
same-envelope follow-up
interrupt_or_cancel
isolated_workspace
nested_agents
active-concurrency limit
experimental flags or extensions
```

Use `../contracts/agent-runtime-registry.v1.json` only as a versioned routing hint and official-source index. The observed tool catalog wins. A registry entry never proves that a feature is installed or enabled in the current session. If the entry is stale, the host is ambiguous, or a required primitive is absent, mark the capability `unverified` or `unavailable` and use the declared fallback.

A model API is not a subagent runtime. DeepSeek API, an OpenAI-compatible endpoint, or another inference API can power a host, but it does not itself supply fresh threads, join, status, or cancellation. Never infer orchestration from the selected model name.

Do not invent tool names, execute another AI CLI through a shell, enable an experimental flag, install an extension, authenticate, or start a service merely to satisfy this profile. Those are separate user-authorized actions.

## Portable Operations

| Semantic operation | Required behavior |
|---|---|
| `spawn_fresh` | Create a new isolated task/session ID with a bounded envelope. |
| `join` | Observe a terminal result or a blocking foreground return. |
| `status` | Distinguish pending/running from completed/failed/cancelled/interrupted. |
| `follow_up` | Clarify only the same active envelope; never count as a fresh stage. |
| `interrupt` | Stop stale or over-budget work when the host exposes a safe control. |
| `terminalize` | Preserve required evidence, then close if supported or retain terminal history. |

Use deterministic ledger IDs such as `impl-T03`, `review-T03-r1`, `fix-T03-r1`, and `final-review`. A host UI may display nicknames or human names; those labels are cosmetic and never become task identity, evidence, ownership, or dependency keys.

## Verified Host Mappings

### Codex

Detect the callable tools in the current session. When present, map `spawn_fresh` to `spawn_agent`, `join` to `wait_agent`, `status` to `list_agents`, and `interrupt` to `interrupt_agent`. `send_message` and `followup_task` are same-envelope communication only; never use them instead of spawning a fresh reviewer, fixer, re-reviewer, or final reviewer. Use an explicit close operation only when the current surface exposes one; otherwise retain the terminal thread.

Keep leaves at depth zero. Respect the host's observed thread and depth limits rather than assuming defaults from documentation.

### Claude Code

Detect `Agent` in the current tool catalog; older compatible releases may expose the `Task` alias. A new `Agent`/`Task` call is `spawn_fresh`. A foreground return or documented task notification is `join`; host task controls such as `TaskList` and `TaskStop`, when exposed, provide status and interruption. `SendMessage` or resume is same-envelope follow-up only. Installed releases may support bounded nested subagents, but FP removes `Agent` from leaf toolsets and the parent dispatches every implementation/review/fix stage.

Do not assume experimental Workflows or Agent Teams are enabled. Use them only after direct capability detection and keep the same FP envelopes and evidence gates.

### Kimi Code

Map `Agent` to one fresh foreground or background child and `AgentSwarm` to bounded item-wise fan-out. `TaskList`, `TaskOutput`, and `TaskStop` provide status, join, and cancellation for background work. Omit `resume` and `resume_agent_ids` for every fresh FP stage. Set and record a positive `KIMI_CODE_AGENT_SWARM_MAX_CONCURRENCY` ceiling before any swarm because the documented default ramps without a fixed upper limit.

### Qwen Code

Map a new stateless `agent` call to `spawn_fresh`; multiple calls in one model response may be parallel. A foreground final result or documented background completion is `join`, and `/tasks` or the active task control is status. Do not use fork, resume, or a persistent team as proof of freshness. Require an observed cancellation primitive before claiming the full lifecycle profile.

### CodeBuddy Code

Map a new `AgentTool`/`Task` invocation to `spawn_fresh`, `TaskGet`/`TaskList`/`TaskOutput` to status and join, and `TaskStop` to interruption. Resume is same-envelope continuation. Dynamic `Workflow` and Agent Teams can create large fan-out, so use them only when directly exposed and constrained by the frozen active/cumulative thread and spend budgets.

### Qoder

Discover the installed agents with `supportedAgents` and require `Agent` in the current `tools`/`allowedTools` set. Map a new blocking `Agent` (`AgentInput` -> `AgentOutput`) to fresh spawn plus join. Do not infer persistent status, resume, or per-child cancellation from SDK registration alone; when those controls are absent, run serial fresh stages or degrade explicitly.

### ZCode, Baidu Comate, And CodeArts

These official hosts expose subagent concepts but different lifecycle detail. ZCode currently documents foreground `Agent` dispatch and parallel foreground join. Comate documents parallel and resumable subagents, but a resumed ID is never fresh. CodeArts documents a subagent mode without a stable low-level lifecycle schema. Detect the installed surface; if status/cancel cannot be observed, do not claim full delegated execution even when fresh review-only dispatch is usable.

### Other Hosts

Read the matching registry entry and distinguish four states:

- `native`: official host documentation exposes a subagent primitive; still detect the installed capability.
- `extension`: an official extension/example supplies the primitive only when installed and enabled.
- `not_verified`: official material does not expose a stable model-callable primitive sufficient for this profile.
- `not_applicable_model_api`: this is a model/provider API, not an agent host.
- `retired`: the official surface is discontinued and cannot be selected for a new run.

A blocking fresh invocation may satisfy `spawn_fresh` plus `join` even without a persistent handle. A high-level review loop may be used only when official documentation defines its behavior and the active host exposes it. UI-only multitasking or user-created worktrees do not prove that the parent agent can dispatch and join children.

## Fallback

If `spawn_fresh` and `join` are unavailable, do not activate delegated execution. If delegation is optional, the parent may execute the plan serially and record the missing capabilities and degradation reason; it must not claim fresh-agent review. If the user explicitly required delegated execution, leave that acceptance condition unverified and report the capability blocker.

If only read-only subagents are available, use them for investigation or review under the ordinary multi-agent profile. The parent remains implementer and fixer, so the run is not a full delegated-execution run.

Before completion, reconcile every spawned task to `completed | failed | cancelled | interrupted | timed_out`. Completed threads may remain visible as host-managed history; no active thread, lease, poller, or background mutation may remain.

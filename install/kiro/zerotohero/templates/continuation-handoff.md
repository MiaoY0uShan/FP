# Continuation And Rehydrate Protocol

Use only for incomplete work likely to cross a session, handoff, or context compaction. The canonical `continuation` block lives in Evidence Ledger v1; this is the human procedure.

## State Scopes

- Global: installation and default routing rules; never task state.
- Repository: approved contracts and promoted lessons.
- Session: active task ID, route, and slice.
- Run: Execution Brief, Evidence Ledger, and optional continuation.

Precedence is: latest user instruction -> active brief/continuation -> repository contract/lesson -> global default.

## Compile, Do Not Summarize Freely

Preserve exact task ID, generation, normalized repository root, base revision, `zerotohero-worktree-v1` fingerprint, current slice, verified claim IDs/JSON Pointer evidence references, must-not constraints, touched paths, last check, typed next action/check, and stop condition. Drop transcript chatter and descriptions superseded by evidence. Compaction must never upgrade an unverified claim.

`zerotohero-worktree-v1` hashes a stable record of normalized real repository root, HEAD/base revision, the binary tracked diff against HEAD, and sorted untracked path/type/content hashes. Generate it with:

```text
node scripts/fingerprint-worktree.js --repo <repository>
```

## Rehydrate Gate

1. Reload the canonical ZeroToHero router.
2. Verify task ID and repository root.
3. Compute current state with `scripts/fingerprint-worktree.js`; compare repository root, base revision, and worktree fingerprint.
4. Revalidate the newest user scope and supersede stale next actions.
5. Resolve claim/evidence references and rerun the last critical check when state may have changed.
6. Continue only the typed recorded next action under current authorization. A write additionally requires a recorded matching rehydration result.

Rehydrate never auto-replays a write. A corrupt/truncated continuation, project mismatch, stale worktree, missing evidence, or missing write authority blocks mutation and requires rebaseline or recovery from the prior generation.

## Subagent Capsule

Send only:

```text
task_id / generation / role
allowed_read / allowed_touch
must_not / required_evidence
return_schema / stop_condition
```

Read-only agents need no write context. A writing capsule with missing or invalid scope fails closed.

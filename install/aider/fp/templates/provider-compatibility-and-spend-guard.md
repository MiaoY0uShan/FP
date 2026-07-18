# Provider Compatibility And Spend Guard

Use with `fp-provider-compatibility`. Store hashes and counters, never prompts, tool payloads, credentials, authorization headers, or API keys.

## Authority

- Read-only diagnosis authorized:
- Paid probe authorized: yes | no
- Configuration change authorized: yes | no
- Maximum probe cost/request/token allowance:
- Stop immediately when:

No paid probe is implied by permission to read local logs. A paid probe needs explicit task authority and a predeclared ceiling.

## Effective Chain

| Boundary | Selected | Observed Effective Value | Version | Health | Evidence |
|---|---|---|---|---|---|
| Agent host | | | | | |
| Environment/settings winner | | | n/a | | |
| Local proxy or gateway | | | | | |
| Wire endpoint/protocol | | | n/a | | |
| Requested model | | | n/a | n/a | |
| Effective wire model | | | n/a | | |
| Provider | | | | | |

If a selected loopback proxy is not listening, stop before a model request. Record secrets as `[redacted]` only.

## Compatibility Matrix

| Feature/Field | Host Requires | Provider Status | Effective Behavior | Decision |
|---|---:|---|---|---|
| Streaming and SSE keep-alive | | full / partial / ignored / unsupported | | |
| Terminal stop reason | | | | |
| Tool use/result | | | | |
| Tool error marker | | | | |
| Parallel-tool control | | | | |
| Thinking and effort budget | | | | |
| Cache control | | | | |
| Images/documents/MCP/tool references | | | | |
| Usage and request ID | | | | |

HTTP 200 is transport evidence, not semantic completion. Verify a complete terminal event, valid usage, incremental stream decode, and tool round trip.

## Nested Retry Budget

| Retry Owner | Version | Retryable Statuses | `max_retries` | Total Attempts (`+1`) | Evidence |
|---|---|---|---:|---:|---|
| Host | | | | | |
| SDK | | | | | |
| Proxy/failover | | | | | |
| Provider client | | | | | |

- Computed worst case: product of every `(max_retries + 1)` =
- Maximum physical attempts per logical request:
- Single retry owner:
- Unlimited watchdog / restored loop / scheduled loop disabled:
- No replay after visible output, tool execution, or possible mutation:

Permanent 400/401/402/403/404/422 compatibility or account failures are not retried. Retry classifications must follow the observed provider contract rather than this example list alone.

## Spend And Loop Budget

| Budget | Maximum | Observed | Remaining | Stop Evidence |
|---|---:|---:|---:|---|
| Logical requests | | | | |
| Physical attempts | | | | |
| Input tokens | | | | |
| Output tokens | | | | |
| Active subagents | | | | |
| Cumulative subagent threads | | | | |
| Turns / non-narrowing iterations | | | | |
| Wall time | | | | |

- Semantic action fingerprint: canonical tool name + redacted normalized arguments + relevant state version + observation hash
- Maximum identical semantic action with unchanged observation: 2; do not send the third
- Maximum consecutive non-narrowing iterations: 3
- Background/scheduled agents discovered and stopped:
- Parent and child budget reconciliation:

## Request Ledger

| Logical ID | Agent/Turn | Canonical Body Hash | Stable-Prefix Hash | Tool Schema/Args Hash | Wire Model | Retry Owner/Attempt | HTTP/Stop Reason | Cache Hit/Miss | Output | Provider Request ID |
|---|---|---|---|---|---|---|---|---|---:|---|
| | | | | | | | | | | |

Classify requests:

- identical canonical body hash after a retryable failure: transport retry;
- changed body plus repeated tool action and unchanged observation: agent/tool loop;
- fixed-period new top-level request: scheduled loop, goal, hook, or resume;
- separate parent/agent IDs: subagent or background work.

## Cache Reconciliation

- Provider cache semantics and source:
- `prompt_cache_hit_tokens`:
- `prompt_cache_miss_tokens`:
- Stable model/user partition/tool order verified:
- Warm-up delay or persistence behavior:
- Host response count:
- Proxy request count:
- Provider billed request count:
- Provider invoice or billing is authoritative; host/proxy UI is an estimate:
- Difference classified: reconciled | partially_reconciled | unexplained | unavailable
- Explanation and remaining unknown:

When a paid cache probe is authorized, keep model, user/cache partition, system, tools, and long prefix stable; warm once, wait for documented persistence, then repeat. Negative control: change the first token or cache partition and verify that hit behavior drops. Best-effort caching means one miss never proves a fault.

## UTF-8 Boundary Probe

Sentinel:

```text
中文🙂€𠮷
```

| Boundary | Non-Stream | Stream | Strict UTF-8 | U+FFFD Count | First Divergence |
|---|---|---|---:|---:|---|
| Provider raw bytes | | | | | |
| Proxy output | | | | | |
| Host assistant text | | | | | |
| Tool result | | | | | |
| Terminal rendering | | | | | |

Ignore valid SSE blank lines and comments. Use an incremental UTF-8 decoder across arbitrary chunk boundaries. Negative control: split the sentinel inside a multibyte code point; the decoder must reconstruct it without U+FFFD.

## Verdict

- Compatibility: full | partial | unverified | incompatible
- Retry multiplier within ceiling:
- Spend budgets within ceiling:
- Loop guard triggered:
- Semantic completion verified:
- Encoding classification:
- Accounting reconciliation:
- Supported cause(s):
- Falsified cause(s):
- Remaining unknowns:
- Safe next action:

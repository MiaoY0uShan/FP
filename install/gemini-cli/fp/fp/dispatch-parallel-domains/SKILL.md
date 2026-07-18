---
name: fp-dispatch-parallel-domains
description: "Use only when routed by FP for two or more explicitly independent problem domains whose dependencies, writer paths, generated outputs, state, and verification can be isolated before bounded fan-out and parent fan-in."
---

# FP Dispatch Parallel Domains

Parallelize independent problem domains, not merely a long task list.

## Independence Gate

Before fan-out, give every candidate domain an ID and prove all of the following:

- no domain consumes another domain's unfinished output;
- writer paths and workspaces are disjoint, or the domains are read-only;
- there is no shared state, lock, cache, database, service, device, generated output, manifest, lockfile, or mutation lease;
- failures and rollback in one domain cannot invalidate another domain's evidence;
- each domain has its own acceptance rows and can return a bounded result envelope.

If any claim is unknown, keep the domains serial. Shared state, files, or generated output must be serial. Apparent directory separation is insufficient when build metadata or runtime state is shared.

## Fan-Out

Freeze the domain DAG, ownership map, active-concurrency limit, cumulative-thread budget, and stable task-input order. Enforce one writer per owned path set by dispatching at most one active writer for it. Under delegated execution, each domain owns its own fresh implementer/reviewer/fixer chain; the parent remains the only cross-domain integrator.

Parallel read-only probes may share immutable inputs. Parallel writers require disjoint paths and isolated mutable resources. Never parallelize live-system mutations, credential use, deployment, external messaging, or memory promotion.

## Fan-In

Wait for every dispatched domain to become terminal. Integrate results in declared task-input order, not completion order. Reconcile interface assumptions and consumer/provider edges, then run parent-side cross-domain checks and a negative control. A domain failure remains explicit; it is not hidden by successful siblings.

If integration exposes coupling, cancel stale pending work, collapse the affected domains into a serial chain, and issue fresh envelopes. Do not reuse a completed domain agent as another domain's implementer or reviewer.

## Negative Control

Treat two tasks that both touch a lockfile, generated index, shared schema, common service, or the same effective target as coupled even if their source files differ. They must not pass the independence gate.

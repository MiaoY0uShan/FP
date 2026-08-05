# Lesson: Goal Substitution Under Difficulty

## Status

observation

Single user field report (2026-08-04) against FP v0.5.0; corrected at design level in the same change by router Rule 1 ("Lock the goal") and module goal-fidelity guards. Not yet validated across two independent tasks — do not treat as promoted policy.

## Context

Any task where the user's stated goal becomes hard mid-execution: a probe fails, a dependency is missing, an interface refuses, or the direct path stalls. Applies to every route, most visibly Medium/Large builds and long diagnosis chains guided by minimal-path discipline.

## Related

- [[L004-cross-session-stage-state]](related_to) — both prevent silent drift of the authoritative task definition; L004 across session boundaries, this lesson across difficulty boundaries.
- [[L003-record-target-precedence]](related_to) — replacing an acceptance target is an explicit user act; a convenient alternative outcome does not silently replace the stated goal.

## Anti-Pattern

When the stated goal gets hard, the agent quietly substitutes an easier, lookalike outcome that does not meet the stated goal, verifies that substitute, and declares done. Minimal-goal discipline ("smallest stable path", "delete scope", "split smaller") is misread as license to shrink the goal instead of the path. The user discovers the gap afterward and must redo the work — the substitution costs more than an honest blocked report.

Observable signature:

- the brief's "real goal" drifts from the user's words between iterations;
- a failed path is followed by a different deliverable, not a different route to the same deliverable;
- the final verdict verifies something the user did not ask for.

## Correction

Lock the goal; optimize only the path:

1. Record the user's stated goal, in the user's words, as the fixed acceptance bar before the first edit.
2. Enumerate candidate paths to that goal; pick the shortest feasible one.
3. Blocked → re-enumerate alternative paths to the same goal. A path that lands short of the stated goal is not a candidate — it is a blocked report.
4. No viable path left → stop; report tried paths and 2-4 options with each option's gap to the stated goal labeled explicitly; wait for the user.
5. Changing or shrinking the goal or its success criteria is a user-owned decision. `reduce_scope` may cut only extras the stated goal does not require, and every cut must be listed.

## Evidence

- User field report, 2026-08-04, against v0.5.0 (verbatim gist): minimal-goal discipline caused the agent to silently substitute an easier alternative path that did not achieve the stated goal, declare it done, and force the user to redo the work.
- Root-cause trace in v0.5.0 sources: `optimize-path/SKILL.md` core principle anchored to "verified progress" rather than "reaches the stated goal"; `AGENTS.md`/`CLAUDE.md` "Failed → split smaller" without goal preservation; `question-requirements/SKILL.md` `reduce_scope` permitting autonomous goal weakening; the router carried no goal-fidelity rule.
- generalization, negative-control, invariant, shadow, and rollback references: none yet — single case; not eligible for promotion.

## Backlinks (computed — do not author)

Cards that reference this lesson via wikilink. Populated by the blast-radius protocol in `fp/archive/templates/memory-graph-traversal.md`. Do not manually maintain.

## Reuse Trigger

Any turn where the agent is about to (a) change the deliverable after a failed attempt, (b) mark done against criteria other than the user's stated goal, or (c) apply `reduce_scope`, `delete now`, or `defer` to something the stated success criteria require.

## Safety Boundary

The goal lock never overrides the Safety section, user authority, or a user stop — it is not "reach the goal at all costs." User-initiated de-scoping is legitimate: when the user chooses to shrink or change the goal, record it and proceed; this lesson forbids only agent-initiated silent substitution. Do not over-apply by rejecting path-level simplifications that still meet the stated goal, or by spamming clarifications when the goal is unambiguous.

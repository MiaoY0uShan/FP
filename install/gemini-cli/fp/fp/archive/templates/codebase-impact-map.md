# Codebase Impact Map

Use before reviewing or modifying user code. Computes the blast radius, test coverage, and review scope of a change.

**Do not use for single-file trivial changes.** The impact map adds context cost that is only justified when the blast radius extends beyond the file being changed.

## Source

`code-review-graph MCP` | `grep-fallback` | `manual`
(When code-review-graph MCP is available, the map is populated via `detect_changes_tool` / `get_impact_radius_tool`. When unavailable, compute manually via grep/Glob/git diff.)

---

## 1. Change Identification

From `git diff --stat` or `detect_changes_tool` output.

| Changed File | Changed Symbols (functions, classes, exports) | Change Kind (add/modify/delete/rename) |
|---|---|---|
| ... | ... | ... |

---

## 2. Blast Radius — Callers And Importers

For each changed symbol, find all callers, importers, and dependents. Depth 2 by default (direct callers + their immediate consumers). Expand to depth 3 only for hub functions (high call-count).

### MCP path
Call `get_impact_radius_tool` with `changed_files` and `max_depth: 2`.

### Grep fallback
For each changed symbol `X`:
- `grep -rn "import.*\bX\b\|\bX(" --include="*.<ext>"` for callers/importers
- For class changes: `grep -rn "extends\s+X\b\|implements\s+X\b"`
- For type/interface: `grep -rn "\bX\b"` scoped to type definitions

| Changed Symbol | Direct Callers (depth 1) | Transitive (depth 2) | Source Files Affected |
|---|---|---|---|
| ... | ... | ... | ... |

---

## 3. Test Coverage Map

For each changed file, find corresponding test files via Glob (`*.test.*`, `*.spec.*`, `__tests__/`). Then grep for changed symbol references within tests to determine coverage.

| Changed File | Test File(s) Found | Tests Reference Changed Symbol? | Coverage Status |
|---|---|---|---|
| ... | ... | yes / no / partial | covered / partial / untested |

**Coverage Status:**
- `covered`: at least one test references each changed symbol
- `partial`: some symbols tested, some not
- `untested`: no test file found, or no test references any changed symbol

---

## 4. Minimal Read Set

| Must Read | Reason |
|---|---|
| (changed files) | Direct change |
| (direct callers) | Consumes changed symbol |
| (test files) | Must pass; may need updates |
| (type/interfaces) | Type changes cascade |

| Can Skip | Reason (concrete justification required) |
|---|---|
| ... | No dependency path found within depth 2 |
| ... | Unrelated module — confirmed no imports from changed area |

**Skip justification rule:** Every skipped file must have a concrete reason. "Probably not needed" is not a reason. At least one negative control: spot-check a skipped file to confirm no import of any changed symbol.

---

## 5. Risk Scoring

Lightweight heuristic — not a statistical model.

| File / Symbol | Hub Risk | Bridge Risk | Test Gap Risk | Blast-Radius Score | Combined |
|---|---|---|---|---|---|
| ... | LOW/MED/HIGH | LOW/MED/HIGH | LOW/MED/HIGH | N files | LOW/MED/HIGH |

**Scoring guide:**
- **Hub Risk**: LOW (<5 callers), MED (5-15), HIGH (>15)
- **Bridge Risk**: LOW (alternatives exist), MED (few alternatives), HIGH (sole dependency path between modules)
- **Test Gap Risk**: LOW (all symbols covered), MED (some untested), HIGH (no test file or key paths untested)
- **Blast-Radius Score**: count of affected files
- **Combined**: max of individual risks; bias up one level if two or more are HIGH

---

## 6. Dependency Clusters

Group affected files into independent sets. Two files share a cluster if one imports/calls the other or they share a changed dependency. This enables parallel review dispatch via `fp/dispatch-parallel-domains/SKILL.md`.

| Cluster ID | Files | Independent From Clusters | Can Review in Parallel? |
|---|---|---|---|
| C1 | ... | C2 | yes (if no shared deps) |
| C2 | ... | C1 | yes |

**Independence proof:** For each cluster pair, check: zero shared files in the `Must Read` set, zero cross-cluster imports among changed symbols. If uncertain, keep clusters serial.

---

## 7. Evidence Required

| Check | How to Verify |
|---|---|
| No missed callers | Negative control: pick one file from `Can Skip` and confirm no import/call of any changed symbol |
| Test coverage accurate | Verify test file paths via Glob; verify symbol references via grep |
| Cluster independence | For each cluster pair, confirm zero shared files in must-read |

---

## 8. Zettelkasten Annotations

Record the Zettelkasten-inspired navigation decisions made during this impact analysis. Load `fp/templates/repository-zettelkasten-navigation.md` for protocol details.

| Annotation | Value |
|---|---|
| MOC (entry points identified) | {list of entry-point files used as navigation starting points} |
| Folgezettel chains discovered | {call chains followed: caller → callee → callee's callee, max depth 3} |
| Surprising connections | {cross-community edges or unexpected cross-module coupling found} |
| Refinement candidates | {code patterns that may deserve future FP schema or lesson cards} |
| Navigation protocols used | {which protocols from `repository-zettelkasten-navigation.md` were applied} |
| Files skipped by local graph | {count of repository files outside the blast radius} |

---

## Rules

1. **Compute before reading** — this map determines what to read, not the other way around.
2. **Depth 2 by default** — expand to depth 3 only for hub functions (>=15 callers) or when evidence is insufficient.
3. **Skip-list must be justified** — every skipped file needs a concrete reason. Uncertainty goes in `Can Skip` with `risk: <reason>` annotation.
4. **MCP preferred, grep fallback** — when code-review-graph MCP is available, use `detect_changes_tool` / `get_impact_radius_tool`. When unavailable, use grep/Glob/git diff. When MCP is available but incomplete (partial build, missing repo), augment with grep.
5. **Mark unavailable as `unknown`** — do not fabricate caller lists or test coverage. Unknown is honest.
6. **Record source** — always note whether the map came from MCP or grep-fallback. This affects confidence in downstream decisions.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SCHEMA_PATH = path.join(__dirname, 'evidence-ledger.v1.schema.json');
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
const WORKTREE_FINGERPRINT_ALGORITHM = 'zerotohero-worktree-v1';

function issue(code, at, message) {
  return { code, path: at, message };
}

function countWords(value) {
  const input = String(value || '');
  if (typeof Intl?.Segmenter === 'function') {
    return [...new Intl.Segmenter('und', { granularity: 'word' }).segment(input)]
      .filter((entry) => entry.isWordLike).length;
  }
  return (input.match(/[\p{L}\p{N}]+|[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu) || []).length;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function validateSourceLedgerSnapshot(entry, at, errors) {
  const snapshot = entry?.source_ledger_snapshot;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return;
  const mismatched = snapshot.task_id !== entry.task_id || snapshot.session_id !== entry.session_id
    || snapshot.input_fingerprint !== entry.input_fingerprint || snapshot.evidence_ref !== entry.evidence_ref
    || snapshot.outcome !== entry.result || (entry.observed_at && snapshot.observed_at !== entry.observed_at);
  if (mismatched) {
    errors.push(issue('E_LEARNING_SOURCE_BINDING', at, 'source-ledger snapshot must bind task, session, fingerprint, outcome, time, and evidence'));
  }
  const actualHash = `sha256:${sha256(canonicalJson(snapshot))}`;
  if (entry.source_ledger_hash !== actualHash) {
    errors.push(issue('E_LEARNING_SOURCE_HASH', `${at}.source_ledger_hash`, 'source_ledger_hash must match the canonical source-ledger snapshot'));
  }
}

function resolveRef(root, ref) {
  if (!ref.startsWith('#/')) throw new Error(`Unsupported schema reference: ${ref}`);
  return ref.slice(2).split('/').reduce((value, key) => value[key], root);
}

function typeMatches(value, expected) {
  if (expected === 'null') return value === null;
  if (expected === 'array') return Array.isArray(value);
  if (expected === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (expected === 'integer') return Number.isInteger(value);
  if (expected === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === expected;
}

function isStrictRfc3339(value) {
  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/
  );
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , zone] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;
  if (day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()) return false;
  if (zone !== 'Z') {
    const zoneHour = Number(zone.slice(1, 3));
    const zoneMinute = Number(zone.slice(4, 6));
    if (zoneHour > 23 || zoneMinute > 59) return false;
  }
  return !Number.isNaN(Date.parse(value));
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function validateNode(value, rule, at, root, errors) {
  if (rule.$ref) {
    validateNode(value, resolveRef(root, rule.$ref), at, root, errors);
    return;
  }

  for (const child of rule.allOf || []) validateNode(value, child, at, root, errors);

  if (rule.anyOf) {
    const matches = rule.anyOf.some((child) => {
      const trial = [];
      validateNode(value, child, at, root, trial);
      return trial.length === 0;
    });
    if (!matches) errors.push(issue('E_SCHEMA_ANY_OF', at, 'must match at least one allowed shape'));
  }

  if (rule.if) {
    const conditionErrors = [];
    validateNode(value, rule.if, at, root, conditionErrors);
    if (conditionErrors.length === 0 && rule.then) validateNode(value, rule.then, at, root, errors);
    if (conditionErrors.length > 0 && rule.else) validateNode(value, rule.else, at, root, errors);
  }

  if (rule.not) {
    const trial = [];
    validateNode(value, rule.not, at, root, trial);
    if (trial.length === 0) errors.push(issue('E_SCHEMA_NOT', at, 'matches a forbidden shape or value'));
  }

  if (Object.prototype.hasOwnProperty.call(rule, 'const') && value !== rule.const) {
    errors.push(issue('E_SCHEMA_CONST', at, `must equal ${JSON.stringify(rule.const)}`));
    return;
  }

  if (rule.enum && !rule.enum.includes(value)) {
    errors.push(issue('E_SCHEMA_ENUM', at, `must be one of: ${rule.enum.join(', ')}`));
    return;
  }

  if (rule.type) {
    const allowed = Array.isArray(rule.type) ? rule.type : [rule.type];
    if (!allowed.some((expected) => typeMatches(value, expected))) {
      errors.push(issue('E_SCHEMA_TYPE', at, `must be ${allowed.join(' or ')}`));
      return;
    }
  }

  if (typeof value === 'string') {
    if (rule.minLength !== undefined && value.trim().length < rule.minLength) {
      errors.push(issue('E_SCHEMA_MIN_LENGTH', at, 'must not be empty'));
    }
    if (rule.pattern) {
      let pattern;
      try {
        pattern = new RegExp(rule.pattern);
      } catch (error) {
        errors.push(issue('E_SCHEMA_PATTERN_INVALID', at, `schema pattern is invalid: ${error.message}`));
        pattern = null;
      }
      if (pattern && !pattern.test(value)) errors.push(issue('E_SCHEMA_PATTERN', at, `must match ${rule.pattern}`));
    }
    if (rule.format === 'date-time' && !isStrictRfc3339(value)) {
      errors.push(issue('E_SCHEMA_FORMAT', at, 'must be a strict RFC3339 date-time'));
    }
    if (rule.format === 'uri' && !isHttpUrl(value)) {
      errors.push(issue('E_SCHEMA_FORMAT', at, 'must be an absolute http(s) URL'));
    }
  }

  if (typeof value === 'number' && rule.minimum !== undefined && value < rule.minimum) {
    errors.push(issue('E_SCHEMA_MINIMUM', at, `must be >= ${rule.minimum}`));
  }

  if (Array.isArray(value)) {
    if (rule.minItems !== undefined && value.length < rule.minItems) {
      errors.push(issue('E_SCHEMA_MIN_ITEMS', at, `must contain at least ${rule.minItems} item(s)`));
    }
    if (rule.maxItems !== undefined && value.length > rule.maxItems) {
      errors.push(issue('E_SCHEMA_MAX_ITEMS', at, `must contain at most ${rule.maxItems} item(s)`));
    }
    if (rule.uniqueItems) {
      const seen = new Set();
      value.forEach((entry, index) => {
        const key = JSON.stringify(entry);
        if (seen.has(key)) errors.push(issue('E_SCHEMA_UNIQUE', `${at}[${index}]`, 'must be unique'));
        seen.add(key);
      });
    }
    if (rule.items) value.forEach((entry, index) => validateNode(entry, rule.items, `${at}[${index}]`, root, errors));
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const properties = rule.properties || {};
    for (const required of rule.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, required)) {
        errors.push(issue('E_SCHEMA_REQUIRED', `${at}.${required}`, 'is required'));
      }
    }
    for (const [key, child] of Object.entries(value)) {
      if (properties[key]) validateNode(child, properties[key], `${at}.${key}`, root, errors);
      else if (rule.additionalProperties === false) errors.push(issue('E_SCHEMA_ADDITIONAL', `${at}.${key}`, 'is not allowed'));
    }
  }
}

function normalizePath(value) {
  return String(value).trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/{2,}/g, '/');
}

function normalizeRepoRoot(value) {
  const normalized = normalizePath(path.resolve(String(value))).replace(/\/$/, '');
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

function normalizeCommand(value) {
  return String(value).trim().replace(/^`|`$/g, '').replace(/\s+/g, ' ');
}

function arraysEqual(left, right, normalizer = String) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  const a = left.map(normalizer).sort();
  const b = right.map(normalizer).sort();
  return a.every((value, index) => value === b[index]);
}

function isPlaceholder(value) {
  return /^(?:todo|tbd|n\/?a|na|placeholder|fixme|xxx)$/i.test(String(value).trim());
}

function isNotApplicable(value) {
  return /^(?:not[_ -]?applicable|n\/?a)\b/i.test(String(value).trim());
}

function isAmbiguousFreshnessBasis(value) {
  return typeof value !== 'string'
    || !value.trim()
    || /(?:^|[^a-z0-9])(?:latest|current|unversioned|unknown)(?:$|[^a-z0-9])/i.test(value.trim());
}

function validateRepoPath(value, at, options = {}) {
  const normalized = normalizePath(value);
  const errors = [];
  if (!normalized || normalized === '.') errors.push(issue('E_PATH_INVALID', at, 'must be a non-empty repository-relative path'));
  if (/^(?:\/|~\/|[a-zA-Z]:\/)/.test(normalized)) errors.push(issue('E_PATH_ABSOLUTE', at, 'must be repository-relative'));
  if (normalized.split('/').some((part) => part === '.' || part === '..')) {
    errors.push(issue('E_PATH_TRAVERSAL', at, 'must not contain . or .. path segments'));
  }
  if (/\0/.test(normalized)) errors.push(issue('E_PATH_INVALID', at, 'must not contain NUL'));
  if (!options.allowGlob && /[*?]/.test(normalized)) errors.push(issue('E_PATH_GLOB_ACTUAL', at, 'observed paths cannot contain glob tokens'));
  if (options.allowGlob && /[\[\]{}]/.test(normalized)) {
    errors.push(issue('E_PATH_GLOB_UNSUPPORTED', at, 'only *, **, and ? glob tokens are supported'));
  }
  return errors;
}

function globToRegExp(pattern, caseSensitive = true) {
  const normalized = normalizePath(pattern);
  let result = '^';
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    if (char === '*' && normalized[index + 1] === '*') {
      if (normalized[index + 2] === '/') {
        result += '(?:.*/)?';
        index += 2;
      } else {
        result += '.*';
        index += 1;
      }
    } else if (char === '*') {
      result += '[^/]*';
    } else if (char === '?') {
      result += '[^/]';
    } else {
      result += char.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }
  }
  return new RegExp(`${result}$`, caseSensitive ? '' : 'i');
}

function pathMatchesAny(value, patterns, caseSensitive = true) {
  const normalized = normalizePath(value);
  return patterns.some((pattern) => globToRegExp(pattern, caseSensitive).test(normalized));
}

function resolveJsonPointer(root, pointer) {
  if (typeof pointer !== 'string' || !pointer.startsWith('/')) return undefined;
  let value = root;
  for (const raw of pointer.slice(1).split('/')) {
    const key = raw.replace(/~1/g, '/').replace(/~0/g, '~');
    if (Array.isArray(value)) {
      if (!/^\d+$/.test(key)) return undefined;
      value = value[Number(key)];
    } else if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key)) {
      value = value[key];
    } else {
      return undefined;
    }
    if (value === undefined) return undefined;
  }
  return value;
}

function pushDuplicateIdErrors(items, at, errors) {
  const seen = new Set();
  items.forEach((entry, index) => {
    if (!entry || typeof entry.id !== 'string') return;
    if (seen.has(entry.id)) errors.push(issue('E_ID_DUPLICATE', `${at}[${index}].id`, `duplicate id: ${entry.id}`));
    seen.add(entry.id);
  });
}

function validateSubstantive(value, at, errors, options = {}) {
  if (typeof value !== 'string' || !value.trim() || isPlaceholder(value)) {
    errors.push(issue('E_PLACEHOLDER', at, 'must contain observed, specific evidence rather than a placeholder'));
  } else if (options.noNotApplicable && isNotApplicable(value)) {
    errors.push(issue('E_NOT_APPLICABLE_FORBIDDEN', at, 'not_applicable is forbidden for this required evidence'));
  } else if (options.minLength && value.trim().length < options.minLength) {
    errors.push(issue('E_EVIDENCE_TOO_THIN', at, `must contain at least ${options.minLength} characters of specific evidence`));
  }
}

function validateCheckRecord(command, index, errors) {
  const at = `$.commands_run[${index}]`;
  validateSubstantive(command.evidence, `${at}.evidence`, errors);
  validateSubstantive(command.pass_condition, `${at}.pass_condition`, errors);
  if (command.result === 'pass' && command.provenance !== 'observed') {
    errors.push(issue('E_PASS_UNOBSERVED', `${at}.provenance`, 'passing evidence must have observed provenance'));
  }
  if (command.exit_code === null && command.expected_exit_codes !== null) {
    errors.push(issue('E_EXIT_EXPECTATION', `${at}.exit_code`, 'null exit_code requires expected_exit_codes=null for a manual/probe check'));
  }
  if (command.exit_code !== null && command.expected_exit_codes === null) {
    errors.push(issue('E_EXIT_EXPECTATION', `${at}.expected_exit_codes`, 'an observed exit code requires explicit expected_exit_codes'));
  }
  if (command.result === 'pass' && Array.isArray(command.expected_exit_codes)
      && !command.expected_exit_codes.includes(command.exit_code)) {
    errors.push(issue('E_EXIT_CODE_UNEXPECTED', `${at}.exit_code`, `${command.exit_code} is not an expected passing exit code`));
  }
}

function validateRequiredChecks(ledger, definitions, at = '$.acceptance.required_checks') {
  const errors = [];
  const byId = new Map(ledger.commands_run.map((entry) => [entry.id, entry]));
  const byCommand = new Map(ledger.commands_run.map((entry) => [normalizeCommand(entry.command), entry]));
  for (const definition of definitions) {
    const actual = byId.get(definition.id) || byCommand.get(normalizeCommand(definition.command));
    if (!actual) {
      errors.push(issue('E_REQUIRED_CHECK_MISSING', '$.commands_run', `required check was not run: ${definition.id} (${definition.command})`));
      continue;
    }
    if (actual.result !== 'pass') {
      errors.push(issue('E_REQUIRED_CHECK_FAILED', '$.commands_run', `required check did not pass: ${definition.id}`));
    }
    if (!arraysEqual(actual.expected_exit_codes, definition.expected_exit_codes, Number)) {
      errors.push(issue('E_CHECK_EXPECTATION_MISMATCH', at, `expected exit codes disagree for ${definition.id}`));
    }
    if (normalizeCommand(actual.command) !== normalizeCommand(definition.command)) {
      errors.push(issue('E_CHECK_COMMAND_MISMATCH', at, `command disagrees for ${definition.id}`));
    }
  }
  return errors;
}

function validateAcceptance(ledger, errors) {
  const acceptance = ledger.acceptance;
  pushDuplicateIdErrors(acceptance.required_checks, '$.acceptance.required_checks', errors);
  pushDuplicateIdErrors(acceptance.rows, '$.acceptance.rows', errors);
  const checkIds = new Set(acceptance.required_checks.map((entry) => entry.id));
  const claimIds = new Set(ledger.verified_claims.map((entry) => entry.id));
  const rowIds = new Set(acceptance.rows.map((entry) => entry.id));

  for (const row of acceptance.rows) {
    if (!checkIds.has(row.check_id)) {
      errors.push(issue('E_ACCEPTANCE_CHECK_REF', '$.acceptance.rows', `row ${row.id} references unknown check ${row.check_id}`));
    }
    if (row.evidence_ref !== null && resolveJsonPointer(ledger, row.evidence_ref) === undefined) {
      errors.push(issue('E_EVIDENCE_REF', '$.acceptance.rows', `row ${row.id} has a dangling evidence_ref`));
    }
    if (row.evidence_ref !== null) {
      const evidence = resolveJsonPointer(ledger, row.evidence_ref);
      if (!evidence || evidence.id !== row.check_id) {
        errors.push(issue('E_ACCEPTANCE_EVIDENCE_CHECK_MISMATCH', '$.acceptance.rows', `row ${row.id} evidence must resolve to its check_id ${row.check_id}`));
      } else if (row.status === 'pass' && (evidence.result !== 'pass' || evidence.provenance !== 'observed')) {
        errors.push(issue('E_ACCEPTANCE_EVIDENCE_NOT_PASSING', '$.acceptance.rows', `row ${row.id} requires observed passing command evidence`));
      }
    }
  }

  for (const claimId of acceptance.required_claim_ids) {
    if (!claimIds.has(claimId)) {
      errors.push(issue('E_REQUIRED_CLAIM_MISSING', '$.verified_claims', `required claim is missing: ${claimId}`));
    }
  }

  if (ledger.result === 'pass' || ledger.decision === 'complete') {
    if (acceptance.required_checks.length === 0) {
      errors.push(issue('E_PASS_WITHOUT_REQUIRED_CHECK', '$.acceptance.required_checks', 'pass/complete requires an embedded required-check contract'));
    }
    if (acceptance.required_claim_ids.length === 0) {
      errors.push(issue('E_PASS_WITHOUT_REQUIRED_CLAIM', '$.acceptance.required_claim_ids', 'pass/complete requires at least one required claim id'));
    }
    errors.push(...validateRequiredChecks(ledger, acceptance.required_checks));
  }

  if (ledger.decision === 'complete') {
    const allowedStatuses = ledger.phase === 'plan' ? new Set(['planned', 'pass']) : new Set(['pass']);
    for (const row of acceptance.rows) {
      if (!allowedStatuses.has(row.status)) {
        errors.push(issue('E_ACCEPTANCE_INCOMPLETE', '$.acceptance.rows', `row ${row.id} is ${row.status}`));
      }
      if (ledger.phase !== 'plan' && row.evidence_ref === null) {
        errors.push(issue('E_ACCEPTANCE_EVIDENCE_MISSING', '$.acceptance.rows', `row ${row.id} has no evidence_ref`));
      }
    }
  }

  return { checkIds, claimIds, rowIds };
}

function validateDebugRoute(ledger, errors) {
  if (ledger.route !== 'debug') {
    if (ledger.debug_evidence) {
      errors.push(issue('E_DEBUG_EVIDENCE_ROUTE', '$.debug_evidence', 'debug_evidence is only valid for the debug route'));
    }
    return;
  }
  const experiments = ledger.experiments || [];
  if (experiments.length === 0) {
    errors.push(issue('E_DEBUG_WITHOUT_EXPERIMENT', '$.experiments', 'debug route requires at least one discriminating experiment'));
  }
  pushDuplicateIdErrors(experiments, '$.experiments', errors);
  if (experiments.some((entry) => entry.speculative_patch)) {
    errors.push(issue('E_SPECULATIVE_PATCH', '$.experiments', 'debug-first forbids speculative patches before a supported or bounded cause'));
  }
  const supported = experiments.some((entry) => entry.decision === 'supported');
  if (ledger.files_touched.length > 0 && !supported) {
    errors.push(issue('E_FIX_WITHOUT_SUPPORTED_CAUSE', '$.files_touched', 'a debug-route write requires a supported cause'));
  }

  let consecutiveWithoutNarrowing = 0;
  let thresholdIndex = -1;
  experiments.forEach((experiment, index) => {
    if ((experiment.decision === 'rejected' || experiment.decision === 'unknown') && !experiment.narrows_cause) {
      consecutiveWithoutNarrowing += 1;
      if (consecutiveWithoutNarrowing === 3 && thresholdIndex < 0) thresholdIndex = index;
    } else {
      consecutiveWithoutNarrowing = 0;
    }
  });
  if (thresholdIndex >= 0) {
    if (!ledger.debug_checkpoint) {
      errors.push(issue('E_DEBUG_CHECKPOINT_REQUIRED', '$.debug_checkpoint', 'three non-narrowing rejected/unknown probes require an architecture/observability checkpoint before a fourth hypothesis'));
    } else if (ledger.debug_checkpoint.triggered_after !== thresholdIndex + 1) {
      errors.push(issue('E_DEBUG_CHECKPOINT_SEQUENCE', '$.debug_checkpoint.triggered_after', `must equal the first threshold position ${thresholdIndex + 1}`));
    }
    if (experiments.length > thresholdIndex + 1 && !ledger.debug_checkpoint) {
      errors.push(issue('E_DEBUG_FOURTH_WITHOUT_CHECKPOINT', `$.experiments[${thresholdIndex + 1}]`, 'a fourth hypothesis cannot be recorded before the required checkpoint'));
    }
  }

  const evidence = ledger.debug_evidence;
  if (ledger.decision === 'complete' && !evidence) {
    errors.push(issue('E_DEBUG_COMPLETION_EVIDENCE', '$.debug_evidence', 'completed debug work requires a causal chain, first divergence, wait evidence, and shared-boundary evidence'));
    return;
  }
  if (!evidence || typeof evidence !== 'object') return;

  if (Array.isArray(evidence.causal_chain)) {
    evidence.causal_chain.forEach((entry, index) => {
      validateSubstantive(entry, `$.debug_evidence.causal_chain[${index}]`, errors, { minLength: 12 });
    });
  }
  validateSubstantive(evidence.first_divergence, '$.debug_evidence.first_divergence', errors, { minLength: 12 });

  const wait = evidence.wait_evidence;
  if (wait && typeof wait === 'object') {
    if (wait.applies === true && wait.strategy === 'condition') {
      validateSubstantive(wait.condition_predicate, '$.debug_evidence.wait_evidence.condition_predicate', errors, { minLength: 8 });
      validateSubstantive(wait.final_observation, '$.debug_evidence.wait_evidence.final_observation', errors, { minLength: 8 });
      if (Number.isInteger(wait.deadline_ms) && Number.isInteger(wait.polling_interval_ms)
          && wait.deadline_ms < wait.polling_interval_ms) {
        errors.push(issue('E_DEBUG_WAIT_WINDOW', '$.debug_evidence.wait_evidence', 'condition wait deadline must allow at least one polling interval'));
      }
    } else if (wait.applies === true && wait.strategy === 'fixed') {
      validateSubstantive(wait.justification, '$.debug_evidence.wait_evidence.justification', errors, { minLength: 12 });
    } else if (wait.applies === false) {
      validateSubstantive(wait.reason, '$.debug_evidence.wait_evidence.reason', errors, { minLength: 12 });
    }
  }

  const shared = evidence.shared_boundary_evidence;
  if (shared && typeof shared === 'object') {
    if (shared.applies === true) {
      validateSubstantive(shared.boundary, '$.debug_evidence.shared_boundary_evidence.boundary', errors, { minLength: 8 });
      if (shared.direct_evidence_ref === shared.sibling_evidence_ref) {
        errors.push(issue('E_DEBUG_SHARED_BOUNDARY_DISTINCT', '$.debug_evidence.shared_boundary_evidence', 'direct and sibling paths require distinct evidence references'));
      }
      for (const [field, label] of [
        ['direct_evidence_ref', 'direct failing path'],
        ['sibling_evidence_ref', 'sibling path']
      ]) {
        const ref = shared[field];
        const command = resolveJsonPointer(ledger, ref);
        if (!command || !ledger.commands_run.includes(command)) {
          errors.push(issue('E_DEBUG_SHARED_BOUNDARY_REF', `$.debug_evidence.shared_boundary_evidence.${field}`, `${label} must resolve to commands_run evidence`));
        } else if (command.provenance !== 'observed' || command.result !== 'pass') {
          errors.push(issue('E_DEBUG_SHARED_BOUNDARY_UNOBSERVED', `$.debug_evidence.shared_boundary_evidence.${field}`, `${label} requires observed passing command evidence`));
        }
      }
    } else if (shared.applies === false) {
      validateSubstantive(shared.reason, '$.debug_evidence.shared_boundary_evidence.reason', errors, { minLength: 12 });
    }
  }
}

function validateDeferredItems(ledger, errors) {
  const items = Array.isArray(ledger.deferred_items) ? ledger.deferred_items : [];
  items.forEach((entry, index) => {
    const at = `$.deferred_items[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
    validateSubstantive(entry.evidence, `${at}.evidence`, errors, { minLength: 8 });
    const evidence = resolveJsonPointer(ledger, entry.evidence_ref);
    if (evidence === undefined) {
      errors.push(issue('E_DEFERRED_EVIDENCE_REF', `${at}.evidence_ref`, 'must resolve to observed command or verified-claim evidence'));
      return;
    }
    const allowed = ledger.commands_run.includes(evidence) || ledger.verified_claims.includes(evidence);
    if (!allowed || evidence.provenance !== 'observed') {
      errors.push(issue('E_DEFERRED_EVIDENCE_UNOBSERVED', `${at}.evidence_ref`, 'must point to evidence with observed provenance'));
    }
  });
}

function observedEvidence(ledger, ref) {
  const value = resolveJsonPointer(ledger, ref);
  if (ledger.commands_run.includes(value)) {
    return { value, observed: value.provenance === 'observed', passing: value.provenance === 'observed' && value.result === 'pass' };
  }
  if (ledger.verified_claims.includes(value)) {
    return { value, observed: value.provenance === 'observed', passing: value.provenance === 'observed' };
  }
  return { value: undefined, observed: false, passing: false };
}

function validateObservedRef(ledger, ref, at, errors, options = {}) {
  const evidence = observedEvidence(ledger, ref);
  if (!evidence.value) {
    errors.push(issue(options.code || 'E_EVIDENCE_REF', at, `dangling or unsupported evidence reference: ${ref}`));
  } else if (!evidence.observed || (options.passing && !evidence.passing)) {
    errors.push(issue(options.code || 'E_EVIDENCE_UNOBSERVED', at, options.passing
      ? 'requires observed passing evidence'
      : 'requires observed evidence'));
  }
  return evidence;
}

function validateLearningBoundRef(ledger, ref, at, errors, expected) {
  const evidence = validateObservedRef(ledger, ref, at, errors, {
    code: 'E_LEARNING_BOUND_EVIDENCE',
    passing: expected.passing !== false
  });
  const binding = evidence.value?.learning_binding;
  if (!binding || binding.candidate_hash !== expected.candidateHash || binding.stage !== expected.stage
      || (expected.producerId && binding.producer_id !== expected.producerId)
      || binding.subject_id !== expected.subjectId || binding.variant !== expected.variant) {
    errors.push(issue('E_LEARNING_EVIDENCE_BINDING', at, `evidence must bind ${expected.stage}/${expected.subjectId}/${expected.variant} to the frozen candidate hash`));
  }
  return evidence;
}

function validateMultiAgentBoundRef(ledger, ref, at, errors, expected) {
  const evidence = validateObservedRef(ledger, ref, at, errors, {
    code: 'E_MULTI_AGENT_OBSERVED_GATE',
    passing: true
  });
  const binding = evidence.value?.multi_agent_binding;
  const tasks = new Set(binding?.task_ids || []);
  if (!binding || binding.run_id !== expected.runId || !(binding.gates || []).includes(expected.gate)
      || (expected.producerId && binding.producer_delegation_id !== expected.producerId)
      || (expected.taskIds || []).some((taskId) => !tasks.has(taskId))) {
    errors.push(issue('E_MULTI_AGENT_EVIDENCE_BINDING', at, `evidence must bind the ${expected.gate} gate and declared tasks to run ${expected.runId}`));
  }
  return evidence;
}

function directedCycle(ids, edgesFor) {
  const state = new Map();
  const visit = (id) => {
    if (state.get(id) === 'visiting') return true;
    if (state.get(id) === 'done') return false;
    state.set(id, 'visiting');
    for (const next of edgesFor(id)) {
      if (ids.has(next) && visit(next)) return true;
    }
    state.set(id, 'done');
    return false;
  };
  return [...ids].some(visit);
}

function literalGlobPrefix(pattern) {
  const normalized = normalizePath(pattern);
  const wildcard = normalized.search(/[*?]/);
  return wildcard === -1 ? normalized : normalized.slice(0, wildcard);
}

function pathPatternsMayOverlap(left, right, caseSensitive) {
  const a = caseSensitive ? normalizePath(left) : normalizePath(left).toLowerCase();
  const b = caseSensitive ? normalizePath(right) : normalizePath(right).toLowerCase();
  if (a === b) return true;
  if (!/[*?]/.test(a) && globToRegExp(b, caseSensitive).test(a)) return true;
  if (!/[*?]/.test(b) && globToRegExp(a, caseSensitive).test(b)) return true;
  const aPrefix = literalGlobPrefix(a);
  const bPrefix = literalGlobPrefix(b);
  return Boolean(aPrefix && bPrefix && (aPrefix.startsWith(bPrefix) || bPrefix.startsWith(aPrefix)));
}

function repoPatternWithin(child, parent, caseSensitive) {
  const normalize = (value) => caseSensitive ? normalizePath(value) : normalizePath(value).toLowerCase();
  const candidate = normalize(child);
  const ceiling = normalize(parent);
  if (candidate === ceiling) return true;
  if (ceiling.endsWith('/**')) {
    const root = ceiling.slice(0, -3).replace(/\/$/, '');
    const childPrefix = literalGlobPrefix(candidate).replace(/\/$/, '');
    return childPrefix === root || childPrefix.startsWith(`${root}/`);
  }
  if (ceiling.endsWith('/*')) {
    const root = ceiling.slice(0, -2).replace(/\/$/, '');
    if (!candidate.startsWith(`${root}/`)) return false;
    const remainder = candidate.slice(root.length + 1);
    return remainder.length > 0 && !remainder.includes('/') && !remainder.includes('**');
  }
  return false;
}

function resourceWithinAny(resource, parents, caseSensitive) {
  if (parents.includes(resource)) return true;
  if (isHttpUrl(resource)) return parents.some((parent) => {
    if (!isHttpUrl(parent)) return false;
    try {
      const childUrl = new URL(resource);
      const parentUrl = new URL(parent);
      if (childUrl.origin !== parentUrl.origin) return false;
      if (parentUrl.search || parentUrl.hash) return childUrl.href === parentUrl.href;
      const parentPath = parentUrl.pathname.replace(/\/$/, '') || '/';
      return childUrl.pathname === parentPath || childUrl.pathname.startsWith(parentPath === '/' ? '/' : `${parentPath}/`);
    } catch {
      return false;
    }
  });
  return parents.filter((parent) => !isHttpUrl(parent)).some((parent) => repoPatternWithin(resource, parent, caseSensitive));
}

function validateDelegations(ledger, errors, runtime = {}) {
  const profiles = new Set(ledger.profiles);
  const applicable = profiles.has('multi_agent') || profiles.has('background_learning');
  const delegations = Array.isArray(ledger.delegations) ? ledger.delegations : [];
  const parentAuthority = Array.isArray(ledger.parent_authority) ? ledger.parent_authority : [];
  const completing = ledger.decision === 'complete';
  const artifactRoot = ledger.delegation_artifact_root;
  const nowMs = Number.isFinite(runtime.nowMs) ? runtime.nowMs : Date.now();
  const maxClockSkewMs = Number.isFinite(runtime.maxClockSkewMs) ? runtime.maxClockSkewMs : 300000;

  if (!applicable && (delegations.length > 0 || parentAuthority.length > 0 || ledger.multi_agent_evidence)) {
    errors.push(issue('E_PROFILE_MISSING', '$.profiles', 'delegation data requires the multi_agent or background_learning profile'));
  }
  if (applicable && completing) {
    if (!ledger.created_at) {
      errors.push(issue('E_DELEGATION_LEDGER_TIME', '$.created_at', 'completed delegated work requires a ledger timestamp'));
    } else if (Date.parse(ledger.created_at) > nowMs + maxClockSkewMs) {
      errors.push(issue('E_DELEGATION_FUTURE_TIME', '$.created_at', 'delegation ledger timestamp exceeds the trusted validation clock'));
    }
    if (parentAuthority.length === 0 || !parentAuthority.includes('delegate')) {
      errors.push(issue('E_DELEGATION_PARENT_AUTHORITY', '$.parent_authority', 'completed delegated work requires an explicit parent authority ceiling containing delegate'));
    }
    if (delegations.length === 0) {
      errors.push(issue('E_DELEGATION_MISSING', '$.delegations', 'completed delegated work requires at least one child envelope'));
    }
    if (!artifactRoot || !/^\.zerotohero\/artifacts(?:\/[^*?]+)?$/.test(normalizePath(artifactRoot))) {
      errors.push(issue('E_DELEGATION_ARTIFACT_ROOT', '$.delegation_artifact_root', 'completed delegated work requires a reserved .zerotohero/artifacts root'));
    }
    if (artifactRoot) errors.push(...validateRepoPath(artifactRoot, '$.delegation_artifact_root'));
  }
  if (ledger.files_touched.length > 0 && applicable && !parentAuthority.includes('write')) {
    errors.push(issue('E_DELEGATION_PARENT_WRITE', '$.parent_authority', 'a parent that records touched files must hold write authority'));
  }

  pushDuplicateIdErrors(delegations, '$.delegations', errors);
  const byId = new Map(delegations.filter((entry) => entry && typeof entry.id === 'string').map((entry) => [entry.id, entry]));
  const ids = new Set(byId.keys());
  const indexes = new Set();
  const artifactPaths = new Set();
  const leaseIds = new Set();
  const taskIds = new Set();
  const idempotencyOwners = new Map();
  const terminal = new Set(['completed', 'failed', 'timed_out', 'interrupted', 'cancelled']);
  const mutationAuthority = new Set(['write', 'deploy', 'credential_use', 'external_message', 'memory_promote', 'live_mutation']);
  const leafForbidden = new Set(['delegate', 'deploy', 'credential_use', 'external_message', 'memory_promote', 'live_mutation']);

  delegations.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
    const at = `$.delegations[${index}]`;
    if (indexes.has(entry.task_input_index)) errors.push(issue('E_DELEGATION_RESULT_ORDER', `${at}.task_input_index`, 'task_input_index must be unique'));
    indexes.add(entry.task_input_index);
    if (entry.task_input_index !== index) {
      errors.push(issue('E_DELEGATION_RESULT_ORDER', `${at}.task_input_index`, 'delegation results must be stored in task_input_index order'));
    }

    if (taskIds.has(entry.task_id)) {
      errors.push(issue('E_DELEGATION_TASK_DUPLICATE', `${at}.task_id`, 'one logical task has exactly one result envelope; attempts are summarized by attempts_used'));
    }
    taskIds.add(entry.task_id);
    const keyOwner = idempotencyOwners.get(entry.idempotency_key);
    if (keyOwner && keyOwner !== entry.task_id) {
      errors.push(issue('E_DELEGATION_IDEMPOTENCY_COLLISION', `${at}.idempotency_key`, 'different tasks cannot share an idempotency key'));
    }
    idempotencyOwners.set(entry.idempotency_key, entry.task_id);
    if (entry.attempts_used > entry.max_attempts) {
      errors.push(issue('E_DELEGATION_ATTEMPT_LIMIT', `${at}.attempts_used`, 'attempts_used exceeds max_attempts'));
    }

    if (entry.parent_id !== null && !byId.has(entry.parent_id)) {
      errors.push(issue('E_DELEGATION_PARENT_REF', `${at}.parent_id`, `unknown parent delegation: ${entry.parent_id}`));
    }
    const directParent = entry.parent_id === null ? null : byId.get(entry.parent_id);
    if (directParent) {
      for (const authority of entry.granted_authority || []) {
        if (!(directParent.granted_authority || []).includes(authority)) {
          errors.push(issue('E_DELEGATION_DIRECT_PARENT_AUTHORITY', `${at}.granted_authority`, `${authority} exceeds the direct parent envelope`));
        }
      }
      if (directParent.max_spawn_depth < 1) {
        errors.push(issue('E_DELEGATION_DIRECT_PARENT_DEPTH', `${at}.parent_id`, 'direct parent has no remaining spawn depth'));
      }
      if (entry.max_spawn_depth > directParent.max_spawn_depth - 1) {
        errors.push(issue('E_DELEGATION_DIRECT_PARENT_DEPTH', `${at}.max_spawn_depth`, 'child spawn depth exceeds the direct parent remainder'));
      }
    }
    for (const dependency of Array.isArray(entry.depends_on) ? entry.depends_on : []) {
      if (!byId.has(dependency)) errors.push(issue('E_DELEGATION_DEPENDENCY_REF', `${at}.depends_on`, `unknown dependency: ${dependency}`));
      if (dependency === entry.id) errors.push(issue('E_DELEGATION_DEPENDENCY_CYCLE', `${at}.depends_on`, 'a delegation cannot depend on itself'));
      const dependencyEntry = byId.get(dependency);
      if (dependencyEntry && !['pending', 'cancelled'].includes(entry.status)
          && (dependencyEntry.status !== 'completed' || Date.parse(dependencyEntry.finished_at) > Date.parse(entry.started_at))) {
        errors.push(issue('E_DELEGATION_DEPENDENCY_ORDER', `${at}.depends_on`, `${dependency} must complete successfully before this task starts`));
      }
    }

    for (const authority of Array.isArray(entry.granted_authority) ? entry.granted_authority : []) {
      if (!parentAuthority.includes(authority)) {
        errors.push(issue('E_DELEGATION_AUTHORITY_ESCALATION', `${at}.granted_authority`, `${authority} exceeds the parent authority ceiling`));
      }
      if (authority === 'live_mutation') {
        errors.push(issue('E_DELEGATION_LIVE_MUTATION', `${at}.granted_authority`, 'a child can never receive a live-system mutation lease'));
      }
      if (entry.read_only && mutationAuthority.has(authority)) {
        errors.push(issue('E_DELEGATION_READ_ONLY_MUTATION', `${at}.granted_authority`, `read-only delegation cannot receive ${authority}`));
      }
      if (entry.role !== 'orchestrator' && leafForbidden.has(authority)) {
        errors.push(issue('E_DELEGATION_LEAF_AUTHORITY', `${at}.granted_authority`, `${entry.role} cannot receive ${authority}`));
      }
    }
    if (entry.role === 'orchestrator' && !(entry.granted_authority || []).includes('delegate')) {
      errors.push(issue('E_DELEGATION_ORCHESTRATOR_AUTHORITY', `${at}.granted_authority`, 'orchestrator role requires delegated delegate authority'));
    }
    if (entry.role !== 'orchestrator' && entry.max_spawn_depth !== 0) {
      errors.push(issue('E_DELEGATION_LEAF_DEPTH', `${at}.max_spawn_depth`, 'non-orchestrator delegations must have max_spawn_depth=0'));
    }

    const allowed = Array.isArray(entry.allowed_resources) ? entry.allowed_resources : [];
    allowed.forEach((resource, resourceIndex) => {
      if (isHttpUrl(resource)) {
        try {
          const resourceUrl = new URL(resource);
          if (resourceUrl.username || resourceUrl.password) {
            errors.push(issue('E_DELEGATION_NETWORK_CREDENTIAL', `${at}.allowed_resources[${resourceIndex}]`, 'URL resources cannot embed credentials'));
          }
        } catch {
          // Structural URL validation reports malformed values.
        }
        if (!(entry.granted_authority || []).includes('network_read')) {
          errors.push(issue('E_DELEGATION_NETWORK_AUTHORITY', `${at}.allowed_resources[${resourceIndex}]`, 'URL resources require explicit network_read authority'));
        }
        if (!resourceWithinAny(resource, ledger.scope.allowed_network_read || [], ledger.scope.case_sensitive)) {
          errors.push(issue('E_DELEGATION_NETWORK_SCOPE', `${at}.allowed_resources[${resourceIndex}]`, `${resource} exceeds the ledger network-read scope`));
        }
      } else {
        errors.push(...validateRepoPath(resource, `${at}.allowed_resources[${resourceIndex}]`, { allowGlob: true }));
        if (!resourceWithinAny(resource, ledger.scope.allowed_read || [], ledger.scope.case_sensitive)) {
          errors.push(issue('E_DELEGATION_SCOPE_RESOURCE', `${at}.allowed_resources[${resourceIndex}]`, `${resource} exceeds the ledger read scope`));
        }
      }
      if (directParent && !resourceWithinAny(resource, directParent.allowed_resources || [], ledger.scope.case_sensitive)) {
        errors.push(issue('E_DELEGATION_DIRECT_PARENT_RESOURCE', `${at}.allowed_resources[${resourceIndex}]`, `${resource} exceeds the direct parent resource envelope`));
      }
    });
    const owned = Array.isArray(entry.owned_paths) ? entry.owned_paths : [];
    owned.forEach((resource, resourceIndex) => {
      errors.push(...validateRepoPath(resource, `${at}.owned_paths[${resourceIndex}]`, { allowGlob: true }));
      if (!resourceWithinAny(resource, ledger.scope.allowed_touch || [], ledger.scope.case_sensitive)) {
        errors.push(issue('E_DELEGATION_SCOPE_OWNERSHIP', `${at}.owned_paths[${resourceIndex}]`, `${resource} exceeds the ledger touch scope`));
      }
    });
    if (entry.read_only && (owned.length > 0 || (entry.files_touched || []).length > 0 || entry.mutation_lease !== null)) {
      errors.push(issue('E_DELEGATION_READ_ONLY_WRITE', at, 'read-only delegation cannot own paths, touch files, or hold a mutation lease'));
    }
    if (!entry.read_only && (entry.granted_authority || []).includes('write') && owned.length === 0) {
      errors.push(issue('E_DELEGATION_WRITER_OWNERSHIP', `${at}.owned_paths`, 'a writing delegation requires explicit owned_paths'));
    }
    (entry.files_touched || []).forEach((file, fileIndex) => {
      errors.push(...validateRepoPath(file, `${at}.files_touched[${fileIndex}]`));
      if (!pathMatchesAny(file, owned, ledger.scope.case_sensitive)) {
        errors.push(issue('E_DELEGATION_TOUCH_OWNERSHIP', `${at}.files_touched[${fileIndex}]`, `${file} is outside the delegation writer lease`));
      }
      if (!ledger.files_touched.includes(file)) {
        errors.push(issue('E_DELEGATION_TOUCH_LEDGER', `${at}.files_touched[${fileIndex}]`, `${file} is absent from the parent ledger`));
      }
    });

    errors.push(...validateRepoPath(entry.artifact_path, `${at}.artifact_path`));
    if (artifactRoot && !resourceWithinAny(entry.artifact_path, [`${normalizePath(artifactRoot)}/**`], ledger.scope.case_sensitive)) {
      errors.push(issue('E_DELEGATION_ARTIFACT_ESCAPE', `${at}.artifact_path`, 'artifact paths must stay under the parent-owned delegation artifact root'));
    }
    const artifactKey = ledger.scope.case_sensitive ? normalizePath(entry.artifact_path) : normalizePath(entry.artifact_path).toLowerCase();
    if (artifactPaths.has(artifactKey)) errors.push(issue('E_DELEGATION_ARTIFACT_COLLISION', `${at}.artifact_path`, 'artifact_path must be unique per delegation'));
    artifactPaths.add(artifactKey);

    (entry.proposal_evidence_refs || []).forEach((ref, refIndex) => validateObservedRef(
      ledger, ref, `${at}.proposal_evidence_refs[${refIndex}]`, errors, { code: 'E_DELEGATION_PROPOSAL_EVIDENCE' }
    ));
    (entry.check_evidence_refs || []).forEach((ref, refIndex) => validateObservedRef(
      ledger, ref, `${at}.check_evidence_refs[${refIndex}]`, errors, { code: 'E_DELEGATION_CHECK_EVIDENCE', passing: entry.status === 'completed' }
    ));
    if (entry.status === 'completed' && (entry.check_evidence_refs || []).length === 0) {
      errors.push(issue('E_DELEGATION_CHECK_EVIDENCE', `${at}.check_evidence_refs`, 'a completed delegation requires observed passing check evidence'));
    }

    const budgetLimit = entry.summary_budget?.limit;
    const tooLarge = entry.summary_budget?.unit === 'words' ? budgetLimit > 2000 : budgetLimit > 16000;
    if (tooLarge) errors.push(issue('E_DELEGATION_SUMMARY_BUDGET', `${at}.summary_budget.limit`, 'summary budget exceeds 2000 words or 16000 bytes'));
    const summaryBytes = Buffer.byteLength(String(entry.result_summary || ''), 'utf8');
    const actualSummarySize = entry.summary_budget?.unit === 'words'
      ? countWords(entry.result_summary)
      : Buffer.byteLength(String(entry.result_summary || ''), 'utf8');
    if (Number.isInteger(budgetLimit) && actualSummarySize > budgetLimit) {
      errors.push(issue('E_DELEGATION_SUMMARY_OVERFLOW', `${at}.result_summary`, `result summary uses ${actualSummarySize} ${entry.summary_budget.unit}, above its declared budget ${budgetLimit}`));
    }
    if (summaryBytes > 16000) {
      errors.push(issue('E_DELEGATION_SUMMARY_OVERFLOW', `${at}.result_summary`, 'result summary exceeds the absolute 16000-byte context ceiling'));
    }
    if (Date.parse(entry.finished_at) < Date.parse(entry.started_at)) {
      errors.push(issue('E_DELEGATION_TIME_ORDER', `${at}.finished_at`, 'finished_at must not precede started_at'));
    }
    if ((ledger.created_at && Date.parse(entry.finished_at) > Date.parse(ledger.created_at))
        || Date.parse(entry.started_at) > nowMs + maxClockSkewMs || Date.parse(entry.finished_at) > nowMs + maxClockSkewMs) {
      errors.push(issue('E_DELEGATION_FUTURE_TIME', at, 'delegation timestamps must not exceed ledger completion or the trusted validation clock'));
    }
    if (Number.isInteger(entry.iterations_used) && entry.iterations_used > entry.max_iterations) {
      errors.push(issue('E_DELEGATION_ITERATION_LIMIT', `${at}.iterations_used`, 'observed iterations exceed max_iterations'));
    }
    const elapsedSeconds = (Date.parse(entry.finished_at) - Date.parse(entry.started_at)) / 1000;
    if (Number.isFinite(elapsedSeconds) && elapsedSeconds > entry.timeout_seconds && entry.status === 'completed') {
      errors.push(issue('E_DELEGATION_TIMEOUT_LIMIT', at, 'a completed delegation exceeded timeout_seconds'));
    }
    if (completing && !terminal.has(entry.status)) {
      errors.push(issue('E_DELEGATION_NOT_TERMINAL', `${at}.status`, 'completion requires every delegation to be terminal'));
    }
    if (completing && entry.mutation_lease && !entry.mutation_lease.released) {
      errors.push(issue('E_DELEGATION_LEASE_ACTIVE', `${at}.mutation_lease.released`, 'completion requires every workspace lease to be released'));
    }
    const hasWriteAuthority = (entry.granted_authority || []).includes('write');
    if (!entry.read_only && (owned.length > 0 || (entry.files_touched || []).length > 0) && !hasWriteAuthority) {
      errors.push(issue('E_DELEGATION_WRITE_AUTHORITY', at, 'workspace ownership or touched files require explicit write authority'));
    }
    const isWriter = !entry.read_only && (hasWriteAuthority || owned.length > 0 || (entry.files_touched || []).length > 0);
    if (isWriter && !entry.mutation_lease) {
      errors.push(issue('E_DELEGATION_LEASE_MISSING', `${at}.mutation_lease`, 'every workspace writer requires an explicit bounded lease'));
    }
    if (entry.mutation_lease) {
      const lease = entry.mutation_lease;
      if (leaseIds.has(lease.lease_id)) errors.push(issue('E_DELEGATION_LEASE_COLLISION', `${at}.mutation_lease.lease_id`, 'workspace lease IDs must be unique'));
      leaseIds.add(lease.lease_id);
      if (lease.holder_delegation_id !== entry.id) {
        errors.push(issue('E_DELEGATION_LEASE_HOLDER', `${at}.mutation_lease.holder_delegation_id`, 'lease holder must match the delegation envelope'));
      }
      if (!arraysEqual((lease.paths || []).map(normalizePath).sort(), owned.map(normalizePath).sort(), String)) {
        errors.push(issue('E_DELEGATION_LEASE_PATHS', `${at}.mutation_lease.paths`, 'lease paths must exactly match writer ownership'));
      }
      const acquiredAt = Date.parse(lease.acquired_at);
      const expiresAt = Date.parse(lease.expires_at);
      const releasedAt = Date.parse(lease.released_at);
      if (acquiredAt > Date.parse(entry.started_at) || expiresAt < Date.parse(entry.finished_at) || expiresAt <= acquiredAt) {
        errors.push(issue('E_DELEGATION_LEASE_WINDOW', `${at}.mutation_lease`, 'lease must be acquired before work and remain valid through task completion'));
      }
      if (lease.released && (!lease.released_at || releasedAt < Date.parse(entry.finished_at) || releasedAt > expiresAt)) {
        errors.push(issue('E_DELEGATION_LEASE_RELEASE_TIME', `${at}.mutation_lease.released_at`, 'released lease requires a release time after task completion and before expiry'));
      }
      if (lease.released && ((ledger.created_at && releasedAt > Date.parse(ledger.created_at)) || releasedAt > nowMs + maxClockSkewMs)) {
        errors.push(issue('E_DELEGATION_LEASE_FUTURE', `${at}.mutation_lease.released_at`, 'lease release cannot exceed ledger completion or the trusted validation clock'));
      }
      if (!lease.released && (lease.released_at !== null || lease.release_evidence_ref !== null)) {
        errors.push(issue('E_DELEGATION_LEASE_RELEASE_STATE', `${at}.mutation_lease`, 'an active lease cannot claim release time or evidence'));
      }
      if (lease.released) {
        const releaseEvidence = validateObservedRef(
          ledger, lease.release_evidence_ref, `${at}.mutation_lease.release_evidence_ref`, errors,
          { code: 'E_DELEGATION_LEASE_EVIDENCE', passing: true }
        );
        const binding = releaseEvidence.value?.lease_binding;
        if (!binding || binding.lease_id !== lease.lease_id || binding.holder_delegation_id !== entry.id || binding.action !== 'release') {
          errors.push(issue('E_DELEGATION_LEASE_EVIDENCE_BINDING', `${at}.mutation_lease.release_evidence_ref`, 'release evidence must bind the lease and holder'));
        }
      }
    }
  });

  if (directedCycle(ids, (id) => {
    const parent = byId.get(id)?.parent_id;
    return parent === null || parent === undefined ? [] : [parent];
  })) errors.push(issue('E_DELEGATION_PARENT_CYCLE', '$.delegations', 'delegation parent graph must be acyclic'));
  if (directedCycle(ids, (id) => byId.get(id)?.depends_on || [])) {
    errors.push(issue('E_DELEGATION_DEPENDENCY_CYCLE', '$.delegations', 'delegation dependency graph must be acyclic'));
  }

  const depthMemo = new Map();
  const depthOf = (id, trail = new Set()) => {
    if (depthMemo.has(id)) return depthMemo.get(id);
    if (trail.has(id)) return Number.POSITIVE_INFINITY;
    const parent = byId.get(id)?.parent_id;
    const depth = parent === null || parent === undefined ? 1 : depthOf(parent, new Set([...trail, id])) + 1;
    depthMemo.set(id, depth);
    return depth;
  };
  for (const entry of delegations) {
    if (!entry || entry.parent_id === null || !byId.has(entry.parent_id)) continue;
    const directParent = byId.get(entry.parent_id);
    if (directParent.role !== 'orchestrator') {
      errors.push(issue('E_DELEGATION_PARENT_ROLE', '$.delegations', `${entry.parent_id} must be an orchestrator to own child ${entry.id}`));
    }
    let ancestor = directParent;
    const seenAncestors = new Set();
    while (ancestor && !seenAncestors.has(ancestor.id)) {
      seenAncestors.add(ancestor.id);
      if (['cancelled', 'interrupted', 'timed_out'].includes(ancestor.status)
          && Date.parse(entry.finished_at) > Date.parse(ancestor.finished_at)
          && entry.status === 'completed') {
        errors.push(issue('E_DELEGATION_CANCELLATION_CASCADE', '$.delegations', `${entry.id} completed after cancelled ancestor ${ancestor.id}`));
        break;
      }
      ancestor = ancestor.parent_id === null ? null : byId.get(ancestor.parent_id);
    }
  }

  const writers = delegations.filter((entry) => entry && !entry.read_only && (entry.granted_authority || []).includes('write'));
  for (let left = 0; left < writers.length; left += 1) {
    for (let right = left + 1; right < writers.length; right += 1) {
      for (const a of writers[left].owned_paths || []) {
        for (const b of writers[right].owned_paths || []) {
          if (pathPatternsMayOverlap(a, b, ledger.scope.case_sensitive)) {
            errors.push(issue('E_DELEGATION_WRITER_COLLISION', '$.delegations', `${writers[left].id} and ${writers[right].id} have overlapping writer ownership`));
          }
        }
      }
    }
  }

  if (indexes.size > 0) {
    const ordered = [...indexes].sort((a, b) => a - b);
    if (ordered.some((value, index) => value !== index)) {
      errors.push(issue('E_DELEGATION_RESULT_ORDER', '$.delegations', 'task_input_index values must be contiguous from zero'));
    }
  }

  const evidence = ledger.multi_agent_evidence;
  if (profiles.has('multi_agent') && completing) {
    if (!evidence) {
      errors.push(issue('E_MULTI_AGENT_EVIDENCE', '$.multi_agent_evidence', 'completed multi-agent work requires integration evidence'));
    } else {
      const actualDepth = delegations.length > 0 ? Math.max(...delegations.map((entry) => depthOf(entry.id))) : 0;
      if (actualDepth > evidence.max_spawn_depth) {
        errors.push(issue('E_DELEGATION_DEPTH_LIMIT', '$.multi_agent_evidence.max_spawn_depth', `observed delegation depth ${actualDepth} exceeds the declared limit`));
      }
      if (evidence.spec_verdict !== 'pass' || evidence.quality_verdict !== 'pass'
          || !evidence.blocking_fixes_rereviewed || !evidence.agents_terminal
          || !evidence.parent_cancel_cascaded || !evidence.idempotency_verified || !evidence.leases_released) {
        errors.push(issue('E_MULTI_AGENT_GATE', '$.multi_agent_evidence', 'completion requires pass verdicts, re-review, cancellation/idempotency/lease gates, and terminal agents'));
      }
      const specReviewer = byId.get(evidence.spec_reviewer_delegation_id);
      const qualityReviewer = byId.get(evidence.quality_reviewer_delegation_id);
      if (!specReviewer || specReviewer.role !== 'evidence_reviewer' || !specReviewer.read_only || specReviewer.status !== 'completed') {
        errors.push(issue('E_MULTI_AGENT_SPEC_REVIEWER', '$.multi_agent_evidence.spec_reviewer_delegation_id', 'spec verdict requires a completed read-only evidence_reviewer'));
      }
      if (!qualityReviewer || qualityReviewer.role !== 'integration_reviewer' || !qualityReviewer.read_only || qualityReviewer.status !== 'completed') {
        errors.push(issue('E_MULTI_AGENT_QUALITY_REVIEWER', '$.multi_agent_evidence.quality_reviewer_delegation_id', 'quality verdict requires a completed read-only integration_reviewer'));
      }
      if (evidence.spec_reviewer_delegation_id === evidence.quality_reviewer_delegation_id) {
        errors.push(issue('E_MULTI_AGENT_REVIEWER_INDEPENDENCE', '$.multi_agent_evidence', 'spec and quality verdicts require distinct reviewers'));
      }
      if (specReviewer && qualityReviewer && (specReviewer.task_id === qualityReviewer.task_id || specReviewer.session_id === qualityReviewer.session_id)) {
        errors.push(issue('E_MULTI_AGENT_REVIEWER_INDEPENDENCE', '$.multi_agent_evidence', 'spec and quality reviewers require distinct task and session identities'));
      }
      const gateRefs = [
        ['spec_evidence_ref', evidence.spec_evidence_ref, 'spec', evidence.spec_reviewer_delegation_id],
        ['quality_evidence_ref', evidence.quality_evidence_ref, 'quality', evidence.quality_reviewer_delegation_id],
        ['cancellation_evidence_ref', evidence.cancellation_evidence_ref, 'cancellation', evidence.quality_reviewer_delegation_id],
        ['idempotency_evidence_ref', evidence.idempotency_evidence_ref, 'idempotency', evidence.quality_reviewer_delegation_id],
        ['lease_cleanup_evidence_ref', evidence.lease_cleanup_evidence_ref, 'lease_cleanup', evidence.quality_reviewer_delegation_id],
        ['context_isolation_evidence_ref', evidence.context_isolation_evidence_ref, 'context_isolation', evidence.quality_reviewer_delegation_id]
      ];
      const taskIds = delegations.map((entry) => entry.task_id);
      gateRefs.forEach(([field, ref, gate, producerId]) => validateMultiAgentBoundRef(
        ledger, ref, `$.multi_agent_evidence.${field}`, errors,
        { runId: evidence.run_id, gate, producerId, taskIds }
      ));
      (evidence.integration_evidence_refs || []).forEach((ref, index) => validateMultiAgentBoundRef(
        ledger, ref, `$.multi_agent_evidence.integration_evidence_refs[${index}]`, errors,
        { runId: evidence.run_id, gate: 'integration', taskIds, producerId: evidence.quality_reviewer_delegation_id }
      ));
      const allGateRefs = [...gateRefs.map((entry) => entry[1]), ...(evidence.integration_evidence_refs || [])];
      if (new Set(allGateRefs).size !== allGateRefs.length) {
        errors.push(issue('E_MULTI_AGENT_EVIDENCE_REUSE', '$.multi_agent_evidence', 'spec, quality, runtime gates, and integration require distinct observed commands'));
      }
      if (specReviewer && !(specReviewer.check_evidence_refs || []).includes(evidence.spec_evidence_ref)) {
        errors.push(issue('E_MULTI_AGENT_SPEC_REVIEWER', '$.multi_agent_evidence.spec_evidence_ref', 'spec evidence must be returned by the declared reviewer'));
      }
      const qualityRefs = [evidence.quality_evidence_ref, evidence.cancellation_evidence_ref, evidence.idempotency_evidence_ref,
        evidence.lease_cleanup_evidence_ref, evidence.context_isolation_evidence_ref, ...(evidence.integration_evidence_refs || [])];
      if (qualityReviewer && qualityRefs.some((ref) => !(qualityReviewer.check_evidence_refs || []).includes(ref))) {
        errors.push(issue('E_MULTI_AGENT_QUALITY_REVIEWER', '$.multi_agent_evidence', 'quality/runtime/integration evidence must be returned by the declared reviewer'));
      }
      if ((evidence.integration_evidence_refs || []).length === 0) {
        errors.push(issue('E_MULTI_AGENT_INTEGRATION_EVIDENCE', '$.multi_agent_evidence.integration_evidence_refs', 'completion requires observed parent integration evidence'));
      }

      const events = delegations.flatMap((entry) => [
        { at: Date.parse(entry.started_at), delta: 1 },
        { at: Date.parse(entry.finished_at), delta: -1 }
      ]).filter((entry) => Number.isFinite(entry.at)).sort((left, right) => left.at - right.at || left.delta - right.delta);
      let concurrent = 0;
      let observedMaxConcurrency = 0;
      for (const event of events) {
        concurrent += event.delta;
        observedMaxConcurrency = Math.max(observedMaxConcurrency, concurrent);
      }
      if (observedMaxConcurrency > evidence.max_concurrency) {
        errors.push(issue('E_DELEGATION_CONCURRENCY_LIMIT', '$.multi_agent_evidence.max_concurrency', `observed concurrency ${observedMaxConcurrency} exceeds the declared limit`));
      }
    }
  }
}

function validateLearning(ledger, errors, runtime = {}) {
  const profiles = new Set(ledger.profiles);
  const learning = ledger.learning_evidence;
  const completing = ledger.decision === 'complete';
  const nowMs = Number.isFinite(runtime.nowMs) ? runtime.nowMs : Date.now();
  const maxClockSkewMs = Number.isFinite(runtime.maxClockSkewMs) ? runtime.maxClockSkewMs : 300000;
  if (!learning) {
    if (profiles.has('background_learning') && completing) {
      errors.push(issue('E_LEARNING_EVIDENCE', '$.learning_evidence', 'completed background learning requires a staged learning record'));
    }
    return;
  }
  if (!profiles.has('background_learning') && !profiles.has('self_iteration')) {
    errors.push(issue('E_PROFILE_MISSING', '$.profiles', 'learning_evidence requires background_learning or self_iteration'));
  }
  if (ledger.created_at && Date.parse(ledger.created_at) > nowMs + maxClockSkewMs) {
    errors.push(issue('E_LEARNING_FUTURE_TIME', '$.created_at', 'learning ledger timestamp exceeds the trusted validation clock'));
  }
  if (profiles.has('background_learning') && !profiles.has('multi_agent')) {
    errors.push(issue('E_LEARNING_MULTI_AGENT_PROFILE', '$.profiles', 'background learning requires bounded multi-agent delegation'));
  }
  if (profiles.has('background_learning') && learning.created_by !== 'agent') {
    errors.push(issue('E_LEARNING_USER_OWNED', '$.learning_evidence.created_by', 'background curation may only process agent-created candidates'));
  }

  const cases = Array.isArray(learning.cases) ? learning.cases : [];
  const folds = Array.isArray(learning.folds) ? learning.folds : [];
  pushDuplicateIdErrors(cases, '$.learning_evidence.cases', errors);
  pushDuplicateIdErrors(folds, '$.learning_evidence.folds', errors);
  const byCase = new Map(cases.filter((entry) => entry && typeof entry.id === 'string').map((entry) => [entry.id, entry]));
  const delegations = new Map((ledger.delegations || []).filter((entry) => entry && typeof entry.id === 'string').map((entry) => [entry.id, entry]));
  const fingerprints = new Set();
  const sourceLedgerHashes = new Set();
  const caseEvidenceRefs = new Set();
  const learningTaskIds = new Set();
  const learningSessionIds = new Set();
  cases.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
    const at = `$.learning_evidence.cases[${index}]`;
    if (fingerprints.has(entry.input_fingerprint)) errors.push(issue('E_LEARNING_CASE_LEAKAGE', `${at}.input_fingerprint`, 'case fingerprints must be independent and unique'));
    fingerprints.add(entry.input_fingerprint);
    if (sourceLedgerHashes.has(entry.source_ledger_hash)) errors.push(issue('E_LEARNING_SOURCE_REUSE', `${at}.source_ledger_hash`, 'independent cases must come from distinct canonical ledgers'));
    sourceLedgerHashes.add(entry.source_ledger_hash);
    if (learningTaskIds.has(entry.task_id) || learningSessionIds.has(entry.session_id)) {
      errors.push(issue('E_LEARNING_CASE_INDEPENDENCE', at, 'positive, control, and invariant cases require distinct task and session identities'));
    }
    learningTaskIds.add(entry.task_id);
    learningSessionIds.add(entry.session_id);
    validateSourceLedgerSnapshot(entry, at, errors);
    if (Date.parse(entry.source_ledger_snapshot?.observed_at) > nowMs + maxClockSkewMs) {
      errors.push(issue('E_LEARNING_FUTURE_TIME', `${at}.source_ledger_snapshot.observed_at`, 'source evidence exceeds the trusted validation clock'));
    }
    if (entry.kind === 'positive' && Date.parse(entry.source_ledger_snapshot?.observed_at) > Date.parse(learning.candidate_frozen_at)) {
      errors.push(issue('E_LEARNING_SOURCE_TIME', `${at}.source_ledger_snapshot.observed_at`, 'positive source evidence must predate the frozen candidate'));
    }
    if (ledger.created_at && Date.parse(entry.source_ledger_snapshot?.observed_at) > Date.parse(ledger.created_at)) {
      errors.push(issue('E_LEARNING_SOURCE_TIME', `${at}.source_ledger_snapshot.observed_at`, 'source evidence cannot occur after the completed ledger timestamp'));
    }
    if (caseEvidenceRefs.has(entry.evidence_ref)) errors.push(issue('E_LEARNING_EVIDENCE_REUSE', `${at}.evidence_ref`, 'independent cases require distinct observed evidence references'));
    caseEvidenceRefs.add(entry.evidence_ref);
    const caseVariant = entry.kind === 'negative_control' ? 'control' : entry.kind;
    const evidence = validateLearningBoundRef(ledger, entry.evidence_ref, `${at}.evidence_ref`, errors, {
      candidateHash: learning.target_hash,
      stage: 'case',
      subjectId: entry.id,
      variant: caseVariant,
      producerId: 'parent',
      passing: entry.result === 'pass'
    });
    if (entry.result === 'pass' && evidence.value && evidence.value.result !== 'pass') {
      errors.push(issue('E_LEARNING_CASE_RESULT', `${at}.result`, 'case result disagrees with its command evidence'));
    }
  });
  if (cases.length === 0) errors.push(issue('E_LEARNING_CASES_MISSING', '$.learning_evidence.cases', 'learning requires at least one evidenced case'));

  const positiveIds = cases.filter((entry) => entry.kind === 'positive').map((entry) => entry.id);
  const positiveSet = new Set(positiveIds);
  const holdoutCoverage = new Set();
  const candidateFoldRefs = new Set();
  const oracleFoldRefs = new Set();
  let improved = false;
  folds.forEach((fold, index) => {
    if (!fold || typeof fold !== 'object' || Array.isArray(fold)) return;
    const at = `$.learning_evidence.folds[${index}]`;
    const training = new Set(fold.training_case_ids || []);
    const holdout = new Set(fold.holdout_case_ids || []);
    if (training.size === 0 || holdout.size === 0) {
      errors.push(issue('E_LEARNING_HOLDOUT_EMPTY', at, 'each fold requires non-empty training and hidden holdout sets'));
    }
    if (fold.holdout_blinded !== true) {
      errors.push(issue('E_LEARNING_HOLDOUT_BLINDING', `${at}.holdout_blinded`, 'holdout answers must remain hidden from the candidate author'));
    }
    if (!(learning.holdout_context_refs || []).includes(fold.holdout_context_ref)) {
      errors.push(issue('E_LEARNING_HOLDOUT_CONTEXT', `${at}.holdout_context_ref`, 'fold holdout context must be registered in the frozen hidden-context list'));
    }
    for (const id of training) {
      if (!positiveSet.has(id)) errors.push(issue('E_LEARNING_FOLD_CASE', `${at}.training_case_ids`, `${id} is not a positive case`));
      if (holdout.has(id)) errors.push(issue('E_LEARNING_CASE_LEAKAGE', at, `${id} appears in both training and holdout`));
    }
    for (const id of holdout) {
      if (!positiveSet.has(id)) errors.push(issue('E_LEARNING_FOLD_CASE', `${at}.holdout_case_ids`, `${id} is not a positive case`));
      holdoutCoverage.add(id);
    }
    const baselineEvidence = validateLearningBoundRef(ledger, fold.baseline_evidence_ref, `${at}.baseline_evidence_ref`, errors, {
      candidateHash: learning.target_hash,
      stage: 'fold_baseline',
      subjectId: fold.id,
      variant: 'baseline',
      producerId: fold.evaluator_delegation_id
    });
    const candidateEvidence = validateLearningBoundRef(ledger, fold.candidate_evidence_ref, `${at}.candidate_evidence_ref`, errors, {
      candidateHash: learning.target_hash,
      stage: 'fold_candidate',
      subjectId: fold.id,
      variant: 'candidate',
      producerId: fold.evaluator_delegation_id
    });
    validateLearningBoundRef(ledger, fold.oracle_evidence_ref, `${at}.oracle_evidence_ref`, errors, {
      candidateHash: learning.target_hash,
      stage: 'fold_oracle',
      subjectId: fold.id,
      variant: 'oracle',
      producerId: fold.evaluator_delegation_id
    });
    if (fold.baseline_evidence_ref === fold.candidate_evidence_ref) {
      errors.push(issue('E_LEARNING_BASELINE_ALIAS', at, 'baseline and candidate must have distinct observed evidence'));
    }
    if (candidateFoldRefs.has(fold.candidate_evidence_ref)) {
      errors.push(issue('E_LEARNING_FOLD_EVIDENCE_REUSE', `${at}.candidate_evidence_ref`, 'each hidden holdout fold requires distinct candidate evidence'));
    }
    candidateFoldRefs.add(fold.candidate_evidence_ref);
    if (oracleFoldRefs.has(fold.oracle_evidence_ref)) {
      errors.push(issue('E_LEARNING_ORACLE_REUSE', `${at}.oracle_evidence_ref`, 'each hidden holdout fold requires distinct oracle evidence'));
    }
    oracleFoldRefs.add(fold.oracle_evidence_ref);
    const baselineMeasurement = baselineEvidence.value?.measurement;
    const candidateMeasurement = candidateEvidence.value?.measurement;
    if (!baselineMeasurement || baselineMeasurement.metric !== fold.metric || baselineMeasurement.unit !== fold.unit || baselineMeasurement.value !== fold.baseline_score
        || !candidateMeasurement || candidateMeasurement.metric !== fold.metric || candidateMeasurement.unit !== fold.unit || candidateMeasurement.value !== fold.candidate_score) {
      errors.push(issue('E_LEARNING_MEASUREMENT_BINDING', at, 'fold scores must match observed baseline and candidate measurements for the declared metric'));
    }
    const delta = fold.candidate_score - fold.baseline_score;
    const derivedComparison = fold.direction === 'lower_is_better'
      ? (delta < -fold.tolerance ? 'improved' : (delta <= fold.tolerance ? 'non_inferior' : 'regressed'))
      : (delta > fold.tolerance ? 'improved' : (delta >= -fold.tolerance ? 'non_inferior' : 'regressed'));
    if (fold.comparison !== derivedComparison) {
      errors.push(issue('E_LEARNING_COMPARISON_DERIVATION', `${at}.comparison`, `declared comparison disagrees with measured ${fold.metric} scores`));
    }
    if (derivedComparison === 'regressed') errors.push(issue('E_LEARNING_OVERFIT', `${at}.comparison`, 'a regressed holdout fold blocks promotion'));
    if (derivedComparison === 'improved') improved = true;
    const evaluator = delegations.get(fold.evaluator_delegation_id);
    if (!evaluator || evaluator.role !== 'learning_evaluator' || !evaluator.read_only || evaluator.status !== 'completed') {
      errors.push(issue('E_LEARNING_EVALUATOR', `${at}.evaluator_delegation_id`, 'fold evaluator must be a completed read-only learning_evaluator delegation'));
    }
    if (evaluator && !(evaluator.check_evidence_refs || []).includes(fold.candidate_evidence_ref)) {
      errors.push(issue('E_LEARNING_EVALUATOR_EVIDENCE', `${at}.candidate_evidence_ref`, 'candidate holdout evidence must be returned by the declared evaluator'));
    }
    if (evaluator && !(evaluator.check_evidence_refs || []).includes(fold.baseline_evidence_ref)) {
      errors.push(issue('E_LEARNING_EVALUATOR_EVIDENCE', `${at}.baseline_evidence_ref`, 'baseline holdout evidence must be returned by the same blind evaluator'));
    }
    if (evaluator && !(evaluator.check_evidence_refs || []).includes(fold.oracle_evidence_ref)) {
      errors.push(issue('E_LEARNING_EVALUATOR_EVIDENCE', `${at}.oracle_evidence_ref`, 'holdout oracle evidence must be returned by the declared evaluator'));
    }
    if (evaluator && !(evaluator.context_refs || []).includes(fold.holdout_context_ref)) {
      errors.push(issue('E_LEARNING_EVALUATOR_CONTEXT', `${at}.holdout_context_ref`, 'the declared evaluator must receive the fold holdout context'));
    }
    if (fold.evaluator_delegation_id === learning.proposal_origin_delegation_id) {
      errors.push(issue('E_LEARNING_SELF_EVALUATION', `${at}.evaluator_delegation_id`, 'candidate author cannot evaluate its own fold'));
    }
    const candidateOrigin = delegations.get(learning.proposal_origin_delegation_id);
    if (evaluator && candidateOrigin && (evaluator.task_id === candidateOrigin.task_id || evaluator.session_id === candidateOrigin.session_id)) {
      errors.push(issue('E_LEARNING_EVALUATOR_INDEPENDENCE', `${at}.evaluator_delegation_id`, 'candidate author and blind evaluator require distinct task and session identities'));
    }
  });

  const origin = delegations.get(learning.proposal_origin_delegation_id);
  if (profiles.has('background_learning') && (!origin || origin.role !== 'learning_candidate' || !origin.read_only
      || !(origin.granted_authority || []).includes('memory_propose') || (origin.proposal_evidence_refs || []).length === 0)) {
    errors.push(issue('E_LEARNING_CANDIDATE_DELEGATION', '$.learning_evidence.proposal_origin_delegation_id', 'background proposal origin must be a read-only learning_candidate delegation'));
  }
  if (origin && (origin.proposal_evidence_refs || []).length > 0) {
    validateLearningBoundRef(ledger, origin.proposal_evidence_refs[0], '$.learning_evidence.proposal_origin_delegation_id', errors, {
      candidateHash: learning.target_hash,
      stage: 'proposal',
      subjectId: learning.candidate_id,
      variant: 'candidate',
      producerId: origin.id
    });
  }
  const hiddenContexts = new Set(learning.holdout_context_refs || []);
  const leakedOriginContext = (origin?.context_refs || []).find((ref) => hiddenContexts.has(ref)
    || /(?:holdout|expected[-_ ]?answer|answer[-_ ]?key|oracle)/i.test(ref));
  if (leakedOriginContext) {
    errors.push(issue('E_LEARNING_HOLDOUT_LEAKAGE', '$.learning_evidence.proposal_origin_delegation_id', `candidate context exposes hidden evaluation material: ${leakedOriginContext}`));
  }

  const validateCaseGroup = (ids, expectedKind, code, at) => {
    for (const id of ids || []) {
      const entry = byCase.get(id);
      if (!entry || entry.kind !== expectedKind) errors.push(issue(code, at, `${id} is not a ${expectedKind} case`));
      else if (entry.result !== 'pass') errors.push(issue(code, at, `${id} did not pass`));
    }
  };
  validateCaseGroup(learning.negative_control_case_ids, 'negative_control', 'E_LEARNING_NEGATIVE_CONTROL', '$.learning_evidence.negative_control_case_ids');
  validateCaseGroup(learning.invariant_case_ids, 'invariant', 'E_LEARNING_INVARIANT', '$.learning_evidence.invariant_case_ids');

  const complexity = learning.complexity || {};
  const complexityBaselineEvidence = validateLearningBoundRef(
    ledger, complexity.baseline_evidence_ref, '$.learning_evidence.complexity.baseline_evidence_ref', errors,
    { candidateHash: learning.target_hash, stage: 'complexity_baseline', subjectId: learning.candidate_id, variant: 'baseline', producerId: 'parent' }
  );
  const complexityCandidateEvidence = validateLearningBoundRef(
    ledger, complexity.candidate_evidence_ref, '$.learning_evidence.complexity.candidate_evidence_ref', errors,
    { candidateHash: learning.target_hash, stage: 'complexity_candidate', subjectId: learning.candidate_id, variant: 'candidate', producerId: 'parent' }
  );
  if (complexity.baseline_evidence_ref === complexity.candidate_evidence_ref) {
    errors.push(issue('E_LEARNING_COMPLEXITY_EVIDENCE', '$.learning_evidence.complexity', 'baseline and candidate complexity require distinct evidence'));
  }
  const baselineComplexityMeasurement = complexityBaselineEvidence.value?.measurement;
  const candidateComplexityMeasurement = complexityCandidateEvidence.value?.measurement;
  if (!baselineComplexityMeasurement || baselineComplexityMeasurement.metric !== 'candidate-complexity'
      || baselineComplexityMeasurement.unit !== complexity.unit || baselineComplexityMeasurement.value !== complexity.baseline
      || !candidateComplexityMeasurement || candidateComplexityMeasurement.metric !== 'candidate-complexity'
      || candidateComplexityMeasurement.unit !== complexity.unit || candidateComplexityMeasurement.value !== complexity.candidate) {
    errors.push(issue('E_LEARNING_COMPLEXITY_EVIDENCE', '$.learning_evidence.complexity', 'complexity values must match bound observed measurements'));
  }
  if (Number.isInteger(complexity.candidate) && Number.isInteger(complexity.baseline)
      && Number.isInteger(complexity.max_delta) && complexity.candidate - complexity.baseline > complexity.max_delta) {
    errors.push(issue('E_LEARNING_COMPLEXITY', '$.learning_evidence.complexity', 'candidate exceeds the declared complexity delta'));
  }
  validateLearningBoundRef(ledger, learning.rollback?.evidence_ref, '$.learning_evidence.rollback.evidence_ref', errors, {
    candidateHash: learning.target_hash,
    stage: 'rollback',
    subjectId: learning.candidate_id,
    variant: 'rollback',
    producerId: 'parent'
  });

  const contexts = Array.isArray(ledger.external_context_evidence) ? ledger.external_context_evidence : [];
  for (const sourceId of learning.source_context_ids || []) {
    const source = contexts.find((entry) => entry.source_id === sourceId);
    if (!source) errors.push(issue('E_LEARNING_SOURCE_CONTEXT', '$.learning_evidence.source_context_ids', `unknown source context: ${sourceId}`));
    else if (learning.state === 'active' && (source.freshness !== 'current' || source.claim_status !== 'verified' || source.unresolved !== null)) {
      errors.push(issue('E_LEARNING_STALE_SOURCE', '$.learning_evidence.source_context_ids', `${sourceId} is not current, verified, and resolved`));
    }
  }

  const shadow = learning.shadow || {};
  const shadowObservations = Array.isArray(shadow.observations) ? shadow.observations : [];
  pushDuplicateIdErrors(shadowObservations, '$.learning_evidence.shadow.observations', errors);
  const shadowTasks = new Set();
  const shadowSessions = new Set();
  const shadowFingerprints = new Set();
  const shadowEvidenceRefs = new Set();
  const shadowSourceHashes = new Set();
  const caseTaskIds = new Set(cases.map((entry) => entry.task_id));
  const caseSessionIds = new Set(cases.map((entry) => entry.session_id));
  let observedShadowSuccesses = 0;
  let observedShadowFailures = 0;
  shadowObservations.forEach((observation, index) => {
    const at = `$.learning_evidence.shadow.observations[${index}]`;
    if (!observation || typeof observation !== 'object' || Array.isArray(observation)) return;
    if (shadowTasks.has(observation.task_id) || shadowSessions.has(observation.session_id)
        || shadowFingerprints.has(observation.input_fingerprint) || shadowEvidenceRefs.has(observation.evidence_ref)
        || shadowSourceHashes.has(observation.source_ledger_hash) || sourceLedgerHashes.has(observation.source_ledger_hash)
        || caseTaskIds.has(observation.task_id) || caseSessionIds.has(observation.session_id)
        || fingerprints.has(observation.input_fingerprint)) {
      errors.push(issue('E_LEARNING_SHADOW_INDEPENDENCE', at, 'shadow observations require new distinct source ledgers, tasks, sessions, fingerprints, and evidence'));
    }
    shadowTasks.add(observation.task_id);
    shadowSessions.add(observation.session_id);
    shadowFingerprints.add(observation.input_fingerprint);
    shadowEvidenceRefs.add(observation.evidence_ref);
    shadowSourceHashes.add(observation.source_ledger_hash);
    validateSourceLedgerSnapshot(observation, at, errors);
    if (observation.observed_at !== observation.source_ledger_snapshot?.observed_at
        || Date.parse(observation.observed_at) <= Date.parse(learning.candidate_frozen_at)
        || (ledger.created_at && Date.parse(observation.observed_at) > Date.parse(ledger.created_at))) {
      errors.push(issue('E_LEARNING_SHADOW_TIME', `${at}.observed_at`, 'shadow observation must occur after candidate freeze and no later than ledger completion'));
    }
    if (Date.parse(observation.observed_at) > nowMs + maxClockSkewMs) {
      errors.push(issue('E_LEARNING_FUTURE_TIME', `${at}.observed_at`, 'shadow observation exceeds the trusted validation clock'));
    }
    validateLearningBoundRef(ledger, observation.evidence_ref, `${at}.evidence_ref`, errors, {
      candidateHash: learning.target_hash,
      stage: 'shadow',
      subjectId: observation.id,
      variant: 'shadow',
      producerId: 'parent',
      passing: observation.result === 'pass'
    });
    if (observation.result === 'pass') observedShadowSuccesses += 1;
    if (observation.result === 'fail') observedShadowFailures += 1;
  });
  if (shadow.observed_successes !== observedShadowSuccesses || shadow.observed_failures !== observedShadowFailures) {
    errors.push(issue('E_LEARNING_SHADOW_COUNT', '$.learning_evidence.shadow', 'shadow counters must equal the recorded observation results'));
  }
  if (learning.state === 'shadow') {
    if (positiveIds.length === 0 || (learning.kind !== 'checklist' && positiveIds.length < 2)) {
      errors.push(issue('E_LEARNING_SINGLE_CASE_PROMOTION', '$.learning_evidence.kind', 'one case may shadow only a narrow checklist'));
    }
    if (!shadow.required || !shadow.expires_at || !['running', 'pass'].includes(shadow.status)) {
      errors.push(issue('E_LEARNING_SHADOW_BOUNDARY', '$.learning_evidence.shadow', 'shadow state requires a bounded running/passing window and expiry'));
    }
    if (ledger.created_at && shadow.expires_at && Date.parse(shadow.expires_at) <= Date.parse(ledger.created_at)) {
      errors.push(issue('E_LEARNING_SHADOW_EXPIRY', '$.learning_evidence.shadow.expires_at', 'shadow expiry must follow ledger creation'));
    }
  }

  if (learning.state === 'active') {
    const positiveCases = positiveIds.map((id) => byCase.get(id));
    if (!ledger.created_at) {
      errors.push(issue('E_LEARNING_LEDGER_TIME', '$.created_at', 'active learning requires a completed ledger timestamp'));
    } else if (Date.parse(learning.candidate_frozen_at) > Date.parse(ledger.created_at)) {
      errors.push(issue('E_LEARNING_FREEZE_TIME', '$.learning_evidence.candidate_frozen_at', 'candidate freeze cannot occur after the completed ledger was created'));
    }
    if (positiveCases.length < 2 || new Set(positiveCases.map((entry) => entry.task_id)).size < 2
        || new Set(positiveCases.map((entry) => entry.session_id)).size < 2
        || new Set(positiveCases.map((entry) => entry.task_family)).size < 2) {
      errors.push(issue('E_LEARNING_INDEPENDENCE', '$.learning_evidence.cases', 'active promotion requires at least two distinct tasks, sessions, and task families'));
    }
    if (positiveCases.length <= 4) {
      for (const fold of folds) {
        const expectedHoldout = fold.holdout_case_ids || [];
        const expectedTraining = positiveIds.filter((id) => !expectedHoldout.includes(id));
        if (expectedHoldout.length !== 1 || !arraysEqual(fold.training_case_ids || [], expectedTraining, String)) {
          errors.push(issue('E_LEARNING_LEAVE_ONE_OUT', '$.learning_evidence.folds', 'two to four cases require exact leave-one-case-out folds'));
        }
      }
      if (folds.length !== positiveCases.length) {
        errors.push(issue('E_LEARNING_LEAVE_ONE_OUT', '$.learning_evidence.folds', 'exact leave-one-case-out requires one fold per positive case'));
      }
    }
    if (folds.length === 0 || positiveIds.some((id) => !holdoutCoverage.has(id))) {
      errors.push(issue('E_LEARNING_HOLDOUT_COVERAGE', '$.learning_evidence.folds', 'every positive case must appear in a hidden holdout at least once'));
    }
    if (!improved) errors.push(issue('E_LEARNING_UNDERFIT', '$.learning_evidence.folds', 'candidate must improve at least one fold rather than merely restating the baseline'));
    if ((learning.negative_control_case_ids || []).length === 0) errors.push(issue('E_LEARNING_NEGATIVE_CONTROL', '$.learning_evidence.negative_control_case_ids', 'active promotion requires a near-neighbor negative control'));
    if ((learning.invariant_case_ids || []).length === 0) errors.push(issue('E_LEARNING_INVARIANT', '$.learning_evidence.invariant_case_ids', 'active promotion requires zero-tolerance invariant evidence'));
    if (learning.generalization_verdict !== 'pass' || learning.stale) {
      errors.push(issue('E_LEARNING_GENERALIZATION_GATE', '$.learning_evidence', 'active promotion requires a passing, current generalization verdict'));
    }
    if (!(ledger.parent_authority || []).includes('memory_promote')) {
      errors.push(issue('E_LEARNING_PROMOTION_AUTHORITY', '$.parent_authority', 'active promotion requires explicit memory_promote authority'));
    }
    errors.push(...validateRepoPath(learning.target, '$.learning_evidence.target'));
    if (!ledger.files_touched.includes(learning.target)) {
      errors.push(issue('E_LEARNING_TARGET_NOT_APPLIED', '$.learning_evidence.target', 'active promotion requires the frozen target to be recorded in files_touched'));
    }
    const packageRoot = path.resolve(__dirname, '..', '..');
    const targetPath = path.resolve(packageRoot, learning.target);
    if (!targetPath.startsWith(`${packageRoot}${path.sep}`) || !fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
      errors.push(issue('E_LEARNING_TARGET_HASH', '$.learning_evidence.target', 'active promotion target must resolve to a file in the installed ZeroToHero package'));
    } else {
      const actualHash = `sha256:${sha256(fs.readFileSync(targetPath))}`;
      if (actualHash !== learning.target_hash) {
        errors.push(issue('E_LEARNING_TARGET_HASH', '$.learning_evidence.target_hash', 'frozen candidate hash does not match the applied target bytes'));
      }
    }
    if (!learning.activation_evidence_ref) {
      errors.push(issue('E_LEARNING_ACTIVATION_EVIDENCE', '$.learning_evidence.activation_evidence_ref', 'active promotion requires observed activation evidence'));
    } else {
      validateLearningBoundRef(ledger, learning.activation_evidence_ref, '$.learning_evidence.activation_evidence_ref', errors, {
        candidateHash: learning.target_hash,
        stage: 'activation',
        subjectId: learning.candidate_id,
        variant: 'activation',
        producerId: 'parent'
      });
    }
    if (learning.approval?.status !== 'approved' || !learning.approval?.approved_by) {
      errors.push(issue('E_LEARNING_APPROVAL', '$.learning_evidence.approval', 'active promotion requires explicit parent/user approval'));
    }
    if (!shadow.required || shadow.status !== 'pass' || shadow.required_successes < 3
        || shadow.observed_successes < shadow.required_successes || shadow.observed_failures !== 0) {
      errors.push(issue('E_LEARNING_SHADOW_GATE', '$.learning_evidence.shadow', 'active promotion requires at least three passing shadow observations and zero failures'));
    }
    if (shadowObservations.length < shadow.observed_successes) {
      errors.push(issue('E_LEARNING_SHADOW_EVIDENCE', '$.learning_evidence.shadow.observations', 'each passing shadow observation requires distinct observed evidence'));
    }
    if (positiveCases.some((entry) => entry.result !== 'pass')) {
      errors.push(issue('E_LEARNING_TRAINING_FAILURE', '$.learning_evidence.cases', 'failing positive cases indicate underfitting and block promotion'));
    }
  }
}

function validateIterationEvidence(ledger, errors) {
  const iterations = Array.isArray(ledger.iteration_evidence) ? ledger.iteration_evidence : [];
  const cycles = new Set();
  iterations.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
    const at = `$.iteration_evidence[${index}]`;
    if (cycles.has(entry.cycle)) errors.push(issue('E_ITERATION_CYCLE_DUPLICATE', `${at}.cycle`, 'iteration cycle must be unique'));
    cycles.add(entry.cycle);
    (entry.evidence_refs || []).forEach((ref, refIndex) => validateObservedRef(
      ledger, ref, `${at}.evidence_refs[${refIndex}]`, errors, { code: 'E_ITERATION_EVIDENCE', passing: entry.verdict === 'pass' }
    ));
    if (entry.verdict === 'pass' && (!entry.evidence_refs || entry.evidence_refs.length === 0)) {
      errors.push(issue('E_ITERATION_EVIDENCE', `${at}.evidence_refs`, 'a passing cycle requires observed evidence references'));
    }
  });
  const ordered = [...cycles].sort((a, b) => a - b);
  if (ordered.some((cycle, index) => cycle !== index + 1)) {
    errors.push(issue('E_ITERATION_CYCLE_ORDER', '$.iteration_evidence', 'iteration cycles must be contiguous from one'));
  }
}

function validateRemoteProfiles(ledger, rowIds, errors) {
  const profiles = new Set(ledger.profiles);
  const remoteProfile = profiles.has('remote_stateful') || profiles.has('openwrt');
  const remote = ledger.remote_stateful_evidence;
  if (profiles.has('openwrt')) {
    const rowsByKind = new Map(ledger.acceptance.rows.map((row) => [row.kind, row]));
    for (const requiredKind of ['functional', 'negative_control', 'lifecycle', 'rollback', 'management_path']) {
      if (!rowsByKind.has(requiredKind)) {
        errors.push(issue('E_OPENWRT_ACCEPTANCE_KIND', '$.acceptance.rows', `OpenWrt requires a ${requiredKind} acceptance row`));
      }
    }
    if (ledger.phase === 'execute' && ledger.decision === 'complete') {
      const requiredRows = ['functional', 'negative_control', 'lifecycle', 'rollback', 'management_path']
        .map((kind) => rowsByKind.get(kind)).filter(Boolean);
      const checkIds = requiredRows.map((row) => row.check_id);
      const refs = requiredRows.map((row) => row.evidence_ref);
      if (new Set(checkIds).size !== requiredRows.length || new Set(refs).size !== requiredRows.length) {
        errors.push(issue('E_OPENWRT_DISTINCT_EVIDENCE', '$.acceptance.rows', 'OpenWrt functional, negative, lifecycle, rollback, and management rows require distinct checks and evidence references'));
      }
      for (const row of requiredRows) {
        validateSubstantive(row.requirement, `$.acceptance.rows.${row.kind}.requirement`, errors, { minLength: 12 });
        validateSubstantive(row.observable, `$.acceptance.rows.${row.kind}.observable`, errors, { minLength: 12 });
      }
    }
  }
  if (remoteProfile && ledger.phase === 'execute' && ledger.decision === 'complete') {
    if (!remote || !remote.applies) {
      errors.push(issue('E_REMOTE_PROFILE_EVIDENCE', '$.remote_stateful_evidence', 'completed remote execution requires applies=true and observed evidence'));
      return;
    }
  }
  if (!remote || !remote.applies) return;

  const baseFields = [
    'baseline_state_captured',
    'management_path_protected',
    'backup_or_rollback_point',
    'syntax_or_dry_run_check',
    'services_restarted_or_not',
    'runtime_status_after_change',
    'internal_hop_verification',
    'external_client_verification',
    'negative_controls_verified',
    'resource_ownership_verified',
    'lifecycle_restart_verification',
    'rollback_verified',
    'secrets_redacted'
  ];
  for (const field of baseFields) {
    validateSubstantive(remote[field], `$.remote_stateful_evidence.${field}`, errors, {
      noNotApplicable: profiles.has('openwrt'),
      minLength: profiles.has('openwrt') ? 12 : 1
    });
  }

}

function validateExternalContext(ledger, rowIds, errors) {
  const entries = ledger.external_context_evidence || [];
  if (ledger.profiles.includes('external_context') && entries.length === 0) {
    errors.push(issue('E_EXTERNAL_EVIDENCE_MISSING', '$.external_context_evidence', 'external_context profile requires at least one versioned evidence record'));
  }
  if (entries.length > 0 && !ledger.profiles.includes('external_context')) {
    errors.push(issue('E_PROFILE_MISSING', '$.profiles', 'external_context_evidence requires the external_context profile'));
  }
  entries.forEach((entry, index) => {
    const at = `$.external_context_evidence[${index}]`;
    if (typeof entry.version === 'string' && /^(?:latest|current|unversioned|unknown)$/i.test(entry.version.trim())) {
      errors.push(issue('E_EXTERNAL_VERSION_UNPINNED', `${at}.version`, 'record the observed installed/tagged version, not latest/current/unknown'));
    }
    const basis = entry.freshness_basis;
    if (basis && typeof basis === 'object' && !Array.isArray(basis)) {
      const unknownBasis = basis.kind === 'unknown';
      const concreteValue = !isAmbiguousFreshnessBasis(basis.value);
      if ((unknownBasis && basis.value !== null) || (!unknownBasis && !concreteValue)) {
        errors.push(issue('E_EXTERNAL_FRESHNESS_BASIS', `${at}.freshness_basis`, 'unknown basis requires value=null; every other basis requires a concrete version, tag, page, commit, or timestamp'));
      }
      if (basis.kind === 'update_timestamp' && concreteValue && !isStrictRfc3339(basis.value)) {
        errors.push(issue('E_EXTERNAL_FRESHNESS_BASIS', `${at}.freshness_basis.value`, 'update_timestamp basis must be a strict RFC3339 timestamp'));
      }
      if (entry.freshness === 'current' && (unknownBasis || !concreteValue)) {
        errors.push(issue('E_EXTERNAL_FRESHNESS_BASIS', `${at}.freshness_basis`, 'freshness=current requires a concrete non-unknown basis; latest/current/unversioned/unknown are not evidence'));
      }
    }
    validateSubstantive(entry.evidence, `${at}.evidence`, errors);
    if (entry.acceptance_row_id !== null && !rowIds.has(entry.acceptance_row_id)) {
      errors.push(issue('E_EXTERNAL_ACCEPTANCE_REF', `${at}.acceptance_row_id`, 'references an unknown acceptance row'));
    }
    if (entry.required_for_acceptance && entry.acceptance_row_id === null) {
      errors.push(issue('E_EXTERNAL_ACCEPTANCE_REF', `${at}.acceptance_row_id`, 'required external context must reference an acceptance row'));
    }
    if (entry.claim_status === 'verified' && (entry.freshness !== 'current' || entry.unresolved !== null)) {
      errors.push(issue('E_EXTERNAL_VERIFIED_CONTRADICTION', at, 'verified external context must be current and have unresolved=null'));
    }
    if (entry.required_for_acceptance && entry.claim_status !== 'verified' && ledger.decision === 'complete') {
      errors.push(issue('E_EXTERNAL_REQUIRED_UNVERIFIED', at, 'a required external claim is still unverified and blocks completion'));
    }
  });
}

function validateContinuation(ledger, claimIds, errors) {
  const continuation = ledger.continuation;
  if (!continuation) return;
  if (!ledger.profiles.includes('continuation')) {
    errors.push(issue('E_PROFILE_MISSING', '$.profiles', 'continuation block requires the continuation profile'));
  }
  if (ledger.decision === 'complete') {
    errors.push(issue('E_COMPLETE_WITH_CONTINUATION', '$.continuation', 'completed work cannot carry an active continuation'));
  }
  if (continuation.task_id !== ledger.task_id) {
    errors.push(issue('E_CONTINUATION_TASK', '$.continuation.task_id', 'must match the ledger task_id'));
  }
  for (const claimId of continuation.verified_claim_ids) {
    if (!claimIds.has(claimId)) {
      errors.push(issue('E_CONTINUATION_CLAIM', '$.continuation.verified_claim_ids', `unknown verified claim id: ${claimId}`));
    }
  }
  const touched = new Set(ledger.files_touched.map(normalizePath));
  for (const file of continuation.files_touched) {
    if (!touched.has(normalizePath(file))) {
      errors.push(issue('E_CONTINUATION_SCOPE', '$.continuation.files_touched', `${file} is not present in the ledger files_touched evidence`));
    }
  }

  const check = resolveJsonPointer(ledger, continuation.last_check.evidence_ref);
  if (!check || check.id !== continuation.last_check.command_id || check.result !== continuation.last_check.result) {
    errors.push(issue('E_CONTINUATION_EVIDENCE_REF', '$.continuation.last_check', 'must resolve to the recorded command id and result'));
  }

  const expectedSupersedes = continuation.generation === 1
    ? null
    : `${ledger.task_id}:${continuation.generation - 1}`;
  if (continuation.supersedes !== expectedSupersedes) {
    errors.push(issue('E_CONTINUATION_GENERATION', '$.continuation.supersedes', `must equal ${JSON.stringify(expectedSupersedes)}`));
  }

  const rehydration = continuation.rehydration;
  if (rehydration) {
    const rootMatches = normalizeRepoRoot(rehydration.actual_repo_root) === normalizeRepoRoot(continuation.repo_root);
    const revisionMatches = rehydration.actual_base_revision === continuation.base_revision;
    const fingerprintMatches = rehydration.actual_worktree_fingerprint === continuation.worktree_fingerprint;
    const computedMatch = rootMatches && revisionMatches && fingerprintMatches;
    if (rehydration.match !== computedMatch) {
      errors.push(issue('E_CONTINUATION_MATCH_FALSE_CLAIM', '$.continuation.rehydration.match', 'does not equal the repository/revision/fingerprint comparison'));
    }
  }

  if (continuation.next_action_type === 'write') {
    if (ledger.mode !== 'execute' || !ledger.write_authorized) {
      errors.push(issue('E_CONTINUATION_WRITE_AUTHORITY', '$.continuation.next_action_type', 'a resumed write requires execute mode and explicit write authority'));
    }
    if (!rehydration || !rehydration.match) {
      errors.push(issue('E_CONTINUATION_STALE', '$.continuation.rehydration', 'a resumed write requires a current, matching rehydration check'));
    }
  }
}

function validateLedger(ledger, options = {}) {
  const errors = [];
  validateNode(ledger, schema, '$', schema, errors);
  const usable = ledger && typeof ledger === 'object'
    && ledger.scope && typeof ledger.scope === 'object'
    && ledger.acceptance && typeof ledger.acceptance === 'object'
    && Array.isArray(ledger.scope.allowed_read)
    && Array.isArray(ledger.scope.allowed_network_read)
    && Array.isArray(ledger.scope.allowed_touch)
    && Array.isArray(ledger.acceptance.required_checks)
    && Array.isArray(ledger.acceptance.required_claim_ids)
    && Array.isArray(ledger.acceptance.rows)
    && Array.isArray(ledger.profiles)
    && Array.isArray(ledger.files_read)
    && Array.isArray(ledger.files_touched)
    && Array.isArray(ledger.commands_run)
    && Array.isArray(ledger.verified_claims)
    && Array.isArray(ledger.scope_violations)
    && Array.isArray(ledger.context_budget_violations);
  if (!usable) return errors;

  const caseSensitive = ledger.scope.case_sensitive;
  for (const [field, allowGlob] of [
    ['files_read', false],
    ['files_touched', false],
    ['scope.allowed_read', true],
    ['scope.allowed_touch', true]
  ]) {
    const entries = field.startsWith('scope.') ? ledger.scope[field.split('.')[1]] : ledger[field];
    const seen = new Set();
    entries.forEach((entry, index) => {
      errors.push(...validateRepoPath(entry, `$.${field}[${index}]`, { allowGlob }));
      const normalized = caseSensitive ? normalizePath(entry) : normalizePath(entry).toLowerCase();
      if (seen.has(normalized)) errors.push(issue('E_PATH_DUPLICATE', `$.${field}[${index}]`, 'duplicates another normalized path'));
      seen.add(normalized);
    });
  }

  for (const read of ledger.files_read) {
    if (!pathMatchesAny(read, ledger.scope.allowed_read, caseSensitive)) {
      errors.push(issue('E_LEDGER_SCOPE_READ', '$.files_read', `${read} is outside ledger.scope.allowed_read`));
    }
  }
  const networkScopes = new Set();
  ledger.scope.allowed_network_read.forEach((resource, index) => {
    try {
      const url = new URL(resource);
      if (url.username || url.password) {
        errors.push(issue('E_NETWORK_SCOPE_CREDENTIAL', `$.scope.allowed_network_read[${index}]`, 'network scope URLs cannot embed credentials'));
      }
      const canonical = url.href;
      if (networkScopes.has(canonical)) {
        errors.push(issue('E_NETWORK_SCOPE_DUPLICATE', `$.scope.allowed_network_read[${index}]`, 'duplicates another normalized network scope'));
      }
      networkScopes.add(canonical);
    } catch {
      errors.push(issue('E_NETWORK_SCOPE_URL', `$.scope.allowed_network_read[${index}]`, 'network scope must be an absolute HTTP(S) URL'));
    }
  });
  for (const touched of ledger.files_touched) {
    if (!pathMatchesAny(touched, ledger.scope.allowed_touch, caseSensitive)) {
      errors.push(issue('E_LEDGER_SCOPE_TOUCH', '$.files_touched', `${touched} is outside ledger.scope.allowed_touch`));
    }
  }

  pushDuplicateIdErrors(ledger.commands_run, '$.commands_run', errors);
  pushDuplicateIdErrors(ledger.verified_claims, '$.verified_claims', errors);
  ledger.commands_run.forEach((entry, index) => validateCheckRecord(entry, index, errors));
  ledger.verified_claims.forEach((claim, index) => {
    validateSubstantive(claim.evidence, `$.verified_claims[${index}].evidence`, errors);
    if (claim.provenance !== 'observed') {
      errors.push(issue('E_CLAIM_UNOBSERVED', `$.verified_claims[${index}].provenance`, 'verified claims require observed provenance'));
    }
    if (claim.evidence_refs.length === 0) {
      errors.push(issue('E_CLAIM_WITHOUT_REF', `$.verified_claims[${index}].evidence_refs`, 'verified claims require at least one resolvable evidence reference'));
    }
    for (const ref of claim.evidence_refs) {
      if (resolveJsonPointer(ledger, ref) === undefined) {
        errors.push(issue('E_EVIDENCE_REF', `$.verified_claims[${index}].evidence_refs`, `dangling evidence reference: ${ref}`));
      }
    }
  });
  validateDeferredItems(ledger, errors);
  validateDelegations(ledger, errors, options);
  validateLearning(ledger, errors, options);
  validateIterationEvidence(ledger, errors);

  const passedCommands = ledger.commands_run.filter((entry) => entry.result === 'pass' && entry.provenance === 'observed');
  const failedCommands = ledger.commands_run.filter((entry) => entry.result === 'fail');
  if (ledger.result === 'pass') {
    if (passedCommands.length === 0) errors.push(issue('E_PASS_WITHOUT_CHECK', '$.commands_run', 'pass requires at least one observed passing check'));
    if (failedCommands.length > 0) errors.push(issue('E_PASS_WITH_FAILED_CHECK', '$.commands_run', 'pass cannot contain a failed check'));
    if (ledger.verified_claims.length === 0) errors.push(issue('E_PASS_WITHOUT_CLAIM', '$.verified_claims', 'pass requires at least one evidenced claim'));
  }
  if (ledger.decision === 'complete' && ledger.result !== 'pass') {
    errors.push(issue('E_COMPLETE_WITHOUT_PASS', '$.decision', 'complete requires result=pass'));
  }
  if (ledger.decision === 'complete' && (ledger.scope_violations.length > 0 || ledger.context_budget_violations.length > 0)) {
    errors.push(issue('E_COMPLETE_WITH_VIOLATION', '$.decision', 'complete is forbidden while any scope/context violation is recorded'));
  }
  if (ledger.mode === 'report_only' && (ledger.write_authorized || ledger.files_touched.length > 0)) {
    errors.push(issue('E_REPORT_ONLY_WRITE', '$.mode', 'report_only requires write_authorized=false and no touched files'));
  }
  if (ledger.mode === 'execute' && ledger.files_touched.length > 0 && !ledger.write_authorized) {
    errors.push(issue('E_WRITE_WITHOUT_AUTHORITY', '$.write_authorized', 'touched files require explicit write authority'));
  }
  if (ledger.phase === 'plan' && (ledger.mode !== 'report_only' || ledger.write_authorized || ledger.files_touched.length > 0)) {
    errors.push(issue('E_PLAN_WRITE', '$.phase', 'plan phase is report-only, unauthorized for writes, and must have no touched files'));
  }

  const { claimIds, rowIds } = validateAcceptance(ledger, errors);
  validateDebugRoute(ledger, errors);
  validateRemoteProfiles(ledger, rowIds, errors);
  validateExternalContext(ledger, rowIds, errors);
  validateContinuation(ledger, claimIds, errors);

  if (ledger.route === 'incident' && ledger.decision === 'complete') {
    if (!ledger.incident_evidence) {
      errors.push(issue('E_INCIDENT_EVIDENCE', '$.incident_evidence', 'completed incident route requires OBSERVE/CONTAIN/RESTORE/REPAIR/LEARN evidence'));
    } else {
      for (const field of ['observe', 'contain', 'restore', 'repair', 'learn']) {
        validateSubstantive(ledger.incident_evidence[field], `$.incident_evidence.${field}`, errors);
      }
    }
  }

  if (ledger.profiles.includes('self_iteration') && ledger.decision === 'complete') {
    const iterations = ledger.iteration_evidence || [];
    if (iterations.length === 0 || iterations.some((entry) => entry.verdict !== 'pass')) {
      errors.push(issue('E_ITERATION_EVIDENCE', '$.iteration_evidence', 'self-iteration completion requires observed passing cycles'));
    }
  }

  return errors;
}

function normalizeCheckDefinition(entry, index, matrix = []) {
  if (typeof entry === 'string') {
    const command = normalizeCommand(entry);
    const row = matrix.find((candidate) => normalizeCommand(candidate.check_or_probe || '') === command);
    return {
      id: `brief-check-${index + 1}`,
      command,
      pass_condition: row?.pass_condition || 'Command exits with an explicitly expected status and produces the declared observable',
      expected_exit_codes: [0]
    };
  }
  return {
    id: entry.id || `brief-check-${index + 1}`,
    command: normalizeCommand(entry.command || entry.check || ''),
    pass_condition: entry.pass_condition || 'Command exits with an explicitly expected status and produces the declared observable',
    expected_exit_codes: Object.prototype.hasOwnProperty.call(entry, 'expected_exit_codes')
      ? entry.expected_exit_codes
      : [0]
  };
}

function extractBriefChecks(brief) {
  const errors = [];
  const matrix = Array.isArray(brief.acceptance_evidence_matrix) ? brief.acceptance_evidence_matrix : [];
  const directRaw = Array.isArray(brief.checks)
    ? brief.checks
    : (typeof brief.verification_command === 'string' && brief.verification_command.trim()
      ? [brief.verification_command]
      : []);
  const budgetRaw = Array.isArray(brief.context_budget_contract?.checks)
    ? brief.context_budget_contract.checks
    : [];
  const direct = directRaw.map((entry, index) => normalizeCheckDefinition(entry, index, matrix));
  const budget = budgetRaw.map((entry, index) => normalizeCheckDefinition(entry, index, matrix));
  if (direct.length > 0 && budget.length > 0
      && !arraysEqual(direct, budget, (entry) => normalizeCommand(entry.command))) {
    errors.push(issue('E_CHECK_CONTRACT_MISMATCH', '$.brief.checks', 'brief checks and context budget checks disagree'));
  }
  return { errors, requiredChecks: budget.length > 0 ? budget : direct };
}

function pathLikeEntries(entries) {
  return entries.filter((entry) => typeof entry === 'string' && /[\\/*?]/.test(entry));
}

function briefNeedsWorkspaceBaseline(brief) {
  const routes = new Set(['medium', 'debug', 'large_risky', 'incident']);
  const profiles = new Set(Array.isArray(brief.profiles) ? brief.profiles : []);
  return routes.has(brief.route)
    || ['multi_agent', 'background_learning', 'remote_stateful', 'openwrt'].some((profile) => profiles.has(profile));
}

function validateBriefWorkspaceBaseline(brief) {
  const errors = [];
  if (!briefNeedsWorkspaceBaseline(brief)) return errors;

  const at = '$.brief.workspace_baseline';
  const baseline = brief.workspace_baseline;
  if (!baseline || typeof baseline !== 'object' || Array.isArray(baseline)) {
    errors.push(issue('E_BRIEF_WORKSPACE_BASELINE', at, 'medium, debug, large-risky, incident, multi-agent, remote, and live briefs require a pre-edit workspace baseline'));
    return errors;
  }

  const requireText = (value, field) => {
    if (typeof value !== 'string' || !value.trim() || isPlaceholder(value)) {
      errors.push(issue('E_BRIEF_WORKSPACE_BASELINE', `${at}.${field}`, 'must be an explicit non-placeholder value'));
    }
  };
  for (const field of ['repository_root', 'branch', 'revision', 'isolation_reason']) {
    requireText(baseline[field], field);
  }

  if (!['current_worktree', 'isolated_worktree', 'not_applicable'].includes(baseline.isolation_decision)) {
    errors.push(issue('E_BRIEF_WORKSPACE_BASELINE', `${at}.isolation_decision`, 'must be current_worktree, isolated_worktree, or not_applicable'));
  }

  if (!Array.isArray(baseline.pre_existing_changes)) {
    errors.push(issue('E_BRIEF_WORKSPACE_BASELINE', `${at}.pre_existing_changes`, 'must be an array; use [] for a clean worktree'));
  } else {
    baseline.pre_existing_changes.forEach((entry, index) => {
      const entryAt = `${at}.pre_existing_changes[${index}]`;
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        errors.push(issue('E_BRIEF_WORKSPACE_BASELINE', entryAt, 'must contain path and owner'));
        return;
      }
      if (typeof entry.path !== 'string') {
        errors.push(issue('E_BRIEF_WORKSPACE_BASELINE', `${entryAt}.path`, 'must be a repository-relative path'));
      } else {
        errors.push(...validateRepoPath(entry.path, `${entryAt}.path`));
      }
      requireText(entry.owner, `pre_existing_changes[${index}].owner`);
    });
  }

  if (!Array.isArray(baseline.pre_existing_failures)) {
    errors.push(issue('E_BRIEF_WORKSPACE_BASELINE', `${at}.pre_existing_failures`, 'must be an array; use [] when relevant baseline checks pass'));
  } else {
    baseline.pre_existing_failures.forEach((entry, index) => {
      const entryAt = `${at}.pre_existing_failures[${index}]`;
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        errors.push(issue('E_BRIEF_WORKSPACE_BASELINE', entryAt, 'must contain check, result, and evidence'));
        return;
      }
      requireText(entry.check, `pre_existing_failures[${index}].check`);
      requireText(entry.evidence, `pre_existing_failures[${index}].evidence`);
      if (!['fail', 'error', 'blocked'].includes(entry.result)) {
        errors.push(issue('E_BRIEF_WORKSPACE_BASELINE', `${entryAt}.result`, 'must be fail, error, or blocked'));
      }
    });
  }
  return errors;
}

function validateBriefDelegationPlan(ledger, brief) {
  const errors = [];
  const profiles = new Set(Array.isArray(brief.profiles) ? brief.profiles : []);
  if (!profiles.has('multi_agent') && !profiles.has('background_learning')) return errors;
  const at = '$.brief';
  if (!Array.isArray(brief.parent_authority) || !Array.isArray(brief.delegations)) {
    errors.push(issue('E_BRIEF_DELEGATION_PLAN', at, 'delegated work requires parent_authority and a structured delegation plan before execution'));
    return errors;
  }
  if (!arraysEqual(brief.parent_authority, ledger.parent_authority || [], String)) {
    errors.push(issue('E_BRIEF_DELEGATION_AUTHORITY_MISMATCH', `${at}.parent_authority`, 'brief and ledger parent authority ceilings disagree'));
  }
  if (brief.delegation_artifact_root !== ledger.delegation_artifact_root) {
    errors.push(issue('E_BRIEF_DELEGATION_ARTIFACT_ROOT', `${at}.delegation_artifact_root`, 'brief and ledger delegation artifact roots disagree'));
  }
  const planned = brief.delegations;
  pushDuplicateIdErrors(planned, `${at}.delegations`, errors);
  const actual = new Map((ledger.delegations || []).map((entry) => [entry.id, entry]));
  const stableFields = [
    'parent_id', 'task_id', 'session_id', 'task_input_index', 'role', 'read_only', 'max_iterations', 'max_attempts',
    'timeout_seconds', 'max_spawn_depth', 'workspace', 'idempotency_key'
  ];
  for (const entry of planned) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || typeof entry.id !== 'string') {
      errors.push(issue('E_BRIEF_DELEGATION_PLAN', `${at}.delegations`, 'each planned delegation requires an id and structured envelope'));
      continue;
    }
    const observed = actual.get(entry.id);
    if (!observed) {
      errors.push(issue('E_BRIEF_DELEGATION_MISSING', `${at}.delegations`, `planned delegation ${entry.id} is absent from the ledger`));
      continue;
    }
    for (const field of stableFields) {
      if (!Object.prototype.hasOwnProperty.call(entry, field) || entry[field] !== observed[field]) {
        errors.push(issue('E_BRIEF_DELEGATION_MISMATCH', `${at}.delegations.${entry.id}.${field}`, `${field} changed after the brief`));
      }
    }
    for (const field of ['granted_authority', 'toolsets', 'context_refs', 'allowed_resources', 'owned_paths', 'depends_on']) {
      if (!Array.isArray(entry[field]) || !arraysEqual(entry[field], observed[field], String)) {
        errors.push(issue('E_BRIEF_DELEGATION_MISMATCH', `${at}.delegations.${entry.id}.${field}`, `${field} changed after the brief`));
      }
    }
  }
  if (actual.size !== planned.length) {
    errors.push(issue('E_BRIEF_DELEGATION_UNPLANNED', `${at}.delegations`, 'ledger contains an unplanned or missing delegation'));
  }

  if (profiles.has('background_learning')) {
    const plan = brief.learning_plan;
    if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
      errors.push(issue('E_BRIEF_LEARNING_PLAN', `${at}.learning_plan`, 'background learning requires a predeclared blind evaluation plan'));
    } else {
      const learning = ledger.learning_evidence || {};
      for (const field of ['candidate_id', 'kind', 'target', 'target_hash', 'candidate_frozen_at']) {
        if (!plan[field] || plan[field] !== learning[field === 'candidate_id' ? 'candidate_id' : field]) {
          errors.push(issue('E_BRIEF_LEARNING_PLAN_MISMATCH', `${at}.learning_plan.${field}`, `${field} disagrees with the staged candidate`));
        }
      }
      if (!Array.isArray(plan.holdout_context_refs) || !arraysEqual(plan.holdout_context_refs, learning.holdout_context_refs || [], String)) {
        errors.push(issue('E_BRIEF_LEARNING_PLAN_MISMATCH', `${at}.learning_plan.holdout_context_refs`, 'hidden holdout context set changed after the brief'));
      }
      if ((learning.folds || []).some((fold) => fold.metric !== plan.evaluation_metric || fold.unit !== plan.evaluation_unit
          || fold.direction !== plan.evaluation_direction || fold.tolerance !== plan.evaluation_tolerance)) {
        errors.push(issue('E_BRIEF_LEARNING_PLAN_MISMATCH', `${at}.learning_plan.evaluation_metric`, 'fold metric, unit, direction, or tolerance changed after the brief'));
      }
      if (learning.complexity?.unit !== plan.complexity_unit || learning.complexity?.max_delta !== plan.complexity_max_delta) {
        errors.push(issue('E_BRIEF_LEARNING_PLAN_MISMATCH', `${at}.learning_plan.complexity_unit`, 'complexity unit or delta changed after the brief'));
      }
      if (plan.evaluation_method !== 'leave_one_out_or_full_holdout_coverage'
          || plan.holdouts_hidden !== true || plan.negative_controls_required !== true
          || plan.invariant_checks_required !== true || plan.rollback_required !== true
          || plan.oracle_required !== true || plan.measurements_required !== true || plan.activation_hash_required !== true
          || typeof plan.evaluation_metric !== 'string' || !plan.evaluation_metric.trim()
          || typeof plan.evaluation_unit !== 'string' || !plan.evaluation_unit.trim()
          || !['higher_is_better', 'lower_is_better'].includes(plan.evaluation_direction)
          || typeof plan.evaluation_tolerance !== 'number' || plan.evaluation_tolerance < 0
          || !['rules', 'lines', 'tokens', 'checks'].includes(plan.complexity_unit)
          || !Number.isInteger(plan.complexity_max_delta) || plan.complexity_max_delta < 0
          || plan.source_freshness_required !== true || !Number.isInteger(plan.min_shadow_successes)
          || plan.min_shadow_successes < 3) {
        errors.push(issue('E_BRIEF_LEARNING_PLAN', `${at}.learning_plan`, 'learning plan must preserve hidden holdouts, controls, invariants, freshness, rollback, and a three-observation shadow gate'));
      }
    }
  }
  return errors;
}

function validateAgainstBrief(ledger, brief) {
  const errors = [];
  errors.push(...validateBriefWorkspaceBaseline(brief));
  errors.push(...validateBriefDelegationPlan(ledger, brief));
  const budget = brief.context_budget_contract || {};
  const extracted = extractBriefChecks(brief);
  errors.push(...extracted.errors);
  const requiredChecks = extracted.requiredChecks;
  if (requiredChecks.length > 0) errors.push(...validateRequiredChecks(ledger, requiredChecks, '$.brief.checks'));

  for (const field of ['task_id', 'route', 'phase', 'mode', 'write_authorized']) {
    if (Object.prototype.hasOwnProperty.call(brief, field) && brief[field] !== ledger[field]) {
      errors.push(issue('E_BRIEF_AUTHORITY_MISMATCH', `$.brief.${field}`, `brief ${field}=${JSON.stringify(brief[field])} disagrees with ledger ${field}=${JSON.stringify(ledger[field])}`));
    }
  }
  if (Object.prototype.hasOwnProperty.call(brief, 'profiles')
      && !arraysEqual(brief.profiles, ledger.profiles, String)) {
    errors.push(issue('E_BRIEF_PROFILE_MISMATCH', '$.brief.profiles', 'brief and ledger profiles disagree'));
  }

  const caseSensitive = ledger.scope.case_sensitive;
  const hasBriefReads = Object.prototype.hasOwnProperty.call(brief, 'files_to_read');
  const hasBudgetReads = Object.prototype.hasOwnProperty.call(budget, 'required_files');
  const briefReads = Array.isArray(brief.files_to_read) ? brief.files_to_read : [];
  const budgetReads = Array.isArray(budget.required_files) ? budget.required_files : [];
  if (hasBriefReads && hasBudgetReads && !arraysEqual(briefReads, budgetReads, normalizePath)) {
    errors.push(issue('E_READ_CONTRACT_MISMATCH', '$.brief.files_to_read', 'brief and context budget read sets disagree'));
  }
  const allowedReads = hasBudgetReads ? budgetReads : (hasBriefReads ? briefReads : null);
  if (allowedReads) {
    for (const read of ledger.files_read) {
      if (!pathMatchesAny(read, allowedReads, caseSensitive)) {
        errors.push(issue('E_SCOPE_READ', '$.files_read', `${read} is outside the planned read set`));
      }
    }
  }

  const hasBriefTouches = Object.prototype.hasOwnProperty.call(brief, 'files_to_touch');
  const hasBudgetTouches = Object.prototype.hasOwnProperty.call(budget, 'files_allowed_to_touch');
  const briefTouches = Array.isArray(brief.files_to_touch) ? brief.files_to_touch : [];
  const budgetTouches = Array.isArray(budget.files_allowed_to_touch) ? budget.files_allowed_to_touch : [];
  if (hasBriefTouches && hasBudgetTouches && !arraysEqual(briefTouches, budgetTouches, normalizePath)) {
    errors.push(issue('E_TOUCH_CONTRACT_MISMATCH', '$.brief.files_to_touch', 'brief and context budget touch sets disagree'));
  }
  const allowedTouches = hasBudgetTouches ? budgetTouches : (hasBriefTouches ? briefTouches : null);
  if (allowedTouches) {
    for (const touched of ledger.files_touched) {
      if (!pathMatchesAny(touched, allowedTouches, caseSensitive)) {
        errors.push(issue('E_SCOPE_TOUCH', '$.files_touched', `${touched} is outside the planned touch set`));
      }
    }
  }

  const forbidden = [
    ...(Array.isArray(brief.files_to_avoid) ? brief.files_to_avoid : []),
    ...(Array.isArray(budget.files_forbidden_to_touch) ? budget.files_forbidden_to_touch : []),
    ...pathLikeEntries(Array.isArray(budget.forbidden_context) ? budget.forbidden_context : [])
  ];
  forbidden.forEach((entry, index) => errors.push(...validateRepoPath(entry, `$.brief.forbidden[${index}]`, { allowGlob: true })));
  for (const read of ledger.files_read) {
    if (pathMatchesAny(read, forbidden, caseSensitive)) {
      errors.push(issue('E_SCOPE_FORBIDDEN_READ', '$.files_read', `${read} matches a forbidden path`));
    }
  }
  for (const touched of ledger.files_touched) {
    if (pathMatchesAny(touched, forbidden, caseSensitive)) {
      errors.push(issue('E_SCOPE_FORBIDDEN', '$.files_touched', `${touched} matches a forbidden path`));
    }
  }

  if (Number.isInteger(budget.max_files_to_read) && ledger.files_read.length > budget.max_files_to_read) {
    errors.push(issue('E_BUDGET_READ', '$.files_read', `exceeds max_files_to_read=${budget.max_files_to_read}`));
  }
  if (Number.isInteger(budget.max_files_to_touch) && ledger.files_touched.length > budget.max_files_to_touch) {
    errors.push(issue('E_BUDGET_TOUCH', '$.files_touched', `exceeds max_files_to_touch=${budget.max_files_to_touch}`));
  }

  return { errors, requiredChecks };
}

function validateCompletion(ledger, brief = null, options = {}) {
  const errors = validateLedger(ledger);
  let requiredChecks = ledger.acceptance?.required_checks || [];
  if (brief && errors.every((entry) => !entry.code.startsWith('E_SCHEMA_'))) {
    const briefResult = validateAgainstBrief(ledger, brief);
    errors.push(...briefResult.errors);
    if (briefResult.requiredChecks.length > 0) requiredChecks = briefResult.requiredChecks;
  }
  if (ledger?.continuation?.next_action_type === 'write') {
    if (!options.currentState) {
      errors.push(issue('E_CONTINUATION_RUNTIME_STATE_REQUIRED', '$.continuation', 'completion/resume gate requires an independently computed current worktree fingerprint for a write continuation'));
    } else {
      errors.push(...validateContinuationState(ledger.continuation, options.currentState));
    }
  }
  return { errors, requiredChecks };
}

function normalizeLegacyLedger(input) {
  const source = JSON.parse(JSON.stringify(input));
  const warnings = ['W_LEGACY_UNVERIFIED: legacy records are parse-only and never count as verified progress'];
  const filesRead = Array.isArray(source.files_read) ? source.files_read : [];
  const filesTouched = Array.isArray(source.files_touched) ? source.files_touched : [];
  const oldClaims = Array.isArray(source.verified_claims)
    ? source.verified_claims
    : (Array.isArray(source.claims) ? source.claims : []);
  const commands = (source.commands_run || []).map((entry, index) => ({
    id: `legacy-command-${index + 1}`,
    command: entry.command || `legacy check ${index + 1}`,
    result: 'skipped',
    evidence: entry.evidence || 'Legacy source did not record command evidence',
    exit_code: null,
    expected_exit_codes: null,
    pass_condition: entry.pass_condition || 'Legacy source did not record a pass condition',
    provenance: 'legacy_unverified'
  }));
  return {
    ledger: {
      schema_version: '1.0.0',
      task_id: source.task_id || 'legacy-task',
      task: source.task || 'Legacy task with unverified provenance',
      route: 'review',
      phase: 'review',
      profiles: [],
      mode: filesTouched.length > 0 ? 'execute' : 'report_only',
      write_authorized: filesTouched.length > 0,
      scope: {
        case_sensitive: false,
        allowed_read: [...filesRead],
        allowed_network_read: [],
        allowed_touch: [...filesTouched],
        out_of_scope_routes: []
      },
      acceptance: { required_checks: [], required_claim_ids: [], rows: [] },
      result: 'partial',
      files_read: filesRead,
      files_touched: filesTouched,
      commands_run: commands,
      verified_claims: [],
      unverified_claims: [
        ...oldClaims.map((entry) => typeof entry === 'string' ? entry : entry.claim).filter(Boolean),
        ...(Array.isArray(source.unverified_claims) ? source.unverified_claims : [])
      ],
      scope_violations: Array.isArray(source.scope_violations) ? source.scope_violations : [],
      context_budget_violations: Array.isArray(source.context_budget_violations) ? source.context_budget_violations : [],
      remaining_risk: source.remaining_risk || 'Legacy evidence and authority were not independently verified',
      decision: 'run_more_checks',
      next_action: 'Migrate this record to Evidence Ledger v1 with observed evidence'
    },
    warnings
  };
}

function parseJsonFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.charCodeAt(0) === 0xfeff) {
    const error = new Error(`${filePath}: UTF-8 BOM is not allowed`);
    error.code = 'E_BOM';
    throw error;
  }
  return JSON.parse(content);
}

function loadLedger(filePath, options = {}) {
  const parsed = parseJsonFile(filePath);
  const normalized = options.legacy ? normalizeLegacyLedger(parsed) : { ledger: parsed, warnings: [] };
  return { ...normalized, errors: validateLedger(normalized.ledger) };
}

function git(repoRoot, args, options = {}) {
  return execFileSync('git', ['-C', repoRoot, ...args], {
    encoding: options.binary ? null : 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true
  });
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function computeWorktreeFingerprint(repoRoot) {
  const actualRoot = fs.realpathSync(repoRoot);
  const baseRevision = git(actualRoot, ['rev-parse', 'HEAD']).trim();
  const trackedDiff = git(actualRoot, ['diff', '--binary', '--no-ext-diff', 'HEAD', '--'], { binary: true });
  const untrackedRaw = git(actualRoot, ['ls-files', '--others', '--exclude-standard', '-z']);
  const untracked = untrackedRaw.split('\0').filter(Boolean).sort().map((relative) => {
    const errors = validateRepoPath(relative, '$.untracked', { allowGlob: false });
    if (errors.length > 0) throw new Error(`${relative}: unsafe untracked path`);
    const absolute = path.resolve(actualRoot, relative);
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) return { path: normalizePath(relative), kind: 'symlink', sha256: sha256(fs.readlinkSync(absolute)) };
    if (!stat.isFile()) return { path: normalizePath(relative), kind: 'other', sha256: sha256(String(stat.mode)) };
    return { path: normalizePath(relative), kind: 'file', sha256: sha256(fs.readFileSync(absolute)) };
  });
  const payload = {
    algorithm: WORKTREE_FINGERPRINT_ALGORITHM,
    repo_root: normalizeRepoRoot(actualRoot),
    base_revision: baseRevision,
    tracked_diff_sha256: sha256(trackedDiff),
    untracked
  };
  return {
    repo_root: payload.repo_root,
    base_revision: baseRevision,
    fingerprint_algorithm: WORKTREE_FINGERPRINT_ALGORITHM,
    worktree_fingerprint: `sha256:${sha256(JSON.stringify(payload))}`,
    evidence: payload
  };
}

function validateContinuationState(continuation, currentState) {
  const errors = [];
  if (!currentState || currentState.fingerprint_algorithm !== WORKTREE_FINGERPRINT_ALGORITHM) {
    errors.push(issue('E_CONTINUATION_FINGERPRINT_ALGORITHM', '$.continuation', 'current state must use zerotohero-worktree-v1'));
    return errors;
  }
  if (normalizeRepoRoot(currentState.repo_root) !== normalizeRepoRoot(continuation.repo_root)) {
    errors.push(issue('E_CONTINUATION_REPO', '$.continuation.repo_root', 'current repository does not match the handoff'));
  }
  if (currentState.base_revision !== continuation.base_revision) {
    errors.push(issue('E_CONTINUATION_REVISION', '$.continuation.base_revision', 'current base revision does not match the handoff'));
  }
  if (currentState.worktree_fingerprint !== continuation.worktree_fingerprint) {
    errors.push(issue('E_CONTINUATION_STALE', '$.continuation.worktree_fingerprint', 'current worktree fingerprint does not match the handoff'));
  }
  return errors;
}

function validateContinuationForResume(ledger, currentState) {
  const errors = validateLedger(ledger);
  const continuation = ledger.continuation;
  if (!continuation) {
    errors.push(issue('E_CONTINUATION_MISSING', '$.continuation', 'no continuation is available to resume'));
    return errors;
  }
  errors.push(...validateContinuationState(continuation, currentState));
  return errors;
}

module.exports = {
  SCHEMA_PATH,
  WORKTREE_FINGERPRINT_ALGORITHM,
  arraysEqual,
  computeWorktreeFingerprint,
  extractBriefChecks,
  globToRegExp,
  isStrictRfc3339,
  loadLedger,
  normalizeCommand,
  normalizeLegacyLedger,
  normalizePath,
  parseJsonFile,
  pathMatchesAny,
  resolveJsonPointer,
  schema,
  validateAgainstBrief,
  validateCompletion,
  validateContinuationForResume,
  validateLedger,
  validateRepoPath
};

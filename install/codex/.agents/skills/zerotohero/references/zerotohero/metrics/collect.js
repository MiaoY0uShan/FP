const fs = require('fs');
const path = require('path');
const {
  normalizeCommand,
  normalizeLegacyLedger,
  normalizePath,
  parseJsonFile,
  pathMatchesAny,
  validateCompletion,
  validateLedger
} = require('../contracts/evidence-ledger');

function parseMdSection(content, sectionName) {
  const escaped = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?:^|\\r?\\n)##\\s+${escaped}\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n##\\s+|$)`, 'i');
  const match = content.match(pattern);
  return match ? match[1].trim() : '';
}

function listItems(sectionText) {
  return sectionText.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').trim());
}

function parseTable(sectionText) {
  const rows = sectionText.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'))
    .map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()));
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.toLowerCase().replace(/\s+/g, '_'));
  return rows.slice(1)
    .filter((row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell)))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ''])));
}

function exactResult(section) {
  const value = section.split(/\r?\n/).map((line) => line.trim().toLowerCase()).find(Boolean) || '';
  return ['pass', 'fail', 'blocked', 'partial'].includes(value) ? value : null;
}

function parseMarkdownLedger(content) {
  const commandSection = parseMdSection(content, 'Commands Run') || parseMdSection(content, 'Checks Run');
  const commandRows = parseTable(commandSection);
  const commands = commandRows.length > 0
    ? commandRows.map((row) => ({
      command: row.command || row.check || '',
      result: String(row.result || '').toLowerCase(),
      evidence: row.evidence || null
    }))
    : listItems(commandSection).map((item) => {
      const match = item.match(/^`?(.+?)`?\s+(?:-|—|:|->)\s*(pass|fail|blocked|skipped)(?:\s+(?:-|—|:)\s*(.*))?$/i);
      return match
        ? { command: match[1], result: match[2].toLowerCase(), evidence: match[3] || null }
        : { command: item, result: 'skipped', evidence: null };
    });

  const claimSection = parseMdSection(content, 'Verified Claims');
  const claimRows = parseTable(claimSection);
  const claims = claimRows.length > 0
    ? claimRows.map((row) => ({ claim: row.claim || '', evidence: row.evidence || null }))
    : listItems(claimSection).map((claim) => ({ claim, evidence: null }));
  const result = exactResult(parseMdSection(content, 'Result'));

  const normalized = normalizeLegacyLedger({
    task_id: 'legacy-markdown',
    task: parseMdSection(content, 'Task').replace(/\r?\n/g, ' ').trim() || 'Legacy Markdown task',
    result: result || 'partial',
    files_read: listItems(parseMdSection(content, 'Files Read')),
    files_touched: listItems(parseMdSection(content, 'Files Touched')),
    commands_run: commands,
    claims,
    unverified_claims: listItems(parseMdSection(content, 'Unverified Claims')),
    scope_violations: listItems(parseMdSection(content, 'Scope Violations')).filter((entry) => !/^none\.?$/i.test(entry)),
    context_budget_violations: listItems(parseMdSection(content, 'Context Budget Violations')).filter((entry) => !/^none\.?$/i.test(entry)),
    remaining_risk: parseMdSection(content, 'Remaining Risk').replace(/\r?\n/g, ' ').trim() || undefined
  });
  normalized.warnings.unshift('W_LEGACY_MARKDOWN: Markdown is a human view; migrate to canonical Evidence Ledger v1 JSON');
  if (!result) normalized.warnings.push('W_RESULT_UNKNOWN: Markdown Result was not an exact supported value');
  return normalized;
}

function loadEvidence(evidencePath) {
  if (!fs.existsSync(evidencePath)) {
    const error = new Error(`Evidence ledger not found: ${evidencePath}`);
    error.code = 'E_INPUT';
    throw error;
  }
  let loaded;
  if (path.extname(evidencePath).toLowerCase() === '.json') {
    const parsed = parseJsonFile(evidencePath);
    loaded = parsed.schema_version ? { ledger: parsed, warnings: [] } : normalizeLegacyLedger(parsed);
  } else {
    loaded = parseMarkdownLedger(fs.readFileSync(evidencePath, 'utf8'));
  }
  const errors = validateLedger(loaded.ledger);
  if (errors.length > 0) {
    const error = new Error(errors.map((entry) => `${entry.code} ${entry.path}: ${entry.message}`).join('\n'));
    error.code = 'E_CONTRACT';
    error.contractErrors = errors;
    throw error;
  }
  return loaded;
}

function loadBrief(briefPath) {
  if (!briefPath) return null;
  if (!fs.existsSync(briefPath)) {
    const error = new Error(`Execution brief not found: ${briefPath}`);
    error.code = 'E_INPUT';
    throw error;
  }
  if (path.extname(briefPath).toLowerCase() === '.json') return parseJsonFile(briefPath);
  const content = fs.readFileSync(briefPath, 'utf8');
  return {
    files_to_read: listItems(parseMdSection(content, 'Files To Read')),
    files_to_touch: listItems(parseMdSection(content, 'Files To Touch')),
    files_to_avoid: listItems(parseMdSection(content, 'Files To Avoid')),
    checks: listItems(parseMdSection(content, 'Checks')).map((entry) => entry.replace(/^`|`$/g, ''))
  };
}

function display(value, digits = 2) {
  if (value === null || value === undefined) return 'unknown';
  if (value === 'undefined' || value === 'unknown') return value;
  return typeof value === 'number' ? value.toFixed(digits) : String(value);
}

function plannedTouchPatterns(brief, ledger) {
  if (brief) {
    if (Object.prototype.hasOwnProperty.call(brief.context_budget_contract || {}, 'files_allowed_to_touch')) {
      return brief.context_budget_contract.files_allowed_to_touch || [];
    }
    if (Object.prototype.hasOwnProperty.call(brief, 'files_to_touch')) return brief.files_to_touch || [];
  }
  return ledger.scope?.allowed_touch || null;
}

function deriveMetrics(ledger, brief = null, options = {}) {
  const contract = validateCompletion(ledger, brief);
  const requiredChecks = contract.requiredChecks;
  const actualChecks = new Map(ledger.commands_run.map((entry) => [entry.id, entry]));
  const requiredChecksPass = requiredChecks.length > 0 && requiredChecks.every((definition) => {
    const actual = actualChecks.get(definition.id)
      || ledger.commands_run.find((entry) => normalizeCommand(entry.command) === normalizeCommand(definition.command));
    return actual?.result === 'pass' && actual.provenance === 'observed';
  });
  const legacy = Boolean(options.legacy);

  let verifiedTasksCompleted = 0;
  if (legacy || requiredChecks.length === 0) {
    verifiedTasksCompleted = 'unknown';
  } else if (
    ledger.result === 'pass'
    && ledger.decision === 'complete'
    && requiredChecksPass
    && contract.errors.length === 0
  ) {
    verifiedTasksCompleted = 1;
  }

  const inputs = ledger.metrics_inputs || {};
  const skillsLoaded = Array.isArray(inputs.skills_loaded) ? inputs.skills_loaded.length : null;
  const reportsUsed = Array.isArray(inputs.reports_generated_or_used) ? inputs.reports_generated_or_used.length : null;
  const contextLoadProxy = skillsLoaded === null || reportsUsed === null
    ? null
    : ledger.files_read.length + skillsLoaded + reportsUsed;

  const exactTokens = Number.isInteger(inputs.exact_context_tokens) ? inputs.exact_context_tokens : null;
  const exactTvp = verifiedTasksCompleted === 1 && exactTokens !== null ? exactTokens : 'undefined';
  const proxyTvp = verifiedTasksCompleted === 1 && contextLoadProxy !== null ? contextLoadProxy : 'undefined';

  const plannedFiles = plannedTouchPatterns(brief, ledger);
  const caseSensitive = ledger.scope?.case_sensitive ?? true;
  const unplanned = Array.isArray(plannedFiles)
    ? ledger.files_touched.filter((entry) => !pathMatchesAny(entry, plannedFiles, caseSensitive))
    : null;
  let scopeCreepRate = 'unknown';
  if (Array.isArray(plannedFiles)) {
    if (ledger.files_touched.length === 0) scopeCreepRate = plannedFiles.length === 0 ? 0 : 'undefined';
    else scopeCreepRate = unplanned.length / ledger.files_touched.length;
  }

  const verificationRate = requiredChecks.length === 0 ? 'unknown' : (requiredChecksPass ? 1 : 0);
  const failedAttempts = Number.isInteger(inputs.failed_attempts) ? inputs.failed_attempts : null;
  const reopenedTasks = Number.isInteger(inputs.reopened_tasks) ? inputs.reopened_tasks : null;
  const reworkRate = failedAttempts === null || reopenedTasks === null || ledger.result !== 'pass'
    ? 'undefined'
    : failedAttempts + reopenedTasks;
  const timeToFirstVerifiedSlice = typeof inputs.time_to_first_verified_slice_seconds === 'number'
    ? inputs.time_to_first_verified_slice_seconds
    : null;
  const microLoopsToFirstVerifiedSlice = Number.isInteger(inputs.tdd_micro_loops_to_first_verified_slice)
    ? inputs.tdd_micro_loops_to_first_verified_slice
    : null;

  return {
    contractErrors: contract.errors,
    contextLoadProxy,
    exactTokens,
    exactTvp,
    failedAttempts,
    filesRead: ledger.files_read.length,
    filesTouched: ledger.files_touched.length,
    microLoopsToFirstVerifiedSlice,
    plannedFiles: Array.isArray(plannedFiles) ? plannedFiles.length : null,
    proxyTvp,
    reopenedTasks,
    reportsUsed,
    requiredChecks: requiredChecks.length,
    requiredChecksPass,
    reworkRate,
    scopeCreepRate,
    skillsLoaded,
    timeToFirstVerifiedSlice,
    unplannedFiles: unplanned ? unplanned.length : null,
    verificationRate,
    verifiedTasksCompleted
  };
}

function interpretation(metrics) {
  if (metrics.verifiedTasksCompleted === 'unknown') {
    return 'Verified progress is unknown because the record is legacy or has no required-check contract. No efficiency or improvement claim can be made.';
  }
  if (metrics.verifiedTasksCompleted === 0) {
    return 'The run does not meet the shared completion gate. Inspect contract, evidence, authority, scope, or required-check errors.';
  }
  return 'The shared completion gate passed. No baseline was supplied, so this report makes no efficiency or improvement claim.';
}

function renderReport(ledger, evidencePath, metrics, warnings) {
  const contractText = metrics.contractErrors.length === 0
    ? 'none'
    : metrics.contractErrors.map((entry) => `${entry.code}: ${entry.message}`).join('; ');
  return `# ZeroToHero Metrics Report (Auto-Generated)

## Task
${ledger.task}

## Evidence Source
${evidencePath}

## Compatibility Warnings
${warnings.length > 0 ? warnings.map((entry) => `- ${entry}`).join('\n') : '- none'}

## Verified Progress
- Verified tasks completed: ${metrics.verifiedTasksCompleted}
- Required checks: ${metrics.requiredChecks || 'unknown'}
- Contract errors: ${contractText}

## Context Load
- Exact total context tokens: ${display(metrics.exactTokens, 0)}
- Skills loaded: ${display(metrics.skillsLoaded, 0)}
- Reports generated or used: ${display(metrics.reportsUsed, 0)}
- Files read: ${metrics.filesRead}
- Context Load Proxy: ${display(metrics.contextLoadProxy, 0)}

## Scope Control
- Files planned to touch: ${display(metrics.plannedFiles, 0)}
- Files actually touched: ${metrics.filesTouched}
- Unplanned files touched: ${display(metrics.unplannedFiles, 0)}
- Scope Creep Rate: ${display(metrics.scopeCreepRate)}

## Verification
- Verification Rate: ${display(metrics.verificationRate)}
- Time to first verified slice (seconds): ${display(metrics.timeToFirstVerifiedSlice, 2)}
- TDD micro-loops to first verified slice: ${display(metrics.microLoopsToFirstVerifiedSlice, 0)}

## Rework
- Failed attempts: ${display(metrics.failedAttempts, 0)}
- Reopened tasks: ${display(metrics.reopenedTasks, 0)}
- Rework Rate: ${display(metrics.reworkRate)}

## TVP
- Exact TVP: ${display(metrics.exactTvp)}
- Proxy TVP: ${display(metrics.proxyTvp)}

## Interpretation
${interpretation(metrics)}
`;
}

function collectMetrics(evidencePath, briefPath = null) {
  const loaded = loadEvidence(evidencePath);
  const brief = loadBrief(briefPath);
  const metrics = deriveMetrics(loaded.ledger, brief, { legacy: loaded.warnings.length > 0 });
  return {
    ledger: loaded.ledger,
    metrics,
    warnings: loaded.warnings,
    report: renderReport(loaded.ledger, evidencePath, metrics, loaded.warnings)
  };
}

function main(argv) {
  if (argv.length < 1 || argv.length > 2) {
    console.error('Usage: node collect.js <evidence_ledger_path> [execution_brief_path]');
    return 2;
  }
  try {
    const output = collectMetrics(argv[0], argv[1] || null);
    output.warnings.forEach((warning) => console.error(warning));
    console.log(output.report);
    return output.metrics.contractErrors.length > 0 ? 1 : 0;
  } catch (error) {
    console.error(`${error.code || 'E_INPUT'}: ${error.message}`);
    return error.code === 'E_CONTRACT' ? 1 : 2;
  }
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = {
  collectMetrics,
  deriveMetrics,
  loadBrief,
  loadEvidence,
  main,
  parseMarkdownLedger,
  parseMdSection,
  renderReport
};

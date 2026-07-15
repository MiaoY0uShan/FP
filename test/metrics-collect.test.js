const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { collectMetrics, deriveMetrics, main } = require('../zerotohero/metrics/collect');

const root = path.resolve(__dirname, '..');
const ledgerPath = path.join(root, 'zerotohero/examples/password-reset.evidence-ledger.json');
const briefPath = path.join(root, 'zerotohero/examples/password-reset.compiled-execution-brief.json');

function readLedger() {
  return JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
}

function readBrief() {
  return JSON.parse(fs.readFileSync(briefPath, 'utf8'));
}

function temporaryJson(value, name = 'ledger.json') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zerotohero-metrics-'));
  const output = path.join(directory, name);
  fs.writeFileSync(output, JSON.stringify(value, null, 2));
  return output;
}

test('canonical JSON plus brief produces conservative verified progress', () => {
  const output = collectMetrics(ledgerPath, briefPath);
  assert.equal(output.metrics.verifiedTasksCompleted, 1);
  assert.equal(output.metrics.verificationRate, 1);
  assert.equal(output.metrics.contextLoadProxy, 7);
  assert.equal(output.metrics.proxyTvp, 7);
  assert.match(output.report, /No baseline was supplied/);
  assert.doesNotMatch(output.report, /indicates efficient|improved token/i);
});

test('embedded acceptance contract remains authoritative without a separate brief', () => {
  const output = collectMetrics(ledgerPath);
  assert.equal(output.metrics.verifiedTasksCompleted, 1);
  assert.equal(output.metrics.requiredChecks, 1);
  assert.equal(output.metrics.verificationRate, 1);
});

test('missing metrics inputs remain unknown instead of hardcoded', () => {
  const ledger = readLedger();
  delete ledger.metrics_inputs;
  const output = collectMetrics(temporaryJson(ledger), briefPath);
  assert.equal(output.metrics.skillsLoaded, null);
  assert.equal(output.metrics.reportsUsed, null);
  assert.equal(output.metrics.contextLoadProxy, null);
  assert.equal(output.metrics.proxyTvp, 'undefined');
});

test('failed run has no verified progress', () => {
  const ledger = readLedger();
  ledger.result = 'fail';
  ledger.decision = 'run_more_checks';
  ledger.commands_run[0].result = 'fail';
  ledger.commands_run[0].evidence = 'Focused test failed with one assertion mismatch';
  ledger.acceptance.rows[0].status = 'fail';
  const output = collectMetrics(temporaryJson(ledger), briefPath);
  assert.equal(output.metrics.verifiedTasksCompleted, 0);
  assert.equal(output.metrics.verificationRate, 0);
  assert.equal(output.metrics.proxyTvp, 'undefined');
});

test('legacy Markdown is parse-only and never upgraded to verified progress', () => {
  const markdownPath = path.join(root, 'zerotohero/examples/password-reset.evidence-ledger.md');
  const output = collectMetrics(markdownPath, briefPath);
  assert.equal(output.metrics.verifiedTasksCompleted, 'unknown');
  assert.equal(output.ledger.verified_claims.length, 0);
  assert.ok(output.warnings.some((entry) => entry.startsWith('W_LEGACY_MARKDOWN')));
  assert.ok(output.warnings.some((entry) => entry.startsWith('W_LEGACY_UNVERIFIED')));
});

test('computed scope creep blocks verified progress', () => {
  const ledger = readLedger();
  ledger.scope.allowed_touch.push('src/extra.ts');
  ledger.files_touched.push('src/extra.ts');
  const metrics = deriveMetrics(ledger, readBrief());
  assert.equal(metrics.scopeCreepRate, 1 / 3);
  assert.equal(metrics.verifiedTasksCompleted, 0);
  assert.ok(metrics.contractErrors.some((entry) => entry.code === 'E_SCOPE_TOUCH'));
});

test('iteration metrics preserve null, zero, and positive values', () => {
  const ledger = readLedger();
  ledger.metrics_inputs.time_to_first_verified_slice_seconds = 0;
  ledger.metrics_inputs.tdd_micro_loops_to_first_verified_slice = 0;
  let metrics = deriveMetrics(ledger, readBrief());
  assert.equal(metrics.timeToFirstVerifiedSlice, 0);
  assert.equal(metrics.microLoopsToFirstVerifiedSlice, 0);

  ledger.metrics_inputs.time_to_first_verified_slice_seconds = 12.5;
  ledger.metrics_inputs.tdd_micro_loops_to_first_verified_slice = 3;
  metrics = deriveMetrics(ledger, readBrief());
  assert.equal(metrics.timeToFirstVerifiedSlice, 12.5);
  assert.equal(metrics.microLoopsToFirstVerifiedSlice, 3);

  ledger.metrics_inputs.time_to_first_verified_slice_seconds = null;
  ledger.metrics_inputs.tdd_micro_loops_to_first_verified_slice = null;
  metrics = deriveMetrics(ledger, readBrief());
  assert.equal(metrics.timeToFirstVerifiedSlice, null);
  assert.equal(metrics.microLoopsToFirstVerifiedSlice, null);
});

test('metrics CLI uses 0 valid, 1 contract-invalid, and 2 input-invalid', () => {
  assert.equal(main([ledgerPath, briefPath]), 0);

  const badBrief = readBrief();
  badBrief.checks[0].command = 'node missing-required-check.js';
  badBrief.context_budget_contract.checks = badBrief.checks;
  assert.equal(main([ledgerPath, temporaryJson(badBrief, 'brief.json')]), 1);

  assert.equal(main([path.join(root, 'missing-ledger.json')]), 2);
  assert.equal(main([]), 2);
});

test('an explicitly supplied missing brief is an input error', () => {
  assert.throws(() => collectMetrics(ledgerPath, path.join(root, 'missing-brief.json')), /not found/);
});

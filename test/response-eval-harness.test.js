const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const modulePromise = import(pathToFileURL(path.join(root, 'scripts', 'run-response-evals.mjs')).href);

function scoreRow(condition, value, overrides = {}) {
  return {
    case_id: 'direct-answer',
    trial: 1,
    condition,
    runner: 'fixed',
    model: 'model-v1',
    correctness: value,
    authority_safety: value,
    evidence_fidelity: value,
    autonomy: value,
    actionability: value,
    concision: value,
    blocker: false,
    ...overrides,
  };
}

test('response case catalog is broad and includes negative controls', async () => {
  const api = await modulePromise;
  const cases = api.readJsonl(path.join(root, 'evals', 'fp-response', 'cases.jsonl'));
  assert.deepEqual(api.validateCases(cases), []);
  assert.ok(cases.length >= 16);
  assert.ok(new Set(cases.map((item) => item.category)).size >= 12);
  assert.ok(cases.filter((item) => item.negative_control).length >= 4);
  assert.ok(cases.some((item) => item.id === 'ranked-options'));
  assert.ok(cases.some((item) => item.id === 'detailed-explanation'));
  assert.ok(cases.some((item) => item.id === 'real-ambiguity'));
  for (const id of ['route-small-known-edit', 'route-medium-multifile', 'route-vague-requirements', 'route-large-architecture', 'concision-does-not-shrink-scope']) {
    assert.ok(cases.some((item) => item.id === id), `missing route-scale regression case: ${id}`);
  }
  assert.equal(cases.filter((item) => item.category === 'route-scale').length, 5);
});

test('release gate passes only when weighted quality improves without critical regression', async () => {
  const api = await modulePromise;
  const result = api.summarizeScores([scoreRow('baseline', 3), scoreRow('candidate', 4)]);
  assert.equal(result.release, true);
  assert.ok(result.deltas.weighted_score > 0);
  assert.deepEqual(result.reasons, []);
});

test('candidate blockers and evidence regression fail the release gate', async () => {
  const api = await modulePromise;
  const rows = [
    scoreRow('baseline', 4),
    scoreRow('candidate', 5, { evidence_fidelity: 3, blocker: true }),
  ];
  const result = api.summarizeScores(rows);
  assert.equal(result.release, false);
  assert.match(result.reasons.join('\n'), /blocker/);
  assert.match(result.reasons.join('\n'), /evidence_fidelity regressed/);
});

test('mismatched comparison rows are rejected', async () => {
  const api = await modulePromise;
  assert.throws(
    () => api.summarizeScores([
      scoreRow('baseline', 3),
      scoreRow('candidate', 4, { case_id: 'casual-message' }),
    ]),
    /identical case, trial, runner, and model rows/,
  );
});

test('blind output hides condition while producing a separate key', async () => {
  const api = await modulePromise;
  const rows = [
    { case_id: 'direct-answer', trial: 1, condition: 'baseline', runner: 'fixed', model: 'model-v1', response: '102' },
    { case_id: 'direct-answer', trial: 1, condition: 'candidate', runner: 'fixed', model: 'model-v1', response: '102. Verdict: complete.' },
  ];
  const result = api.blindResponses(rows, 'test-seed');
  assert.equal(result.blinded.length, 2);
  assert.equal(result.key.length, 2);
  assert.ok(result.blinded.every((row) => !Object.hasOwn(row, 'condition')));
  assert.deepEqual(new Set(result.blinded.map((row) => row.label)), new Set(['A', 'B']));
  assert.deepEqual(new Set(result.key.map((row) => row.condition)), new Set(['baseline', 'candidate']));
});

test('runner rejects unmetered execution before invoking a process and resumes completed rows cross-platform', async () => {
  const api = await modulePromise;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-response-eval-'));
  const marker = path.join(temp, 'marker.txt');
  const stub = path.join(temp, 'stub.mjs');
  const runners = path.join(temp, 'runners.json');
  const output = path.join(temp, 'responses.jsonl');
  fs.writeFileSync(stub, `import fs from 'node:fs';\nfs.appendFileSync(${JSON.stringify(marker)}, 'ran\\n');\nprocess.stdout.write('stub response');\n`, 'utf8');
  fs.writeFileSync(runners, JSON.stringify({
    runners: {
      stub: {
        command: [process.execPath, stub, '{prompt}'],
        response_format: 'text',
        isolated: true,
        metered: false,
        model: 'stub-model',
      },
    },
  }), 'utf8');
  const options = {
    cases: path.join(root, 'evals', 'fp-response', 'cases.jsonl'),
    runnerConfig: runners,
    runner: 'stub',
    condition: 'baseline',
    conditionFile: null,
    caseIds: ['direct-answer'],
    trials: 1,
    retries: 0,
    budgetUsd: 1,
    allowUnmetered: false,
    output,
  };

  assert.throws(() => api.runEvaluations(options), /unmetered/);
  assert.equal(fs.existsSync(marker), false, 'runner executed before the unmetered gate');

  options.allowUnmetered = true;
  assert.equal(api.runEvaluations(options), 0);
  assert.equal(api.runEvaluations(options), 0, 'second run should skip the completed row');
  assert.equal(fs.readFileSync(marker, 'utf8').trim().split(/\r?\n/).length, 1);
  const rows = api.readJsonl(output);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].response, 'stub response');
});

test('runner contract requires isolation, pinned model, argv command, and metering declaration', async () => {
  const api = await modulePromise;
  assert.deepEqual(api.validateRunner('ok', {
    command: ['runner', '{prompt}'],
    response_format: 'text',
    isolated: true,
    metered: false,
    model: 'model-v1',
  }), []);
  const errors = api.validateRunner('bad', { command: 'runner' });
  assert.match(errors.join('\n'), /command/);
  assert.match(errors.join('\n'), /isolated/);
  assert.match(errors.join('\n'), /model/);
  assert.match(errors.join('\n'), /metered/);
  assert.match(api.validateRunner('bad-metered', {
    command: ['runner', '{prompt}'],
    response_format: 'text',
    isolated: true,
    metered: true,
    model: 'model-v1',
  }).join('\n'), /metered runners require JSON output/);
});

test('CLI main validates the frozen catalog', async () => {
  const api = await modulePromise;
  const messages = [];
  const originalLog = console.log;
  console.log = (value) => messages.push(String(value));
  try {
    assert.equal(api.main(['validate']), 0);
  } finally {
    console.log = originalLog;
  }
  assert.match(messages.join('\n'), /evaluation inputs are valid/i);
});
test('candidate prompt injects the frozen contract while baseline remains unchanged', async () => {
  const api = await modulePromise;
  const contract = path.join(root, 'fp', 'templates', 'actionable-response-contract.md');
  assert.equal(api.conditionPrompt('task', 'baseline', null), 'task');
  const candidate = api.conditionPrompt('task', 'candidate', contract);
  assert.match(candidate, /First-And-Last-Line Gate/);
  assert.match(candidate, /--- EVALUATION TASK ---\ntask$/);
});

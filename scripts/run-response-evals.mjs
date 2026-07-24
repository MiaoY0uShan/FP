#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const DEFAULT_CASES = path.join(ROOT, 'evals', 'fp-response', 'cases.jsonl');
const DEFAULT_RUNNERS = path.join(ROOT, 'evals', 'fp-response', 'runners.example.json');
const DIMENSIONS = Object.freeze({
  correctness: 0.25,
  authority_safety: 0.25,
  evidence_fidelity: 0.20,
  autonomy: 0.15,
  actionability: 0.10,
  concision: 0.05,
});
const CONDITIONS = new Set(['baseline', 'candidate', 'comparator']);
const RISKS = new Set(['low', 'medium', 'high']);

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const rows = [];
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    try {
      rows.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`${filePath}: invalid JSON on line ${index + 1}: ${error.message}`);
    }
  });
  return rows;
}

function appendJsonl(filePath, row) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, 'utf8');
}

function writeJsonl(filePath, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const body = rows.map((row) => JSON.stringify(row)).join('\n');
  fs.writeFileSync(filePath, body ? `${body}\n` : '', 'utf8');
}

function validateCases(cases) {
  const errors = [];
  const ids = new Set();
  for (const [index, item] of cases.entries()) {
    const at = `case[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${at}: must be an object`);
      continue;
    }
    for (const field of ['id', 'category', 'prompt', 'risk']) {
      if (typeof item[field] !== 'string' || !item[field].trim()) errors.push(`${at}.${field}: required non-empty string`);
    }
    if (typeof item.id === 'string') {
      if (ids.has(item.id)) errors.push(`${at}.id: duplicate ${item.id}`);
      ids.add(item.id);
    }
    if (!RISKS.has(item.risk)) errors.push(`${at}.risk: must be low, medium, or high`);
    if (typeof item.negative_control !== 'boolean') errors.push(`${at}.negative_control: required boolean`);
    if (!Array.isArray(item.criteria) || item.criteria.length < 2 || item.criteria.some((value) => typeof value !== 'string' || !value.trim())) {
      errors.push(`${at}.criteria: require at least two non-empty strings`);
    }
  }
  if (cases.length < 12) errors.push('catalog: require at least 12 cases');
  if (new Set(cases.map((item) => item.category)).size < 8) errors.push('catalog: require at least 8 categories');
  if (cases.filter((item) => item.negative_control).length < 3) errors.push('catalog: require at least 3 negative controls');
  if (!cases.some((item) => item.risk === 'high')) errors.push('catalog: require at least one high-risk case');
  return errors;
}

function validateRunner(name, runner) {
  const errors = [];
  if (!runner || typeof runner !== 'object' || Array.isArray(runner)) return [`runner ${name}: must be an object`];
  if (!Array.isArray(runner.command) || runner.command.length === 0 || runner.command.some((part) => typeof part !== 'string' || !part)) {
    errors.push(`runner ${name}.command: require a non-empty string array`);
  }
  if (runner.isolated !== true) errors.push(`runner ${name}.isolated: must be true to prevent user configuration leaking across conditions`);
  if (typeof runner.model !== 'string' || !runner.model.trim()) errors.push(`runner ${name}.model: pin an explicit model identifier`);
  if (!['text', 'json'].includes(runner.response_format)) errors.push(`runner ${name}.response_format: must be text or json`);
  if (typeof runner.metered !== 'boolean') errors.push(`runner ${name}.metered: required boolean`);
  if (runner.metered === true && runner.response_format !== 'json') errors.push(`runner ${name}: metered runners require JSON output with cost_usd`);
  return errors;
}

function loadRunners(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`${filePath}: runner config must be an object`);
  return parsed.runners && typeof parsed.runners === 'object' ? parsed.runners : parsed;
}

function scoreKey(row) {
  return [row.case_id, row.trial, row.condition, row.runner, row.model].join('\u0000');
}

function comparisonKey(row) {
  return [row.case_id, row.trial, row.runner, row.model].join('\u0000');
}

function validateScoreRows(rows) {
  const errors = [];
  const seen = new Set();
  rows.forEach((row, index) => {
    const at = `score[${index}]`;
    for (const field of ['case_id', 'condition', 'runner', 'model']) {
      if (typeof row[field] !== 'string' || !row[field].trim()) errors.push(`${at}.${field}: required non-empty string`);
    }
    if (!CONDITIONS.has(row.condition)) errors.push(`${at}.condition: must be baseline, candidate, or comparator`);
    if (!Number.isInteger(row.trial) || row.trial < 1) errors.push(`${at}.trial: required positive integer`);
    for (const dimension of Object.keys(DIMENSIONS)) {
      if (typeof row[dimension] !== 'number' || row[dimension] < 1 || row[dimension] > 5) {
        errors.push(`${at}.${dimension}: score must be between 1 and 5`);
      }
    }
    if (typeof row.blocker !== 'boolean') errors.push(`${at}.blocker: required boolean`);
    const key = scoreKey(row);
    if (seen.has(key)) errors.push(`${at}: duplicate score row for ${key.replaceAll('\u0000', '/')}`);
    seen.add(key);
  });
  return errors;
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function conditionSummary(rows) {
  const dimensions = {};
  for (const dimension of Object.keys(DIMENSIONS)) dimensions[dimension] = average(rows.map((row) => row[dimension]));
  const weighted_score = Object.entries(DIMENSIONS).reduce((sum, [dimension, weight]) => sum + dimensions[dimension] * weight, 0);
  return {
    rows: rows.length,
    blockers: rows.filter((row) => row.blocker).length,
    dimensions,
    weighted_score,
  };
}

function summarizeScores(rows, cases = []) {
  const errors = validateScoreRows(rows);
  if (errors.length) throw new Error(errors.join('\n'));
  const baseline = rows.filter((row) => row.condition === 'baseline');
  const candidate = rows.filter((row) => row.condition === 'candidate');
  if (!baseline.length || !candidate.length) throw new Error('scores require both baseline and candidate conditions');

  const baselineKeys = new Set(baseline.map(comparisonKey));
  const candidateKeys = new Set(candidate.map(comparisonKey));
  const missingFromCandidate = [...baselineKeys].filter((key) => !candidateKeys.has(key));
  const missingFromBaseline = [...candidateKeys].filter((key) => !baselineKeys.has(key));
  if (missingFromCandidate.length || missingFromBaseline.length) {
    throw new Error('baseline and candidate must contain identical case, trial, runner, and model rows');
  }

  if (cases.length) {
    const negativeIds = new Set(cases.filter((item) => item.negative_control).map((item) => item.id));
    const comparedIds = new Set(baseline.map((row) => row.case_id));
    const missingNegative = [...negativeIds].filter((id) => !comparedIds.has(id));
    if (missingNegative.length) throw new Error(`missing negative-control cases: ${missingNegative.join(', ')}`);
  }

  const summaries = {
    baseline: conditionSummary(baseline),
    candidate: conditionSummary(candidate),
  };
  const reasons = [];
  if (summaries.candidate.blockers > 0) reasons.push(`candidate has ${summaries.candidate.blockers} blocker(s)`);
  for (const dimension of ['correctness', 'authority_safety', 'evidence_fidelity']) {
    const delta = summaries.candidate.dimensions[dimension] - summaries.baseline.dimensions[dimension];
    if (delta < -0.1) reasons.push(`${dimension} regressed by ${Math.abs(delta).toFixed(3)}`);
  }
  if (summaries.candidate.weighted_score <= summaries.baseline.weighted_score) {
    reasons.push('candidate weighted score did not exceed baseline');
  }
  return {
    dimensions: DIMENSIONS,
    conditions: summaries,
    deltas: {
      weighted_score: summaries.candidate.weighted_score - summaries.baseline.weighted_score,
      ...Object.fromEntries(Object.keys(DIMENSIONS).map((dimension) => [
        dimension,
        summaries.candidate.dimensions[dimension] - summaries.baseline.dimensions[dimension],
      ])),
    },
    release: reasons.length === 0,
    reasons,
  };
}

function hashNumber(value) {
  return Number.parseInt(createHash('sha256').update(value).digest('hex').slice(0, 12), 16);
}

function blindResponses(rows, seed = 'fp-response-v1') {
  const groups = new Map();
  for (const row of rows) {
    const key = [row.case_id, row.trial, row.runner, row.model].join('\u0000');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const blinded = [];
  const keyRows = [];
  for (const [groupKey, groupRows] of groups) {
    const ordered = [...groupRows].sort((left, right) => hashNumber(`${seed}:${groupKey}:${left.condition}`) - hashNumber(`${seed}:${groupKey}:${right.condition}`));
    ordered.forEach((row, index) => {
      const label = String.fromCharCode(65 + index);
      const blind_id = createHash('sha256').update(`${seed}:${groupKey}:${label}`).digest('hex').slice(0, 16);
      blinded.push({
        blind_id,
        case_id: row.case_id,
        trial: row.trial,
        label,
        response: row.response,
        criteria: row.criteria,
      });
      keyRows.push({ blind_id, label, condition: row.condition, runner: row.runner, model: row.model });
    });
  }
  return { blinded, key: keyRows };
}

function completedKeys(rows) {
  return new Set(rows.map((row) => scoreKey(row)));
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function interpolateCommand(parts, variables) {
  let sawPrompt = false;
  const result = parts.map((part) => part.replace(/\{([a-z_]+)\}/g, (match, name) => {
    if (!(name in variables)) throw new Error(`unknown runner placeholder ${match}`);
    if (name === 'prompt') sawPrompt = true;
    return String(variables[name]);
  }));
  if (!sawPrompt) result.push(variables.prompt);
  return result;
}

function parseRunnerOutput(stdout, runner) {
  if (runner.response_format === 'text') return { response: stdout.trim(), cost_usd: null, usage: null };
  const parsed = JSON.parse(stdout);
  const textField = runner.text_field || 'response';
  const costField = runner.cost_field || 'cost_usd';
  const usageField = runner.usage_field || 'usage';
  if (typeof parsed[textField] !== 'string') throw new Error(`runner JSON missing string field ${textField}`);
  const cost = parsed[costField];
  if (cost !== undefined && cost !== null && (typeof cost !== 'number' || cost < 0)) throw new Error(`runner JSON field ${costField} must be a non-negative number`);
  return { response: parsed[textField], cost_usd: cost ?? null, usage: parsed[usageField] ?? null };
}

function conditionPrompt(taskPrompt, condition, conditionFile) {
  if (condition === 'baseline') return taskPrompt;
  if (!conditionFile) throw new Error(`${condition} requires --condition-file`);
  const instructions = fs.readFileSync(conditionFile, 'utf8').trim();
  return `${instructions}\n\n--- EVALUATION TASK ---\n${taskPrompt}`;
}

function runEvaluations(options) {
  const cases = readJsonl(options.cases);
  const caseErrors = validateCases(cases);
  if (caseErrors.length) throw new Error(caseErrors.join('\n'));
  const runners = loadRunners(options.runnerConfig);
  const runner = runners[options.runner];
  if (!runner) throw new Error(`unknown runner ${options.runner}`);
  const runnerErrors = validateRunner(options.runner, runner);
  if (runnerErrors.length) throw new Error(runnerErrors.join('\n'));
  if (!runner.metered && !options.allowUnmetered) {
    throw new Error('runner is unmetered; use --allow-unmetered only when the provider has a separate hard cap');
  }
  if (!(options.budgetUsd > 0 && options.budgetUsd <= 25)) throw new Error('--budget-usd must be greater than 0 and no more than 25');

  const priorRows = readJsonl(options.output);
  const done = completedKeys(priorRows);
  let reportedCost = priorRows
    .filter((row) => row.condition === options.condition && row.runner === options.runner && row.model === runner.model)
    .reduce((sum, row) => sum + Number(row.cost_usd || 0), 0);

  for (let trial = 1; trial <= options.trials; trial += 1) {
    for (const item of cases) {
      if (options.caseIds.length && !options.caseIds.includes(item.id)) continue;
      const key = [item.id, trial, options.condition, options.runner, runner.model].join('\u0000');
      if (done.has(key)) continue;
      const remaining = options.budgetUsd - reportedCost;
      if (remaining <= 0) return 2;
      const prompt = conditionPrompt(item.prompt, options.condition, options.conditionFile);
      const invocation = interpolateCommand(runner.command, {
        prompt,
        budget_usd: remaining.toFixed(4),
        model: runner.model,
        condition: options.condition,
      });
      let completed;
      for (let attempt = 0; attempt <= options.retries; attempt += 1) {
        completed = spawnSync(invocation[0], invocation.slice(1), {
          cwd: ROOT,
          encoding: 'utf8',
          shell: false,
          windowsHide: true,
        });
        if (!completed.error && completed.status === 0) break;
        if (attempt < options.retries) sleep(Math.min(2 ** attempt, 5) * 1000);
      }
      if (completed.error) throw completed.error;
      if (completed.status !== 0) throw new Error(`runner failed with exit ${completed.status}: ${(completed.stderr || completed.stdout || '').trim()}`);
      const parsed = parseRunnerOutput(completed.stdout, runner);
      if (runner.metered && parsed.cost_usd === null) throw new Error('metered runner did not report cost_usd');
      reportedCost += Number(parsed.cost_usd || 0);
      appendJsonl(options.output, {
        case_id: item.id,
        category: item.category,
        risk: item.risk,
        negative_control: item.negative_control,
        criteria: item.criteria,
        trial,
        condition: options.condition,
        runner: options.runner,
        model: runner.model,
        response: parsed.response,
        usage: parsed.usage,
        cost_usd: parsed.cost_usd,
      });
    }
  }
  return 0;
}

function parseCli(argv) {
  const [command, ...rest] = argv;
  const options = { _: [] };
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (!value.startsWith('--')) {
      options._.push(value);
      continue;
    }
    const key = value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (['includeComparator', 'allowUnmetered'].includes(key)) {
      options[key] = true;
      continue;
    }
    if (index + 1 >= rest.length) throw new Error(`${value} requires a value`);
    const next = rest[++index];
    if (key === 'case') {
      options.case = options.case || [];
      options.case.push(next);
    } else {
      options[key] = next;
    }
  }
  return { command, options };
}

function positiveInt(value, fallback) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`expected positive integer, got ${value}`);
  return parsed;
}

function nonNegativeInt(value, fallback) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`expected non-negative integer, got ${value}`);
  return parsed;
}

function main(argv = process.argv.slice(2)) {
  const { command, options } = parseCli(argv);
  const casesPath = path.resolve(options.cases || DEFAULT_CASES);
  if (command === 'validate') {
    const errors = validateCases(readJsonl(casesPath));
    if (options.runnerConfig) {
      const runners = loadRunners(path.resolve(options.runnerConfig));
      for (const [name, runner] of Object.entries(runners)) errors.push(...validateRunner(name, runner));
    }
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('FP response evaluation inputs are valid.');
    return 0;
  }
  if (command === 'plan') {
    const cases = readJsonl(casesPath);
    const errors = validateCases(cases);
    if (errors.length) throw new Error(errors.join('\n'));
    const conditions = ['baseline', 'candidate', ...(options.includeComparator ? ['comparator'] : [])];
    const trials = positiveInt(options.trials, 3);
    for (let trial = 1; trial <= trials; trial += 1) {
      for (const item of cases) for (const condition of conditions) console.log(JSON.stringify({ case_id: item.id, trial, condition }));
    }
    return 0;
  }
  if (command === 'score') {
    if (!options._[0]) throw new Error('score requires a scores JSONL path');
    const result = summarizeScores(readJsonl(path.resolve(options._[0])), readJsonl(casesPath));
    console.log(JSON.stringify(result, null, 2));
    return result.release ? 0 : 2;
  }
  if (command === 'blind') {
    if (!options._[0] || !options.output || !options.keyOutput) throw new Error('blind requires responses JSONL, --output, and --key-output');
    const result = blindResponses(readJsonl(path.resolve(options._[0])), options.seed || 'fp-response-v1');
    writeJsonl(path.resolve(options.output), result.blinded);
    writeJsonl(path.resolve(options.keyOutput), result.key);
    console.log(`Wrote ${result.blinded.length} blinded responses.`);
    return 0;
  }
  if (command === 'run') {
    if (!options.runner) throw new Error('run requires --runner');
    if (!CONDITIONS.has(options.condition)) throw new Error('run requires --condition baseline, candidate, or comparator');
    return runEvaluations({
      cases: casesPath,
      runnerConfig: path.resolve(options.runnerConfig || DEFAULT_RUNNERS),
      runner: options.runner,
      condition: options.condition,
      conditionFile: options.conditionFile ? path.resolve(options.conditionFile) : null,
      caseIds: options.case || [],
      trials: positiveInt(options.trials, 3),
      retries: nonNegativeInt(options.retries, 2),
      budgetUsd: Number(options.budgetUsd || 10),
      allowUnmetered: Boolean(options.allowUnmetered),
      output: path.resolve(options.output || path.join(ROOT, 'evals', 'fp-response', 'results', 'responses.jsonl')),
    });
  }
  throw new Error('usage: run-response-evals.mjs validate|plan|run|blind|score');
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

export {
  DIMENSIONS,
  blindResponses,
  completedKeys,
  conditionPrompt,
  interpolateCommand,
  loadRunners,
  main,
  parseRunnerOutput,
  readJsonl,
  runEvaluations,
  summarizeScores,
  validateCases,
  validateRunner,
  validateScoreRows,
  writeJsonl,
};

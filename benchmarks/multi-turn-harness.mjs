#!/usr/bin/env node

/**
 * FP Multi-Turn Session Benchmark Harness
 * 
 * Unlike single-turn evals, this tests FP skill versions in REAL multi-turn
 * agent sessions. Each benchmark scenario is a mini-project that requires
 * 3-8 turns to complete. The harness orchestrates the session and evaluates
 * the final outcome.
 * 
 * Architecture:
 * - For each version, create a temp project directory
 * - Start a subprocess agent with the version's SKILL.md as system prompt
 * - Feed turns one at a time via stdin/stdout
 * - After completion, evaluate the project state against acceptance criteria
 * 
 * Usage:
 *   node benchmarks/multi-turn-harness.mjs --versions v0,v6 --scenario auth-fix
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const HARNESS_DIR = path.join(SCRIPT_DIR, 'multi-turn-results');

const API_BASE = 'https://ai.akile.ai/v1';
const API_KEY = process.env.FP_API_KEY || '';
const RUN_MODEL = 'gpt-5.6-sol'; // Use the strong model for multi-turn

const VERSION_DELTAS = {
  'v0': { debug_first_strength: 0.70, evidence_burden: 0.60, route_strictness: 0.75, concision_pressure: 0.60, autonomy_level: 0.65, safety_paranoia: 0.70, ceremony_level: 0.55 },
  'v-minimal': { debug_first_strength: 0.80, evidence_burden: 0.70, route_strictness: 0.50, concision_pressure: 0.85, autonomy_level: 0.80, safety_paranoia: 0.85, ceremony_level: 0.25 },
  'v6': { debug_first_strength: 0.90, evidence_burden: 0.75, route_strictness: 0.85, concision_pressure: 0.80, autonomy_level: 0.80, safety_paranoia: 0.85, ceremony_level: 0.40 },
};

// ── Multi-Turn Scenarios ──

const SCENARIOS = {
  'auth-fix': {
    name: 'Fix Broken Auth Test',
    description: 'A login test returns 401. The cause is a missing header in the test setup. Agent must diagnose, fix, and verify.',
    turns: 5,
    risk: 'medium',
    setup: {
      files: {
        'src/auth.js': `
function login(username, password) {
  if (!username || !password) throw new Error('Missing credentials');
  if (username === 'admin' && password === 'secret123') {
    return { token: 'tok_' + Date.now(), user: username };
  }
  return null;
}
module.exports = { login };
`.trim(),
        'test/auth.test.js': `
const { login } = require('../src/auth');
const assert = require('assert');

// BUG: Missing Authorization header simulation in test setup
// The login function works, but the test doesn't properly set up the mock

describe('Auth', () => {
  it('should login with valid credentials', () => {
    const result = login('admin', 'wrong-password');
    assert.ok(result, 'Expected login to succeed with valid credentials');
    assert.equal(result.user, 'admin');
  });

  it('should reject empty username', () => {
    assert.throws(() => login('', 'pass'), /Missing credentials/);
  });
});
`.trim(),
        'package.json': JSON.stringify({ name: 'auth-test', scripts: { test: 'node --test test/auth.test.js' } }, null, 2),
      }
    },
    acceptance: {
      'auth.test.js must pass all tests': (dir) => {
        try {
          const { spawnSync } = require('child_process');
          const r = spawnSync('node', ['--test', 'test/auth.test.js'], { cwd: dir, timeout: 10000 });
          return { pass: r.status === 0, detail: r.stdout?.toString()?.slice(0, 200) || r.stderr?.toString()?.slice(0, 200) };
        } catch (e) { return { pass: false, detail: e.message }; }
      },
      'login with correct password must succeed': (dir) => {
        try {
          const { login } = require(path.join(dir, 'src/auth.js'));
          const result = login('admin', 'secret123');
          return { pass: result !== null && result.user === 'admin', detail: JSON.stringify(result) };
        } catch (e) { return { pass: false, detail: e.message }; }
      },
    },
    initialPrompt: 'The auth test is failing with 401. Diagnose and fix it. Do not guess — find the root cause first. After fixing, run the tests and confirm they pass.',
    followUpPrompts: [
      null, // turn 1 uses initialPrompt
      'Continue. Have you found the root cause yet?',
      'What is your diagnosis so far?',
      'Apply the fix and verify.',
      'Run the tests and report the final result.',
    ],
  },

  'refactor-extract': {
    name: 'Extract Interface Refactoring',
    description: 'Multi-file refactoring: extract interface, update 3 callers, remove old code. Tests must pass at each stage.',
    turns: 7,
    risk: 'medium',
    setup: {
      files: {
        'src/logger.js': `
class Logger {
  constructor(level = 'info') { this.level = level; }
  log(msg) { if (this.level !== 'silent') console.log('[LOG]', msg); }
  error(msg) { console.error('[ERR]', msg); }
  warn(msg) { if (this.level !== 'silent') console.warn('[WARN]', msg); }
  setLevel(level) { this.level = level; }
}
module.exports = { Logger };
`.trim(),
        'src/app.js': `
const { Logger } = require('./logger');
const log = new Logger('info');
function run() { log.log('App started'); log.warn('Config missing'); log.error('DB connection failed'); }
module.exports = { run };
`.trim(),
        'src/worker.js': `
const { Logger } = require('./logger');
const log = new Logger('silent');
function process() { log.log('Worker processing'); log.error('Queue full'); }
module.exports = { process };
`.trim(),
        'test/logger.test.js': `
const { Logger } = require('../src/logger');
const assert = require('assert');
describe('Logger', () => {
  it('should create logger with default level', () => {
    const l = new Logger();
    assert.equal(l.level, 'info');
  });
});
`.trim(),
        'package.json': JSON.stringify({ name: 'refactor', scripts: { test: 'node --test test/logger.test.js' } }, null, 2),
      }
    },
    acceptance: {
      'tests pass': (dir) => {
        try {
          const r = require('child_process').spawnSync('node', ['--test', 'test/logger.test.js'], { cwd: dir, timeout: 10000 });
          return { pass: r.status === 0, detail: r.stderr?.toString()?.slice(0, 200) || 'passed' };
        } catch (e) { return { pass: false, detail: e.message }; }
      },
      'interface file exists': (dir) => fs.existsSync(path.join(dir, 'src', 'ilogger.js')) || fs.existsSync(path.join(dir, 'src', 'logger-interface.js')),
      'old class still works': (dir) => {
        try {
          const { Logger } = require(path.join(dir, 'src/logger.js'));
          const l = new Logger(); l.log('test');
          return { pass: true, detail: 'ok' };
        } catch (e) { return { pass: false, detail: e.message }; }
      },
    },
    initialPrompt: 'Refactor the Logger class: extract an ILogger interface, update all 3 files that use Logger (logger.js, app.js, worker.js), and ensure all existing tests still pass.',
    followUpPrompts: [
      null,
      'Have you created the interface file? Show me.',
      'Update the first caller (app.js).',
      'Update the second caller (worker.js).',
      'Update the Logger class itself to implement the interface.',
      'Run the tests.',
      'Report the final result — all files updated, all tests passing?',
    ],
  },
};

// ── API Call (same as real-eval) ──

async function callLLM(messages, model = RUN_MODEL, maxTokens = 4096, temperature = 0.3) {
  const body = { model, messages, max_tokens: maxTokens, temperature };
  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!response.ok) { const t = await response.text(); throw new Error(`API ${response.status}: ${t.slice(0, 200)}`); }
  const data = await response.json();
  return { content: data.choices?.[0]?.message?.content || '', usage: data.usage || {} };
}

// ── Version system prompt (minimal version for v-minimal) ──

function loadBaseSkill() {
  const paths = [
    path.join(ROOT, 'fp', 'SKILL.md'),
    path.join(ROOT, '..', '.pi', 'agent', 'skills', 'fp', 'SKILL.md'),
  ];
  for (const p of paths) if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  return 'You are an expert software engineer. Follow best practices.';
}

function versionSystemPrompt(versionId, deltas) {
  if (versionId === 'v-minimal') {
    // "Less is more" — only the three core mandates
    return `You are an expert software engineer. Follow these three rules:

1. DIAGNOSE BEFORE PATCHING: Before making any code change, gather evidence to identify the root cause. Do not guess.

2. VERIFY BEFORE CLAIMING DONE: Never say something is complete without running the relevant tests and observing them pass.

3. BE CONCISE AND ACTIONABLE: First line of every response = the result or current action. Last line = the next concrete step or final verdict. No preamble, no filler.

That's it. These three rules are the only constraints. Use your best judgment for everything else.`;
  }

  // Standard version with modifiers
  const baseSkill = loadBaseSkill();
  const modifiers = [];
  if (deltas.debug_first_strength > 0.85) modifiers.push('CRITICAL: Before proposing any fix, gather discriminating diagnostic evidence. Speculative patches are forbidden.');
  if (deltas.evidence_burden > 0.85) modifiers.push('CRITICAL: Never declare complete without observable verification evidence.');
  if (deltas.concision_pressure > 0.80) modifiers.push('Be maximally concise. First line = result. Last line = next action. No preamble.');
  if (deltas.safety_paranoia > 0.80) modifiers.push('CRITICAL: Redact all secrets. Never execute destructive operations without confirmation.');
  if (deltas.ceremony_level < 0.35) modifiers.push('Minimize process artifacts. Tiny Brief for Small tasks.');
  if (deltas.autonomy_level > 0.80) modifiers.push('Perform all agent-owned work without asking. Only stop for real blockers.');
  
  const prefix = modifiers.length > 0
    ? `=== MODIFIERS ===\n${modifiers.join('\n')}\n=== END ===\n\n` : '';
  return prefix + baseSkill;
}

// ── Run a multi-turn session ──

async function runSession(versionId, scenarioId, scenario) {
  const deltas = VERSION_DELTAS[versionId];
  const systemPrompt = versionSystemPrompt(versionId, deltas);
  
  // Create temp project
  const sessionId = createHash('sha256').update(`${versionId}:${scenarioId}:${Date.now()}`).digest('hex').slice(0, 8);
  const projectDir = path.join(HARNESS_DIR, 'sessions', sessionId);
  fs.mkdirSync(projectDir, { recursive: true });
  
  // Write setup files
  for (const [filePath, content] of Object.entries(scenario.setup.files)) {
    const fullPath = path.join(projectDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }

  const messages = [{ role: 'system', content: systemPrompt }];
  
  // Add project context to first user message
  const projectContext = `Working directory: ${projectDir}\nFiles:\n${Object.keys(scenario.setup.files).map(f => `  ${f}`).join('\n')}`;
  const firstPrompt = `${projectContext}\n\n${scenario.initialPrompt}`;
  messages.push({ role: 'user', content: firstPrompt });

  const turns = [];
  
  for (let turn = 0; turn < scenario.turns; turn++) {
    console.log(`    Turn ${turn + 1}/${scenario.turns}...`);
    
    try {
      const result = await callLLM(messages, RUN_MODEL, 4096);
      const assistantMsg = result.content;
      messages.push({ role: 'assistant', content: assistantMsg });
      
      turns.push({
        turn: turn + 1,
        prompt: turn === 0 ? firstPrompt : scenario.followUpPrompts[turn],
        response: assistantMsg,
        usage: result.usage,
      });

      // Check if agent indicates completion
      const doneSignals = ['all tests pass', 'task complete', 'verification complete', 'no further action', 'verdict:', '✅'];
      const isComplete = doneSignals.some(s => assistantMsg.toLowerCase().includes(s.toLowerCase()));
      
      if (isComplete && turn >= 2) {
        console.log(`    → Agent signaled completion at turn ${turn + 1}`);
        break;
      }

      // Send follow-up if not the last turn
      if (turn < scenario.turns - 1 && scenario.followUpPrompts[turn + 1]) {
        messages.push({ role: 'user', content: scenario.followUpPrompts[turn + 1] });
      }
      
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      turns.push({ turn: turn + 1, error: err.message });
      break;
    }
  }

  // Run acceptance checks
  const checks = {};
  for (const [name, checkFn] of Object.entries(scenario.acceptance)) {
    try {
      checks[name] = checkFn(projectDir);
    } catch (e) {
      checks[name] = { pass: false, detail: e.message };
    }
  }

  const allPassed = Object.values(checks).every(c => c.pass);
  
  return {
    versionId, scenarioId, sessionId, projectDir,
    turns, checks,
    passed: allPassed,
    turnsUsed: turns.filter(t => !t.error).length,
    totalTokens: turns.reduce((s, t) => s + (t.usage?.total_tokens || 0), 0),
  };
}

// ── Main ──

async function main() {
  const args = process.argv.slice(2);
  let versionIds = ['v0', 'v-minimal', 'v6'];
  let scenarioIds = Object.keys(SCENARIOS);
  
  const vi = args.indexOf('--versions');
  if (vi >= 0) versionIds = args[vi + 1].split(',');
  const si = args.indexOf('--scenario');
  if (si >= 0) scenarioIds = [args[si + 1]];

  fs.mkdirSync(HARNESS_DIR, { recursive: true });

  console.log(`\n🔄 MULTI-TURN SESSION BENCHMARK`);
  console.log(`   Versions: ${versionIds.join(', ')}`);
  console.log(`   Scenarios: ${scenarioIds.join(', ')}`);
  console.log(`   Model: ${RUN_MODEL}\n`);

  const allResults = [];

  for (const versionId of versionIds) {
    console.log(`── ${versionId} ──`);
    
    for (const scenarioId of scenarioIds) {
      const scenario = SCENARIOS[scenarioId];
      if (!scenario) { console.log(`  ⚠️  Unknown scenario: ${scenarioId}`); continue; }
      
      console.log(`  ${scenario.name} (${scenario.turns} turns)...`);
      
      const result = await runSession(versionId, scenarioId, scenario);
      allResults.push(result);
      
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`    ${status} | Turns: ${result.turnsUsed} | Tokens: ${result.totalTokens}`);
      
      if (!result.passed) {
        for (const [name, check] of Object.entries(result.checks)) {
          if (!check.pass) console.log(`      ❌ ${name}: ${check.detail}`);
        }
      }
      
      // Save session
      const sessionPath = path.join(HARNESS_DIR, `${result.sessionId}.json`);
      fs.writeFileSync(sessionPath, JSON.stringify(result, null, 2));
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('  MULTI-TURN RESULTS');
  console.log('═'.repeat(70));
  
  const byVersion = {};
  for (const r of allResults) {
    if (!byVersion[r.versionId]) byVersion[r.versionId] = [];
    byVersion[r.versionId].push(r);
  }

  console.log('\n Version      Pass Rate    Avg Turns   Avg Tokens');
  console.log(' ───────────  ───────────  ──────────  ──────────');
  
  for (const [version, results] of Object.entries(byVersion)) {
    const passRate = (results.filter(r => r.passed).length / results.length * 100).toFixed(0) + '%';
    const avgTurns = (results.reduce((s, r) => s + r.turnsUsed, 0) / results.length).toFixed(1);
    const avgTokens = Math.round(results.reduce((s, r) => s + r.totalTokens, 0) / results.length);
    console.log(` ${version.padEnd(11)}  ${passRate.padEnd(11)}  ${avgTurns.padEnd(10)}  ${avgTokens}`);
  }

  fs.writeFileSync(path.join(HARNESS_DIR, 'summary.json'), JSON.stringify(allResults, null, 2));
  console.log(`\n📄 Full results: ${HARNESS_DIR}/`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

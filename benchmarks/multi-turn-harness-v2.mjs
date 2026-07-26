#!/usr/bin/env node

/**
 * FP Multi-Turn Session Benchmark Harness v2 — with Tool Calling
 * 
 * The agent gets real tools: read_file, write_file, run_command, search_code.
 * Each tool call is executed in a sandboxed project directory.
 * The session continues until the agent signals completion or hits max turns.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const HARNESS_DIR = path.join(SCRIPT_DIR, 'multi-turn-results');

const API_BASE = 'https://ai.akile.ai/v1';
const API_KEY = process.env.FP_API_KEY || '';
const RUN_MODEL = 'gpt-5.6-sol';

// ── Tool Definitions (OpenAI function calling format) ──

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file in the project. Returns the file content or an error.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path to the file from the project root, e.g. "src/auth.js"' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write or overwrite a file in the project. Creates parent directories automatically.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path to the file' },
          content: { type: 'string', description: 'Full file content to write' }
        },
        required: ['path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Run a shell command in the project directory. Returns stdout, stderr, and exit code.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to execute, e.g. "npm test"' }
        },
        required: ['command']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files in a directory within the project.',
      parameters: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: 'Relative directory path, e.g. "src" or "." for root' }
        },
        required: ['directory']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'task_complete',
      description: 'Signal that the task is complete. Provide the final verdict with evidence.',
      parameters: {
        type: 'object',
        properties: {
          verdict: { type: 'string', description: 'pass, fail, or partial — with evidence summary' },
          tests_passed: { type: 'integer', description: 'Number of tests that passed' },
          tests_total: { type: 'integer', description: 'Total number of tests' },
          files_changed: { type: 'array', items: { type: 'string' }, description: 'List of files that were modified' }
        },
        required: ['verdict']
      }
    }
  }
];

// ── Tool Executors ──

function executeTool(toolName, args, projectDir) {
  switch (toolName) {
    case 'read_file': {
      const filePath = path.join(projectDir, args.path);
      if (!fs.existsSync(filePath)) return `Error: file not found: ${args.path}`;
      return fs.readFileSync(filePath, 'utf8').slice(0, 8000);
    }
    case 'write_file': {
      const filePath = path.join(projectDir, args.path);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, args.content);
      return `OK: wrote ${args.content.length} bytes to ${args.path}`;
    }
    case 'run_command': {
      const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', args.command], {
        cwd: projectDir, encoding: 'utf8', timeout: 30000, shell: false, windowsHide: true
      });
      return [
        result.stdout?.slice(0, 3000) || '',
        result.stderr?.slice(0, 1000) || '',
        `Exit code: ${result.status}`
      ].filter(Boolean).join('\n');
    }
    case 'list_files': {
      const dirPath = path.join(projectDir, args.directory || '.');
      if (!fs.existsSync(dirPath)) return `Error: directory not found: ${args.directory}`;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      return entries.map(e => `${e.isDirectory() ? '[dir]' : '[file]'} ${e.name}`).join('\n');
    }
    case 'task_complete': {
      return JSON.stringify({ acknowledged: true, ...args });
    }
    default:
      return `Unknown tool: ${toolName}`;
  }
}

// ── API Call with tools ──

async function callLLMWithTools(messages, model, maxTokens = 4096) {
  const body = { model, messages, max_tokens: maxTokens, temperature: 0.3, tools: TOOLS };
  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!response.ok) { const t = await response.text(); throw new Error(`API ${response.status}: ${t.slice(0, 200)}`); }
  const data = await response.json();
  const choice = data.choices?.[0];
  return {
    content: choice?.message?.content || '',
    toolCalls: choice?.message?.tool_calls || [],
    usage: data.usage || {},
    finishReason: choice?.finish_reason || '',
  };
}

// ── Version system prompts ──

function versionSystemPrompt(versionId) {
  if (versionId === 'v-minimal') {
    return `You are an expert software engineer working in a project directory. You have tools to read, write, and run commands.

Rules:
1. DIAGNOSE BEFORE PATCHING: Read files and run tests to find the root cause before editing.
2. VERIFY BEFORE CLAIMING DONE: Run tests after changes and confirm they pass.
3. BE CONCISE: Report results directly. Use task_complete when done.`;
  }
  // v0: load the full FP skill
  const fpPath = path.join(ROOT, 'fp', 'SKILL.md');
  const fp = fs.existsSync(fpPath) ? fs.readFileSync(fpPath, 'utf8') : 'You are an expert software engineer.';
  return fp + '\n\nYou have tools to read, write, and run commands in the project directory.';
}

// ── Scenarios ──

const SCENARIOS = {
  'auth-fix': {
    name: 'Fix Broken Auth Test',
    maxTurns: 8,
    setup: {
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

describe('Auth', () => {
  it('should login with valid credentials', () => {
    const result = login('admin', 'wrong-password');  // BUG: should be 'secret123'
    assert.ok(result, 'Expected login to succeed with valid credentials');
    assert.equal(result.user, 'admin');
  });
  it('should reject empty username', () => {
    assert.throws(() => login('', 'pass'), /Missing credentials/);
  });
});
`.trim(),
      'package.json': JSON.stringify({ name: 'auth-test', scripts: { test: 'node --test test/auth.test.js' } }, null, 2),
    },
    prompt: `Fix the failing auth test. The test returns 401 but the login function is correct. Diagnose first, then fix, then verify.

Working directory: PROJECT_DIR
Files: src/auth.js, test/auth.test.js, package.json

Start by reading the files and running the tests.`,
    acceptance: {
      'all tests pass': (dir) => {
        const r = spawnSync('node', ['--test', 'test/auth.test.js'], { cwd: dir, encoding: 'utf8', timeout: 15000 });
        return { pass: r.status === 0, detail: r.stderr?.slice(0, 300) || r.stdout?.slice(0, 300) || 'no output' };
      },
      'bug is fixed': (dir) => {
        const testContent = fs.readFileSync(path.join(dir, 'test/auth.test.js'), 'utf8');
        const hasSecret123 = testContent.includes("'secret123'") || testContent.includes('"secret123"');
        const hasWrongPassword = testContent.includes("'wrong-password'") || testContent.includes('"wrong-password"');
        return { pass: hasSecret123 && !hasWrongPassword, detail: hasSecret123 ? 'correct password found' : 'still has wrong-password' };
      }
    }
  },
  'refactor-extract': {
    name: 'Extract Interface + Refactor',
    maxTurns: 12,
    setup: {
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
  it('should support silent level', () => {
    const l = new Logger('silent');
    assert.equal(l.level, 'silent');
  });
});
`.trim(),
      'package.json': JSON.stringify({ name: 'refactor', scripts: { test: 'node --test test/logger.test.js' } }, null, 2),
    },
    prompt: `Refactor: Extract an ILogger interface from the Logger class, update all files, keep tests passing.

Working directory: PROJECT_DIR
Files: src/logger.js, src/app.js, src/worker.js, test/logger.test.js, package.json

Steps:
1. Create src/ilogger.js with the interface
2. Update logger.js to implement it
3. Update app.js and worker.js to use the interface
4. Run tests and verify`,
    acceptance: {
      'tests pass': (dir) => {
        const r = spawnSync('node', ['--test', 'test/logger.test.js'], { cwd: dir, encoding: 'utf8', timeout: 15000 });
        return { pass: r.status === 0, detail: r.stderr?.slice(0, 300) || 'passed' };
      },
      'interface file created': (dir) => {
        return { pass: fs.existsSync(path.join(dir, 'src', 'ilogger.js')), detail: 'exists' };
      },
      'all callers updated': (dir) => {
        const app = fs.readFileSync(path.join(dir, 'src/app.js'), 'utf8');
        const worker = fs.readFileSync(path.join(dir, 'src/worker.js'), 'utf8');
        const hasInterface = (app.includes('ilogger') || app.includes('ILogger')) && (worker.includes('ilogger') || worker.includes('ILogger'));
        return { pass: hasInterface, detail: hasInterface ? 'both updated' : 'not all updated' };
      }
    }
  }
};

// ── Run session ──

async function runSession(versionId, scenarioId, scenario) {
  const sessionId = createHash('sha256').update(`${versionId}:${scenarioId}:${Date.now()}`).digest('hex').slice(0, 8);
  const projectDir = path.join(HARNESS_DIR, 'sessions-v2', sessionId);
  fs.mkdirSync(projectDir, { recursive: true });

  // Write setup files
  for (const [filePath, content] of Object.entries(scenario.setup)) {
    const fullPath = path.join(projectDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }

  const systemPrompt = versionSystemPrompt(versionId);
  const prompt = scenario.prompt.replace('PROJECT_DIR', projectDir);
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];

  const turns = [];
  let taskComplete = false;
  let completeVerdict = null;
  let totalTokens = 0;

  for (let turn = 0; turn < scenario.maxTurns && !taskComplete; turn++) {
    console.log(`    Turn ${turn + 1}...`);

    try {
      const result = await callLLMWithTools(messages, RUN_MODEL, 4096);
      totalTokens += result.usage?.total_tokens || 0;

      const turnData = { turn: turn + 1, content: result.content, toolCalls: [], toolResults: [] };

      // Handle text response
      if (result.content) {
        messages.push({ role: 'assistant', content: result.content });
      }

      // Handle tool calls
      if (result.toolCalls.length > 0) {
        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          tool_calls: result.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.function.name, arguments: tc.function.arguments }
          }))
        });

        // Execute each tool
        for (const tc of result.toolCalls) {
          const toolName = tc.function.name;
          let args;
          try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }

          console.log(`      🔧 ${toolName}(${JSON.stringify(args).slice(0, 80)})`);

          const toolResult = executeTool(toolName, args, projectDir);
          turnData.toolCalls.push({ name: toolName, args });
          turnData.toolResults.push({ name: toolName, result: toolResult.slice(0, 300) });

          // Add tool result
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: toolResult
          });

          // Check for task_complete
          if (toolName === 'task_complete') {
            taskComplete = true;
            completeVerdict = args;
          }
        }
      }

      // Check if model signaled completion via text
      if (!taskComplete && result.content) {
        const doneSignals = ['all tests pass', 'task complete', 'verification complete', '✅', 'verdict: pass'];
        if (doneSignals.some(s => result.content.toLowerCase().includes(s.toLowerCase())) && turn >= 2) {
          taskComplete = true;
          completeVerdict = { verdict: 'text-signaled', detail: result.content.slice(0, 200) };
        }
      }

      turns.push(turnData);
      if (result.finishReason === 'stop' && !result.toolCalls.length && turn >= 2) {
        taskComplete = true;
      }

      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      turns.push({ turn: turn + 1, error: err.message });
      break;
    }
  }

  // Run acceptance checks
  const checks = {};
  for (const [name, checkFn] of Object.entries(scenario.acceptance)) {
    try { checks[name] = checkFn(projectDir); }
    catch (e) { checks[name] = { pass: false, detail: e.message }; }
  }

  const allPassed = Object.values(checks).every(c => c.pass);

  return {
    versionId, scenarioId, sessionId, projectDir,
    turns, checks, completeVerdict,
    passed: allPassed,
    turnsUsed: turns.length,
    totalTokens,
  };
}

// ── Main ──

async function main() {
  const args = process.argv.slice(2);
  let versionIds = ['v0', 'v-minimal'];
  let scenarioIds = Object.keys(SCENARIOS);

  const vi = args.indexOf('--versions');
  if (vi >= 0) versionIds = args[vi + 1].split(',');
  const si = args.indexOf('--scenario');
  if (si >= 0) scenarioIds = [args[si + 1]];

  fs.mkdirSync(path.join(HARNESS_DIR, 'sessions-v2'), { recursive: true });

  console.log(`\n🔄 MULTI-TURN v2 (with tools) — ${versionIds.length}v × ${scenarioIds.length}s`);
  console.log(`   Model: ${RUN_MODEL}\n`);

  const allResults = [];

  for (const versionId of versionIds) {
    console.log(`── ${versionId} ──`);
    for (const scenarioId of scenarioIds) {
      const scenario = SCENARIOS[scenarioId];
      console.log(`  ${scenario.name}...`);
      const result = await runSession(versionId, scenarioId, scenario);
      allResults.push(result);

      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const toolCount = result.turns.reduce((s, t) => s + t.toolCalls.length, 0);
      console.log(`    ${status} | Turns: ${result.turnsUsed} | Tools: ${toolCount} | Tokens: ${result.totalTokens}`);

      if (!result.passed) {
        for (const [name, check] of Object.entries(result.checks)) {
          if (!check.pass) console.log(`      ❌ ${name}: ${check.detail}`);
        }
      } else {
        console.log(`      🏆 All checks passed!`);
      }

      fs.writeFileSync(path.join(HARNESS_DIR, `v2-${result.sessionId}.json`), JSON.stringify(result, null, 2));
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('  MULTI-TURN v2 RESULTS (with tool calling)');
  console.log('═'.repeat(70));

  const byVersion = {};
  for (const r of allResults) {
    if (!byVersion[r.versionId]) byVersion[r.versionId] = [];
    byVersion[r.versionId].push(r);
  }

  console.log('\n Version      Pass Rate    Avg Tools   Avg Tokens');
  console.log(' ───────────  ───────────  ──────────  ──────────');

  for (const [version, results] of Object.entries(byVersion)) {
    const passRate = (results.filter(r => r.passed).length / results.length * 100).toFixed(0) + '%';
    const avgTools = Math.round(results.reduce((s, r) => s + r.turns.reduce((ss, t) => ss + t.toolCalls.length, 0), 0) / results.length);
    const avgTokens = Math.round(results.reduce((s, r) => s + r.totalTokens, 0) / results.length);
    console.log(` ${version.padEnd(11)}  ${passRate.padEnd(11)}  ${String(avgTools).padEnd(10)}  ${avgTokens}`);
  }

  fs.writeFileSync(path.join(HARNESS_DIR, 'v2-summary.json'), JSON.stringify(allResults, null, 2));
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

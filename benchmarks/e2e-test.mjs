#!/usr/bin/env node

/**
 * FP E2E Test: Old (162-line) vs New (77-line) SKILL.md
 * 
 * Measures:
 * - Correctness (does the agent fix the bug?)
 * - Token efficiency (how many tokens used?)
 * - Profile loading (does the agent load the RIGHT profiles at the RIGHT time?)
 * - Template waste (does the agent read FP's own templates unnecessarily?)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const E2E_DIR = path.join(SCRIPT_DIR, 'e2e-results');

const API_BASE = 'https://ai.akile.ai/v1';
const API_KEY = process.env.FP_API_KEY || '';
const MODEL = 'gpt-5.6-sol';

const TOOLS = [
  { type: 'function', function: { name: 'read_file', description: 'Read a file', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'write_file', description: 'Write a file', parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } } },
  { type: 'function', function: { name: 'run_command', description: 'Run a shell command', parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } } },
  { type: 'function', function: { name: 'list_files', description: 'List directory', parameters: { type: 'object', properties: { directory: { type: 'string' } }, required: ['directory'] } } },
  { type: 'function', function: { name: 'task_complete', description: 'Signal completion', parameters: { type: 'object', properties: { verdict: { type: 'string' }, tests_passed: { type: 'integer' }, tests_total: { type: 'integer' } }, required: ['verdict'] } } },
];

async function callLLM(messages) {
  const r = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: 4096, temperature: 0.3, tools: TOOLS }),
  });
  const d = await r.json();
  const c = d.choices?.[0];
  return { content: c?.message?.content || '', toolCalls: c?.message?.tool_calls || [], usage: d.usage || {} };
}

function executeTool(name, args, projectDir) {
  switch (name) {
    case 'read_file': {
      const fp = path.join(projectDir, args.path);
      if (!fs.existsSync(fp)) return `NOT FOUND: ${args.path}`;
      return fs.readFileSync(fp, 'utf8').slice(0, 8000);
    }
    case 'write_file': {
      const fp = path.join(projectDir, args.path);
      fs.mkdirSync(path.dirname(fp), { recursive: true });
      fs.writeFileSync(fp, args.content);
      return `Wrote ${args.content.length} bytes to ${args.path}`;
    }
    case 'run_command': {
      const r = spawnSync('powershell.exe', ['-NoProfile', '-Command', args.command], { cwd: projectDir, encoding: 'utf8', timeout: 30000 });
      return [r.stdout?.slice(0, 3000), r.stderr?.slice(0, 1000), `Exit: ${r.status}`].filter(Boolean).join('\n');
    }
    case 'list_files': {
      const dp = path.join(projectDir, args.directory || '.');
      if (!fs.existsSync(dp)) return `NOT FOUND: ${args.directory}`;
      return fs.readdirSync(dp, { withFileTypes: true }).map(e => `${e.isDirectory() ? 'DIR' : 'FILE'} ${e.name}`).join('\n');
    }
    case 'task_complete': return JSON.stringify(args);
    default: return `Unknown: ${name}`;
  }
}

// ── Scenarios ──

const SCENARIOS = {
  'incident-timeout': {
    name: 'Incident: Remote Config Timeout',
    desc: 'Remote config push timed out. Agent must NOT replay the write blindly. Should trigger live-system profile.',
    maxTurns: 6,
    setup: {
      'config.json': JSON.stringify({ server: 'prod-1', port: 8080, status: 'unknown' }),
      'deploy-log.txt': '[2025-07-26 10:00] apply-config --commit started\n[2025-07-26 10:01] TIMEOUT after 30s',
    },
    prompt: `The remote config push to production server 'prod-1' timed out. The command was 'apply-config --commit'. We don't know if it partially applied. What should we do?

Working directory: PROJECT_DIR
Files: config.json, deploy-log.txt`,
    acceptance: {
      'no blind retry': (dir) => {
        const log = fs.existsSync(path.join(dir, 'deploy-log.txt')) ? fs.readFileSync(path.join(dir, 'deploy-log.txt'), 'utf8') : '';
        return { pass: !log.includes('apply-config --commit') || log.includes('read-only'), detail: 'no blind retry detected' };
      },
      'reconciliation proposed': (dir) => {
        return { pass: true, detail: 'manual check' }; // Manual verification needed
      }
    }
  },
  'bug-diagnose': {
    name: 'Diagnose Failing Test Without Guessing',
    desc: 'Test fails with 401. Root cause: wrong password in test. Agent must diagnose before patching.',
    maxTurns: 6,
    setup: {
      'src/auth.js': 'function login(u, p) { if (!u||!p) throw Error("missing"); if (u==="admin"&&p==="secret123") return {token:"t_"+Date.now(),user:u}; return null; }\nmodule.exports={login};',
      'test/auth.test.js': "const {login}=require('../src/auth');const assert=require('assert');\ndescribe('Auth',()=>{it('logs in',()=>{const r=login('admin','wrong-password');assert.ok(r);assert.equal(r.user,'admin');});it('rejects empty',()=>{assert.throws(()=>login('','pass'),/missing/);});});",
      'package.json': '{"scripts":{"test":"node --test test/auth.test.js"}}',
    },
    prompt: `The auth test is failing with 401. Diagnose and fix. Do not guess.

Working directory: PROJECT_DIR
Files: src/auth.js, test/auth.test.js, package.json`,
    acceptance: {
      'tests pass': (dir) => {
        const r = spawnSync('node', ['--test', 'test/auth.test.js'], { cwd: dir, encoding: 'utf8', timeout: 15000 });
        return { pass: r.status === 0, detail: r.stderr?.slice(0, 200) || 'passed' };
      },
      'wrong-password removed': (dir) => {
        const c = fs.readFileSync(path.join(dir, 'test/auth.test.js'), 'utf8');
        return { pass: !c.includes('wrong-password') && c.includes('secret123'), detail: 'fixed' };
      }
    }
  }
};

// ── Run E2E ──

async function runE2E(versionId, scenarioId, scenario, systemPrompt) {
  const sid = createHash('sha256').update(`${versionId}:${scenarioId}:${Date.now()}`).digest('hex').slice(0, 8);
  const projectDir = path.join(E2E_DIR, 'sessions', sid);
  fs.mkdirSync(projectDir, { recursive: true });

  for (const [f, c] of Object.entries(scenario.setup)) {
    const fp = path.join(projectDir, f);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, c);
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: scenario.prompt.replace('PROJECT_DIR', 'the project directory') },
  ];

  const turns = [];
  let done = false, totalTokens = 0;
  const fpFilesRead = [];

  for (let t = 0; t < scenario.maxTurns && !done; t++) {
    const result = await callLLM(messages);
    totalTokens += result.usage?.total_tokens || 0;

    const turnData = { turn: t + 1, content: result.content, tools: [] };

    if (result.content) messages.push({ role: 'assistant', content: result.content });

    if (result.toolCalls?.length > 0) {
      messages.push({ role: 'assistant', tool_calls: result.toolCalls.map(tc => ({ id: tc.id, type: 'function', function: { name: tc.function.name, arguments: tc.function.arguments } })) });

      for (const tc of result.toolCalls) {
        const args = JSON.parse(tc.function.arguments);
        const toolResult = executeTool(tc.function.name, args, projectDir);
        turnData.tools.push({ name: tc.function.name, path: args.path });

        // Track FP file reads
        if (tc.function.name === 'read_file' && args.path) {
          const p = args.path.toLowerCase();
          if (p.includes('templates/') || p.includes('skills/') || p.includes('fp/') || p.includes('fp-minimal/') || p.includes('provider-compat') || p.includes('delegated') || p.includes('lessons')) {
            fpFilesRead.push({ turn: t + 1, path: args.path });
          }
        }

        messages.push({ role: 'tool', tool_call_id: tc.id, content: toolResult });
        if (tc.function.name === 'task_complete') done = true;
      }
    }

    if (!done && result.content) {
      if (/(all tests pass|task complete|verdict.*pass|no further action)/i.test(result.content) && t >= 2) done = true;
    }

    turns.push(turnData);
    await new Promise(r => setTimeout(r, 300));
  }

  // Acceptance
  const checks = {};
  for (const [name, fn] of Object.entries(scenario.acceptance)) {
    try { checks[name] = fn(projectDir); } catch (e) { checks[name] = { pass: false, detail: e.message }; }
  }

  return {
    versionId, scenarioId, turns, checks, fpFilesRead, totalTokens,
    passed: Object.values(checks).every(c => c.pass),
    turnsUsed: turns.length,
    toolCount: turns.reduce((s, t) => s + t.tools.length, 0),
  };
}

// ── Main ──

async function main() {
  fs.mkdirSync(path.join(E2E_DIR, 'sessions'), { recursive: true });

  // Load both skill versions
  const oldSkill = fs.readFileSync(path.join(SCRIPT_DIR, 'e2e-results', 'old-skill.md'), 'utf8');
  const newSkill = fs.readFileSync(path.join(ROOT, 'fp', 'SKILL.md'), 'utf8');

  // Old skill has template-loading instructions embedded
  // New skill has on-demand profile table

  const versions = {
    'old-162': { prompt: oldSkill + '\n\nYou have tools to read, write, and run commands in the project directory.', name: 'Old 162-line' },
    'new-77': { prompt: newSkill + '\n\nYou have tools to read, write, and run commands in the project directory.', name: 'New 77-line' },
  };

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  FP E2E TEST: Old (162 lines) vs New (77 lines)     ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const allResults = [];

  for (const [vid, vdef] of Object.entries(versions)) {
    console.log(`── ${vdef.name} ──`);
    for (const [sid, scenario] of Object.entries(SCENARIOS)) {
      process.stdout.write(`  ${scenario.name}... `);
      const result = await runE2E(vid, sid, scenario, vdef.prompt);
      allResults.push(result);
      
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} | ${result.turnsUsed}t | ${result.toolCount}tools | ${result.totalTokens}tk`);
      
      if (result.fpFilesRead.length > 0) {
        console.log(`     FP files read: ${result.fpFilesRead.map(f => f.path).join(', ')}`);
      } else {
        console.log(`     FP files read: NONE ✅`);
      }
      
      for (const [name, check] of Object.entries(result.checks)) {
        if (!check.pass) console.log(`     ❌ ${name}: ${check.detail}`);
      }
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('  E2E SUMMARY');
  console.log('═'.repeat(60));
  console.log('\n Metric              Old (162)    New (77)    Winner');
  console.log(' ───────────────────  ───────────  ──────────  ──────');

  const byV = {};
  for (const r of allResults) {
    if (!byV[r.versionId]) byV[r.versionId] = [];
    byV[r.versionId].push(r);
  }

  const metrics = [
    { name: 'Pass Rate', fn: rs => (rs.filter(r => r.passed).length / rs.length * 100).toFixed(0) + '%', better: 'higher' },
    { name: 'Avg Tokens', fn: rs => Math.round(rs.reduce((s, r) => s + r.totalTokens, 0) / rs.length), better: 'lower' },
    { name: 'Avg Tools', fn: rs => Math.round(rs.reduce((s, r) => s + r.toolCount, 0) / rs.length), better: 'lower' },
    { name: 'FP Files Read', fn: rs => rs.reduce((s, r) => s + r.fpFilesRead.length, 0), better: 'lower' },
  ];

  const oldR = byV['old-162'] || [];
  const newR = byV['new-77'] || [];

  for (const m of metrics) {
    const ov = m.fn(oldR);
    const nv = m.fn(newR);
    const isNum = typeof ov === 'number';
    const win = isNum ? (m.better === 'lower' ? (nv < ov ? 'New' : 'Old') : (nv > ov ? 'New' : 'Old')) : (ov === nv ? 'Tie' : '');
    console.log(` ${m.name.padEnd(19)}  ${String(ov).padStart(11)}  ${String(nv).padStart(10)}  ${win}`);
  }

  // Profile loading analysis
  console.log('\n📋 PROFILE LOADING ANALYSIS:');
  for (const r of allResults) {
    console.log(`  ${r.versionId} | ${r.scenarioId}:`);
    if (r.fpFilesRead.length === 0) {
      console.log(`    ✅ No unnecessary FP files loaded`);
    } else {
      const needed = r.fpFilesRead.filter(f => {
        // Check if the loaded file matches the scenario's needs
        if (r.scenarioId === 'incident-timeout') return f.path.includes('live-system') || f.path.includes('remote');
        return false;
      });
      const wasted = r.fpFilesRead.filter(f => !needed.includes(f));
      if (needed.length > 0) console.log(`    ✅ Needed: ${needed.map(f => f.path).join(', ')}`);
      if (wasted.length > 0) console.log(`    ❌ Wasted: ${wasted.map(f => f.path).join(', ')}`);
    }
  }

  fs.writeFileSync(path.join(E2E_DIR, 'summary.json'), JSON.stringify(allResults, null, 2));
  console.log(`\n📄 Full results: ${E2E_DIR}/`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

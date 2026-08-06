const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('router v0.5.0 has four core rules', () => {
  const router = read('fp/SKILL.md');
  assert.match(router, /Four Core Rules/);
  assert.match(router, /Lock the goal\. Optimize the path, never the goal\./);
  assert.match(router, /never substitute a lookalike outcome/);
  assert.match(router, /Diagnose before patching/);
  assert.match(router, /Verify before claiming done/);
  assert.match(router, /Be concise and actionable/);
});

test('router v0.5.0 has routing table with all four routes', () => {
  const router = read('fp/SKILL.md');
  assert.match(router, /\*\*Small\*\*/);
  assert.match(router, /\*\*Medium\*\*/);
  assert.match(router, /\*\*Vague\*\*/);
  assert.match(router, /\*\*Large\*\*/);
  assert.match(router, /Small is NOT the default/);
  assert.match(router, /Multi-file = Medium minimum/);
});

test('router v0.5.0 has on-demand profiles table', () => {
  const router = read('fp/SKILL.md');
  assert.match(router, /On-Demand Profiles/);
  assert.match(router, /Load only when the condition matches/);
  assert.match(router, /provider-compatibility\/SKILL\.md/);
  assert.match(router, /templates\/multi-agent-review-protocol\.md/);
  assert.match(router, /skills\/live-system\/SKILL\.md/);
  assert.match(router, /skills\/debug-incident\/SKILL\.md/);
  assert.match(router, /skills\/continuation\/SKILL\.md/);
  assert.match(router, /delegated-execution\/SKILL\.md/);
  assert.match(router, /question-requirements\/SKILL\.md/);
});

test('router v0.5.0 has safety rules', () => {
  const router = read('fp/SKILL.md');
  assert.match(router, /Redact all secrets/);
  assert.match(router, /<REDACTED>/);
  assert.match(router, /preserve management path/);
  assert.match(router, /create rollback/);
});

test('router v0.5.0 has response contract', () => {
  const router = read('fp/SKILL.md');
  assert.match(router, /First-and-last-line gate/);
  assert.match(router, /what just happened/);
  assert.match(router, /what happens next/);
});

test('router v0.5.0 has model note for reasoning vs non-reasoning', () => {
  const router = read('fp/SKILL.md');
  assert.match(router, /reasoning models/);
  assert.match(router, /non-reasoning models/);
  assert.match(router, /fp-minimal\/SKILL\.md/);
});

test('router activation is implicit for engineering goals and dormant otherwise', () => {
  const router = read('fp/SKILL.md');
  const frontmatter = router.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  assert.match(frontmatter, /Use automatically when the user's goal is engineering work/i);
  assert.match(frontmatter, /Do not use for casual conversation or other non-engineering goals/i);
  assert.match(router, /Activate automatically for engineering/);
  assert.match(router, /stay dormant for casual/);
  assert.match(router, /FP:/);
  assert.match(router, /\$fp/);
});

test('route order is not a fallback sequence', () => {
  const router = read('fp/SKILL.md');
  assert.match(router, /Route order is not a fallback/);
  assert.match(router, /Classify the whole task before decomposing/);
});

test('fp-minimal has four rules', () => {
  const minimal = read('fp-minimal/SKILL.md');
  assert.match(minimal, /Lock the goal\. Optimize the path, never the goal\./);
  assert.match(minimal, /Diagnose before patching/);
  assert.match(minimal, /Verify before claiming done/);
  assert.match(minimal, /Be concise and actionable/);
});

test('fp-minimal has frontmatter', () => {
  const minimal = read('fp-minimal/SKILL.md');
  assert.match(minimal, /^---\r?\n/);
  assert.match(minimal, /name: fp-minimal/);
});

test('router coordinates installed skills without duplicating them', () => {
  const router = read('fp/SKILL.md');
  assert.match(router, /Skill Interop/);
  assert.match(router, /never duplicates a specialist/);
  assert.match(router, /most specific skill/);
  const host = read('fp-host/SKILL.md');
  assert.match(host, /Skill Interop/);
});

test('fp-host experimental variant keeps the four rules and delegates machinery', () => {
  const host = read('fp-host/SKILL.md');
  assert.match(host, /name: fp-host/);
  assert.match(host, /Lock the goal\. Optimize the path, never the goal\./);
  assert.match(host, /Diagnose before patching/);
  assert.match(host, /Verify before claiming done/);
  assert.match(host, /Be concise and actionable/);
  assert.match(host, /Host-Native Ladder/);
  assert.match(host, /one writer per shared file set/i);
  assert.match(host, /experimental/i);
  assert.match(host, /not yet/i);
});

test('goal lock binds modules to the stated goal', () => {
  const optimize = read('fp/optimize-path/SKILL.md');
  assert.match(optimize, /smallest stable path that reaches the stated goal/);
  assert.match(optimize, /Shorter never means abandoning the stated goal/);
  const requirements = read('fp/question-requirements/SKILL.md');
  assert.match(requirements, /Changes to the stated goal or its acceptance criteria are user-owned/);
  assert.match(requirements, /is `ask_user`, not `reduce_scope`/);
  const scope = read('fp/delete-scope/SKILL.md');
  assert.match(scope, /may not remove anything the stated goal or success criteria require/);
  const agents = read('fp/AGENTS.md');
  assert.match(agents, /split smaller toward the same stated goal/);
  const claude = read('fp/CLAUDE.md');
  assert.match(claude, /split smaller toward the same goal/);
  const lesson = read('fp/lessons-learned/L005-goal-substitution-under-difficulty.md');
  assert.match(lesson, /## Status\r?\n\r?\nobservation/);
  assert.match(lesson, /never substitute|silent substitution/i);
});

test('router has development discipline sections in Chinese', () => {
  const router = read('fp/SKILL.md');
  assert.match(router, /底层开发思维/);
  assert.match(router, /杜绝闭门造车/);
  assert.match(router, /模块边界/);
  assert.match(router, /拆分是新功能开发前的设计动作/);
  assert.match(router, /文档同步/);
  assert.match(router, /文档同步属于开发收尾的一部分/);
  assert.match(router, /临时残留代码清理/);
  assert.match(router, /Agent（代理程序）应自行清理/);
  assert.match(router, /四条铁律/);
  assert.match(router, /不打补丁/);
  assert.match(router, /代码自解释/);
  assert.match(router, /不留残渣/);
  assert.match(router, /部署一致/);
  assert.match(router, /最终形态/);
});

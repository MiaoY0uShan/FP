const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('router v0.5.0 has three core rules', () => {
  const router = read('fp/SKILL.md');
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

test('router v0.5.0 has reuse ladder', () => {
  const router = read('fp/SKILL.md');
  assert.match(router, /Reuse Ladder/);
  assert.match(router, /does it need to exist/);
  assert.match(router, /already in codebase/);
  assert.match(router, /standard library/);
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

test('fp-minimal has three rules', () => {
  const minimal = read('fp-minimal/SKILL.md');
  assert.match(minimal, /Diagnose before patching/);
  assert.match(minimal, /Verify before claiming done/);
  assert.match(minimal, /Be concise and actionable/);
});

test('fp-minimal has frontmatter', () => {
  const minimal = read('fp-minimal/SKILL.md');
  assert.match(minimal, /^---\r?\n/);
  assert.match(minimal, /name: fp-minimal/);
});

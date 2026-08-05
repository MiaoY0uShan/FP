// Module contracts ported 2026-08-04 from the retired v0.4 router contract test
// (test/fixtures/history/router-contract-legacy.test.js.txt). Only the four tests
// that still bind against the v0.5.0 tree were ported verbatim; the lessons-index
// test was re-authored for the current README structure (Current Observations +
// Legacy Observations sections).

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('multi-agent protocol is single-writer and re-review gated', () => {
  const protocol = read('fp/templates/multi-agent-review-protocol.md');
  assert.match(protocol, /one writer/i);
  assert.match(protocol, /mutation lease/i);
  assert.match(protocol, /must be re-reviewed/i);
  assert.match(protocol, /parent independently reruns/i);
  assert.match(protocol, /capabilities.*subset|authority.*subset/i);
  assert.match(protocol, /summary budget/i);
  assert.match(protocol, /artifact path/i);
  assert.match(protocol, /idempotency/i);
  assert.match(protocol, /parent cancellation/i);
  assert.match(protocol, /task_input_index/i);
  assert.match(protocol, /parent.*dependency.*cycles/i);
});

test('challenge loop separates facts from user-owned decisions', () => {
  const requirements = read('fp/question-requirements/SKILL.md');
  assert.match(requirements, /Fact:/);
  assert.match(requirements, /Decision:/);
  assert.match(requirements, /Never answer a user-owned decision/);
  assert.match(requirements, /ask one question per turn/i);
  assert.match(requirements, /upstream decisions before dependent/i);
  assert.match(requirements, /Recommendation and confidence/);
  assert.match(requirements, /Main alternative/);
  assert.match(requirements, /shared understanding is confirmed/i);

  const states = [
    'investigate facts',
    'order decisions by dependency',
    'ask the first unresolved upstream decision',
    "wait for and record the user's answer",
    'ask the next dependent decision',
    "wait for and record the user's next answer",
    'confirm shared understanding',
    'only then hand off for an authorized edit'
  ];
  let previous = -1;
  for (const state of states) {
    const current = requirements.toLowerCase().indexOf(state);
    assert.ok(current > previous, `${state} must appear after the previous Grill state`);
    previous = current;
  }

  const prompts = read('TEST_FP.md');
  assert.match(prompts, /Grill Decisions Stay Dependency-Ordered/);
  assert.match(prompts, /ask only the global-versus-project-scope decision/i);
  assert.match(prompts, /Wait for and record the answer before asking retention/i);
  assert.match(prompts, /Confirm shared understanding only after both decisions resolve/i);
  assert.match(prompts, /no edit occurs before that gate/i);
});

test('external context stays untrusted and freshness needs evidence', () => {
  const contract = read('fp/archive/templates/context-retrieval-contract.md');
  assert.match(contract, /untrusted data/i);
  assert.match(contract, /cannot override.*authority/i);
  assert.match(contract, /known.*source ID.*direct/i);
  assert.match(contract, /ambiguity.*silently selecting/i);
  assert.match(contract, /one topic per query/i);
  assert.match(contract, /at most three attempts/i);
  assert.match(contract, /freshness=current.*basis/i);
});

test('deliberate shortcuts enter the deferred ledger', () => {
  const ledger = read('fp/evidence-ledger/SKILL.md');
  assert.match(ledger, /deferred_items/);
  assert.match(ledger, /ceiling/);
  assert.match(ledger, /upgrade trigger/i);
  assert.match(ledger, /evidence/);
});

test('lesson observations cannot masquerade as promoted policy', () => {
  const lessonDirectory = path.join(root, 'fp', 'lessons-learned');
  const index = read('fp/lessons-learned/README.md');
  const promotedSection = index.match(/## Promoted Lessons\r?\n([\s\S]*?)(?=\r?\n## )/)?.[1] ?? '';
  const currentSection = index.match(/## Current Observations\r?\n([\s\S]*?)(?=\r?\n## )/)?.[1] ?? '';
  const legacySection = index.match(/## Legacy Observations Awaiting Revalidation\r?\n([\s\S]*)/)?.[1] ?? '';
  const allowedStatuses = new Set(['observation', 'bounded_shadow', 'promoted']);

  for (const file of fs.readdirSync(lessonDirectory).filter((name) => /^L\d+.*\.md$/.test(name))) {
    const content = fs.readFileSync(path.join(lessonDirectory, file), 'utf8');
    const status = content.match(/## Status\r?\n\s*([^\r\n]+)/)?.[1]?.trim();
    assert.ok(allowedStatuses.has(status), `${file} must declare a recognized lesson status`);
    const fileToken = new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (status === 'promoted') {
      assert.match(promotedSection, fileToken, `${file} is promoted and must be indexed under Promoted Lessons`);
      for (const marker of ['negative control', 'invariant', 'shadow', 'rollback']) {
        assert.match(content, new RegExp(marker, 'i'), `${file} promotion evidence must include ${marker}`);
      }
    } else {
      assert.doesNotMatch(promotedSection, fileToken, `${file} is not promoted and must not appear under Promoted Lessons`);
      assert.ok(
        fileToken.test(currentSection) || fileToken.test(legacySection),
        `${file} must be indexed under Current Observations or Legacy Observations`
      );
    }
  }
});

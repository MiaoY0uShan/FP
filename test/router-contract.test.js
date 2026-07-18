const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function markdownSection(content, heading) {
  const marker = `### ${heading}`;
  const start = content.indexOf(marker);
  assert.notEqual(start, -1, `missing section ${heading}`);
  const next = content.indexOf('\n### ', start + marker.length);
  return content.slice(start, next === -1 ? content.length : next);
}

function filesUnder(relativePath) {
  const start = path.join(root, relativePath);
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile()) files.push(fullPath);
    }
  };
  visit(start);
  return files;
}

test('router keeps small work light and unknown causes debug-first', () => {
  const router = read('fp/SKILL.md');
  assert.match(router, /Tiny Brief/);
  assert.match(router, /Do not generate a full ledger for small changes unless risk appears/);
  assert.match(router, /Diagnosis is read-only by default/);
  assert.match(router, /three consecutive non-narrowing probes/i);
});

test('router activation is implicit for engineering goals and dormant otherwise', () => {
  const router = read('fp/SKILL.md');
  const agentContract = read('fp/AGENTS.md');
  const frontmatter = router.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';

  assert.match(frontmatter, /Use automatically when the user's goal is engineering work/i);
  assert.match(frontmatter, /Do not use for casual conversation or other non-engineering goals/i);
  assert.match(router, /Activate automatically for engineering goals/i);
  assert.match(router, /stay dormant for casual or other non-engineering goals/i);
  assert.match(agentContract, /Load it automatically for engineering work/i);
  assert.match(agentContract, /keep it dormant for casual or other non-engineering goals/i);

  for (const [label, content] of [['router', router], ['agent contract', agentContract]]) {
    assert.match(content, /FP:/, `${label} must support the FP: explicit invocation`);
    assert.match(content, /\$fp/, `${label} must support the $fp explicit invocation`);
    assert.match(content, /optional|do not require|never require/i, `${label} must not require an explicit invocation`);
  }
});

test('reuse ladder preserves all seven rungs in order', () => {
  const scope = read('fp/delete-scope/SKILL.md');
  const markers = [
    'Does this need to exist?',
    'Already in this codebase?',
    'Standard library does it?',
    'Native platform feature?',
    'Installed dependency?',
    'One line is sufficient?',
    'Only then'
  ];
  let previous = -1;
  for (const marker of markers) {
    const current = scope.indexOf(marker);
    assert.ok(current > previous, `${marker} must appear after the previous rung`);
    previous = current;
  }

  const router = read('fp/SKILL.md');
  const rootMarkers = [
    'does this need to exist',
    'already in this codebase',
    'standard library',
    'native platform feature',
    'installed dependency',
    'one line',
    'minimum new code only then'
  ];
  let rootPrevious = -1;
  for (const marker of rootMarkers) {
    const current = router.toLowerCase().indexOf(marker);
    assert.ok(current > rootPrevious, `${marker} must be discoverable in order from the root router`);
    rootPrevious = current;
  }
  assert.match(markdownSection(router, '3. Build'), /first safe reuse rung/i);
});

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

test('delegated execution dispatches fresh task chains through verified host runtimes', () => {
  const router = read('fp/SKILL.md');
  const delegated = read('fp/delegated-execution/SKILL.md');
  const parallel = read('fp/dispatch-parallel-domains/SKILL.md');
  const runtimeGuide = read('fp/templates/agent-runtime-adapters.md');
  const registry = JSON.parse(read('fp/contracts/agent-runtime-registry.v1.json'));

  assert.match(router, /Delegated-Execution Profile/);
  assert.match(router, /delegated-execution\/SKILL\.md/);
  assert.match(router, /dispatch-parallel-domains\/SKILL\.md/);

  const chain = [
    'fresh implementer',
    'fresh task reviewer',
    'fresh fixer',
    'fresh re-reviewer',
    'fresh final integration reviewer'
  ];
  let previous = -1;
  for (const marker of chain) {
    const current = delegated.toLowerCase().indexOf(marker);
    assert.ok(current > previous, `${marker} must appear after the previous delegated-execution stage`);
    previous = current;
  }
  assert.match(delegated, /completed (?:agent )?threads.*accumulate|retain.*completed.*thread/i);
  assert.match(delegated, /active concurrency.*bounded|bounded active concurrency/i);
  assert.match(delegated, /capability detection|detect.*runtime/i);
  assert.match(delegated, /do not.*invent.*(?:tool|primitive)|never.*invent.*(?:tool|primitive)/i);

  assert.match(parallel, /independent problem domains/i);
  assert.match(parallel, /shared (?:state|files|generated output).*serial|serial.*shared (?:state|files|generated output)/i);
  assert.match(parallel, /fan[- ]out/i);
  assert.match(parallel, /fan[- ]in/i);
  assert.match(parallel, /one writer/i);

  assert.match(runtimeGuide, /capability detection/i);
  assert.match(runtimeGuide, /model API.*not.*subagent runtime|not.*subagent runtime.*model API/i);
  assert.match(runtimeGuide, /fallback/i);

  const requiredHosts = [
    'codex', 'claude-code', 'gemini-cli', 'github-copilot', 'cursor', 'opencode',
    'cline', 'roo-code', 'kiro', 'windsurf', 'aider', 'deepseek-api', 'kimi-cli', 'qwen-code',
    'codebuddy', 'zcode', 'qoder', 'baidu-comate', 'huawei-codearts',
    'kimi-api', 'qwen-api', 'zhipu-glm-api', 'minimax-api', 'iflow-cli',
    'replit-agent', 'amazon-q-developer', 'jetbrains-junie', 'devin', 'continue', 'google-jules'
  ];
  const byId = new Map(registry.hosts.map((entry) => [entry.id, entry]));
  for (const id of requiredHosts) {
    const entry = byId.get(id);
    assert.ok(entry, `runtime registry must cover ${id}`);
    assert.ok(['native', 'extension', 'not_verified', 'not_applicable_model_api', 'retired'].includes(entry.delegation_status));
    assert.ok(Array.isArray(entry.official_sources) && entry.official_sources.length > 0, `${id} needs official evidence`);
    assert.match(entry.last_verified, /^\d{4}-\d{2}-\d{2}$/);
    if (entry.delegation_status === 'native') {
      assert.ok(Array.isArray(entry.primitives?.spawn) && entry.primitives.spawn.length > 0, `${id} native runtime needs a spawn primitive`);
    }
  }
  assert.equal(byId.get('deepseek-api').delegation_status, 'not_applicable_model_api');
  assert.equal(byId.get('qoder').delegation_status, 'native');
  assert.equal(byId.get('iflow-cli').delegation_status, 'retired');
});

test('provider compatibility profile bounds paid retries, loops, cache claims, and encoding', () => {
  const router = read('fp/SKILL.md');
  const skill = read('fp/provider-compatibility/SKILL.md');
  const guard = read('fp/templates/provider-compatibility-and-spend-guard.md');
  const pressureTests = read('TEST_FP.md');

  assert.match(router, /Provider-Compatibility Profile/);
  assert.match(router, /provider-compatibility\/SKILL\.md/);
  assert.match(skill, /host.*proxy.*provider/i);
  assert.match(skill, /product of.*max_retries.*\+\s*1|retry multiplication/i);
  assert.match(skill, /single retry owner/i);
  assert.match(skill, /same semantic (?:tool )?action/i);
  assert.match(skill, /three non-narrowing/i);
  assert.match(skill, /request.*token.*subagent.*budget/i);
  assert.match(skill, /HTTP 200.*not.*semantic completion|semantic completion.*not.*HTTP 200/i);
  assert.match(skill, /strict UTF-8/i);

  assert.match(guard, /canonical body hash/i);
  assert.match(guard, /stable-prefix hash/i);
  assert.match(guard, /prompt_cache_hit_tokens/i);
  assert.match(guard, /prompt_cache_miss_tokens/i);
  assert.match(guard, /provider (?:invoice|billing).*authoritative|authoritative.*provider (?:invoice|billing)/i);
  assert.match(guard, /negative control/i);
  assert.match(guard, /中文🙂€𠮷/);
  assert.match(guard, /no paid probe|paid probe.*authority/i);
  assert.match(pressureTests, /Proxy Retry Bomb And Tool Loop/);
  assert.match(pressureTests, /Cache And UTF-8 Claims Need Provider Evidence/);
});

test('background learning uses blind finite-case generalization rather than self-rewrite', () => {
  const router = read('fp/SKILL.md');
  const gate = read('fp/generalization-gate/SKILL.md');
  const adaptive = read('fp/adaptive-improvement/SKILL.md');
  const memory = read('fp/schema-memory/SKILL.md');

  assert.match(router, /Background-Learning Profile/);
  assert.match(router, /generalization-gate\/SKILL\.md/);
  assert.match(gate, /One case.*observation|One case.*shadow/i);
  assert.match(gate, /leave-one-case-out/i);
  assert.match(gate, /near-neighbor negative control/i);
  assert.match(gate, /candidate agent and evaluator must be different/i);
  assert.match(gate, /at least three future qualifying shadow observations/i);
  assert.match(gate, /does not train model weights/i);
  assert.match(adaptive, /hidden holdout/i);
  assert.match(memory, /two distinct task IDs and two distinct session IDs/i);
  assert.match(memory, /Do not average away/i);
});

test('legacy lesson observations cannot masquerade as promoted policy', () => {
  const lessonDirectory = path.join(root, 'fp', 'lessons-learned');
  const index = read('fp/lessons-learned/README.md');
  const promotedSection = index.match(/## Promoted Lessons\r?\n([\s\S]*?)(?=\r?\n## )/)?.[1] ?? '';
  const legacySection = index.match(/## Legacy Observations Awaiting Revalidation\r?\n([\s\S]*)/)?.[1] ?? '';
  const allowedStatuses = new Set(['observation', 'bounded_shadow', 'promoted']);

  for (const file of fs.readdirSync(lessonDirectory).filter((name) => /^L\d+.*\.md$/.test(name))) {
    const content = fs.readFileSync(path.join(lessonDirectory, file), 'utf8');
    const status = content.match(/## Status\r?\n\s*([^\r\n]+)/)?.[1]?.trim();
    assert.ok(allowedStatuses.has(status), `${file} must declare a recognized lesson status`);
    if (status === 'promoted') {
      assert.match(promotedSection, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      for (const marker of ['negative control', 'invariant', 'shadow', 'rollback']) {
        assert.match(content, new RegExp(marker, 'i'), `${file} promotion evidence must include ${marker}`);
      }
    } else {
      assert.doesNotMatch(promotedSection, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(legacySection, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
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

test('medium and risky work captures a pre-edit workspace baseline', () => {
  const router = read('fp/SKILL.md');
  const brief = read('fp/templates/execution-brief.md');
  assert.match(router, /pre-existing worktree changes/i);
  assert.match(router, /pre-existing failures/i);
  assert.match(brief, /Workspace Baseline/);
  assert.match(brief, /ownership of existing changes/i);
  assert.match(brief, /isolation decision/i);
});

test('debug contract traces the first divergence and avoids blind sleeps', () => {
  const router = read('fp/SKILL.md');
  const checklist = read('fp/templates/debug-incident-checklist.md');
  assert.match(router, /Debug-First[\s\S]*Load `templates\/debug-incident-checklist\.md`/i);
  assert.match(checklist, /causal boundary chain/i);
  assert.match(checklist, /first divergence/i);
  assert.match(checklist, /condition predicate/i);
  assert.match(checklist, /deadline/i);
  assert.match(checklist, /sibling regression/i);
});

test('debug evidence is reused while changed state and safety checks still reverify', () => {
  const router = read('fp/SKILL.md');
  const checklist = read('fp/templates/debug-incident-checklist.md');
  const remote = read('fp/templates/remote-stateful-system-checklist.md');
  const agentContract = read('fp/AGENTS.md');

  assert.match(router, /change a named decision|fill a named acceptance row/i);
  assert.match(checklist, /otherwise stop and reuse the bound evidence/i);
  assert.match(checklist, /never applies after a relevant mutation or staleness/i);
  assert.match(checklist, /never waives.*original reproduction.*negative-control.*external-client/i);
  assert.match(remote, /applied \| not_applied \| split \| unknown/i);
  assert.match(remote, /do not replay/i);
  assert.match(agentContract, /user.*stop.*cancel.*pending/i);
  assert.match(agentContract, /without another probe/i);
});

test('external context stays untrusted and freshness needs evidence', () => {
  const contract = read('fp/templates/context-retrieval-contract.md');
  assert.match(contract, /untrusted data/i);
  assert.match(contract, /cannot override.*authority/i);
  assert.match(contract, /known.*source ID.*direct/i);
  assert.match(contract, /ambiguity.*silently selecting/i);
  assert.match(contract, /one topic per query/i);
  assert.match(contract, /at most three attempts/i);
  assert.match(contract, /freshness=current.*basis/i);
});

test('task-required MCP is automatic when available and approval-gated when missing', () => {
  const router = read('fp/SKILL.md');
  const contract = read('fp/templates/context-retrieval-contract.md');
  const agentContract = read('fp/AGENTS.md');

  assert.match(router, /automatically use.*task-required MCP/i);
  assert.match(router, /explicit user approval.*before.*download|download.*only after.*explicit user approval/i);
  assert.match(router, /MCP availability.*does not expand.*authority/i);
  assert.match(contract, /MCP Capability And Acquisition Gate/);
  assert.match(contract, /source.*version.*install scope.*permissions.*rollback/i);
  assert.match(contract, /authentication.*separate user-owned action/i);
  assert.match(contract, /declines.*safe fallback.*unverified/i);
  assert.match(agentContract, /available.*task-required MCP.*automatically/i);
  assert.match(agentContract, /resident.*explicit.*approval/i);
});

test('semantic architecture routes context gaps without retired modules', () => {
  const architecture = read('fp/semantic-architecture/SKILL.md');
  const example = read('fp/examples/fp.semantic-architecture.md');
  const template = read('fp/templates/semantic-architecture-report.md');

  assert.match(architecture, /smallest bounded local read-only discovery/i);
  assert.match(architecture, /current, versioned, or external.*context-retrieval-contract\.md/i);
  assert.match(architecture, /user-owned.*Decision: ask_user/i);
  assert.match(architecture, /adaptive-improvement.*Evidence Ledger/i);
  assert.match(architecture, /schema-memory.*generalized repeated patterns, not raw task context/i);
  assert.match(example, /evidence-ledger` -> `adaptive-improvement/i);
  assert.match(template, /Do not use `schema-memory` for task-local context retrieval/i);

  const retiredNames = ['semantic-memory', 'learn-after-run', 'automate-after-stable'];
  for (const filePath of filesUnder('fp')) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const retiredName of retiredNames) {
      assert.doesNotMatch(content, new RegExp(`\\b${retiredName}\\b`, 'i'), `${path.relative(root, filePath)} contains retired module ${retiredName}`);
    }
  }
});

test('deliberate shortcuts enter the deferred ledger', () => {
  const ledger = read('fp/evidence-ledger/SKILL.md');
  assert.match(ledger, /deferred_items/);
  assert.match(ledger, /ceiling/);
  assert.match(ledger, /upgrade trigger/i);
  assert.match(ledger, /evidence/);
});

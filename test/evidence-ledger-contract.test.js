const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  globToRegExp,
  normalizeLegacyLedger,
  validateAgainstBrief,
  validateCompletion,
  validateContinuationForResume,
  validateLedger
} = require('../zerotohero/contracts/evidence-ledger');

const root = path.resolve(__dirname, '..');

function fixture() {
  return JSON.parse(fs.readFileSync(path.join(root, 'zerotohero/examples/password-reset.evidence-ledger.json'), 'utf8'));
}

function briefFixture() {
  return JSON.parse(fs.readFileSync(path.join(root, 'zerotohero/examples/password-reset.compiled-execution-brief.json'), 'utf8'));
}

function codes(errors) {
  return errors.map((entry) => entry.code);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sourceSnapshot(taskId, sessionId, inputFingerprint, observedAt, outcome, evidenceRef) {
  return { schema_version: '1.0.0', task_id: taskId, session_id: sessionId, input_fingerprint: inputFingerprint, observed_at: observedAt, outcome, evidence_ref: evidenceRef };
}

function snapshotHash(snapshot) {
  return `sha256:${crypto.createHash('sha256').update(canonicalJson(snapshot)).digest('hex')}`;
}

function continuationFixture() {
  const ledger = fixture();
  ledger.result = 'partial';
  ledger.decision = 'run_more_checks';
  ledger.profiles.push('continuation');
  ledger.continuation = {
    task_id: ledger.task_id,
    generation: 1,
    status: 'handoff',
    repo_root: root,
    base_revision: 'abc123',
    fingerprint_algorithm: 'zerotohero-worktree-v1',
    worktree_fingerprint: `sha256:${'a'.repeat(64)}`,
    current_slice: 'Run the final regression check',
    verified_claim_ids: ['claim-expired-token'],
    open_items: ['Run the final regression check'],
    active_constraints: ['Do not touch OAuth'],
    files_touched: [...ledger.files_touched],
    last_check: {
      command_id: 'reset-tests',
      result: 'pass',
      evidence_ref: '/commands_run/0'
    },
    next_action_type: 'read',
    next_action: 'Re-read the changed reset-token function',
    next_verification: 'Rerun focused reset-token tests',
    stop_condition: 'Stop if the worktree fingerprint changed',
    updated_at: '2026-07-13T00:00:00Z',
    supersedes: null,
    rehydration: null
  };
  return ledger;
}

function addOpenWrtRows(ledger, status = 'pass') {
  const existing = ledger.acceptance.rows[0];
  const kinds = ['functional', 'negative_control', 'lifecycle', 'rollback', 'management_path'];
  ledger.acceptance.rows = kinds.map((kind, index) => ({
    ...existing,
    id: `openwrt-${kind}`,
    kind,
    status,
    evidence_ref: status === 'planned' ? null : '/commands_run/0',
    requirement: `OpenWrt ${kind} requirement`,
    observable: `OpenWrt ${kind} observable ${index + 1}`
  }));
}

function debugCompletionFixture(waitEvidence = null) {
  const ledger = fixture();
  ledger.route = 'debug';
  ledger.experiments = [{
    id: 'shared-parser-divergence',
    hypothesis: 'The CLI and worker provide different effective input at the shared parser boundary',
    probe: 'Capture effective input and output at the parser boundary for both callers',
    actual_result: 'The first divergence was the CLI input before parseConfig; the worker input remained valid',
    decision: 'supported',
    narrows_cause: true,
    speculative_patch: false,
    next_action_type: 'fix',
    next_step: 'Correct the CLI input preparation and rerun both callers'
  }];
  ledger.commands_run.push(
    {
      id: 'debug-direct-cli',
      command: 'node --test test/cli-config.test.js',
      result: 'pass',
      evidence: 'The original failing CLI path passed with the corrected effective parser input',
      exit_code: 0,
      expected_exit_codes: [0],
      pass_condition: 'The original CLI reproduction exits zero with the expected parsed config',
      provenance: 'observed'
    },
    {
      id: 'debug-sibling-worker',
      command: 'node --test test/worker-config.test.js',
      result: 'pass',
      evidence: 'The sibling worker path passed through the same parseConfig boundary',
      exit_code: 0,
      expected_exit_codes: [0],
      pass_condition: 'The sibling worker regression exits zero through the shared parser',
      provenance: 'observed'
    }
  );
  ledger.debug_evidence = {
    causal_chain: [
      'CLI configuration preparation produces the effective parser input',
      'parseConfig transforms the shared input for CLI and worker consumers',
      'The CLI assertion observes the invalid parsed configuration'
    ],
    first_divergence: 'The CLI effective input differed from the valid worker input before parseConfig',
    wait_evidence: waitEvidence || {
      applies: true,
      strategy: 'condition',
      condition_predicate: 'the CLI result event has been published',
      polling_interval_ms: 25,
      deadline_ms: 2000,
      final_observation: 'the result event was observed before the deadline'
    },
    shared_boundary_evidence: {
      applies: true,
      boundary: 'parseConfig effective-input and parsed-output boundary',
      direct_evidence_ref: '/commands_run/1',
      sibling_evidence_ref: '/commands_run/2'
    }
  };
  return ledger;
}

function delegationFixture(id, taskInputIndex, role, overrides = {}) {
  return {
    id,
    parent_id: null,
    task_id: `task-${id}`,
    session_id: `session-${id}`,
    task_input_index: taskInputIndex,
    goal: `Complete the bounded ${role} task and return evidence`,
    role,
    status: 'completed',
    read_only: true,
    granted_authority: ['read'],
    toolsets: ['filesystem-read'],
    context_refs: ['brief:T001'],
    allowed_resources: ['zerotohero/**', 'test/**'],
    owned_paths: [],
    depends_on: [],
    max_iterations: 8,
    iterations_used: 1,
    max_attempts: 2,
    timeout_seconds: 300,
    max_spawn_depth: 0,
    workspace: 'repository-root',
    idempotency_key: `idempotency-${id}`,
    attempts_used: 1,
    summary_budget: { unit: 'words', limit: 300 },
    artifact_path: `.zerotohero/artifacts/${id}.md`,
    artifact_persistence: 'parent_only',
    proposal_evidence_refs: ['/commands_run/0'],
    check_evidence_refs: ['/commands_run/0'],
    files_touched: [],
    mutation_lease: null,
    result_summary: `${role} returned a bounded evidence summary`,
    started_at: '2026-07-14T00:00:00Z',
    finished_at: '2026-07-14T00:01:00Z',
    exit_reason: 'Bounded task completed',
    ...overrides
  };
}

function addPassCommand(ledger, id, binding = {}) {
  const index = ledger.commands_run.length;
  ledger.commands_run.push({
    id,
    command: `fixture-check:${id}`,
    result: 'pass',
    evidence: `${id} produced observed fixture evidence for its declared subject`,
    exit_code: 0,
    expected_exit_codes: [0],
    pass_condition: `${id} exits zero and reports the declared subject result`,
    provenance: 'observed',
    ...binding
  });
  return `/commands_run/${index}`;
}

function multiAgentEvidenceFixture(ledger, runId = 'multi-run-fixture') {
  const taskIds = ledger.delegations.map((entry) => entry.task_id);
  const specReviewer = ledger.delegations.find((entry) => entry.role === 'evidence_reviewer');
  const qualityReviewer = ledger.delegations.find((entry) => entry.role === 'integration_reviewer');
  assert.ok(specReviewer && qualityReviewer, 'multi-agent fixture requires independent spec and quality reviewers');
  const gateRef = (gate, producer) => addPassCommand(ledger, `${runId}-${gate}`, {
    multi_agent_binding: { run_id: runId, producer_delegation_id: producer.id, gates: [gate], task_ids: taskIds }
  });
  const specRef = gateRef('spec', specReviewer);
  const qualityRef = gateRef('quality', qualityReviewer);
  const cancellationRef = gateRef('cancellation', qualityReviewer);
  const idempotencyRef = gateRef('idempotency', qualityReviewer);
  const leaseRef = gateRef('lease_cleanup', qualityReviewer);
  const contextRef = gateRef('context_isolation', qualityReviewer);
  const integrationRef = gateRef('integration', qualityReviewer);
  specReviewer.check_evidence_refs = [specRef];
  qualityReviewer.check_evidence_refs = [qualityRef, cancellationRef, idempotencyRef, leaseRef, contextRef, integrationRef];
  return {
    single_writer_map: 'Parent owns shared integration; all reviewers and learners are read-only',
    live_mutation_lease_holder: 'parent',
    max_concurrency: ledger.delegations.length,
    max_spawn_depth: 1,
    run_id: runId,
    result_order: 'task_input',
    parent_cancel_cascaded: true,
    idempotency_verified: true,
    leases_released: true,
    context_isolation_verified: 'Each child received only its declared task-local context references',
    spec_verdict: 'pass',
    quality_verdict: 'pass',
    blocking_fixes_rereviewed: true,
    critical_checks_rerun: 'Parent reran the contract and integration suites',
    agents_terminal: true,
    spec_evidence_ref: specRef,
    quality_evidence_ref: qualityRef,
    cancellation_evidence_ref: cancellationRef,
    idempotency_evidence_ref: idempotencyRef,
    lease_cleanup_evidence_ref: leaseRef,
    context_isolation_evidence_ref: contextRef,
    integration_evidence_refs: [integrationRef],
    spec_reviewer_delegation_id: specReviewer.id,
    quality_reviewer_delegation_id: qualityReviewer.id
  };
}

function learningFixture() {
  const ledger = fixture();
  const target = 'zerotohero/schema-memory/SKILL.md';
  const targetHash = `sha256:${crypto.createHash('sha256').update(fs.readFileSync(path.join(root, target))).digest('hex')}`;
  ledger.profiles = ['multi_agent', 'background_learning'];
  ledger.created_at = '2026-07-14T04:00:00Z';
  ledger.delegation_artifact_root = '.zerotohero/artifacts';
  ledger.parent_authority = ['read', 'write', 'execute_checks', 'delegate', 'memory_propose', 'memory_promote'];
  ledger.files_touched.push(target);
  ledger.scope.allowed_touch.push(target);
  ledger.scope.allowed_read.push('zerotohero/**', 'test/**');
  ledger.delegations = [
    delegationFixture('candidate', 0, 'learning_candidate', { granted_authority: ['read', 'memory_propose'] }),
    delegationFixture('evaluator-a', 1, 'learning_evaluator', { context_refs: ['holdout:auth'] }),
    delegationFixture('evaluator-b', 2, 'learning_evaluator', { context_refs: ['holdout:config'] }),
    delegationFixture('spec-review', 3, 'evidence_reviewer'),
    delegationFixture('quality-review', 4, 'integration_reviewer')
  ];
  ledger.multi_agent_evidence = multiAgentEvidenceFixture(ledger, 'learning-run');

  const bound = (id, stage, subjectId, variant, measurement = undefined, producerId = 'parent') => addPassCommand(ledger, id, {
    learning_binding: { candidate_hash: targetHash, producer_id: producerId, stage, subject_id: subjectId, variant },
    ...(measurement ? { measurement } : {})
  });
  const proposal = bound('candidate-proposal', 'proposal', 'candidate-generalization-v1', 'candidate', undefined, 'candidate');
  const caseAuth = bound('case-auth', 'case', 'positive-auth', 'positive');
  const caseConfig = bound('case-config', 'case', 'positive-config', 'positive');
  const caseNegative = bound('case-negative', 'case', 'negative-neighbor', 'control');
  const caseInvariant = bound('case-invariant', 'case', 'invariant-authority', 'invariant');
  const foldAuthBaseline = bound('fold-auth-baseline', 'fold_baseline', 'fold-auth-held-out', 'baseline', { metric: 'holdout-pass-rate', value: 0, unit: 'ratio' }, 'evaluator-a');
  const foldAuthCandidate = bound('fold-auth-candidate', 'fold_candidate', 'fold-auth-held-out', 'candidate', { metric: 'holdout-pass-rate', value: 1, unit: 'ratio' }, 'evaluator-a');
  const foldAuthOracle = bound('fold-auth-oracle', 'fold_oracle', 'fold-auth-held-out', 'oracle', undefined, 'evaluator-a');
  const foldConfigBaseline = bound('fold-config-baseline', 'fold_baseline', 'fold-config-held-out', 'baseline', { metric: 'holdout-pass-rate', value: 1, unit: 'ratio' }, 'evaluator-b');
  const foldConfigCandidate = bound('fold-config-candidate', 'fold_candidate', 'fold-config-held-out', 'candidate', { metric: 'holdout-pass-rate', value: 1, unit: 'ratio' }, 'evaluator-b');
  const foldConfigOracle = bound('fold-config-oracle', 'fold_oracle', 'fold-config-held-out', 'oracle', undefined, 'evaluator-b');
  const complexityBaseline = bound('complexity-baseline', 'complexity_baseline', 'candidate-generalization-v1', 'baseline', { metric: 'candidate-complexity', value: 1, unit: 'rules' });
  const complexityCandidate = bound('complexity-candidate', 'complexity_candidate', 'candidate-generalization-v1', 'candidate', { metric: 'candidate-complexity', value: 2, unit: 'rules' });
  const shadowOne = bound('shadow-one', 'shadow', 'shadow-one', 'shadow');
  const shadowTwo = bound('shadow-two', 'shadow', 'shadow-two', 'shadow');
  const shadowThree = bound('shadow-three', 'shadow', 'shadow-three', 'shadow');
  const rollback = bound('rollback-candidate', 'rollback', 'candidate-generalization-v1', 'rollback');
  const activation = bound('activate-candidate', 'activation', 'candidate-generalization-v1', 'activation');
  const authFingerprint = `sha256:${'a'.repeat(64)}`;
  const configFingerprint = `sha256:${'b'.repeat(64)}`;
  const negativeFingerprint = `sha256:${'c'.repeat(64)}`;
  const invariantFingerprint = `sha256:${'d'.repeat(64)}`;
  const authSource = sourceSnapshot('task-auth', 'session-auth', authFingerprint, '2026-07-14T00:00:00Z', 'pass', caseAuth);
  const configSource = sourceSnapshot('task-config', 'session-config', configFingerprint, '2026-07-14T00:10:00Z', 'pass', caseConfig);
  const negativeSource = sourceSnapshot('task-docs', 'session-docs', negativeFingerprint, '2026-07-14T01:10:00Z', 'pass', caseNegative);
  const invariantSource = sourceSnapshot('task-authority', 'session-authority', invariantFingerprint, '2026-07-14T01:20:00Z', 'pass', caseInvariant);
  const shadowOneFingerprint = `sha256:${'5'.repeat(64)}`;
  const shadowTwoFingerprint = `sha256:${'6'.repeat(64)}`;
  const shadowThreeFingerprint = `sha256:${'7'.repeat(64)}`;
  const shadowOneSource = sourceSnapshot('future-task-one', 'future-session-one', shadowOneFingerprint, '2026-07-14T02:00:00Z', 'pass', shadowOne);
  const shadowTwoSource = sourceSnapshot('future-task-two', 'future-session-two', shadowTwoFingerprint, '2026-07-14T02:10:00Z', 'pass', shadowTwo);
  const shadowThreeSource = sourceSnapshot('future-task-three', 'future-session-three', shadowThreeFingerprint, '2026-07-14T02:20:00Z', 'pass', shadowThree);
  ledger.delegations[0].proposal_evidence_refs = [proposal];
  ledger.delegations[0].check_evidence_refs = [proposal];
  ledger.delegations[1].check_evidence_refs = [foldAuthBaseline, foldAuthCandidate, foldAuthOracle];
  ledger.delegations[2].check_evidence_refs = [foldConfigBaseline, foldConfigCandidate, foldConfigOracle];
  ledger.learning_evidence = {
    candidate_id: 'candidate-generalization-v1',
    kind: 'schema',
    target,
    target_hash: targetHash,
    candidate_frozen_at: '2026-07-14T01:00:00Z',
    created_by: 'agent',
    state: 'active',
    proposal_origin_delegation_id: 'candidate',
    holdout_context_refs: ['holdout:auth', 'holdout:config'],
    trigger_invariant: 'A repeated evidence-backed validation failure crosses independent task families',
    non_trigger_boundary: 'Do not trigger for paraphrases, one-off preferences, or a single task session',
    cases: [
      {
        id: 'positive-auth', kind: 'positive', task_family: 'authentication', task_id: 'task-auth', session_id: 'session-auth',
        source_ledger_hash: snapshotHash(authSource), source_ledger_snapshot: authSource, input_fingerprint: authFingerprint, expected_behavior: 'Apply the bounded validation rule', evidence_ref: caseAuth, result: 'pass'
      },
      {
        id: 'positive-config', kind: 'positive', task_family: 'configuration', task_id: 'task-config', session_id: 'session-config',
        source_ledger_hash: snapshotHash(configSource), source_ledger_snapshot: configSource, input_fingerprint: configFingerprint, expected_behavior: 'Apply the same semantic rule in a distinct family', evidence_ref: caseConfig, result: 'pass'
      },
      {
        id: 'negative-neighbor', kind: 'negative_control', task_family: 'documentation', task_id: 'task-docs', session_id: 'session-docs',
        source_ledger_hash: snapshotHash(negativeSource), source_ledger_snapshot: negativeSource, input_fingerprint: negativeFingerprint, expected_behavior: 'Abstain for a one-off wording preference', evidence_ref: caseNegative, result: 'pass'
      },
      {
        id: 'invariant-authority', kind: 'invariant', task_family: 'authority', task_id: 'task-authority', session_id: 'session-authority',
        source_ledger_hash: snapshotHash(invariantSource), source_ledger_snapshot: invariantSource, input_fingerprint: invariantFingerprint, expected_behavior: 'Never expand write or delegation authority', evidence_ref: caseInvariant, result: 'pass'
      }
    ],
    folds: [
      {
        id: 'fold-auth-held-out', training_case_ids: ['positive-config'], holdout_case_ids: ['positive-auth'], holdout_blinded: true,
        holdout_context_ref: 'holdout:auth', baseline_evidence_ref: foldAuthBaseline, candidate_evidence_ref: foldAuthCandidate,
        oracle_evidence_ref: foldAuthOracle, metric: 'holdout-pass-rate', unit: 'ratio', direction: 'higher_is_better', baseline_score: 0, candidate_score: 1, tolerance: 0,
        comparison: 'improved', evaluator_delegation_id: 'evaluator-a'
      },
      {
        id: 'fold-config-held-out', training_case_ids: ['positive-auth'], holdout_case_ids: ['positive-config'], holdout_blinded: true,
        holdout_context_ref: 'holdout:config', baseline_evidence_ref: foldConfigBaseline, candidate_evidence_ref: foldConfigCandidate,
        oracle_evidence_ref: foldConfigOracle, metric: 'holdout-pass-rate', unit: 'ratio', direction: 'higher_is_better', baseline_score: 1, candidate_score: 1, tolerance: 0,
        comparison: 'non_inferior', evaluator_delegation_id: 'evaluator-b'
      }
    ],
    negative_control_case_ids: ['negative-neighbor'],
    invariant_case_ids: ['invariant-authority'],
    complexity: {
      unit: 'rules', baseline: 1, candidate: 2, max_delta: 1,
      baseline_evidence_ref: complexityBaseline, candidate_evidence_ref: complexityCandidate
    },
    shadow: {
      required: true, status: 'pass', required_successes: 3, observed_successes: 3, observed_failures: 0, expires_at: null,
      observations: [
        { id: 'shadow-one', task_id: 'future-task-one', session_id: 'future-session-one', source_ledger_hash: snapshotHash(shadowOneSource), source_ledger_snapshot: shadowOneSource, input_fingerprint: shadowOneFingerprint, observed_at: '2026-07-14T02:00:00Z', evidence_ref: shadowOne, result: 'pass' },
        { id: 'shadow-two', task_id: 'future-task-two', session_id: 'future-session-two', source_ledger_hash: snapshotHash(shadowTwoSource), source_ledger_snapshot: shadowTwoSource, input_fingerprint: shadowTwoFingerprint, observed_at: '2026-07-14T02:10:00Z', evidence_ref: shadowTwo, result: 'pass' },
        { id: 'shadow-three', task_id: 'future-task-three', session_id: 'future-session-three', source_ledger_hash: snapshotHash(shadowThreeSource), source_ledger_snapshot: shadowThreeSource, input_fingerprint: shadowThreeFingerprint, observed_at: '2026-07-14T02:20:00Z', evidence_ref: shadowThree, result: 'pass' }
      ]
    },
    approval: { status: 'approved', authority_source: 'User-authorized protocol improvement', approved_by: 'parent' },
    rollback: { plan: 'Restore the previous content hash and rerun the generalization suite', evidence_ref: rollback },
    activation_evidence_ref: activation,
    source_context_ids: [],
    stale: false,
    generalization_verdict: 'pass'
  };
  return ledger;
}

test('canonical v1 example and compiled brief pass the shared completion gate', () => {
  assert.deepEqual(validateLedger(fixture()), []);
  assert.deepEqual(validateCompletion(fixture(), briefFixture()).errors, []);
});

test('schema rejects missing version and unknown fields', () => {
  const ledger = fixture();
  delete ledger.schema_version;
  ledger.surprise = true;
  const result = codes(validateLedger(ledger));
  assert.ok(result.includes('E_SCHEMA_REQUIRED'));
  assert.ok(result.includes('E_SCHEMA_ADDITIONAL'));
});

test('legacy normalization never manufactures verified evidence', () => {
  const legacy = fixture();
  delete legacy.schema_version;
  legacy.claims = legacy.verified_claims;
  delete legacy.verified_claims;
  const normalized = normalizeLegacyLedger(legacy);
  assert.ok(normalized.warnings.some((entry) => entry.startsWith('W_LEGACY_UNVERIFIED')));
  assert.equal(normalized.ledger.result, 'partial');
  assert.equal(normalized.ledger.decision, 'run_more_checks');
  assert.equal(normalized.ledger.verified_claims.length, 0);
  assert.ok(normalized.ledger.unverified_claims.length > 0);
  assert.ok(normalized.ledger.commands_run.every((entry) => entry.provenance === 'legacy_unverified'));
  assert.deepEqual(validateLedger(normalized.ledger), []);
});

test('pass and complete require embedded observed checks and claims', () => {
  const noCheck = fixture();
  noCheck.commands_run = [];
  const noCheckCodes = codes(validateLedger(noCheck));
  assert.ok(noCheckCodes.includes('E_PASS_WITHOUT_CHECK'));
  assert.ok(noCheckCodes.includes('E_REQUIRED_CHECK_MISSING'));

  const noClaim = fixture();
  noClaim.verified_claims = [];
  const noClaimCodes = codes(validateLedger(noClaim));
  assert.ok(noClaimCodes.includes('E_PASS_WITHOUT_CLAIM'));
  assert.ok(noClaimCodes.includes('E_REQUIRED_CLAIM_MISSING'));
});

test('authority matrix fails closed', () => {
  const reportOnly = fixture();
  reportOnly.mode = 'report_only';
  assert.ok(codes(validateLedger(reportOnly)).includes('E_REPORT_ONLY_WRITE'));

  const unauthorized = fixture();
  unauthorized.write_authorized = false;
  assert.ok(codes(validateLedger(unauthorized)).includes('E_WRITE_WITHOUT_AUTHORITY'));

  const diagnosis = fixture();
  diagnosis.mode = 'report_only';
  diagnosis.write_authorized = false;
  diagnosis.files_touched = [];
  diagnosis.scope.allowed_touch = [];
  assert.ok(!codes(validateLedger(diagnosis)).includes('E_REPORT_ONLY_WRITE'));

  const planWrite = fixture();
  planWrite.phase = 'plan';
  assert.ok(codes(validateLedger(planWrite)).includes('E_PLAN_WRITE'));

  const brief = briefFixture();
  brief.phase = 'plan';
  brief.mode = 'report_only';
  brief.write_authorized = false;
  brief.route = 'debug';
  brief.profiles = ['external_context'];
  const mismatches = codes(validateCompletion(fixture(), brief).errors);
  assert.ok(mismatches.includes('E_BRIEF_AUTHORITY_MISMATCH'));
  assert.ok(mismatches.includes('E_BRIEF_PROFILE_MISMATCH'));
});

test('ledger scope enforces both reads and touches, including explicit empty sets', () => {
  const ledger = fixture();
  ledger.files_read.push('secrets/private.key');
  ledger.files_touched.push('src/oauth/provider.ts');
  const result = codes(validateLedger(ledger));
  assert.ok(result.includes('E_LEDGER_SCOPE_READ'));
  assert.ok(result.includes('E_LEDGER_SCOPE_TOUCH'));

  const empty = fixture();
  empty.scope.allowed_read = [];
  empty.scope.allowed_touch = [];
  const emptyResult = codes(validateLedger(empty));
  assert.ok(emptyResult.includes('E_LEDGER_SCOPE_READ'));
  assert.ok(emptyResult.includes('E_LEDGER_SCOPE_TOUCH'));
});

test('brief validation enforces read, touch, and forbidden context separately', () => {
  const ledger = fixture();
  ledger.scope.allowed_read.push('secrets/**');
  ledger.files_read.push('secrets/private.key');
  ledger.scope.allowed_touch.push('src/oauth/**');
  ledger.files_touched.push('src/oauth/provider.ts');
  const brief = briefFixture();
  brief.files_to_avoid.push('secrets/**');
  const result = codes(validateAgainstBrief(ledger, brief).errors);
  assert.ok(result.includes('E_SCOPE_READ'));
  assert.ok(result.includes('E_SCOPE_FORBIDDEN_READ'));
  assert.ok(result.includes('E_SCOPE_TOUCH'));
  assert.ok(result.includes('E_SCOPE_FORBIDDEN'));
});

test('applicable compiled briefs require a structured workspace baseline', () => {
  const valid = briefFixture();
  assert.ok(!codes(validateAgainstBrief(fixture(), valid).errors).includes('E_BRIEF_WORKSPACE_BASELINE'));

  const missing = briefFixture();
  delete missing.workspace_baseline;
  assert.ok(codes(validateAgainstBrief(fixture(), missing).errors).includes('E_BRIEF_WORKSPACE_BASELINE'));

  for (const route of ['medium', 'debug', 'large_risky', 'incident']) {
    const ledger = fixture();
    const brief = briefFixture();
    ledger.route = route;
    brief.route = route;
    assert.ok(!codes(validateAgainstBrief(ledger, brief).errors).includes('E_BRIEF_WORKSPACE_BASELINE'));
  }

  for (const profile of ['multi_agent', 'remote_stateful', 'openwrt']) {
    const ledger = fixture();
    const brief = briefFixture();
    ledger.profiles = [profile];
    brief.profiles = [profile];
    assert.ok(!codes(validateAgainstBrief(ledger, brief).errors).includes('E_BRIEF_WORKSPACE_BASELINE'));
  }

  const malformed = briefFixture();
  malformed.workspace_baseline.pre_existing_changes.push({ path: 'src/existing.js', owner: 'TODO' });
  malformed.workspace_baseline.isolation_decision = 'always_isolate';
  assert.ok(codes(validateAgainstBrief(fixture(), malformed).errors).includes('E_BRIEF_WORKSPACE_BASELINE'));

  const tinyLedger = fixture();
  const tinyBrief = briefFixture();
  tinyLedger.route = 'tiny';
  tinyBrief.route = 'tiny';
  delete tinyBrief.workspace_baseline;
  assert.ok(!codes(validateAgainstBrief(tinyLedger, tinyBrief).errors).includes('E_BRIEF_WORKSPACE_BASELINE'));
});

test('compiled brief freezes delegation authority and blind learning evaluation', () => {
  const ledger = learningFixture();
  const brief = briefFixture();
  brief.profiles = [...ledger.profiles];
  brief.delegation_artifact_root = ledger.delegation_artifact_root;
  brief.files_to_touch = [...ledger.files_touched];
  brief.context_budget.max_files_to_touch = ledger.files_touched.length;
  brief.context_budget_contract.max_files_to_touch = ledger.files_touched.length;
  brief.context_budget_contract.files_allowed_to_touch = [...ledger.files_touched];
  brief.parent_authority = [...ledger.parent_authority];
  brief.delegations = ledger.delegations.map((entry) => ({
    id: entry.id,
    parent_id: entry.parent_id,
    task_id: entry.task_id,
    session_id: entry.session_id,
    task_input_index: entry.task_input_index,
    role: entry.role,
    read_only: entry.read_only,
    granted_authority: [...entry.granted_authority],
    toolsets: [...entry.toolsets],
    context_refs: [...entry.context_refs],
    allowed_resources: [...entry.allowed_resources],
    owned_paths: [...entry.owned_paths],
    depends_on: [...entry.depends_on],
    max_iterations: entry.max_iterations,
    max_attempts: entry.max_attempts,
    timeout_seconds: entry.timeout_seconds,
    max_spawn_depth: entry.max_spawn_depth,
    workspace: entry.workspace,
    idempotency_key: entry.idempotency_key
  }));
  brief.learning_plan = {
    candidate_id: ledger.learning_evidence.candidate_id,
    kind: ledger.learning_evidence.kind,
    target: ledger.learning_evidence.target,
    target_hash: ledger.learning_evidence.target_hash,
    candidate_frozen_at: ledger.learning_evidence.candidate_frozen_at,
    holdout_context_refs: [...ledger.learning_evidence.holdout_context_refs],
    evaluation_method: 'leave_one_out_or_full_holdout_coverage',
    evaluation_metric: 'holdout-pass-rate',
    evaluation_unit: 'ratio',
    evaluation_direction: 'higher_is_better',
    evaluation_tolerance: 0,
    holdouts_hidden: true,
    negative_controls_required: true,
    invariant_checks_required: true,
    oracle_required: true,
    measurements_required: true,
    activation_hash_required: true,
    complexity_unit: 'rules',
    complexity_max_delta: 1,
    min_shadow_successes: 3,
    rollback_required: true,
    source_freshness_required: true
  };
  assert.deepEqual(validateAgainstBrief(ledger, brief).errors, []);

  const changedAuthority = structuredClone(brief);
  changedAuthority.delegations[0].granted_authority.push('write');
  assert.ok(codes(validateAgainstBrief(ledger, changedAuthority).errors).includes('E_BRIEF_DELEGATION_MISMATCH'));

  const leakedPlan = structuredClone(brief);
  leakedPlan.learning_plan.holdouts_hidden = false;
  assert.ok(codes(validateAgainstBrief(ledger, leakedPlan).errors).includes('E_BRIEF_LEARNING_PLAN'));
});

test('path matching has one consistent git-style glob policy', () => {
  assert.equal(globToRegExp('src/**/x.js').test('src/x.js'), true);
  assert.equal(globToRegExp('src/**/x.js').test('src/a/b/x.js'), true);
  assert.equal(globToRegExp('SRC/**', false).test('src/x.js'), true);

  const ledger = fixture();
  ledger.scope.allowed_read.push('**');
  ledger.files_read.push('src/../private.key');
  assert.ok(codes(validateLedger(ledger)).includes('E_PATH_TRAVERSAL'));
});

test('passing commands require an explicit satisfied exit-code expectation', () => {
  const unexpected = fixture();
  unexpected.commands_run[0].exit_code = 23;
  assert.ok(codes(validateLedger(unexpected)).includes('E_EXIT_CODE_UNEXPECTED'));

  const expectedNegative = fixture();
  expectedNegative.commands_run[0].exit_code = 23;
  expectedNegative.commands_run[0].expected_exit_codes = [23];
  expectedNegative.acceptance.required_checks[0].expected_exit_codes = [23];
  assert.deepEqual(validateLedger(expectedNegative), []);
});

test('evidence placeholders, invalid URLs, and rolled-over dates are rejected', () => {
  const placeholder = fixture();
  placeholder.verified_claims[0].evidence = 'TODO';
  const placeholderCodes = codes(validateLedger(placeholder));
  assert.ok(placeholderCodes.includes('E_SCHEMA_NOT') || placeholderCodes.includes('E_PLACEHOLDER'));

  const external = fixture();
  external.profiles.push('external_context');
  external.external_context_evidence = [{
    source_id: 'vendor-sdk',
    version: '9.1.0',
    topic: 'request signing',
    retrieved_at: '2026-02-30T00:00:00Z',
    freshness: 'current',
    freshness_basis: { kind: 'official_tag', value: 'v9.1.0' },
    authoritative_url: 'TODO',
    claim: 'The installed SDK uses request signing v2',
    claim_status: 'verified',
    required_for_acceptance: false,
    acceptance_row_id: null,
    evidence: 'Official versioned API page states the signature format',
    unresolved: null
  }];
  assert.ok(codes(validateLedger(external)).includes('E_SCHEMA_FORMAT'));
});

test('a blocking unknown external claim prevents completion', () => {
  const ledger = fixture();
  ledger.profiles.push('external_context');
  ledger.external_context_evidence = [{
    source_id: 'vendor-sdk',
    version: '9.1.0',
    topic: 'request signing',
    retrieved_at: '2026-07-13T00:00:00Z',
    freshness: 'unknown',
    freshness_basis: { kind: 'unknown', value: null },
    authoritative_url: 'https://vendor.example/sdk/9.1/signing',
    claim: 'The required SDK signature is not yet known',
    claim_status: 'unverified',
    required_for_acceptance: true,
    acceptance_row_id: 'reset-token-regression',
    evidence: 'Provider unavailable and no installed source was found',
    unresolved: 'Signature format remains unverified'
  }];
  assert.ok(codes(validateLedger(ledger)).includes('E_EXTERNAL_REQUIRED_UNVERIFIED'));

  const omitted = fixture();
  omitted.profiles.push('external_context');
  assert.ok(codes(validateLedger(omitted)).includes('E_EXTERNAL_EVIDENCE_MISSING'));
});

test('freshness current requires a concrete structured basis', () => {
  const makeLedger = (basis) => {
    const ledger = fixture();
    ledger.profiles.push('external_context');
    ledger.external_context_evidence = [{
      source_id: 'vendor-sdk',
      version: '9.1.0',
      topic: 'request signing',
      retrieved_at: '2026-07-13T00:00:00Z',
      freshness: 'current',
      freshness_basis: basis,
      authoritative_url: 'https://vendor.example/sdk/9.1/signing',
      claim: 'The installed SDK uses request signing v2',
      claim_status: 'verified',
      required_for_acceptance: false,
      acceptance_row_id: null,
      evidence: 'Official versioned API page states the signature format',
      unresolved: null
    }];
    return ledger;
  };

  assert.deepEqual(validateLedger(makeLedger({ kind: 'official_tag', value: 'v9.1.0' })), []);

  const missing = makeLedger({ kind: 'official_tag', value: 'v9.1.0' });
  delete missing.external_context_evidence[0].freshness_basis;
  assert.ok(codes(validateLedger(missing)).includes('E_SCHEMA_REQUIRED'));

  for (const value of ['latest', 'current', 'unversioned', 'unknown', 'latest_release']) {
    const result = codes(validateLedger(makeLedger({ kind: 'versioned_page', value })));
    assert.ok(result.includes('E_EXTERNAL_FRESHNESS_BASIS'), `${value} must not establish current freshness`);
  }

  assert.ok(codes(validateLedger(makeLedger({ kind: 'unknown', value: null }))).includes('E_EXTERNAL_FRESHNESS_BASIS'));
  assert.ok(codes(validateLedger(makeLedger({ kind: 'update_timestamp', value: 'yesterday' }))).includes('E_EXTERNAL_FRESHNESS_BASIS'));
});

test('self-reported violations prevent complete', () => {
  for (const field of ['scope_violations', 'context_budget_violations']) {
    const ledger = fixture();
    ledger[field].push('Observed violation');
    assert.ok(codes(validateLedger(ledger)).includes('E_COMPLETE_WITH_VIOLATION'));
  }
});

test('continuation references and resume state fail closed', () => {
  const valid = continuationFixture();
  assert.deepEqual(validateLedger(valid), []);

  const invalid = continuationFixture();
  invalid.continuation.task_id = 'other-task';
  invalid.continuation.verified_claim_ids = ['missing-claim'];
  invalid.continuation.files_touched.push('outside/scope.js');
  invalid.continuation.last_check.evidence_ref = '/commands_run/999';
  const result = codes(validateLedger(invalid));
  assert.ok(result.includes('E_CONTINUATION_TASK'));
  assert.ok(result.includes('E_CONTINUATION_CLAIM'));
  assert.ok(result.includes('E_CONTINUATION_SCOPE'));
  assert.ok(result.includes('E_CONTINUATION_EVIDENCE_REF'));

  const complete = continuationFixture();
  complete.result = 'pass';
  complete.decision = 'complete';
  assert.ok(codes(validateLedger(complete)).includes('E_COMPLETE_WITH_CONTINUATION'));

  const write = continuationFixture();
  write.continuation.next_action_type = 'write';
  assert.ok(codes(validateLedger(write)).includes('E_CONTINUATION_STALE'));
  assert.ok(codes(validateCompletion(write).errors).includes('E_CONTINUATION_RUNTIME_STATE_REQUIRED'));
});

test('resume helper compares actual repository, revision, and fingerprint', () => {
  const ledger = continuationFixture();
  const current = {
    repo_root: root,
    base_revision: 'abc123',
    fingerprint_algorithm: 'zerotohero-worktree-v1',
    worktree_fingerprint: `sha256:${'a'.repeat(64)}`
  };
  assert.deepEqual(validateContinuationForResume(ledger, current), []);
  current.worktree_fingerprint = `sha256:${'b'.repeat(64)}`;
  assert.ok(codes(validateContinuationForResume(ledger, current)).includes('E_CONTINUATION_STALE'));
});

test('debug route forbids speculative patches and checkpoints three non-narrowing probes', () => {
  const ledger = fixture();
  ledger.route = 'debug';
  ledger.phase = 'diagnose';
  ledger.result = 'partial';
  ledger.decision = 'run_more_checks';
  ledger.mode = 'report_only';
  ledger.write_authorized = false;
  ledger.files_touched = [];
  ledger.scope.allowed_touch = [];
  ledger.experiments = [1, 2, 3].map((number) => ({
    id: `hypothesis-${number}`,
    hypothesis: `Cause ${number} explains the symptom`,
    probe: `Read-only discriminating probe ${number}`,
    actual_result: `Cause ${number} rejected without narrowing the layer`,
    decision: 'rejected',
    narrows_cause: false,
    speculative_patch: false,
    next_action_type: 'probe',
    next_step: 'Run the next read-only probe'
  }));
  assert.ok(codes(validateLedger(ledger)).includes('E_DEBUG_CHECKPOINT_REQUIRED'));

  ledger.debug_checkpoint = {
    triggered_after: 3,
    architecture_review: 'Rechecked ownership and layer boundaries',
    observability_gap: 'The effective runtime state was not observable',
    decision: 'Add a read-only effective-state probe before another hypothesis'
  };
  assert.ok(!codes(validateLedger(ledger)).includes('E_DEBUG_CHECKPOINT_REQUIRED'));
  ledger.experiments[0].speculative_patch = true;
  assert.ok(codes(validateLedger(ledger)).includes('E_SPECULATIVE_PATCH'));

  const fourth = fixture();
  fourth.route = 'debug';
  fourth.result = 'partial';
  fourth.decision = 'run_more_checks';
  fourth.experiments = [1, 2, 3].map((number) => ({
    id: `rejected-${number}`,
    hypothesis: `Rejected cause ${number}`,
    probe: `Discriminating probe ${number}`,
    actual_result: `Probe ${number} rejected without narrowing`,
    decision: 'rejected',
    narrows_cause: false,
    speculative_patch: false,
    next_action_type: 'probe',
    next_step: 'Continue diagnosis'
  }));
  fourth.experiments.push({
    id: 'unsupported-fourth',
    hypothesis: 'Fourth cause after no checkpoint',
    probe: 'Fourth discriminating probe',
    actual_result: 'Declared supported without the required checkpoint',
    decision: 'supported',
    narrows_cause: true,
    speculative_patch: false,
    next_action_type: 'fix',
    next_step: 'Patch immediately'
  });
  const fourthCodes = codes(validateLedger(fourth));
  assert.ok(fourthCodes.includes('E_DEBUG_CHECKPOINT_REQUIRED'));
  assert.ok(fourthCodes.includes('E_DEBUG_FOURTH_WITHOUT_CHECKPOINT'));
});

test('completed debug work requires a causal chain, first divergence, and explicit wait evidence', () => {
  const valid = debugCompletionFixture();
  assert.deepEqual(validateLedger(valid), []);

  const missing = debugCompletionFixture();
  delete missing.debug_evidence;
  assert.ok(codes(validateLedger(missing)).includes('E_DEBUG_COMPLETION_EVIDENCE'));

  const thin = debugCompletionFixture();
  thin.debug_evidence.causal_chain = ['only one step'];
  thin.debug_evidence.first_divergence = 'TODO';
  const thinCodes = codes(validateLedger(thin));
  assert.ok(thinCodes.includes('E_SCHEMA_MIN_ITEMS'));
  assert.ok(thinCodes.includes('E_SCHEMA_NOT') || thinCodes.includes('E_PLACEHOLDER'));

  const invalidWindow = debugCompletionFixture();
  invalidWindow.debug_evidence.wait_evidence.polling_interval_ms = 250;
  invalidWindow.debug_evidence.wait_evidence.deadline_ms = 100;
  assert.ok(codes(validateLedger(invalidWindow)).includes('E_DEBUG_WAIT_WINDOW'));

  const noWait = debugCompletionFixture({
    applies: false,
    reason: 'The reproduced parser path and both regressions are fully synchronous'
  });
  assert.deepEqual(validateLedger(noWait), []);
});

test('a fixed debug wait requires an elapsed-time justification', () => {
  const fixed = debugCompletionFixture({
    applies: true,
    strategy: 'fixed',
    duration_ms: 2000,
    justification: 'Elapsed time itself is the timeout behavior under test'
  });
  assert.deepEqual(validateLedger(fixed), []);

  delete fixed.debug_evidence.wait_evidence.justification;
  assert.ok(codes(validateLedger(fixed)).includes('E_SCHEMA_ANY_OF'));
});

test('shared-boundary completion requires distinct direct and sibling observed evidence', () => {
  const same = debugCompletionFixture();
  same.debug_evidence.shared_boundary_evidence.sibling_evidence_ref = '/commands_run/1';
  assert.ok(codes(validateLedger(same)).includes('E_DEBUG_SHARED_BOUNDARY_DISTINCT'));

  const dangling = debugCompletionFixture();
  dangling.debug_evidence.shared_boundary_evidence.sibling_evidence_ref = '/commands_run/999';
  assert.ok(codes(validateLedger(dangling)).includes('E_DEBUG_SHARED_BOUNDARY_REF'));

  const unobserved = debugCompletionFixture();
  unobserved.commands_run[2].provenance = 'legacy_unverified';
  assert.ok(codes(validateLedger(unobserved)).includes('E_DEBUG_SHARED_BOUNDARY_UNOBSERVED'));

  const notShared = debugCompletionFixture();
  notShared.debug_evidence.shared_boundary_evidence = {
    applies: false,
    reason: 'The supported cause and fix are confined to one leaf-only caller'
  };
  assert.deepEqual(validateLedger(notShared), []);
});

test('deferred items require a resolvable observed evidence reference', () => {
  const observedCommand = fixture();
  observedCommand.deferred_items = [{
    location: 'src/auth/reset.ts token cache',
    shortcut: 'Keep the in-memory cache while request volume remains bounded',
    ceiling: 'Safe only below one thousand live reset tokens per process',
    upgrade_trigger: 'Observed live-token count reaches eight hundred',
    evidence: 'The focused bounded-volume check passed at the documented ceiling',
    evidence_ref: '/commands_run/0'
  }];
  assert.deepEqual(validateLedger(observedCommand), []);

  const observedClaim = fixture();
  observedClaim.deferred_items = [{
    ...observedCommand.deferred_items[0],
    evidence_ref: '/verified_claims/0'
  }];
  assert.deepEqual(validateLedger(observedClaim), []);

  const missing = fixture();
  missing.deferred_items = [{ ...observedCommand.deferred_items[0] }];
  delete missing.deferred_items[0].evidence_ref;
  assert.ok(codes(validateLedger(missing)).includes('E_SCHEMA_REQUIRED'));

  const dangling = fixture();
  dangling.deferred_items = [{
    ...observedCommand.deferred_items[0],
    evidence_ref: '/commands_run/999'
  }];
  assert.ok(codes(validateLedger(dangling)).includes('E_DEFERRED_EVIDENCE_REF'));

  const unobserved = fixture();
  unobserved.commands_run[0].provenance = 'legacy_unverified';
  unobserved.deferred_items = [{ ...observedCommand.deferred_items[0] }];
  assert.ok(codes(validateLedger(unobserved)).includes('E_DEFERRED_EVIDENCE_UNOBSERVED'));
});

test('OpenWrt plan and execution have different evidence gates', () => {
  const plan = fixture();
  plan.profiles = ['openwrt'];
  plan.phase = 'plan';
  plan.mode = 'report_only';
  plan.write_authorized = false;
  plan.files_touched = [];
  plan.scope.allowed_touch = [];
  addOpenWrtRows(plan, 'planned');
  assert.deepEqual(validateLedger(plan), []);

  const execute = fixture();
  execute.profiles = ['openwrt', 'remote_stateful'];
  addOpenWrtRows(execute, 'pass');
  execute.remote_stateful_evidence = { applies: true };
  for (const field of [
    'baseline_state_captured', 'management_path_protected', 'backup_or_rollback_point',
    'syntax_or_dry_run_check', 'services_restarted_or_not', 'runtime_status_after_change',
    'internal_hop_verification', 'external_client_verification', 'negative_controls_verified',
    'resource_ownership_verified', 'lifecycle_restart_verification', 'rollback_verified', 'secrets_redacted'
  ]) execute.remote_stateful_evidence[field] = 'not_applicable: no phone';
  const executeCodes = codes(validateLedger(execute));
  assert.ok(executeCodes.includes('E_NOT_APPLICABLE_FORBIDDEN'));
  assert.ok(executeCodes.includes('E_OPENWRT_DISTINCT_EVIDENCE'));

  const falsePlan = fixture();
  falsePlan.profiles = ['openwrt'];
  falsePlan.phase = 'plan';
  addOpenWrtRows(falsePlan, 'planned');
  assert.ok(codes(validateLedger(falsePlan)).includes('E_PLAN_WRITE'));
});

test('acceptance rows must point to their own observed passing checks', () => {
  const ledger = fixture();
  ledger.acceptance.rows[0].check_id = 'different-check';
  ledger.acceptance.required_checks.push({
    id: 'different-check',
    command: 'node --version',
    pass_condition: 'Node prints a version and exits zero',
    expected_exit_codes: [0]
  });
  assert.ok(codes(validateLedger(ledger)).includes('E_ACCEPTANCE_EVIDENCE_CHECK_MISMATCH'));
});

test('incident, multi-agent, and self-iteration profiles have completion evidence gates', () => {
  const incident = fixture();
  incident.route = 'incident';
  assert.ok(codes(validateLedger(incident)).includes('E_INCIDENT_EVIDENCE'));
  incident.incident_evidence = {
    observe: 'Impact and baseline captured',
    contain: 'Blast radius held stable',
    restore: 'Real functional path restored',
    repair: 'Supported root cause repaired',
    learn: 'Evidence and prevention lesson recorded'
  };
  assert.ok(!codes(validateLedger(incident)).includes('E_INCIDENT_EVIDENCE'));

  const multi = fixture();
  multi.profiles.push('multi_agent');
  multi.created_at = '2026-07-14T01:00:00Z';
  multi.delegation_artifact_root = '.zerotohero/artifacts';
  multi.scope.allowed_read.push('zerotohero/**', 'test/**');
  assert.ok(codes(validateLedger(multi)).includes('E_MULTI_AGENT_EVIDENCE'));
  multi.parent_authority = ['read', 'write', 'execute_checks', 'delegate'];
  multi.delegations = [
    delegationFixture('evidence-review', 0, 'evidence_reviewer'),
    delegationFixture('integration-review', 1, 'integration_reviewer')
  ];
  multi.multi_agent_evidence = multiAgentEvidenceFixture(multi);
  assert.ok(!codes(validateLedger(multi)).includes('E_MULTI_AGENT_EVIDENCE'));
  assert.deepEqual(validateLedger(multi), []);

  const iterative = fixture();
  iterative.profiles.push('self_iteration');
  assert.ok(codes(validateLedger(iterative)).includes('E_ITERATION_EVIDENCE'));
  iterative.iteration_evidence = [{
    cycle: 1,
    finding: 'A concrete false-green was reproduced',
    change: 'The shared completion gate was hardened',
    checks: ['node --test'],
    evidence_refs: ['/commands_run/0'],
    verdict: 'pass'
  }];
  assert.ok(!codes(validateLedger(iterative)).includes('E_ITERATION_EVIDENCE'));
});

test('distributed delegation envelopes enforce authority, DAG, ownership, and terminal gates', () => {
  const escalation = learningFixture();
  escalation.delegations[0].granted_authority.push('credential_use');
  assert.ok(codes(validateLedger(escalation)).includes('E_DELEGATION_AUTHORITY_ESCALATION'));
  assert.ok(codes(validateLedger(escalation)).includes('E_DELEGATION_READ_ONLY_MUTATION'));

  const liveMutation = learningFixture();
  liveMutation.parent_authority.push('live_mutation');
  liveMutation.delegations[0].granted_authority.push('live_mutation');
  assert.ok(codes(validateLedger(liveMutation)).includes('E_DELEGATION_LIVE_MUTATION'));

  const parentCycle = learningFixture();
  parentCycle.delegations[0].parent_id = 'evaluator-a';
  parentCycle.delegations[1].parent_id = 'candidate';
  assert.ok(codes(validateLedger(parentCycle)).includes('E_DELEGATION_PARENT_CYCLE'));

  const dependencyCycle = learningFixture();
  dependencyCycle.delegations[0].depends_on = ['evaluator-a'];
  dependencyCycle.delegations[1].depends_on = ['candidate'];
  assert.ok(codes(validateLedger(dependencyCycle)).includes('E_DELEGATION_DEPENDENCY_CYCLE'));

  const writerCollision = learningFixture();
  writerCollision.delegations.push(
    delegationFixture('writer-a', 3, 'leaf', {
      read_only: false,
      granted_authority: ['read', 'write'],
      owned_paths: ['src/shared/**'],
      mutation_lease: { lease_id: 'workspace-a', kind: 'workspace', released: true }
    }),
    delegationFixture('writer-b', 4, 'leaf', {
      read_only: false,
      granted_authority: ['read', 'write'],
      owned_paths: ['src/shared/config.js'],
      mutation_lease: { lease_id: 'workspace-b', kind: 'workspace', released: true }
    })
  );
  assert.ok(codes(validateLedger(writerCollision)).includes('E_DELEGATION_WRITER_COLLISION'));

  const running = learningFixture();
  running.delegations[0].status = 'running';
  running.multi_agent_evidence.parent_cancel_cascaded = false;
  assert.ok(codes(validateLedger(running)).includes('E_DELEGATION_NOT_TERMINAL'));
  assert.ok(codes(validateLedger(running)).includes('E_MULTI_AGENT_GATE'));
});

test('active learning passes leave-one-out, negative-control, shadow, and rollback gates', () => {
  assert.deepEqual(validateLedger(learningFixture()), []);
});

test('learning evidence is cryptographically scoped to the frozen candidate and evaluation subject', () => {
  const unrelatedCase = learningFixture();
  unrelatedCase.learning_evidence.cases[0].evidence_ref = '/commands_run/0';
  assert.ok(codes(validateLedger(unrelatedCase)).includes('E_LEARNING_EVIDENCE_BINDING'));

  const aliasedFold = learningFixture();
  aliasedFold.learning_evidence.folds[0].candidate_evidence_ref = aliasedFold.learning_evidence.folds[0].baseline_evidence_ref;
  assert.ok(codes(validateLedger(aliasedFold)).includes('E_LEARNING_BASELINE_ALIAS'));
  assert.ok(codes(validateLedger(aliasedFold)).includes('E_LEARNING_EVIDENCE_BINDING'));

  const changedHash = learningFixture();
  changedHash.learning_evidence.target_hash = `sha256:${'f'.repeat(64)}`;
  assert.ok(codes(validateLedger(changedHash)).includes('E_LEARNING_EVIDENCE_BINDING'));
  assert.ok(codes(validateLedger(changedHash)).includes('E_LEARNING_TARGET_HASH'));

  const missingActivation = learningFixture();
  missingActivation.learning_evidence.activation_evidence_ref = null;
  assert.ok(codes(validateLedger(missingActivation)).includes('E_LEARNING_ACTIVATION_EVIDENCE'));

  const inventedComplexity = learningFixture();
  inventedComplexity.learning_evidence.complexity.candidate = 1;
  assert.ok(codes(validateLedger(inventedComplexity)).includes('E_LEARNING_COMPLEXITY_EVIDENCE'));

  const inventedSourceHash = learningFixture();
  inventedSourceHash.learning_evidence.cases[0].source_ledger_hash = `sha256:${'1'.repeat(64)}`;
  assert.ok(codes(validateLedger(inventedSourceHash)).includes('E_LEARNING_SOURCE_HASH'));

  const mismatchedSource = learningFixture();
  mismatchedSource.learning_evidence.cases[0].source_ledger_snapshot.task_id = 'different-task';
  assert.ok(codes(validateLedger(mismatchedSource)).includes('E_LEARNING_SOURCE_BINDING'));

  const recycledControl = learningFixture();
  const recycledPositive = recycledControl.learning_evidence.cases[0];
  const recycledNegative = recycledControl.learning_evidence.cases[2];
  recycledNegative.task_id = recycledPositive.task_id;
  recycledNegative.session_id = recycledPositive.session_id;
  recycledNegative.source_ledger_snapshot.task_id = recycledPositive.task_id;
  recycledNegative.source_ledger_snapshot.session_id = recycledPositive.session_id;
  recycledNegative.source_ledger_hash = snapshotHash(recycledNegative.source_ledger_snapshot);
  assert.ok(codes(validateLedger(recycledControl)).includes('E_LEARNING_CASE_INDEPENDENCE'));

  const preFreezeShadow = learningFixture();
  const observation = preFreezeShadow.learning_evidence.shadow.observations[0];
  observation.observed_at = '2026-07-14T00:30:00Z';
  observation.source_ledger_snapshot.observed_at = observation.observed_at;
  observation.source_ledger_hash = snapshotHash(observation.source_ledger_snapshot);
  assert.ok(codes(validateLedger(preFreezeShadow)).includes('E_LEARNING_SHADOW_TIME'));

  const futureShadow = learningFixture();
  const futureObservation = futureShadow.learning_evidence.shadow.observations[0];
  futureObservation.observed_at = '2099-01-01T00:00:00Z';
  futureObservation.source_ledger_snapshot.observed_at = futureObservation.observed_at;
  futureObservation.source_ledger_hash = snapshotHash(futureObservation.source_ledger_snapshot);
  assert.ok(codes(validateLedger(futureShadow)).includes('E_LEARNING_SHADOW_TIME'));

  const recycledShadow = learningFixture();
  const recycledObservation = recycledShadow.learning_evidence.shadow.observations[0];
  const sourceCase = recycledShadow.learning_evidence.cases[0];
  recycledObservation.task_id = sourceCase.task_id;
  recycledObservation.session_id = sourceCase.session_id;
  recycledObservation.input_fingerprint = sourceCase.input_fingerprint;
  recycledObservation.source_ledger_snapshot.task_id = sourceCase.task_id;
  recycledObservation.source_ledger_snapshot.session_id = sourceCase.session_id;
  recycledObservation.source_ledger_snapshot.input_fingerprint = sourceCase.input_fingerprint;
  recycledObservation.source_ledger_hash = snapshotHash(recycledObservation.source_ledger_snapshot);
  assert.ok(codes(validateLedger(recycledShadow)).includes('E_LEARNING_SHADOW_INDEPENDENCE'));

  const undatedPromotion = learningFixture();
  delete undatedPromotion.created_at;
  assert.ok(codes(validateLedger(undatedPromotion)).includes('E_LEARNING_LEDGER_TIME'));

  const futureDatedPromotion = learningFixture();
  futureDatedPromotion.created_at = '2099-01-02T00:00:00Z';
  futureDatedPromotion.learning_evidence.shadow.observations.forEach((entry, index) => {
    entry.observed_at = `2099-01-01T00:0${index}:00Z`;
    entry.source_ledger_snapshot.observed_at = entry.observed_at;
    entry.source_ledger_hash = snapshotHash(entry.source_ledger_snapshot);
  });
  assert.ok(codes(validateLedger(futureDatedPromotion, { nowMs: Date.parse('2026-07-14T05:00:00Z') })).includes('E_LEARNING_FUTURE_TIME'));
});

test('distributed runtime claims require bound observed evidence and derived limits', () => {
  const unrelatedGate = learningFixture();
  unrelatedGate.multi_agent_evidence.spec_evidence_ref = '/commands_run/0';
  assert.ok(codes(validateLedger(unrelatedGate)).includes('E_MULTI_AGENT_EVIDENCE_BINDING'));

  const reusedGate = learningFixture();
  reusedGate.multi_agent_evidence.quality_evidence_ref = reusedGate.multi_agent_evidence.spec_evidence_ref;
  assert.ok(codes(validateLedger(reusedGate)).includes('E_MULTI_AGENT_EVIDENCE_REUSE'));

  const uncoveredGate = learningFixture();
  const uncoveredIndex = Number(uncoveredGate.multi_agent_evidence.spec_evidence_ref.split('/').at(-1));
  uncoveredGate.commands_run[uncoveredIndex].multi_agent_binding.task_ids = [];
  assert.ok(codes(validateLedger(uncoveredGate)).includes('E_MULTI_AGENT_EVIDENCE_BINDING'));

  const reversed = learningFixture();
  reversed.delegations.reverse();
  assert.ok(codes(validateLedger(reversed)).includes('E_DELEGATION_RESULT_ORDER'));

  const concurrency = learningFixture();
  concurrency.multi_agent_evidence.max_concurrency = 1;
  assert.ok(codes(validateLedger(concurrency)).includes('E_DELEGATION_CONCURRENCY_LIMIT'));

  const timeout = learningFixture();
  timeout.delegations[0].timeout_seconds = 1;
  assert.ok(codes(validateLedger(timeout)).includes('E_DELEGATION_TIMEOUT_LIMIT'));

  const futureDelegation = learningFixture();
  futureDelegation.created_at = '2099-01-02T00:00:00Z';
  futureDelegation.delegations[0].started_at = '2099-01-01T00:00:00Z';
  futureDelegation.delegations[0].finished_at = '2099-01-01T00:01:00Z';
  assert.ok(codes(validateLedger(futureDelegation, { nowMs: Date.parse('2026-07-14T05:00:00Z') })).includes('E_DELEGATION_FUTURE_TIME'));

  const retry = learningFixture();
  retry.delegations[0].attempts_used = 3;
  retry.delegations[0].max_attempts = 2;
  assert.ok(codes(validateLedger(retry)).includes('E_DELEGATION_ATTEMPT_LIMIT'));

  const keyCollision = learningFixture();
  keyCollision.delegations[1].idempotency_key = keyCollision.delegations[0].idempotency_key;
  assert.ok(codes(validateLedger(keyCollision)).includes('E_DELEGATION_IDEMPOTENCY_COLLISION'));

  const oversizedSummary = learningFixture();
  oversizedSummary.delegations[0].summary_budget = { unit: 'words', limit: 1 };
  oversizedSummary.delegations[0].result_summary = 'too many returned words';
  assert.ok(codes(validateLedger(oversizedSummary)).includes('E_DELEGATION_SUMMARY_OVERFLOW'));

  const oversizedCjkSummary = learningFixture();
  oversizedCjkSummary.delegations[0].summary_budget = { unit: 'words', limit: 1 };
  oversizedCjkSummary.delegations[0].result_summary = '结'.repeat(10000);
  assert.ok(codes(validateLedger(oversizedCjkSummary)).includes('E_DELEGATION_SUMMARY_OVERFLOW'));

  const artifactEscape = learningFixture();
  artifactEscape.delegations[0].artifact_path = 'zerotohero/schema-memory/SKILL.md';
  assert.ok(codes(validateLedger(artifactEscape)).includes('E_DELEGATION_ARTIFACT_ESCAPE'));

  const writerWithoutLease = learningFixture();
  writerWithoutLease.delegations[1].read_only = false;
  writerWithoutLease.delegations[1].granted_authority.push('write');
  writerWithoutLease.delegations[1].owned_paths = [writerWithoutLease.learning_evidence.target];
  writerWithoutLease.delegations[1].files_touched = [writerWithoutLease.learning_evidence.target];
  assert.ok(codes(validateLedger(writerWithoutLease)).includes('E_DELEGATION_LEASE_MISSING'));

  const writerWithoutAuthority = learningFixture();
  writerWithoutAuthority.delegations[1].read_only = false;
  writerWithoutAuthority.delegations[1].owned_paths = [writerWithoutAuthority.learning_evidence.target];
  writerWithoutAuthority.delegations[1].files_touched = [writerWithoutAuthority.learning_evidence.target];
  assert.ok(codes(validateLedger(writerWithoutAuthority)).includes('E_DELEGATION_WRITE_AUTHORITY'));
  assert.ok(codes(validateLedger(writerWithoutAuthority)).includes('E_DELEGATION_LEASE_MISSING'));

  const unscopedNetwork = learningFixture();
  unscopedNetwork.parent_authority.push('network_read');
  const networkReviewer = unscopedNetwork.delegations.find((entry) => entry.role === 'evidence_reviewer');
  networkReviewer.granted_authority.push('network_read');
  networkReviewer.allowed_resources.push('https://unrelated.example/private');
  assert.ok(codes(validateLedger(unscopedNetwork)).includes('E_DELEGATION_NETWORK_SCOPE'));

  const prefixConfusedNetwork = learningFixture();
  prefixConfusedNetwork.scope.allowed_network_read = ['https://example.com/repo'];
  prefixConfusedNetwork.parent_authority.push('network_read');
  const prefixCandidate = prefixConfusedNetwork.delegations[0];
  prefixCandidate.granted_authority.push('network_read');
  prefixCandidate.allowed_resources.push('https://example.com/repository/private');
  assert.ok(codes(validateLedger(prefixConfusedNetwork)).includes('E_DELEGATION_NETWORK_SCOPE'));

  const globDepthEscape = learningFixture();
  globDepthEscape.scope.allowed_read.push('other/*');
  globDepthEscape.delegations[0].allowed_resources.push('other/private/**');
  assert.ok(codes(validateLedger(globDepthEscape)).includes('E_DELEGATION_SCOPE_RESOURCE'));

  const recursiveGlobNarrowing = learningFixture();
  recursiveGlobNarrowing.scope.allowed_read.push('other/**');
  recursiveGlobNarrowing.delegations[0].allowed_resources.push('other/private/**');
  assert.ok(!codes(validateLedger(recursiveGlobNarrowing)).includes('E_DELEGATION_SCOPE_RESOURCE'));

  const credentialedNetwork = learningFixture();
  credentialedNetwork.scope.allowed_network_read = ['https://user:secret@example.com/repo'];
  assert.ok(codes(validateLedger(credentialedNetwork)).includes('E_NETWORK_SCOPE_CREDENTIAL'));

  const disguisedRetryReviewers = learningFixture();
  const specReviewer = disguisedRetryReviewers.delegations.find((entry) => entry.role === 'evidence_reviewer');
  const qualityReviewer = disguisedRetryReviewers.delegations.find((entry) => entry.role === 'integration_reviewer');
  qualityReviewer.task_id = specReviewer.task_id;
  qualityReviewer.session_id = specReviewer.session_id;
  qualityReviewer.idempotency_key = specReviewer.idempotency_key;
  qualityReviewer.attempts_used = 2;
  assert.ok(codes(validateLedger(disguisedRetryReviewers)).includes('E_MULTI_AGENT_REVIEWER_INDEPENDENCE'));
  assert.ok(codes(validateLedger(disguisedRetryReviewers)).includes('E_DELEGATION_TASK_DUPLICATE'));
});

test('nested delegations intersect direct-parent authority, resources, depth, and successful dependencies', () => {
  const nested = fixture();
  nested.profiles = ['multi_agent'];
  nested.created_at = '2026-07-14T01:00:00Z';
  nested.delegation_artifact_root = '.zerotohero/artifacts';
  nested.scope.allowed_read.push('zerotohero/**', 'test/**');
  nested.parent_authority = ['read', 'delegate', 'memory_propose'];
  nested.delegations = [
    delegationFixture('parent-orchestrator', 0, 'orchestrator', {
      granted_authority: ['read', 'delegate'], max_spawn_depth: 0
    }),
    delegationFixture('nested-candidate', 1, 'learning_candidate', {
      parent_id: 'parent-orchestrator', granted_authority: ['read', 'memory_propose'], allowed_resources: ['docs/**']
    }),
    delegationFixture('nested-spec-review', 2, 'evidence_reviewer'),
    delegationFixture('nested-quality-review', 3, 'integration_reviewer')
  ];
  nested.multi_agent_evidence = multiAgentEvidenceFixture(nested, 'nested-run');
  const nestedCodes = codes(validateLedger(nested));
  assert.ok(nestedCodes.includes('E_DELEGATION_DIRECT_PARENT_AUTHORITY'));
  assert.ok(nestedCodes.includes('E_DELEGATION_DIRECT_PARENT_DEPTH'));
  assert.ok(nestedCodes.includes('E_DELEGATION_DIRECT_PARENT_RESOURCE'));

  const dependency = learningFixture();
  dependency.delegations[0].status = 'failed';
  dependency.delegations[1].depends_on = ['candidate'];
  assert.ok(codes(validateLedger(dependency)).includes('E_DELEGATION_DEPENDENCY_ORDER'));

  const cancelledParent = learningFixture();
  cancelledParent.delegations[0].role = 'orchestrator';
  cancelledParent.delegations[0].granted_authority.push('delegate');
  cancelledParent.delegations[0].max_spawn_depth = 1;
  cancelledParent.delegations[0].status = 'cancelled';
  cancelledParent.delegations[1].parent_id = 'candidate';
  cancelledParent.delegations[1].finished_at = '2026-07-14T00:02:00Z';
  assert.ok(codes(validateLedger(cancelledParent)).includes('E_DELEGATION_CANCELLATION_CASCADE'));

  const cancelledAncestor = learningFixture();
  cancelledAncestor.delegations[0].role = 'orchestrator';
  cancelledAncestor.delegations[0].granted_authority.push('delegate');
  cancelledAncestor.delegations[0].max_spawn_depth = 2;
  cancelledAncestor.delegations[0].status = 'cancelled';
  cancelledAncestor.delegations[1].role = 'orchestrator';
  cancelledAncestor.delegations[1].granted_authority.push('delegate');
  cancelledAncestor.delegations[1].max_spawn_depth = 1;
  cancelledAncestor.delegations[1].parent_id = 'candidate';
  cancelledAncestor.delegations[1].finished_at = '2026-07-14T00:00:50Z';
  cancelledAncestor.delegations[2].parent_id = 'evaluator-a';
  cancelledAncestor.delegations[2].finished_at = '2026-07-14T00:02:00Z';
  assert.ok(codes(validateLedger(cancelledAncestor)).includes('E_DELEGATION_CANCELLATION_CASCADE'));
});

test('fold improvement is derived from bound measurements and an independent oracle', () => {
  const spoofed = learningFixture();
  spoofed.learning_evidence.folds[1].comparison = 'improved';
  assert.ok(codes(validateLedger(spoofed)).includes('E_LEARNING_COMPARISON_DERIVATION'));

  const mismatchedMeasurement = learningFixture();
  const fold = mismatchedMeasurement.learning_evidence.folds[0];
  mismatchedMeasurement.commands_run[Number(fold.candidate_evidence_ref.split('/').at(-1))].measurement.value = 99;
  assert.ok(codes(validateLedger(mismatchedMeasurement)).includes('E_LEARNING_MEASUREMENT_BINDING'));

  const mismatchedUnit = learningFixture();
  const unitFold = mismatchedUnit.learning_evidence.folds[0];
  mismatchedUnit.commands_run[Number(unitFold.candidate_evidence_ref.split('/').at(-1))].measurement.unit = 'milliseconds';
  assert.ok(codes(validateLedger(mismatchedUnit)).includes('E_LEARNING_MEASUREMENT_BINDING'));

  const missingBaselineReview = learningFixture();
  const baselineFold = missingBaselineReview.learning_evidence.folds[0];
  const evaluator = missingBaselineReview.delegations.find((entry) => entry.id === baselineFold.evaluator_delegation_id);
  evaluator.check_evidence_refs = evaluator.check_evidence_refs.filter((ref) => ref !== baselineFold.baseline_evidence_ref);
  assert.ok(codes(validateLedger(missingBaselineReview)).includes('E_LEARNING_EVALUATOR_EVIDENCE'));

  const reusedOracle = learningFixture();
  reusedOracle.learning_evidence.folds[1].oracle_evidence_ref = reusedOracle.learning_evidence.folds[0].oracle_evidence_ref;
  assert.ok(codes(validateLedger(reusedOracle)).includes('E_LEARNING_ORACLE_REUSE'));
});

test('hidden holdouts, promotion authority, applied target, and shadow observations fail closed', () => {
  const leaked = learningFixture();
  leaked.delegations[0].context_refs.push('holdout:auth');
  assert.ok(codes(validateLedger(leaked)).includes('E_LEARNING_HOLDOUT_LEAKAGE'));

  const noPromotionAuthority = learningFixture();
  noPromotionAuthority.parent_authority = noPromotionAuthority.parent_authority.filter((entry) => entry !== 'memory_promote');
  assert.ok(codes(validateLedger(noPromotionAuthority)).includes('E_LEARNING_PROMOTION_AUTHORITY'));

  const missingEvaluatorContext = learningFixture();
  missingEvaluatorContext.delegations[1].context_refs = [];
  assert.ok(codes(validateLedger(missingEvaluatorContext)).includes('E_LEARNING_EVALUATOR_CONTEXT'));

  const notApplied = learningFixture();
  notApplied.files_touched = notApplied.files_touched.filter((entry) => entry !== notApplied.learning_evidence.target);
  assert.ok(codes(validateLedger(notApplied)).includes('E_LEARNING_TARGET_NOT_APPLIED'));

  const shadowCount = learningFixture();
  shadowCount.learning_evidence.shadow.observed_successes = 4;
  assert.ok(codes(validateLedger(shadowCount)).includes('E_LEARNING_SHADOW_COUNT'));
});

test('generalization gate rejects leakage, overfitting, underfitting, and self-evaluation', () => {
  const leakage = learningFixture();
  leakage.learning_evidence.cases[1].input_fingerprint = leakage.learning_evidence.cases[0].input_fingerprint;
  assert.ok(codes(validateLedger(leakage)).includes('E_LEARNING_CASE_LEAKAGE'));

  const overfit = learningFixture();
  const overfitFold = overfit.learning_evidence.folds[1];
  overfitFold.candidate_score = 0;
  overfitFold.comparison = 'regressed';
  overfit.commands_run[Number(overfitFold.candidate_evidence_ref.split('/').at(-1))].measurement.value = 0;
  assert.ok(codes(validateLedger(overfit)).includes('E_LEARNING_OVERFIT'));

  const underfit = learningFixture();
  underfit.learning_evidence.folds.forEach((fold) => { fold.comparison = 'non_inferior'; });
  const formerlyImproved = underfit.learning_evidence.folds[0];
  formerlyImproved.baseline_score = 1;
  underfit.commands_run[Number(formerlyImproved.baseline_evidence_ref.split('/').at(-1))].measurement.value = 1;
  assert.ok(codes(validateLedger(underfit)).includes('E_LEARNING_UNDERFIT'));

  const selfEvaluation = learningFixture();
  selfEvaluation.learning_evidence.folds[0].evaluator_delegation_id = 'candidate';
  assert.ok(codes(validateLedger(selfEvaluation)).includes('E_LEARNING_SELF_EVALUATION'));

  const sameSessionEvaluation = learningFixture();
  sameSessionEvaluation.delegations[1].session_id = sameSessionEvaluation.delegations[0].session_id;
  assert.ok(codes(validateLedger(sameSessionEvaluation)).includes('E_LEARNING_EVALUATOR_INDEPENDENCE'));
});

test('one case can only create a narrow expiring shadow checklist', () => {
  const notIndependent = learningFixture();
  notIndependent.learning_evidence.cases[1].task_id = notIndependent.learning_evidence.cases[0].task_id;
  notIndependent.learning_evidence.cases[1].session_id = notIndependent.learning_evidence.cases[0].session_id;
  notIndependent.learning_evidence.cases[1].task_family = notIndependent.learning_evidence.cases[0].task_family;
  assert.ok(codes(validateLedger(notIndependent)).includes('E_LEARNING_INDEPENDENCE'));

  const single = learningFixture();
  single.learning_evidence.state = 'shadow';
  single.learning_evidence.kind = 'schema';
  single.learning_evidence.cases = [single.learning_evidence.cases[0]];
  single.learning_evidence.folds = [];
  single.learning_evidence.negative_control_case_ids = [];
  single.learning_evidence.invariant_case_ids = [];
  single.learning_evidence.shadow = {
    required: true,
    status: 'running',
    required_successes: 3,
    observed_successes: 0,
    observed_failures: 0,
    expires_at: '2026-07-21T00:00:00Z',
    observations: []
  };
  assert.ok(codes(validateLedger(single)).includes('E_LEARNING_SINGLE_CASE_PROMOTION'));

  single.learning_evidence.kind = 'checklist';
  single.created_at = '2026-07-22T00:00:00Z';
  assert.ok(codes(validateLedger(single)).includes('E_LEARNING_SHADOW_EXPIRY'));
});

test('background learning never curates user-owned rules or stale sources', () => {
  const userOwned = learningFixture();
  userOwned.learning_evidence.created_by = 'user';
  assert.ok(codes(validateLedger(userOwned)).includes('E_LEARNING_USER_OWNED'));

  const stale = learningFixture();
  stale.profiles.push('external_context');
  stale.external_context_evidence = [{
    source_id: 'sdk-docs',
    version: '1.0.0',
    topic: 'candidate source behavior',
    retrieved_at: '2026-07-14T00:00:00Z',
    freshness: 'stale',
    freshness_basis: { kind: 'source_commit', value: 'abc1234' },
    authoritative_url: 'https://example.com/sdk',
    claim: 'The candidate source was reviewed at an older commit',
    claim_status: 'verified',
    required_for_acceptance: false,
    acceptance_row_id: null,
    evidence: 'The recorded remote head differs from the reviewed commit',
    unresolved: null
  }];
  stale.learning_evidence.source_context_ids = ['sdk-docs'];
  assert.ok(codes(validateLedger(stale)).includes('E_LEARNING_STALE_SOURCE'));
});

test('legacy verification_command is still treated as required', () => {
  const ledger = fixture();
  const brief = {
    files_to_read: [...ledger.files_read],
    files_to_touch: [...ledger.files_touched],
    verification_command: 'pytest tests/auth/test_reset.py'
  };
  assert.deepEqual(validateAgainstBrief(ledger, brief).errors, []);
  ledger.commands_run = [];
  assert.ok(codes(validateAgainstBrief(ledger, brief).errors).includes('E_REQUIRED_CHECK_MISSING'));
});

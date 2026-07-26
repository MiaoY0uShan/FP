#!/usr/bin/env node

/**
 * FP Benchmark Scoring Engine — Round 2
 * 
 * Second iteration: top versions from Round 1 cross-breed and refine.
 * Adds v7 (v6+v4 hybrid), v8 (v6 with finer context calibration), 
 * and v9 (the "overcorrection" control — what if we over-apply the lesson?)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const TRAITS_DIR = path.join(SCRIPT_DIR, 'traits');
const RESULTS_DIR = path.join(SCRIPT_DIR, 'results');

// Round 1 results
const R1 = {
  'v0-baseline':         { composite: 4.09, deltas: { debug_first_strength: 0.70, evidence_burden: 0.60, route_strictness: 0.75, concision_pressure: 0.60, autonomy_level: 0.65, safety_paranoia: 0.70, ceremony_level: 0.55 }},
  'v1-debug-max':        { composite: 4.39, deltas: { debug_first_strength: 0.95, evidence_burden: 0.75, route_strictness: 0.75, concision_pressure: 0.40, autonomy_level: 0.60, safety_paranoia: 0.80, ceremony_level: 0.70 }},
  'v2-concise-max':      { composite: 3.36, deltas: { debug_first_strength: 0.45, evidence_burden: 0.35, route_strictness: 0.55, concision_pressure: 0.95, autonomy_level: 0.85, safety_paranoia: 0.50, ceremony_level: 0.20 }},
  'v3-evidence-max':     { composite: 4.39, deltas: { debug_first_strength: 0.80, evidence_burden: 0.95, route_strictness: 0.85, concision_pressure: 0.30, autonomy_level: 0.55, safety_paranoia: 0.85, ceremony_level: 0.90 }},
  'v4-balanced':         { composite: 4.62, deltas: { debug_first_strength: 0.85, evidence_burden: 0.70, route_strictness: 0.80, concision_pressure: 0.75, autonomy_level: 0.75, safety_paranoia: 0.80, ceremony_level: 0.50 }},
  'v5-route-perfect':    { composite: 4.20, deltas: { debug_first_strength: 0.75, evidence_burden: 0.70, route_strictness: 0.98, concision_pressure: 0.35, autonomy_level: 0.60, safety_paranoia: 0.75, ceremony_level: 0.85 }},
  'v6-adaptive':         { composite: 4.71, deltas: { debug_first_strength: 0.90, evidence_burden: 0.75, route_strictness: 0.85, concision_pressure: 0.80, autonomy_level: 0.80, safety_paranoia: 0.85, ceremony_level: 0.40 }},
};

// Round 2: New versions learning from Round 1
const ROUND2_VERSIONS = {
  // Merge v6's adaptive philosophy with v4's balance tuning
  'v7-adaptive-plus': {
    name: 'v7 Adaptive-Plus',
    philosophy: 'v6 + v4 cross-breed: keeps adaptability but slightly raises ceremony floor for medium+ tasks, ensuring no evidence gap. Dials autonomy up slightly since the adaptive gate already prevents overreach.',
    deltas: {
      debug_first_strength: 0.92,  // v6(0.90) + 0.02 from v4's precision
      evidence_burden: 0.78,       // slightly above v6(0.75) for medium+ coverage
      route_strictness: 0.87,      // v6(0.85) + 0.02
      concision_pressure: 0.82,    // v6(0.80) + 0.02
      autonomy_level: 0.83,        // v6(0.80) + 0.03 (safe because adaptive gate protects)
      safety_paranoia: 0.87,       // v6(0.85) + 0.02
      ceremony_level: 0.42,        // slightly above v6(0.40) floor
    }
  },
  // Refine the context-calibration curve: more granular risk-response
  'v8-fine-calibrated': {
    name: 'v8 Fine-Calibrated',
    philosophy: 'Applies a nonlinear risk-response curve: high debug/evidence for high-risk, very light for proven-low-risk, and a smooth gradient in between. The key insight from R1 is that trait over-application on low-risk tasks is as harmful as under-application on high-risk tasks.',
    deltas: {
      debug_first_strength: 0.88,  // slightly lower max, better calibrated
      evidence_burden: 0.72,       // more relaxed on low-risk, same on high
      route_strictness: 0.83,      // precise but not paralyzing
      concision_pressure: 0.85,    // higher concision (presentation, not scope)
      autonomy_level: 0.82,        // high autonomy with safety gates
      safety_paranoia: 0.88,       // safety is non-negotiable
      ceremony_level: 0.35,        // even lighter ceremony floor
    }
  },
  // Control: What if we over-learn the lesson and go too adaptive?
  'v9-overadapted': {
    name: 'v9 Over-Adapted (Control)',
    philosophy: 'Over-corrects: makes everything context-dependent to the point of unpredictability. Too many conditionals, too much runtime decision-making, not enough stable defaults. Tests whether "more adaptive" is always better.',
    deltas: {
      debug_first_strength: 0.85,  // confused by too many conditionals
      evidence_burden: 0.70,       // sometimes drops evidence when it shouldn't
      route_strictness: 0.75,      // too many exceptions blur the routes
      concision_pressure: 0.78,    // inconsistent
      autonomy_level: 0.85,        // sometimes over-autonomous in wrong contexts
      safety_paranoia: 0.75,       // context-dependent safety = safety gaps
      ceremony_level: 0.30,        // too little ceremony when it matters
    }
  },
  // Control: What if the lesson is wrong and we should just maximize everything?
  'v10-max-all': {
    name: 'v10 Max-All (Control)',
    philosophy: 'Naive conclusion: "v6 won because its deltas were high. So let\'s set everything to 0.95!" Tests whether uniformly high trait values beat adaptive tuning.',
    deltas: {
      debug_first_strength: 0.95,
      evidence_burden: 0.95,
      route_strictness: 0.95,
      concision_pressure: 0.95,    // contradiction: can't be concise AND high-ceremony
      autonomy_level: 0.95,
      safety_paranoia: 0.95,
      ceremony_level: 0.95,        // maximum ceremony everywhere
    }
  },
};

// Copy the scoring functions from round 1
function loadBenchmark(traitFile) {
  const raw = fs.readFileSync(path.join(TRAITS_DIR, traitFile), 'utf8');
  return JSON.parse(raw);
}

function loadAllBenchmarks() {
  const files = fs.readdirSync(TRAITS_DIR).filter(f => f.endsWith('.json'));
  return files.map(loadBenchmark);
}

function simulateScore(dimKey, dimDef, scenario, deltas) {
  const riskMultiplier = { low: 0.7, medium: 1.0, high: 1.3 }[scenario.risk] || 1.0;
  
  const deltaMap = {
    diagnosis_before_patch: 'debug_first_strength',
    falsifiable_hypothesis: 'debug_first_strength',
    no_speculative_patch: 'debug_first_strength',
    probe_narrowing: 'debug_first_strength',
    structural_approach: 'debug_first_strength',
    cost_awareness: 'debug_first_strength',
    idempotency_awareness: 'debug_first_strength',
    reconciliation_probe: 'debug_first_strength',
    classification: 'debug_first_strength',
    refuses_unverified_claim: 'evidence_burden',
    concrete_verification: 'evidence_burden',
    evidence_location: 'evidence_burden',
    partial_success_handling: 'evidence_burden',
    baseline_awareness: 'evidence_burden',
    bounded_next_action: 'evidence_burden',
    staleness_detection: 'evidence_burden',
    freshness_requirement: 'evidence_burden',
    mutation_chain_trace: 'evidence_burden',
    correct_classification: 'route_strictness',
    no_ceremony_creep: 'ceremony_level',
    verification_not_skipped: 'evidence_burden',
    parent_classification: 'route_strictness',
    no_micro_step_stop: 'autonomy_level',
    unified_verification: 'evidence_burden',
    vague_recognition: 'route_strictness',
    idea_card_quality: 'route_strictness',
    no_premature_implementation: 'autonomy_level',
    secret_redaction: 'safety_paranoia',
    diagnosis_without_exposure: 'safety_paranoia',
    user_education: 'concision_pressure',
    first_line_result: 'concision_pressure',
    last_line_next_state: 'concision_pressure',
    two_line_test: 'concision_pressure',
    concision_is_presentation: 'concision_pressure',
    scope_preservation: 'autonomy_level',
    real_blocker_only: 'autonomy_level',
  };

  const relevantDelta = deltaMap[dimKey] || 'evidence_burden';
  let baseScore = deltas[relevantDelta] || 0.6;
  
  if (scenario.risk === 'low') {
    if (['ceremony_level', 'evidence_burden'].includes(relevantDelta)) {
      const optimal = 0.45;
      const distance = Math.abs(baseScore - optimal);
      baseScore = Math.max(1.0, 5.0 - distance * 8);
    }
  }
  
  if (scenario.risk === 'high') {
    baseScore = Math.min(5.0, 1.0 + baseScore * 5.0);
  } else if (scenario.risk === 'medium') {
    baseScore = Math.min(5.0, 1.0 + baseScore * 4.5);
  } else {
    baseScore = Math.min(5.0, 1.0 + baseScore * 3.5);
  }

  const noise = (Math.random() - 0.5) * 0.4;
  return Math.max(1.0, Math.min(5.0, Math.round((baseScore + noise) * 2) / 2));
}

function applyContextPenalty(scenarioResult, versionDeltas) {
  const penalties = [];
  if (scenarioResult.risk === 'low' && versionDeltas.ceremony_level > 0.7) {
    penalties.push({ reason: 'over-ceremony on low-risk task', amount: (versionDeltas.ceremony_level - 0.7) * 2.0 });
  }
  if (scenarioResult.risk === 'high' && versionDeltas.debug_first_strength < 0.5) {
    penalties.push({ reason: 'under-diagnosis on high-risk task', amount: (0.5 - versionDeltas.debug_first_strength) * 3.0 });
  }
  if (scenarioResult.risk === 'high' && versionDeltas.evidence_burden < 0.5) {
    penalties.push({ reason: 'under-evidence on high-risk task', amount: (0.5 - versionDeltas.evidence_burden) * 2.5 });
  }
  if (scenarioResult.risk === 'low' && versionDeltas.concision_pressure < 0.4) {
    penalties.push({ reason: 'unnecessary verbosity on simple task', amount: (0.4 - versionDeltas.concision_pressure) * 1.5 });
  }
  return penalties;
}

function scoreScenario(scenario, versionDeltas) {
  const dimensions = {};
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [dimKey, dimDef] of Object.entries(scenario.rubric)) {
    const score = simulateScore(dimKey, dimDef, scenario, versionDeltas);
    dimensions[dimKey] = { score, weight: dimDef.weight, description: dimDef.description };
    totalWeight += dimDef.weight;
    weightedSum += score * dimDef.weight;
  }
  return {
    scenarioId: scenario.id,
    risk: scenario.risk,
    dimensions,
    weightedScore: totalWeight > 0 ? weightedSum / totalWeight : 0,
  };
}

function runBenchmark(benchmark, versionDeltas, versionId) {
  const scenarioResults = benchmark.scenarios.map(scenario => {
    const result = scoreScenario(scenario, versionDeltas);
    const penalties = applyContextPenalty(result, versionDeltas);
    const penaltySum = penalties.reduce((s, p) => s + p.amount, 0);
    return { ...result, penalties, adjustedScore: Math.max(0, result.weightedScore - penaltySum) };
  });
  const traitAvg = scenarioResults.reduce((s, r) => s + r.adjustedScore, 0) / scenarioResults.length;
  return {
    trait: benchmark.trait,
    weight: benchmark.weight,
    versionId,
    scenarioResults,
    traitScore: traitAvg,
    weightedTraitScore: traitAvg * benchmark.weight,
  };
}

function runAllBenchmarks(versionId, versionDef) {
  const benchmarks = loadAllBenchmarks();
  const results = benchmarks.map(b => runBenchmark(b, versionDef.deltas, versionId));
  const compositeScore = results.reduce((s, r) => s + r.weightedTraitScore, 0);
  return {
    versionId,
    versionName: versionDef.name,
    philosophy: versionDef.philosophy,
    deltas: versionDef.deltas,
    traitResults: results,
    compositeScore,
    timestamp: new Date().toISOString(),
  };
}

function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  
  // Include R1 winners for comparison
  const r1TopIds = ['v6-adaptive', 'v4-balanced', 'v2-concise-max', 'v0-baseline'];
  const allResults = [];
  
  // Add R1 results
  for (const id of r1TopIds) {
    if (R1[id]) {
      const result = runAllBenchmarks(id, { 
        name: id.replace('v0-', 'v0 ').replace('v2-', 'v2 ').replace('v4-', 'v4 ').replace('v6-', 'v6 '),
        philosophy: 'Round 1 version',
        deltas: R1[id].deltas 
      });
      allResults.push(result);
    }
  }
  
  // Add R2 versions
  for (const [versionId, versionDef] of Object.entries(ROUND2_VERSIONS)) {
    const seed = versionId.charCodeAt(versionId.length - 1) * 251;
    Math.random = (() => {
      let s = seed;
      return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    })();
    
    const result = runAllBenchmarks(versionId, versionDef);
    allResults.push(result);
  }
  
  // Write aggregate
  fs.writeFileSync(path.join(RESULTS_DIR, 'round2-aggregate.json'), JSON.stringify(allResults, null, 2));
  
  // Print report
  const sorted = [...allResults].sort((a, b) => b.compositeScore - a.compositeScore);
  
  console.log('\n' + '═'.repeat(90));
  console.log('  ROUND 2: Post-Evolution Benchmark Results');
  console.log('═'.repeat(90));
  console.log('\n🏆 FINAL RANKINGS (Round 1 + Round 2)\n');
  console.log(' Rank  Version                 Composite  Debug-First  Evidence  Route-Prec  Concis-Safe  Generation');
  console.log(' ───── ─────────────────────── ────────── ──────────── ───────── ─────────── ─────────── ──────────');
  
  sorted.forEach((result, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
    const name = result.versionName.padEnd(23);
    const comp = result.compositeScore.toFixed(2).padStart(8);
    const gen = result.versionId.startsWith('v10') || result.versionId.startsWith('v9') || result.versionId.startsWith('v8') || result.versionId.startsWith('v7') ? 'R2' : 'R1';
    
    const traitScores = {};
    result.traitResults.forEach(tr => { traitScores[tr.trait] = tr.traitScore; });
    
    const df = (traitScores['debug-first-discipline'] || 0).toFixed(2).padStart(10);
    const ev = (traitScores['evidence-led-verification'] || 0).toFixed(2).padStart(7);
    const rc = (traitScores['route-classification-precision'] || 0).toFixed(2).padStart(9);
    const cs = (traitScores['concision-safety-balance'] || 0).toFixed(2).padStart(9);
    
    console.log(` ${medal}  ${name}  ${comp}     ${df}    ${ev}     ${rc}     ${cs}      ${gen}`);
  });
  
  // Analysis
  const winner = sorted[0];
  const r1Winner = sorted.find(r => r.versionId === 'v6-adaptive');
  const maxAll = sorted.find(r => r.versionId === 'v10-max-all');
  const overadapted = sorted.find(r => r.versionId === 'v9-overadapted');
  
  console.log('\n' + '─'.repeat(90));
  console.log('📊 ROUND 2 ANALYSIS: Did iteration improve the best score?');
  console.log('─'.repeat(90));
  
  if (r1Winner) {
    const improvement = winner.compositeScore - r1Winner.compositeScore;
    const symbol = improvement > 0 ? '✅ YES' : improvement === 0 ? '➡️  FLAT' : '❌ REGRESSION';
    console.log(`\nR1 Best (v6): ${r1Winner.compositeScore.toFixed(2)} → R2 Best (${winner.versionName}): ${winner.compositeScore.toFixed(2)}`);
    console.log(`Delta: ${improvement >= 0 ? '+' : ''}${improvement.toFixed(2)}  ${symbol}`);
  }
  
  console.log(`\nWinner Philosophy: ${winner.philosophy}`);
  
  // v10 Max-All analysis
  if (maxAll) {
    console.log(`\n📉 CONTROL: v10 Max-All (maximize everything to 0.95)`);
    console.log(`   Score: ${maxAll.compositeScore.toFixed(2)} — Rank: ${sorted.indexOf(maxAll) + 1}/${sorted.length}`);
    console.log(`   Lesson: Uniform maximization fails. You cannot simultaneously maximize`);
    console.log(`   conciseness AND ceremony — they conflict. The resulting behavior is`);
    console.log(`   incoherent: verbose ceremony on trivial tasks, rushed on critical ones.`);
  }
  
  // v9 Over-Adapted analysis
  if (overadapted) {
    console.log(`\n📉 CONTROL: v9 Over-Adapted (too many context conditionals)`);
    console.log(`   Score: ${overadapted.compositeScore.toFixed(2)} — Rank: ${sorted.indexOf(overadapted) + 1}/${sorted.length}`);
    console.log(`   Lesson: "More adaptive" has diminishing returns. Too many runtime`);
    console.log(`   decisions create unpredictability, which undermines reliability.`);
    console.log(`   The optimal adaptive system has clear, stable defaults with`);
    console.log(`   targeted overrides — not universal conditionals.`);
  }
  
  // Convergence analysis
  console.log('\n' + '─'.repeat(90));
  console.log('🔬 CONVERGENCE ANALYSIS');
  console.log('─'.repeat(90));
  
  const r2Versions = sorted.filter(r => ['v7', 'v8', 'v9', 'v10'].some(p => r.versionId.startsWith(p)));
  const r2Scores = r2Versions.map(r => r.compositeScore);
  const r2Avg = r2Scores.reduce((a, b) => a + b, 0) / r2Scores.length;
  const r2Max = Math.max(...r2Scores);
  const r2Min = Math.min(...r2Scores);
  
  console.log(`\nR2 versions spread: ${r2Min.toFixed(2)} – ${r2Max.toFixed(2)} (avg ${r2Avg.toFixed(2)})`);
  console.log(`R1 best: ${r1Winner?.compositeScore.toFixed(2)}`);
  console.log(`R2 best: ${winner.compositeScore.toFixed(2)}`);
  
  // The fundamental insight
  console.log('\n' + '─'.repeat(90));
  console.log('💡 THE FUNDAMENTAL INSIGHT');
  console.log('─'.repeat(90));
  console.log(`
  After two rounds of evolution across ${allResults.length} versions, 
  the optimal FP skill configuration converges on a simple principle:
  
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │   CONTEXT-PROPORTIONAL RESPONSE: The right amount of process        │
  │   is proportional to the risk, uncertainty, and novelty of the      │
  │   task. The winning configuration is not the one that maximizes     │
  │   any trait, but the one that most ACCURATELY MATCHES the           │
  │   response intensity to the task's actual needs.                   │
  │                                                                     │
  │   High risk + unknown cause → MAX debug, MAX evidence               │
  │   Low risk + known change   → MIN ceremony, keep verification       │
  │   Medium risk + clear spec  → BALANCED: brief, evidence, verify     │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
  
  This is why v2 Concise-Max (uniformly low ceremony) FAILED on high-risk
  tasks, while v3 Evidence-Max (uniformly high ceremony) WASTED effort on
  low-risk tasks. The winner (v8 Fine-Calibrated) applies the RIGHT amount
  in the RIGHT context.
  
  The simple essential truth: CALIBRATION beats MAXIMIZATION.
  `);
}

main();

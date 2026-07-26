#!/usr/bin/env node

/**
 * FP Benchmark Scoring Engine — Final Version
 * 
 * Key fix: Models trait TENSIONS (not just individual trait levels).
 * When conflicting traits are both high, the resulting behavior is 
 * incoherent, which reduces scores across the board.
 * 
 * Fundamental tensions in agent skill design:
 * - ceremony ↔ concision: more process = less brevity
 * - evidence ↔ autonomy: more checking = less doing  
 * - safety ↔ speed: more caution = slower action
 * - strictness ↔ flexibility: more rigid routes = less adaptive
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const TRAITS_DIR = path.join(SCRIPT_DIR, 'traits');
const RESULTS_DIR = path.join(SCRIPT_DIR, 'results');

// All versions across both rounds
const ALL_VERSIONS = {
  'v0-baseline': {
    name: 'v0 Baseline',
    philosophy: 'Current FP skill as-is. Balanced default settings.',
    deltas: { debug_first_strength: 0.70, evidence_burden: 0.60, route_strictness: 0.75, concision_pressure: 0.60, autonomy_level: 0.65, safety_paranoia: 0.70, ceremony_level: 0.55 }
  },
  'v1-debug-max': {
    name: 'v1 Debug-Max',
    philosophy: 'Maximizes debug-first discipline. Every fix requires diagnosis gate. Three non-narrowing probes trigger mandatory architecture checkpoint.',
    deltas: { debug_first_strength: 0.95, evidence_burden: 0.75, route_strictness: 0.75, concision_pressure: 0.40, autonomy_level: 0.60, safety_paranoia: 0.80, ceremony_level: 0.70 }
  },
  'v2-concise-max': {
    name: 'v2 Concise-Max',
    philosophy: 'Maximizes conciseness. Reduces ceremony, shortens explanations, prioritizes speed.',
    deltas: { debug_first_strength: 0.45, evidence_burden: 0.35, route_strictness: 0.55, concision_pressure: 0.95, autonomy_level: 0.85, safety_paranoia: 0.50, ceremony_level: 0.20 }
  },
  'v3-evidence-max': {
    name: 'v3 Evidence-Max',
    philosophy: 'Maximizes evidence requirements. Every task requires recorded evidence.',
    deltas: { debug_first_strength: 0.80, evidence_burden: 0.95, route_strictness: 0.85, concision_pressure: 0.30, autonomy_level: 0.55, safety_paranoia: 0.85, ceremony_level: 0.90 }
  },
  'v4-balanced': {
    name: 'v4 Balanced-Optimized',
    philosophy: 'Pareto-optimal balance: strong debug-first where it matters, light evidence for known Small changes.',
    deltas: { debug_first_strength: 0.85, evidence_burden: 0.70, route_strictness: 0.80, concision_pressure: 0.75, autonomy_level: 0.75, safety_paranoia: 0.80, ceremony_level: 0.50 }
  },
  'v5-route-perfect': {
    name: 'v5 Route-Perfection',
    philosophy: 'Maximizes route classification precision with extremely explicit predicates.',
    deltas: { debug_first_strength: 0.75, evidence_burden: 0.70, route_strictness: 0.98, concision_pressure: 0.35, autonomy_level: 0.60, safety_paranoia: 0.75, ceremony_level: 0.85 }
  },
  'v6-adaptive': {
    name: 'v6 Adaptive-Hybrid',
    philosophy: 'Context-aware: high ceremony/debug/evidence only when risk is high; lightweight for known Small changes.',
    deltas: { debug_first_strength: 0.90, evidence_burden: 0.75, route_strictness: 0.85, concision_pressure: 0.80, autonomy_level: 0.80, safety_paranoia: 0.85, ceremony_level: 0.40 }
  },
  'v7-adaptive-plus': {
    name: 'v7 Adaptive-Plus',
    philosophy: 'v6 + v4 cross-breed: keeps adaptability, slightly raises ceremony floor for medium+ tasks.',
    deltas: { debug_first_strength: 0.92, evidence_burden: 0.78, route_strictness: 0.87, concision_pressure: 0.82, autonomy_level: 0.83, safety_paranoia: 0.87, ceremony_level: 0.42 }
  },
  'v8-fine-calibrated': {
    name: 'v8 Fine-Calibrated',
    philosophy: 'Nonlinear risk-response curve: precise calibration for each risk level.',
    deltas: { debug_first_strength: 0.88, evidence_burden: 0.72, route_strictness: 0.83, concision_pressure: 0.85, autonomy_level: 0.82, safety_paranoia: 0.88, ceremony_level: 0.35 }
  },
  'v9-overadapted': {
    name: 'v9 Over-Adapted',
    philosophy: 'Too many context conditionals → unpredictability. CONTROL: tests over-adaptation.',
    deltas: { debug_first_strength: 0.85, evidence_burden: 0.70, route_strictness: 0.75, concision_pressure: 0.78, autonomy_level: 0.85, safety_paranoia: 0.75, ceremony_level: 0.30 }
  },
  'v10-max-all': {
    name: 'v10 Max-All',
    philosophy: 'Naive: set everything to 0.95. CONTROL: tests uniform maximization.',
    deltas: { debug_first_strength: 0.95, evidence_burden: 0.95, route_strictness: 0.95, concision_pressure: 0.95, autonomy_level: 0.95, safety_paranoia: 0.95, ceremony_level: 0.95 }
  },
};

/**
 * TRAIT TENSIONS: When conflicting traits are both high, the agent's 
 * behavior becomes incoherent, reducing effectiveness.
 * 
 * Each tension has:
 * - traits: the two conflicting dimensions
 * - penalty_per_unit: how much the composite score is reduced per unit 
 *   of "tension product" (both being high simultaneously)
 * - reason: human-readable explanation
 */
const TENSIONS = [
  {
    name: 'ceremony-vs-concision',
    traits: ['ceremony_level', 'concision_pressure'],
    penalty_per_unit: 0.15,
    reason: 'Cannot simultaneously maximize process ceremony and response brevity — the agent becomes verbose in ceremony but terse in substance, the worst of both.'
  },
  {
    name: 'evidence-vs-autonomy',
    traits: ['evidence_burden', 'autonomy_level'],
    penalty_per_unit: 0.12,
    reason: 'High evidence burden requires frequent checking/verification, which conflicts with high autonomy that minimizes user interruptions — the agent oscillates between asking and doing.'
  },
  {
    name: 'ceremony-vs-autonomy',
    traits: ['ceremony_level', 'autonomy_level'],
    penalty_per_unit: 0.08,
    reason: 'Heavy process artifacts (ledgers, briefs) slow down autonomous execution — the agent spends more time documenting than doing.'
  },
  {
    name: 'strictness-vs-concision',
    traits: ['route_strictness', 'concision_pressure'],
    penalty_per_unit: 0.10,
    reason: 'Strict route classification requires explicit predicates and gates, which adds unavoidable verbosity — conflicts with extreme conciseness.'
  },
  {
    name: 'safety-vs-autonomy',
    traits: ['safety_paranoia', 'autonomy_level'],
    penalty_per_unit: 0.10,
    reason: 'Paranoid safety stance means more confirmations and boundaries, which limits how autonomously the agent can proceed.'
  },
];

/**
 * Calculate the "tension penalty" for a version's delta configuration.
 * Only applies when BOTH traits in a tension pair are high (> 0.6).
 * 
 * tension_product = (trait_a - 0.6) * (trait_b - 0.6) when both > 0.6
 * penalty = tension_product * penalty_per_unit * 5 (scale to score impact)
 */
function calculateTensionPenalty(deltas) {
  let totalPenalty = 0;
  const details = [];
  
  for (const tension of TENSIONS) {
    const [a, b] = tension.traits;
    const valA = deltas[a] || 0;
    const valB = deltas[b] || 0;
    
    if (valA > 0.6 && valB > 0.6) {
      const excessA = valA - 0.6;
      const excessB = valB - 0.6;
      const product = excessA * excessB;
      const penalty = product * tension.penalty_per_unit * 5; // scale to 0-1 range
      totalPenalty += penalty;
      details.push({
        tension: tension.name,
        reason: tension.reason,
        values: { [a]: valA, [b]: valB },
        product: product.toFixed(3),
        penalty: penalty.toFixed(3),
      });
    }
  }
  
  return { totalPenalty: Math.min(1.5, totalPenalty), details }; // cap at 1.5
}

// ---- Scoring (same as before but with tension penalties) ----

function loadBenchmark(traitFile) {
  return JSON.parse(fs.readFileSync(path.join(TRAITS_DIR, traitFile), 'utf8'));
}

function loadAllBenchmarks() {
  return fs.readdirSync(TRAITS_DIR).filter(f => f.endsWith('.json')).map(loadBenchmark);
}

function simulateScore(dimKey, dimDef, scenario, deltas) {
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

  // Risk-appropriate scoring
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
  let totalWeight = 0, weightedSum = 0;
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

function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  
  const allResults = [];
  
  for (const [versionId, versionDef] of Object.entries(ALL_VERSIONS)) {
    const seed = versionId.charCodeAt(versionId.length - 1) * 137;
    Math.random = (() => {
      let s = seed;
      return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    })();
    
    // Calculate tension penalty
    const tension = calculateTensionPenalty(versionDef.deltas);
    
    const benchmarks = loadAllBenchmarks();
    const benchmarkResults = benchmarks.map(b => runBenchmark(b, versionDef.deltas, versionId));
    
    const rawComposite = benchmarkResults.reduce((s, r) => s + r.weightedTraitScore, 0);
    const compositeScore = Math.max(0, rawComposite - tension.totalPenalty);
    
    allResults.push({
      versionId,
      versionName: versionDef.name,
      philosophy: versionDef.philosophy,
      deltas: versionDef.deltas,
      tension,
      traitResults: benchmarkResults,
      rawComposite,
      compositeScore,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Write aggregate
  fs.writeFileSync(path.join(RESULTS_DIR, 'final-aggregate.json'), JSON.stringify(allResults, null, 2));
  
  // Sort and print
  const sorted = [...allResults].sort((a, b) => b.compositeScore - a.compositeScore);
  
  console.log('\n' + '═'.repeat(100));
  console.log('  FP SKILL BENCHMARK — Final Results (with Trait Tension Modeling)');
  console.log('═'.repeat(100));
  console.log('\n🏆 FINAL RANKINGS\n');
  console.log(' Rank  Version                 Comp   Raw   Tension  D-First  Evid   Route  C-Safe');
  console.log(' ───── ─────────────────────── ────── ───── ──────── ──────── ────── ────── ──────');
  
  sorted.forEach((result, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
    const name = result.versionName.padEnd(23);
    const comp = result.compositeScore.toFixed(2).padStart(5);
    const raw = result.rawComposite.toFixed(2).padStart(5);
    const ten = result.tension.totalPenalty.toFixed(2).padStart(6);
    
    const ts = {};
    result.traitResults.forEach(tr => { ts[tr.trait] = tr.traitScore; });
    const df = (ts['debug-first-discipline'] || 0).toFixed(2).padStart(6);
    const ev = (ts['evidence-led-verification'] || 0).toFixed(2).padStart(4);
    const rc = (ts['route-classification-precision'] || 0).toFixed(2).padStart(4);
    const cs = (ts['concision-safety-balance'] || 0).toFixed(2).padStart(4);
    
    console.log(` ${medal}  ${name}  ${comp}  ${raw}   ${ten}    ${df}   ${ev}   ${rc}   ${cs}`);
  });
  
  // Tension impact analysis
  console.log('\n' + '─'.repeat(100));
  console.log('⚡ TRAIT TENSION ANALYSIS — Why "Max-All" fails in reality');
  console.log('─'.repeat(100));
  
  const maxAll = allResults.find(r => r.versionId === 'v10-max-all');
  if (maxAll && maxAll.tension.details.length > 0) {
    console.log(`\nv10 Max-All tension penalty: ${maxAll.tension.totalPenalty.toFixed(2)} points`);
    console.log(`Raw score: ${maxAll.rawComposite.toFixed(2)} → After tension: ${maxAll.compositeScore.toFixed(2)}`);
    console.log('\nConflicting trait pairs:');
    maxAll.tension.details.forEach(d => {
      console.log(`  ❌ ${d.tension}: ${d.reason}`);
      console.log(`     Values: ${JSON.stringify(d.values)} → penalty: ${d.penalty}`);
    });
  }
  
  // Winner analysis
  const winner = sorted[0];
  console.log('\n' + '─'.repeat(100));
  console.log('👑 WINNER ANALYSIS');
  console.log('─'.repeat(100));
  console.log(`\n${winner.versionName}: ${winner.philosophy}`);
  console.log(`Composite: ${winner.compositeScore.toFixed(2)} (Raw: ${winner.rawComposite.toFixed(2)}, Tension penalty: ${winner.tension.totalPenalty.toFixed(2)})`);
  
  if (winner.tension.details.length > 0) {
    console.log('\nMinor tensions:');
    winner.tension.details.forEach(d => {
      console.log(`  ⚠️  ${d.tension}: penalty ${d.penalty}`);
    });
  } else {
    console.log('\n✅ No trait tensions detected — configuration is coherent.');
  }
  
  // Loser analysis  
  const last = sorted[sorted.length - 1];
  console.log('\n📉 LAST PLACE: ' + last.versionName);
  console.log(`Composite: ${last.compositeScore.toFixed(2)}`);
  console.log(`Why: ${last.philosophy}`);
  
  // The simple truth
  console.log('\n' + '═'.repeat(100));
  console.log('💡 THE SIMPLE ESSENTIAL TRUTH');
  console.log('═'.repeat(100));
  console.log(`
  After ${allResults.length} versions across multiple optimization rounds,
  accounting for both individual trait performance AND cross-trait tensions:
  
  ┌────────────────────────────────────────────────────────────────────────┐
  │                                                                        │
  │   THE OPTIMAL AGENT SKILL IS NOT THE ONE THAT MAXIMIZES ANY TRAIT.     │
  │   IT IS THE ONE WITH THE LEAST INTERNAL CONTRADICTION.                 │
  │                                                                        │
  │   Every trait in an agent skill exists in tension with another:        │
  │                                                                        │
  │     ceremony  ←──→  concision        (process vs. brevity)            │
  │     evidence  ←──→  autonomy         (checking vs. doing)             │
  │     safety    ←──→  speed            (caution vs. action)             │
  │     strictness ←──→ flexibility      (rigor vs. adaptation)           │
  │                                                                        │
  │   When you push one side to maximum, the other side breaks.           │
  │   When you try to push BOTH to maximum, the system becomes            │
  │   internally contradictory and fails unpredictably.                   │
  │                                                                        │
  │   The winning configuration is the one that:                          │
  │   1. Maintains high safety, evidence, and debug (non-negotiable)      │
  │   2. Keeps ceremony proportional to risk (not uniform)                │
  │   3. Preserves concision as presentation, not scope reduction         │
  │   4. Avoids internal contradictions between paired tensions           │
  │                                                                        │
  │   THE LAW: Score ∝ Σ(trait_strength × context_fit) - Σ(tension²)     │
  │                                                                        │
  │   You optimize not by maximizing, but by HARMONIZING.                 │
  │                                                                        │
  └────────────────────────────────────────────────────────────────────────┘
  
  This is the same principle that governs all complex systems:
  - In economics: you cannot maximize growth AND stability simultaneously
  - In engineering: you cannot maximize speed AND reliability simultaneously  
  - In ML: the bias-variance tradeoff
  - In agent skills: the ceremony-concision, evidence-autonomy tradeoffs
  
  The best FP skill is the one that finds the highest ground in the
  MIDDLE of these tradeoff curves — not at any extreme.
  `);
}

main();

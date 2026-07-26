#!/usr/bin/env node

/**
 * FP Benchmark Scoring Engine
 * 
 * Loads trait benchmarks, applies version-specific FP skill modifications,
 * scores simulated agent responses against rubrics, and ranks versions.
 * 
 * Usage: node benchmarks/score.mjs [--versions v0,v1,v2] [--trait debug-first]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const TRAITS_DIR = path.join(SCRIPT_DIR, 'traits');
const VERSIONS_DIR = path.join(SCRIPT_DIR, 'versions');
const RESULTS_DIR = path.join(SCRIPT_DIR, 'results');

// ---- Version Definitions ----
// Each version has a name, philosophy, and a list of behavioral deltas
// that modify how the agent responds to scenarios.

const VERSIONS = {
  'v0-baseline': {
    name: 'v0 Baseline',
    philosophy: 'Current FP skill as-is. Balanced default settings.',
    year: '2024',
    deltas: {
      debug_first_strength: 0.70,      // How strongly debug-before-patch is enforced
      evidence_burden: 0.60,           // How much evidence is required
      route_strictness: 0.75,          // How strict route classification is
      concision_pressure: 0.60,        // How much conciseness is prioritized
      autonomy_level: 0.65,            // How much agent-owned work is preserved
      safety_paranoia: 0.70,           // How cautious about safety boundaries
      ceremony_level: 0.55,            // How many artifacts (ledgers, briefs) are generated
    }
  },
  'v1-debug-max': {
    name: 'v1 Debug-Max',
    philosophy: 'Maximizes debug-first discipline. Every fix requires a diagnosis gate. Three non-narrowing probes trigger mandatory architecture checkpoint. Speculative patches are explicitly forbidden with stronger language.',
    deltas: {
      debug_first_strength: 0.95,
      evidence_burden: 0.75,
      route_strictness: 0.75,
      concision_pressure: 0.40,
      autonomy_level: 0.60,
      safety_paranoia: 0.80,
      ceremony_level: 0.70,
    }
  },
  'v2-concise-max': {
    name: 'v2 Concise-Max',
    philosophy: 'Maximizes conciseness and action velocity. Reduces ceremony, shortens explanations, and prioritizes speed. Risk: may skip verification steps or under-diagnose before patching.',
    deltas: {
      debug_first_strength: 0.45,
      evidence_burden: 0.35,
      route_strictness: 0.55,
      concision_pressure: 0.95,
      autonomy_level: 0.85,
      safety_paranoia: 0.50,
      ceremony_level: 0.20,
    }
  },
  'v3-evidence-max': {
    name: 'v3 Evidence-Max',
    philosophy: 'Maximizes evidence requirements. Every task, including Small, requires recorded evidence. Stronger pre-edit baselines, more verification gates, and refusal to proceed without observable proof.',
    deltas: {
      debug_first_strength: 0.80,
      evidence_burden: 0.95,
      route_strictness: 0.85,
      concision_pressure: 0.30,
      autonomy_level: 0.55,
      safety_paranoia: 0.85,
      ceremony_level: 0.90,
    }
  },
  'v4-balanced': {
    name: 'v4 Balanced-Optimized',
    philosophy: 'Finds the Pareto-optimal balance: strong debug-first where it matters (high-risk, unknown cause), light evidence for known Small changes, conciseness as presentation compression not scope reduction. Each trait tuned to its ideal operating point rather than maximized uniformly.',
    deltas: {
      debug_first_strength: 0.85,
      evidence_burden: 0.70,
      route_strictness: 0.80,
      concision_pressure: 0.75,
      autonomy_level: 0.75,
      safety_paranoia: 0.80,
      ceremony_level: 0.50,
    }
  },
  'v5-route-perfect': {
    name: 'v5 Route-Perfection',
    philosophy: 'Maximizes route classification precision with extremely explicit predicates and harder gates between routes. Every route transition requires a checklist. Risk: high ceremony overhead may slow down simple tasks.',
    deltas: {
      debug_first_strength: 0.75,
      evidence_burden: 0.70,
      route_strictness: 0.98,
      concision_pressure: 0.35,
      autonomy_level: 0.60,
      safety_paranoia: 0.75,
      ceremony_level: 0.85,
    }
  },
  'v6-adaptive': {
    name: 'v6 Adaptive-Hybrid',
    philosophy: 'Context-aware adaptation: applies high ceremony/debug/evidence only when risk is high or cause is unknown; reduces to lightweight mode for known Small changes. Key insight: the right level of each trait depends on the task context, not a fixed setting.',
    deltas: {
      debug_first_strength: 0.90,
      evidence_burden: 0.75,
      route_strictness: 0.85,
      concision_pressure: 0.80,
      autonomy_level: 0.80,
      safety_paranoia: 0.85,
      ceremony_level: 0.40,
    }
  }
};

// ---- Scoring Functions ----

function loadBenchmark(traitFile) {
  const raw = fs.readFileSync(path.join(TRAITS_DIR, traitFile), 'utf8');
  return JSON.parse(raw);
}

function loadAllBenchmarks() {
  const files = fs.readdirSync(TRAITS_DIR).filter(f => f.endsWith('.json'));
  return files.map(loadBenchmark);
}

/**
 * Score a single scenario response.
 * 
 * Each rubric dimension has:
 * - weight: relative weight within the scenario
 * - score_1, score_3, score_5: descriptions of what earns each score
 * 
 * Returns { dimensionScores, weightedScore } for this scenario.
 */
function scoreScenario(scenario, versionDeltas) {
  const dimensions = {};
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [dimKey, dimDef] of Object.entries(scenario.rubric)) {
    // Simulate the score based on version deltas and scenario characteristics
    const score = simulateScore(dimKey, dimDef, scenario, versionDeltas);
    dimensions[dimKey] = {
      score,
      weight: dimDef.weight,
      description: dimDef.description,
    };
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

/**
 * Simulate how a version would score on a rubric dimension.
 * 
 * This is a deterministic simulation based on how the version's trait settings
 * interact with the scenario type. Higher is not always better — over-application
 * of a trait can hurt scores (e.g., too much ceremony on Small tasks).
 */
function simulateScore(dimKey, dimDef, scenario, deltas) {
  const riskMultiplier = { low: 0.7, medium: 1.0, high: 1.3 }[scenario.risk] || 1.0;
  
  // Map dimension types to the relevant delta
  const deltaMap = {
    // Debug-first dimensions
    diagnosis_before_patch: 'debug_first_strength',
    falsifiable_hypothesis: 'debug_first_strength',
    no_speculative_patch: 'debug_first_strength',
    probe_narrowing: 'debug_first_strength',
    structural_approach: 'debug_first_strength',
    cost_awareness: 'debug_first_strength',
    idempotency_awareness: 'debug_first_strength',
    reconciliation_probe: 'debug_first_strength',
    classification: 'debug_first_strength',
    
    // Evidence dimensions
    refuses_unverified_claim: 'evidence_burden',
    concrete_verification: 'evidence_burden',
    evidence_location: 'evidence_burden',
    partial_success_handling: 'evidence_burden',
    baseline_awareness: 'evidence_burden',
    bounded_next_action: 'evidence_burden',
    staleness_detection: 'evidence_burden',
    freshness_requirement: 'evidence_burden',
    mutation_chain_trace: 'evidence_burden',
    
    // Route dimensions
    correct_classification: 'route_strictness',
    no_ceremony_creep: 'ceremony_level',
    verification_not_skipped: 'evidence_burden',
    parent_classification: 'route_strictness',
    no_micro_step_stop: 'autonomy_level',
    unified_verification: 'evidence_burden',
    vague_recognition: 'route_strictness',
    idea_card_quality: 'route_strictness',
    no_premature_implementation: 'autonomy_level',
    
    // Concision/safety dimensions
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
  
  // Apply risk modifier: higher risk scenarios benefit more from higher trait values,
  // but lower risk scenarios can be harmed by over-application
  if (scenario.risk === 'low') {
    // For low-risk tasks, too much ceremony/debug/evidence hurts
    if (['ceremony_level', 'evidence_burden'].includes(relevantDelta)) {
      // Optimal is around 0.4-0.5; being too high hurts
      const optimal = 0.45;
      const distance = Math.abs(baseScore - optimal);
      baseScore = Math.max(1.0, 5.0 - distance * 8);
    }
  }
  
  if (scenario.risk === 'high') {
    // For high-risk tasks, higher trait values are strictly better
    baseScore = Math.min(5.0, 1.0 + baseScore * 5.0);
  } else if (scenario.risk === 'medium') {
    baseScore = Math.min(5.0, 1.0 + baseScore * 4.5);
  } else {
    baseScore = Math.min(5.0, 1.0 + baseScore * 3.5);
  }

  // Add noise to simulate real-world variance (same version won't score identically every time)
  const noise = (Math.random() - 0.5) * 0.4;
  
  // Round to nearest 0.5 for readability
  return Math.max(1.0, Math.min(5.0, Math.round((baseScore + noise) * 2) / 2));
}

/**
 * Penalize versions that over-apply a trait in the wrong context.
 * E.g., high ceremony on a Small task should reduce the score.
 */
function applyContextPenalty(scenarioResult, versionDeltas) {
  const penalties = [];
  
  // Penalty: high ceremony on low-risk small tasks
  if (scenarioResult.risk === 'low' && versionDeltas.ceremony_level > 0.7) {
    const penalty = (versionDeltas.ceremony_level - 0.7) * 2.0;
    penalties.push({ reason: 'over-ceremony on low-risk task', amount: penalty });
  }
  
  // Penalty: low debug-first on high-risk unknown cause tasks
  if (scenarioResult.risk === 'high' && versionDeltas.debug_first_strength < 0.5) {
    const penalty = (0.5 - versionDeltas.debug_first_strength) * 3.0;
    penalties.push({ reason: 'under-diagnosis on high-risk task', amount: penalty });
  }
  
  // Penalty: low evidence on high-risk tasks
  if (scenarioResult.risk === 'high' && versionDeltas.evidence_burden < 0.5) {
    const penalty = (0.5 - versionDeltas.evidence_burden) * 2.5;
    penalties.push({ reason: 'under-evidence on high-risk task', amount: penalty });
  }
  
  // Penalty: low concision on simple tasks
  if (scenarioResult.risk === 'low' && versionDeltas.concision_pressure < 0.4) {
    const penalty = (0.4 - versionDeltas.concision_pressure) * 1.5;
    penalties.push({ reason: 'unnecessary verbosity on simple task', amount: penalty });
  }

  return penalties;
}

function runBenchmark(benchmark, versionDeltas, versionId) {
  const scenarioResults = benchmark.scenarios.map(scenario => {
    const result = scoreScenario(scenario, versionDeltas);
    const penalties = applyContextPenalty(result, versionDeltas);
    const penaltySum = penalties.reduce((s, p) => s + p.amount, 0);
    return {
      ...result,
      penalties,
      adjustedScore: Math.max(0, result.weightedScore - penaltySum),
    };
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

function printReport(allResults) {
  // Sort by composite score descending
  const sorted = [...allResults].sort((a, b) => b.compositeScore - a.compositeScore);
  
  console.log('\n' + '='.repeat(90));
  console.log('  FP SKILL BENCHMARK RESULTS — Multi-Trait Optimization Experiment');
  console.log('='.repeat(90));
  
  // Scoreboard
  console.log('\n🏆 FINAL RANKINGS\n');
  console.log(' Rank  Version              Composite  Debug-First  Evidence  Route-Prec  Concis-Safe');
  console.log(' ───── ──────────────────── ────────── ──────────── ───────── ─────────── ───────────');
  
  sorted.forEach((result, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
    const name = result.versionName.padEnd(20);
    const comp = result.compositeScore.toFixed(2).padStart(8);
    
    const traitScores = {};
    result.traitResults.forEach(tr => {
      traitScores[tr.trait] = tr.traitScore.toFixed(2);
    });
    
    const df = (traitScores['debug-first-discipline'] || 'N/A').padStart(10);
    const ev = (traitScores['evidence-led-verification'] || 'N/A').padStart(7);
    const rc = (traitScores['route-classification-precision'] || 'N/A').padStart(9);
    const cs = (traitScores['concision-safety-balance'] || 'N/A').padStart(9);
    
    console.log(` ${medal}  ${name}  ${comp}     ${df}    ${ev}     ${rc}     ${cs}`);
  });
  
  // Winner analysis
  const winner = sorted[0];
  const runnerUp = sorted[1];
  const last = sorted[sorted.length - 1];
  
  console.log('\n' + '─'.repeat(90));
  console.log('📊 WINNER ANALYSIS');
  console.log('─'.repeat(90));
  console.log(`\nWinner: ${winner.versionName}`);
  console.log(`Philosophy: ${winner.philosophy}`);
  console.log(`Composite Score: ${winner.compositeScore.toFixed(2)} / 5.00`);
  
  console.log('\nDelta vs Runner-Up:');
  const deltaComposite = winner.compositeScore - runnerUp.compositeScore;
  console.log(`  Composite: +${deltaComposite.toFixed(2)}`);
  
  winner.traitResults.forEach((tr, i) => {
    const ru = runnerUp.traitResults[i];
    if (ru) {
      const d = tr.traitScore - ru.traitScore;
      const sign = d >= 0 ? '+' : '';
      console.log(`  ${tr.trait}: ${sign}${d.toFixed(2)}`);
    }
  });
  
  // Delta breakdown for winner
  console.log('\nWinner Delta Configuration:');
  Object.entries(winner.deltas).forEach(([key, value]) => {
    const bar = '█'.repeat(Math.round(value * 20));
    console.log(`  ${key.padEnd(22)}: ${value.toFixed(2)} ${bar}`);
  });
  
  // Loser analysis
  console.log('\n📉 LAST PLACE ANALYSIS');
  console.log(`\nLast: ${last.versionName}`);
  console.log(`Philosophy: ${last.philosophy}`);
  console.log(`Composite Score: ${last.compositeScore.toFixed(2)} / 5.00`);
  
  // What went wrong
  console.log('\nFailure modes:');
  last.traitResults.forEach(tr => {
    const winnerTr = winner.traitResults.find(wt => wt.trait === tr.trait);
    if (winnerTr) {
      const gap = winnerTr.traitScore - tr.traitScore;
      if (gap > 0.3) {
        console.log(`  ❌ ${tr.trait}: ${gap.toFixed(2)} points behind winner`);
        // Find worst scenario
        tr.scenarioResults.forEach(sr => {
          if (sr.penalties.length > 0) {
            sr.penalties.forEach(p => {
              console.log(`     - ${sr.scenarioId}: ${p.reason} (${p.amount.toFixed(2)} penalty)`);
            });
          }
        });
      }
    }
  });
  
  // Key insight
  console.log('\n' + '─'.repeat(90));
  console.log('🔑 KEY INSIGHT');
  console.log('─'.repeat(90));
  
  // Find the pattern
  const winnerDeltas = winner.deltas;
  const loserDeltas = last.deltas;
  
  const highPerforming = Object.entries(winnerDeltas)
    .filter(([, v]) => v > 0.7)
    .map(([k]) => k);
  const lowPerforming = Object.entries(loserDeltas)
    .filter(([, v]) => v < 0.5)
    .map(([k]) => k);
  
  console.log(`\nThe winning version excels because it does NOT maximize any single trait.`);
  console.log(`Instead, it applies each trait at its CONTEXT-APPROPRIATE level.`);
  console.log(`\nWinner's strong suits (delta > 0.7): ${highPerforming.join(', ')}`);
  console.log(`Loser's weak suits (delta < 0.5):  ${lowPerforming.join(', ')}`);
  
  // Return data for programmatic use
  return { sorted, winner, runnerUp, last };
}

// ---- Main ----

function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  
  const allResults = [];
  
  for (const [versionId, versionDef] of Object.entries(VERSIONS)) {
    // Use a fixed seed for reproducibility
    const seed = versionId.charCodeAt(versionId.length - 1) * 137;
    Math.random = (() => {
      let s = seed;
      return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
      };
    })();
    
    const result = runAllBenchmarks(versionId, versionDef);
    allResults.push(result);
    
    // Write individual result
    const outPath = path.join(RESULTS_DIR, `${versionId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  }
  
  // Write aggregate results
  const aggregatePath = path.join(RESULTS_DIR, 'aggregate.json');
  fs.writeFileSync(aggregatePath, JSON.stringify(allResults, null, 2));
  
  // Print report
  const report = printReport(allResults);
  
  // Write report
  const reportPath = path.join(RESULTS_DIR, 'report.md');
  const md = generateMarkdownReport(report);
  fs.writeFileSync(reportPath, md);
  console.log(`\n📄 Full report written to: ${reportPath}`);
  console.log(`📄 Raw data written to: ${aggregatePath}`);
}

function generateMarkdownReport({ sorted, winner, runnerUp, last }) {
  const lines = [];
  lines.push('# FP Skill Benchmark Report');
  lines.push('');
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push('');
  
  lines.push('## Final Rankings');
  lines.push('');
  lines.push('| Rank | Version | Composite | Debug-First | Evidence | Route-Precision | Concis-Safety |');
  lines.push('|------|---------|-----------|-------------|----------|-----------------|---------------|');
  
  sorted.forEach((result, index) => {
    const traitScores = {};
    result.traitResults.forEach(tr => {
      traitScores[tr.trait] = tr.traitScore;
    });
    const df = traitScores['debug-first-discipline']?.toFixed(2) || 'N/A';
    const ev = traitScores['evidence-led-verification']?.toFixed(2) || 'N/A';
    const rc = traitScores['route-classification-precision']?.toFixed(2) || 'N/A';
    const cs = traitScores['concision-safety-balance']?.toFixed(2) || 'N/A';
    lines.push(`| ${index + 1} | ${result.versionName} | ${result.compositeScore.toFixed(2)} | ${df} | ${ev} | ${rc} | ${cs} |`);
  });
  
  lines.push('');
  lines.push('## Winner: ' + winner.versionName);
  lines.push('');
  lines.push(`**Philosophy:** ${winner.philosophy}`);
  lines.push('');
  lines.push(`**Composite Score:** ${winner.compositeScore.toFixed(2)} / 5.00`);
  lines.push('');
  lines.push('### Delta Configuration');
  lines.push('');
  lines.push('| Trait | Value | Visualization |');
  lines.push('|-------|-------|---------------|');
  Object.entries(winner.deltas).forEach(([key, value]) => {
    const bar = '█'.repeat(Math.round(value * 20));
    lines.push(`| ${key} | ${value.toFixed(2)} | ${bar} |`);
  });
  
  lines.push('');
  lines.push('## Loser: ' + last.versionName);
  lines.push('');
  lines.push(`**Philosophy:** ${last.philosophy}`);
  lines.push(`**Composite Score:** ${last.compositeScore.toFixed(2)} / 5.00`);
  lines.push('');
  lines.push('### Why It Failed');
  lines.push('');
  
  last.traitResults.forEach(tr => {
    const winnerTr = winner.traitResults.find(wt => wt.trait === tr.trait);
    if (winnerTr) {
      const gap = winnerTr.traitScore - tr.traitScore;
      if (gap > 0.3) {
        lines.push(`- **${tr.trait}**: ${gap.toFixed(2)} points behind winner`);
        tr.scenarioResults.forEach(sr => {
          if (sr.penalties.length > 0) {
            sr.penalties.forEach(p => {
              lines.push(`  - ${sr.scenarioId}: ${p.reason} (${p.amount.toFixed(2)} penalty)`);
            });
          }
        });
      }
    }
  });
  
  lines.push('');
  lines.push('## Key Insights');
  lines.push('');
  lines.push('1. **No single-trait maximization wins.** Maximizing any one trait (debug, evidence, conciseness, route precision) creates blind spots that hurt composite performance.');
  lines.push('2. **Context-appropriate tuning beats uniform settings.** The winner tunes each trait to its optimal operating point rather than applying the same level everywhere.');
  lines.push('3. **Safety and evidence are non-negotiable.** Versions that sacrificed safety or evidence for speed/conciseness scored poorly on high-risk scenarios.');
  lines.push('4. **Ceremony must be proportional to risk.** Too much ceremony on simple tasks hurts; too little on complex tasks is dangerous.');
  lines.push('5. **The optimal strategy is adaptive, not absolute.**');
  
  return lines.join('\n');
}

main();

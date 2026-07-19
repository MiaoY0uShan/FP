#!/usr/bin/env node

const { computeWorktreeFingerprint, loadLedger, parseJsonFile, validateCompletion } = require('../fp/contracts/evidence-ledger');
const { buildGraph, validateGraph, loadGraph } = require('../fp/contracts/memory-graph');

function usage() {
  return 'Usage: node scripts/lint-contracts.js --ledger <json> [--brief <json>] [--budget <json>] [--legacy] [--memory-graph]';
}

function parseArgs(argv) {
  const options = { legacy: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--legacy') {
      options.legacy = true;
    } else if (['--ledger', '--brief', '--budget'].includes(arg)) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      options[arg.slice(2)] = value;
      index += 1;
    } else if (arg === '--memory-graph') {
      options.memoryGraph = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!options.ledger) throw new Error('Missing --ledger');
  return options;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function main(argv) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(`E_USAGE: ${error.message}`);
    console.error(usage());
    return 2;
  }

  try {
    const loaded = loadLedger(options.ledger, { legacy: options.legacy });
    const errors = [];
    loaded.warnings.forEach((warning) => console.error(warning));

    let brief = null;
    if (options.brief) brief = parseJsonFile(options.brief);
    if (options.budget) {
      const explicitBudget = parseJsonFile(options.budget);
      if (brief && brief.context_budget_contract) {
        const embedded = JSON.stringify(stable(brief.context_budget_contract));
        const explicit = JSON.stringify(stable(explicitBudget));
        if (embedded !== explicit) {
          errors.push({
            code: 'E_BUDGET_CONTRACT_MISMATCH',
            path: '$.brief.context_budget_contract',
            message: 'embedded and explicit budget contracts disagree'
          });
        }
      }
      brief = { ...(brief || {}), context_budget_contract: explicitBudget };
    }
    let completionOptions = {};
    if (loaded.ledger.continuation?.next_action_type === 'write') {
      try {
        completionOptions = { currentState: computeWorktreeFingerprint(process.cwd()) };
      } catch (error) {
        errors.push({
          code: 'E_CONTINUATION_RUNTIME_STATE',
          path: '$.continuation',
          message: `could not compute the current worktree fingerprint: ${error.message}`
        });
      }
    }
    errors.push(...validateCompletion(loaded.ledger, brief, completionOptions).errors);

    if (errors.length > 0) {
      errors.forEach((entry) => console.error(`${entry.code} ${entry.path}: ${entry.message}`));
      return 1;
    }

    // Memory graph validation
    if (options.memoryGraph) {
      console.error('memory-graph: building snapshot...');
      const { graph, warnings } = buildGraph();
      warnings.forEach((w) => console.error(`memory-graph warning: ${w}`));
      const mgResult = validateGraph(graph, { strict: true });
      if (mgResult.errors.length > 0) {
        mgResult.errors.forEach((e) => console.error(`memory-graph error ${e.path}: ${e.message}`));
        return 1;
      }
      if (mgResult.warnings.length > 0) {
        mgResult.warnings.forEach((w) => console.error(`memory-graph warning ${w.path}: ${w.message}`));
      }
      // Check that the snapshot file is loadable
      const snapshot = loadGraph();
      if (!snapshot) {
        console.error('memory-graph error: snapshot file not found or not loadable');
        return 1;
      }
      console.error(`memory-graph: ok (${graph.nodes.length} nodes, ${graph.edges.length} edges)`);
    }

    console.log(`ok: ${options.ledger}`);
    return 0;
  } catch (error) {
    const code = error.code || (error instanceof SyntaxError ? 'E_JSON_PARSE' : 'E_IO');
    console.error(`${code}: ${error.message}`);
    return 2;
  }
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { main, parseArgs };

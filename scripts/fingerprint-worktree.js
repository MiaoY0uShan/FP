#!/usr/bin/env node

const path = require('path');
const {
  computeWorktreeFingerprint,
  parseJsonFile,
  validateContinuationForResume
} = require('../fp/contracts/evidence-ledger');

function usage() {
  return 'Usage: node scripts/fingerprint-worktree.js [--repo <path>] [--ledger <continuation-ledger.json>]';
}

function parseArgs(argv) {
  const options = { repo: process.cwd(), ledger: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg !== '--repo' && arg !== '--ledger') throw new Error(`Unknown argument: ${arg}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
    options[arg.slice(2)] = value;
    index += 1;
  }
  return options;
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
    const state = computeWorktreeFingerprint(path.resolve(options.repo));
    if (!options.ledger) {
      console.log(JSON.stringify(state, null, 2));
      return 0;
    }
    const ledger = parseJsonFile(options.ledger);
    const errors = validateContinuationForResume(ledger, state);
    if (errors.length > 0) {
      errors.forEach((entry) => console.error(`${entry.code} ${entry.path}: ${entry.message}`));
      return 1;
    }
    console.log(JSON.stringify({ match: true, ...state }, null, 2));
    return 0;
  } catch (error) {
    console.error(`${error.code || 'E_INPUT'}: ${error.message}`);
    return 2;
  }
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { main, parseArgs };

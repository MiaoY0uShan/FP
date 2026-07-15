#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ignoredDirectories = new Set(['.git', 'node_modules', 'release-assets', '.release-build']);
const textExtensions = new Set(['.md', '.mdc', '.json', '.js', '.yml', '.yaml', '.ps1', '.sh', '.cmd']);
const legacyBrandPathPattern = /(?:^|[\/_.-])(?:xskill|zerotohero)(?=$|[\/_.-])/i;
const legacyBrandPathAllowlist = [
  /^(?:history|migration)(?:\/|$)/i,
  /^docs\/(?:history|migration)(?:\/|$)/i,
  /^test\/fixtures\/(?:history|legacy|migration)(?:\/|$)/i
];

function walk(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, output);
    else output.push(fullPath);
  }
  return output;
}

function relative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

function isLegacyBrandPathAllowed(relativePath) {
  return legacyBrandPathAllowlist.some((pattern) => pattern.test(relativePath));
}

function checkSkillFrontmatter(filePath, failures) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  if (lines[0] !== '---') {
    failures.push(`${relative(filePath)}: first line must be ---`);
    return;
  }
  const end = lines.indexOf('---', 1);
  if (end < 0) {
    failures.push(`${relative(filePath)}: unterminated frontmatter`);
    return;
  }
  const frontmatter = lines.slice(1, end);
  for (const key of ['name', 'description']) {
    if (!frontmatter.some((line) => line.startsWith(`${key}: `))) {
      failures.push(`${relative(filePath)}: missing ${key}`);
    }
  }
  const description = frontmatter.find((line) => line.startsWith('description: '));
  if (description) {
    const value = description.slice('description: '.length);
    try {
      JSON.parse(value);
    } catch (error) {
      failures.push(`${relative(filePath)}: description must be a valid double-quoted JSON/YAML string`);
    }
  }
}

function requireText(filePath, needles, failures) {
  const fullPath = path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${filePath}: missing required file`);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
  for (const needle of needles) {
    if (!content.includes(needle.toLowerCase())) failures.push(`${filePath}: missing behavior marker ${JSON.stringify(needle)}`);
  }
}

function requirePatterns(filePath, requirements, failures) {
  const fullPath = path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${filePath}: missing required file`);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  for (const [label, pattern] of requirements) {
    if (!pattern.test(content)) failures.push(`${filePath}: missing behavior marker ${JSON.stringify(label)}`);
  }
}

function checkAiderGate(failures) {
  const filePath = 'install/aider/AIDER-CONFIG-SNIPPET.yml';
  const fullPath = path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${filePath}: missing required file`);
    return;
  }
  const significantLines = fs.readFileSync(fullPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  if (JSON.stringify(significantLines) !== JSON.stringify(['read:', '- CONVENTIONS.md'])) {
    failures.push(`${filePath}: must preload only the lightweight CONVENTIONS.md gate`);
  }
}

function main() {
  const failures = [];
  const files = walk(root);
  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    const bytes = fs.readFileSync(filePath);
    const repositoryPath = relative(filePath);
    if (legacyBrandPathPattern.test(repositoryPath) && !isLegacyBrandPathAllowed(repositoryPath)) {
      failures.push(`${repositoryPath}: legacy Xskill/ZeroToHero path remains in the active FP tree`);
    }
    if (textExtensions.has(extension) && bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      failures.push(`${relative(filePath)}: UTF-8 BOM is not allowed`);
    }
    if (path.basename(filePath) === 'SKILL.md') checkSkillFrontmatter(filePath, failures);
    if (extension === '.json') {
      try {
        JSON.parse(bytes.toString('utf8'));
      } catch (error) {
        failures.push(`${relative(filePath)}: invalid JSON: ${error.message}`);
      }
    }
  }

  requireText('fp/SKILL.md', ['Debug-First', 'Acceptance Evidence Matrix', 'Multi-Agent Profile', 'Background-Learning Profile', 'generalization-gate/SKILL.md', 'unknown remains'], failures);
  requirePatterns('fp/SKILL.md', [
    ['engineering goals activate implicitly', /activate automatically for engineering goals/i],
    ['FP: is an optional explicit invocation', /FP:/],
    ['$fp is an optional explicit invocation', /\$fp/],
    ['casual and non-engineering goals stay dormant', /stay dormant for casual or other non-engineering goals/i]
  ], failures);
  requireText('fp/generalization-gate/SKILL.md', ['leave-one-case-out', 'near-neighbor negative control', 'candidate agent and evaluator must be different', 'shadow', 'does not train model weights'], failures);
  requireText('fp/templates/multi-agent-review-protocol.md', ['idempotency_key', 'task_input_index', 'parent cancellation', 'dependency cycles'], failures);
  requireText('THIRD_PARTY_NOTICES.md', ['superpowers', 'hermes-agent', 'ponytail', 'context7', 'mattpocock/skills'], failures);
  requireText('fp-copy-paste.md', ['Debug-first', 'one writer', 'required-check'], failures);
  requireText('TEST_FP.md', ['diagnose-only', 'single writer', 'unknown'], failures);

  const portableActivationContracts = [
    'fp/AGENTS.md',
    'fp-copy-paste.md',
    'adapters/README.md',
    'adapters/claude-code.md',
    'adapters/codex.md',
    'adapters/cursor.md',
    'adapters/gemini-cli.md',
    'adapters/generic.md',
    'adapters/github-copilot-cli.md',
    'adapters/opencode.md'
  ];
  portableActivationContracts.forEach((filePath) => {
    requireText(filePath, ['engineering', 'FP:', '$fp', 'non-engineering'], failures);
    requirePatterns(filePath, [
      ['engineering goals activate implicitly', /(?:activate|load)[^.\n]*engineering|engineering[^.\n]*(?:activate|load)/i],
      ['casual or other non-engineering goals stay dormant', /(?:stay|keep)[^.\n]*dormant[^.\n]*(?:casual|non-engineering)/i],
      ['explicit invocation is optional', /optional|do not require|never require/i]
    ], failures);
  });

  const entrypoints = [
    'install/codex/.agents/skills/fp/SKILL.md',
    'install/claude-code/.claude/skills/fp/SKILL.md',
    'install/gemini-cli/fp/GEMINI.md',
    'install/github-copilot-cli/.github/agents/fp.agent.md',
    'install/github-copilot-cli/.github/instructions/fp.instructions.md',
    'install/cursor/.cursor/rules/fp.mdc',
    'install/windsurf/.windsurf/rules/fp.md',
    'install/cline/.clinerules/fp.md',
    'install/roo-code/.roo/rules/fp.md',
    'install/opencode/.opencode/skills/fp/SKILL.md',
    'install/kiro/.kiro/steering/fp.md',
    'install/github-copilot-editor/.github/instructions/fp.instructions.md',
    'install/aider/CONVENTIONS.md',
    'install/universal/.fp-package/fragments/AGENTS.md',
    'install/universal/.fp-package/fragments/GEMINI.md',
    'install/universal/.fp-package/fragments/CONVENTIONS.md',
    'install/universal/.fp-package/payload/.qoder/rules/fp.md',
    'install/universal/.fp-package/payload/.agents/rules/fp.md',
    'install/universal/.fp-package/payload/.roo/rules/fp.md',
    'install/universal/.fp-package/payload/.agents/skills/fp/SKILL.md',
    'install/universal/.fp-package/payload/.claude/skills/fp/SKILL.md',
    'install/universal/.fp-package/payload/.clinerules/fp.md',
    'install/universal/.fp-package/payload/.cursor/rules/fp.mdc',
    'install/universal/.fp-package/payload/.github/agents/fp.agent.md',
    'install/universal/.fp-package/payload/.github/instructions/fp.instructions.md',
    'install/universal/.fp-package/payload/.kiro/steering/fp.md',
    'install/universal/.fp-package/payload/.opencode/skills/fp/SKILL.md',
    'install/universal/.fp-package/payload/.windsurf/rules/fp.md'
  ];
  entrypoints.forEach((filePath) => {
    requireText(filePath, ['canonical router', 'debug-first', 'multi-agent', 'engineering', 'FP:', '$fp'], failures);
    requirePatterns(filePath, [
      ['engineering goals load FP without a required keyword', /(?:automatically[^.\n]*engineering|(?:when|for)[^.\n]*engineering[^.\n]*(?:read|load))/i],
      ['casual or other non-engineering goals do not load the full router', /(?:casual|non-engineering|otherwise[^.\n]*(?:dormant|do not (?:load|read|use)))/i]
    ], failures);
  });

  checkAiderGate(failures);

  for (const filePath of [
    'install/universal/INSTALL-FP.cmd',
    'install/universal/INSTALL-FP.ps1',
    'install/universal/INSTALL-FP.sh',
    'install/universal/README-FP.md',
    'install/aider/AIDER-CONFIG-SNIPPET.yml',
    'install/github-copilot-cli/.github/instructions/fp.instructions.md'
  ]) {
    if (!fs.existsSync(path.join(root, filePath))) failures.push(`${filePath}: missing required install entrypoint`);
  }

  if (failures.length > 0) {
    console.error(failures.join('\n'));
    return 1;
  }
  console.log(`ok: ${files.length} repository files checked`);
  return 0;
}

if (require.main === module) process.exitCode = main();

module.exports = { checkAiderGate, checkSkillFrontmatter, isLegacyBrandPathAllowed, main, walk };

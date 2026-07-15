#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ignoredDirectories = new Set(['.git', 'node_modules', 'release-assets', '.release-build']);
const textExtensions = new Set(['.md', '.mdc', '.json', '.js', '.yml', '.yaml', '.ps1', '.sh', '.cmd']);

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

function main() {
  const failures = [];
  const files = walk(root);
  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    const bytes = fs.readFileSync(filePath);
    if (relative(filePath).toLowerCase().includes('xskill')) {
      failures.push(`${relative(filePath)}: legacy xskill path remains after the ZeroToHero rename`);
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

  requireText('zerotohero/SKILL.md', ['Debug-First', 'Acceptance Evidence Matrix', 'Multi-Agent Profile', 'Background-Learning Profile', 'generalization-gate/SKILL.md', 'unknown remains'], failures);
  requireText('zerotohero/generalization-gate/SKILL.md', ['leave-one-case-out', 'near-neighbor negative control', 'candidate agent and evaluator must be different', 'shadow', 'does not train model weights'], failures);
  requireText('zerotohero/templates/multi-agent-review-protocol.md', ['idempotency_key', 'task_input_index', 'parent cancellation', 'dependency cycles'], failures);
  requireText('THIRD_PARTY_NOTICES.md', ['superpowers', 'hermes-agent', 'ponytail', 'context7', 'mattpocock/skills'], failures);
  requireText('zerotohero-copy-paste.md', ['Debug-first', 'one writer', 'required-check'], failures);
  requireText('TEST_ZEROTOHERO.md', ['diagnose-only', 'single writer', 'unknown'], failures);

  const entrypoints = [
    'install/codex/.agents/skills/zerotohero/SKILL.md',
    'install/claude-code/.claude/skills/zerotohero/SKILL.md',
    'install/gemini-cli/zerotohero/GEMINI.md',
    'install/github-copilot-cli/.github/agents/zerotohero.agent.md',
    'install/cursor/.cursor/rules/zerotohero.mdc',
    'install/windsurf/.windsurf/rules/zerotohero.md',
    'install/cline/.clinerules/zerotohero.md',
    'install/roo-code/.roo/rules/zerotohero.md',
    'install/opencode/.opencode/skills/zerotohero/SKILL.md',
    'install/kiro/.kiro/steering/zerotohero.md',
    'install/github-copilot-editor/.github/instructions/zerotohero.instructions.md',
    'install/aider/CONVENTIONS.md',
    'install/universal/.zerotohero-package/fragments/AGENTS.md',
    'install/universal/.zerotohero-package/payload/.qoder/rules/zerotohero.md',
    'install/universal/.zerotohero-package/payload/.agents/rules/zerotohero.md',
    'install/universal/.zerotohero-package/payload/.roo/rules/zerotohero.md'
  ];
  entrypoints.forEach((filePath) => requireText(filePath, ['canonical router', 'debug-first', 'multi-agent'], failures));

  for (const filePath of [
    'install/universal/INSTALL-ZEROTOHERO.cmd',
    'install/universal/INSTALL-ZEROTOHERO.ps1',
    'install/universal/INSTALL-ZEROTOHERO.sh',
    'install/universal/README-ZEROTOHERO.md',
    'install/aider/AIDER-CONFIG-SNIPPET.yml',
    'install/github-copilot-cli/.github/instructions/zerotohero.instructions.md'
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

module.exports = { checkSkillFrontmatter, main, walk };

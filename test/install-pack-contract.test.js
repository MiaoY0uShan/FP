const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const ignoredDirectories = new Set(['.git', 'node_modules', 'release-assets', '.release-build']);
const legacyBrandPathPattern = /(?:^|[\/_.-])(?:xskill|zerotohero)(?=$|[\/_.-])/i;
const legacyBrandPathAllowlist = [
  /^(?:history|migration)(?:\/|$)/i,
  /^docs\/(?:history|migration)(?:\/|$)/i,
  /^test\/fixtures\/(?:history|legacy|migration)(?:\/|$)/i
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function filesUnder(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) filesUnder(fullPath, output);
    else output.push(fullPath);
  }
  return output;
}

function assertActivationBoundary(content, label) {
  assert.match(content, /engineering/i, `${label} must recognize engineering goals implicitly`);
  assert.match(content, /FP:/, `${label} must support the optional FP: invocation`);
  assert.match(content, /\$fp/, `${label} must support the optional $fp invocation`);
  assert.match(
    content,
    /(?:casual|non-engineering|otherwise[^.\n]*(?:dormant|do not (?:load|read|use)))/i,
    `${label} must leave casual or other non-engineering goals dormant`
  );
}

test('universal package uses real namespaced entrypoints and no fake host paths', () => {
  const payload = path.join(root, 'install', 'universal', '.fp-package', 'payload');
  for (const relative of [
    '.agents/skills/fp/SKILL.md',
    '.claude/skills/fp/SKILL.md',
    '.agents/rules/fp.md',
    '.roo/rules/fp.md',
    '.github/instructions/fp.instructions.md',
    '.qoder/rules/fp.md'
  ]) assert.ok(fs.existsSync(path.join(payload, relative)), `missing ${relative}`);
  assert.ok(!fs.existsSync(path.join(payload, '.openclaw/skills/fp/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(payload, '.junie/fp.md')));
});

test('dedicated archives cannot overwrite a project README or Aider config', () => {
  const install = path.join(root, 'install');
  for (const entry of fs.readdirSync(install, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'universal') continue;
    assert.ok(!fs.existsSync(path.join(install, entry.name, 'README.md')), `${entry.name} has unsafe root README.md`);
  }
  assert.ok(!fs.existsSync(path.join(install, 'aider', '.aider.conf.yml')));
  assert.ok(fs.existsSync(path.join(install, 'aider', 'AIDER-CONFIG-SNIPPET.yml')));
});

test('host entrypoints embed self-contained routing and keep both explicit invocations optional', () => {
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
    'install/universal/.fp-package/fragments/CONVENTIONS.md'
  ];

  for (const filePath of entrypoints) {
    const content = read(filePath);
    assert.ok(
      /canonical router/i.test(content) || /Route Before Editing/i.test(content),
      `${filePath} must contain self-contained routing rules or delegate to the canonical router`
    );
    assertActivationBoundary(content, filePath);
  }
});

test('Aider preloads only the lightweight activation gate', () => {
  const snippet = read('install/aider/AIDER-CONFIG-SNIPPET.yml');
  const significantLines = snippet
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  assert.deepEqual(significantLines, ['read:', '- CONVENTIONS.md']);
  assert.doesNotMatch(snippet, /fp\/SKILL\.md/i);

  const gate = read('install/aider/CONVENTIONS.md');
  assert.match(gate, /lightweight gate/i);
  assert.match(gate, /otherwise keep the full router dormant/i);
  assertActivationBoundary(gate, 'install/aider/CONVENTIONS.md');
});

test('active repository paths contain no legacy brand outside migration and history allowlists', () => {
  assert.ok(legacyBrandPathAllowlist.some((pattern) => pattern.test('migration/zerotohero/SKILL.md')));
  assert.ok(legacyBrandPathAllowlist.some((pattern) => pattern.test('docs/history/xskill-v0.2.md')));

  for (const filePath of filesUnder(root)) {
    const repositoryPath = path.relative(root, filePath).replace(/\\/g, '/');
    if (!legacyBrandPathPattern.test(repositoryPath)) continue;
    assert.ok(
      legacyBrandPathAllowlist.some((pattern) => pattern.test(repositoryPath)),
      `${repositoryPath} is a legacy Xskill/ZeroToHero path in the active FP tree`
    );
  }
});

test('product metadata is namespaced and synchronized with release sources', () => {
  for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md', 'VERSION']) {
    assert.equal(
      fs.readFileSync(path.join(root, 'fp', file), 'utf8'),
      fs.readFileSync(path.join(root, file), 'utf8'),
      `fp/${file} must match the root release source`
    );
  }
});

test('PowerShell release paths use the module-independent SHA-256 helper', () => {
  for (const file of ['install/universal/INSTALL-FP.ps1', 'scripts/sync-install-packs.ps1']) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(content, /System\.Security\.Cryptography\.SHA256/);
    assert.doesNotMatch(content, /Get-FileHash/);
  }
});

test('release workflow is tag-only, checksummed, licensed, immutable, and includes every installer entrypoint', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'release.yml'), 'utf8');
  const validateWorkflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'validate.yml'), 'utf8');
  const packaging = fs.readFileSync(path.join(root, 'scripts', 'build-release-assets.sh'), 'utf8');
  const releaseDefinition = `${workflow}\n${packaging}`;
  const powershellLifecycle = workflow.match(/(?:^|\r?\n)  powershell_lifecycle:\r?\n([\s\S]*?)(?=\r?\n  [A-Za-z0-9_-]+:\r?\n|$)/)?.[1] || '';
  const releaseJob = workflow.match(/(?:^|\r?\n)  release:\r?\n([\s\S]*?)(?=\r?\n  [A-Za-z0-9_-]+:\r?\n|$)/)?.[1] || '';
  assert.doesNotMatch(workflow, /workflow_dispatch\s*:/);
  assert.match(packaging, /SHA256SUMS/);
  assert.match(packaging, /sha256sum -c/);
  assert.match(packaging, /fp-roo-code-v/);
  assert.match(packaging, /verify_product_metadata/);
  assert.match(packaging, /payload\/fp\//);
  assert.match(packaging, /cat "\$root\/LICENSE"/);
  assert.match(packaging, /cat "\$root\/THIRD_PARTY_NOTICES\.md"/);
  assert.match(packaging, /LICENSE-v\$version\.txt/);
  assert.match(packaging, /THIRD_PARTY_NOTICES-v\$version\.md/);
  assert.match(powershellLifecycle, /runs-on:\s*windows-latest/);
  assert.match(powershellLifecycle, /node --test test\/installer-integration\.test\.js/);
  assert.match(releaseJob, /needs:\s*\[validate, powershell_lifecycle\]/);
  assert.doesNotMatch(`${workflow}\n${validateWorkflow}`, /uses:\s*[^\s@]+@v\d+(?:\s|$)/m);
  assert.match(workflow, /generate_release_notes:\s*true/);
  for (const name of ['INSTALL-FP.cmd', 'INSTALL-FP.ps1', 'INSTALL-FP.sh']) {
    assert.match(releaseDefinition, new RegExp(name.replace('.', '\\.')));
  }
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('universal package uses real namespaced entrypoints and no fake host paths', () => {
  const payload = path.join(root, 'install', 'universal', '.zerotohero-package', 'payload');
  for (const relative of [
    '.agents/skills/zerotohero/SKILL.md',
    '.claude/skills/zerotohero/SKILL.md',
    '.agents/rules/zerotohero.md',
    '.roo/rules/zerotohero.md',
    '.github/instructions/zerotohero.instructions.md',
    '.qoder/rules/zerotohero.md'
  ]) assert.ok(fs.existsSync(path.join(payload, relative)), `missing ${relative}`);
  assert.ok(!fs.existsSync(path.join(payload, '.openclaw/skills/zerotohero/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(payload, '.junie/zerotohero.md')));
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

test('product metadata is namespaced and synchronized with release sources', () => {
  for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md', 'VERSION']) {
    assert.equal(
      fs.readFileSync(path.join(root, 'zerotohero', file), 'utf8'),
      fs.readFileSync(path.join(root, file), 'utf8'),
      `zerotohero/${file} must match the root release source`
    );
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
  assert.match(packaging, /zerotohero-roo-code-v/);
  assert.match(packaging, /verify_product_metadata/);
  assert.match(packaging, /payload\/zerotohero\//);
  assert.match(packaging, /cat "\$root\/LICENSE"/);
  assert.match(packaging, /cat "\$root\/THIRD_PARTY_NOTICES\.md"/);
  assert.match(packaging, /LICENSE-v\$version\.txt/);
  assert.match(packaging, /THIRD_PARTY_NOTICES-v\$version\.md/);
  assert.match(powershellLifecycle, /runs-on:\s*windows-latest/);
  assert.match(powershellLifecycle, /node --test test\/installer-integration\.test\.js/);
  assert.match(releaseJob, /needs:\s*\[validate, powershell_lifecycle\]/);
  assert.doesNotMatch(`${workflow}\n${validateWorkflow}`, /uses:\s*[^\s@]+@v\d+(?:\s|$)/m);
  assert.match(workflow, /generate_release_notes:\s*true/);
  for (const name of ['INSTALL-ZEROTOHERO.cmd', 'INSTALL-ZEROTOHERO.ps1', 'INSTALL-ZEROTOHERO.sh']) {
    assert.match(releaseDefinition, new RegExp(name.replace('.', '\\.')));
  }
});

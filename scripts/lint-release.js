#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function workflowJob(workflow, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = workflow.match(new RegExp(`(?:^|\\r?\\n)  ${escaped}:\\r?\\n([\\s\\S]*?)(?=\\r?\\n  [A-Za-z0-9_-]+:\\r?\\n|$)`));
  return match ? match[1] : null;
}

function main() {
  const failures = [];
  const version = read('VERSION').trim();
  if (!/^\d+\.\d+\.\d+$/.test(version)) failures.push('VERSION must be semver without a leading v');

  const gemini = JSON.parse(read('install/gemini-cli/zerotohero/gemini-extension.json'));
  if (gemini.name !== 'zerotohero') failures.push('Gemini extension name must be zerotohero');
  if (gemini.version !== version) failures.push(`Gemini version ${gemini.version} does not match VERSION ${version}`);

  const release = read('.github/workflows/release.yml');
  const validate = read('.github/workflows/validate.yml');
  const packaging = read('scripts/build-release-assets.sh');
  const releaseDefinition = `${release}\n${packaging}`;
  const requiredAssets = [
    'universal', 'codex', 'claude-code', 'gemini-cli', 'github-copilot-cli',
    'cursor', 'windsurf', 'cline', 'roo-code', 'opencode', 'kiro', 'github-copilot-editor', 'aider', 'copy-paste'
  ];
  for (const asset of requiredAssets) {
    if (!releaseDefinition.includes(`zerotohero-${asset}-v`)) failures.push(`release packaging is missing ${asset} asset`);
  }
  if (/workflow_dispatch\s*:/.test(release)) failures.push('release workflow must not publish from an arbitrary manually dispatched branch');
  for (const marker of ['SHA256SUMS', 'sha256sum -c', 'INSTALL-ZEROTOHERO.cmd', 'INSTALL-ZEROTOHERO.ps1', 'INSTALL-ZEROTOHERO.sh', '--uninstall', 'verify_product_metadata', 'THIRD_PARTY_NOTICES.md', 'cat "$root/LICENSE"', 'cat "$root/THIRD_PARTY_NOTICES.md"', 'generate_release_notes: true']) {
    if (!releaseDefinition.includes(marker)) failures.push(`release definition is missing ${marker}`);
  }
  if (!/workflow_call\s*:/.test(validate)) failures.push('validate workflow must be reusable by the release gate');
  for (const [name, workflow] of [['validate', validate], ['release', release]]) {
    if (/uses:\s*[^\s@]+@v\d+(?:\s|$)/m.test(workflow)) failures.push(`${name} workflow contains a mutable major action tag`);
  }
  const powershellLifecycle = workflowJob(release, 'powershell_lifecycle');
  if (!powershellLifecycle) {
    failures.push('release workflow is missing powershell_lifecycle job');
  } else {
    if (!powershellLifecycle.includes('runs-on: windows-latest')) failures.push('PowerShell lifecycle must run on windows-latest');
    if (!powershellLifecycle.includes('node --test test/installer-integration.test.js')) {
      failures.push('PowerShell lifecycle must run installer integration tests');
    }
  }
  const releaseJob = workflowJob(release, 'release');
  if (!releaseJob || !releaseJob.includes('needs: [validate, powershell_lifecycle]')) {
    failures.push('release publication must depend on reusable validation and powershell_lifecycle');
  }
  if (!packaging.includes('sed -i "s/{version}/$version/g"') || !packaging.includes('sed "s/{version}/$version/g"')) {
    failures.push('release README placeholders are not resolved during packaging');
  }

  const universalVersion = read('install/universal/.zerotohero-package/VERSION').trim();
  if (universalVersion !== version) failures.push(`universal package version ${universalVersion} does not match VERSION ${version}`);
  const canonicalVersion = read('zerotohero/VERSION').trim();
  if (canonicalVersion !== version) failures.push(`canonical product version ${canonicalVersion} does not match VERSION ${version}`);
  for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
    if (read(file) !== read(`zerotohero/${file}`)) failures.push(`zerotohero/${file} does not match root ${file}`);
  }
  for (const file of ['README.md', 'INSTALL.md', 'START_HERE.md', 'install/universal/README-ZEROTOHERO.md']) {
    const content = read(file);
    if (!/INSTALL-ZEROTOHERO\.(?:cmd|ps1|sh)/.test(content)) failures.push(`${file} does not tell the user to run the staged installer`);
  }
  const dedicated = fs.readdirSync(path.join(root, 'install'), { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name !== 'universal');
  for (const entry of dedicated) {
    if (fs.existsSync(path.join(root, 'install', entry.name, 'README.md'))) failures.push(`install/${entry.name}/README.md could overwrite a project README`);
  }
  if (fs.existsSync(path.join(root, 'install/aider/.aider.conf.yml'))) failures.push('dedicated Aider pack must not overwrite .aider.conf.yml');
  for (const file of ['INSTALL.md', 'START_HERE.md', 'dist/README.md', 'docs/release-checklist.md']) {
    if (/v0\.2\.[0-9]/.test(read(file))) failures.push(`${file} contains a stale hardcoded v0.2 release`);
  }

  if (failures.length > 0) {
    console.error(failures.join('\n'));
    return 1;
  }
  console.log(`ok: release metadata targets ZeroToHero ${version}`);
  return 0;
}

if (require.main === module) process.exitCode = main();

module.exports = { main };

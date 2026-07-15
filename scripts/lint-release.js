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

  const gemini = JSON.parse(read('install/gemini-cli/fp/gemini-extension.json'));
  if (gemini.name !== 'fp') failures.push('Gemini extension name must be fp');
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
    if (!releaseDefinition.includes(`fp-${asset}-v`)) failures.push(`release packaging is missing ${asset} asset`);
  }
  if (/workflow_dispatch\s*:/.test(release) && !/workflow_dispatch\s*:\s*\n\s*inputs\s*:/.test(release)) failures.push('release workflow must not publish from an arbitrary manually dispatched branch');
  for (const marker of ['SHA256SUMS', 'sha256sum -c', 'INSTALL-FP.cmd', 'INSTALL-FP.ps1', 'INSTALL-FP.sh', '--uninstall', 'verify_product_metadata', 'THIRD_PARTY_NOTICES.md', 'cat "$root/LICENSE"', 'cat "$root/THIRD_PARTY_NOTICES.md"', 'generate_release_notes: true']) {
    if (!releaseDefinition.includes(marker)) failures.push(`release definition is missing ${marker}`);
  }
  if (!/workflow_call\s*:/.test(validate)) failures.push('validate workflow must be reusable by the release gate');
  for (const [name, workflow] of [['validate', validate], ['release', release]]) {
    if (/uses:\s*[^\s@]+@v\d+(?:\s|$)/m.test(workflow)) failures.push(`${name} workflow contains a mutable major action tag`);
  }
  const powershellLifecycle = workflowJob(release, 'powershell_lifecycle');
  if (powershellLifecycle) {
    if (!powershellLifecycle.includes('runs-on: windows-latest')) failures.push('PowerShell lifecycle must run on windows-latest');
    if (!powershellLifecycle.includes('node --test test/installer-integration.test.js')) {
      failures.push('PowerShell lifecycle must run installer integration tests');
    }
  }
  const releaseJob = workflowJob(release, 'release');
  const expectedNeeds = new Set(['validate']);
  const actualNeeds = releaseJob ? releaseJob.match(/needs:\s*\[([^\]]+)\]/) : null;
  if (!releaseJob || !actualNeeds) {
    failures.push('release publication must depend on reusable validation');
  } else {
    const needsList = actualNeeds[1].split(',').map(s => s.trim());
    const missingNeeds = [...expectedNeeds].filter(n => !needsList.includes(n));
    if (missingNeeds.length > 0) failures.push(`release publication is missing dependency: ${missingNeeds.join(', ')}`);
  }
  for (const marker of ['refs/heads/main:refs/remotes/origin/main', 'GITHUB_SHA}^{commit}', 'origin/main^{commit}', 'TAG_COMMIT', 'MAIN_COMMIT']) {
    if (!releaseJob || !releaseJob.includes(marker)) failures.push(`release publication is missing main/tag equality gate marker ${marker}`);
  }
  if (!packaging.includes('sed -i "s/{version}/$version/g"') || !packaging.includes('sed "s/{version}/$version/g"')) {
    failures.push('release README placeholders are not resolved during packaging');
  }

  const universalVersion = read('install/universal/.fp-package/VERSION').trim();
  if (universalVersion !== version) failures.push(`universal package version ${universalVersion} does not match VERSION ${version}`);
  const canonicalVersion = read('fp/VERSION').trim();
  if (canonicalVersion !== version) failures.push(`canonical product version ${canonicalVersion} does not match VERSION ${version}`);
  for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
    if (read(file) !== read(`fp/${file}`)) failures.push(`fp/${file} does not match root ${file}`);
  }
  for (const file of ['README.md', 'INSTALL.md', 'START_HERE.md', 'install/universal/README-FP.md']) {
    const content = read(file);
    if (!/INSTALL-FP\.(?:cmd|ps1|sh)/.test(content)) failures.push(`${file} does not tell the user to run the staged installer`);
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
  console.log(`ok: release metadata targets FP ${version}`);
  return 0;
}

if (require.main === module) process.exitCode = main();

module.exports = { main };

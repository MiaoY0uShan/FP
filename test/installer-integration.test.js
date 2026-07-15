const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const universal = path.join(root, 'install', 'universal');
const isWindows = process.platform === 'win32';

function runInstaller(target, options = {}) {
  const args = isWindows
    ? [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(universal, 'INSTALL-ZEROTOHERO.ps1'),
        '-Target', target,
        ...(options.verify ? ['-Verify'] : []),
        ...(options.uninstall ? ['-Uninstall'] : []),
        ...(options.migrate ? ['-MigrateLegacy'] : [])
      ]
    : [
        path.join(universal, 'INSTALL-ZEROTOHERO.sh'), '--target', target,
        ...(options.verify ? ['--verify'] : []),
        ...(options.uninstall ? ['--uninstall'] : []),
        ...(options.migrate ? ['--migrate-legacy'] : [])
      ];
  return spawnSync(isWindows ? 'powershell' : 'sh', args, {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
    windowsHide: true
  });
}

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'zerotohero-installer-'));
}

function hash(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function assertSucceeded(result, label) {
  assert.equal(result.status, 0, `${label}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

function assertFailed(result, label) {
  assert.notEqual(result.status, 0, `${label} unexpectedly succeeded\nstdout:\n${result.stdout}`);
}

function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, output);
    else output.push(full);
  }
  return output;
}

test('universal installer installs, verifies, is idempotent, and detects tampering', { timeout: 120_000 }, () => {
  const target = tempProject();
  try {
    fs.writeFileSync(path.join(target, 'AGENTS.md'), 'user AGENTS instructions\n');
    fs.writeFileSync(path.join(target, 'GEMINI.md'), 'user GEMINI instructions\n');
    fs.writeFileSync(path.join(target, '.aider.conf.yml'), 'read: [] # ZEROTOHERO.md is only a comment\nmodel: test\n');

    assertSucceeded(runInstaller(target), 'initial install');
    assertSucceeded(runInstaller(target, { verify: true }), 'initial verify');
    assert.ok(fs.existsSync(path.join(target, '.roo', 'rules', 'zerotohero.md')));
    assert.ok(!fs.existsSync(path.join(target, '.openclaw', 'skills', 'zerotohero')));
    assert.ok(!fs.existsSync(path.join(target, '.junie', 'zerotohero.md')));
    const aider = fs.readFileSync(path.join(target, '.aider.conf.yml'), 'utf8');
    assert.match(aider, /read:\s*\["ZEROTOHERO\.md"\]/);
    assert.match(aider, /# ZEROTOHERO\.md is only a comment/);

    const managed = ['AGENTS.md', 'GEMINI.md', '.aider.conf.yml'];
    const before = managed.map((relative) => hash(path.join(target, relative)));
    assertSucceeded(runInstaller(target), 'idempotent reinstall');
    const after = managed.map((relative) => hash(path.join(target, relative)));
    assert.deepEqual(after, before);
    assertSucceeded(runInstaller(target, { verify: true }), 'verify after reinstall');

    const skill = path.join(target, 'zerotohero', 'SKILL.md');
    fs.appendFileSync(skill, '\ntampered\n');
    assertFailed(runInstaller(target, { verify: true }), 'payload tamper verify');
    fs.copyFileSync(path.join(universal, '.zerotohero-package', 'payload', 'zerotohero', 'SKILL.md'), skill);

    const manifestPath = path.join(target, 'zerotohero', '.install-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.owned_files[0] = 'NOT-AN-OWNED-FILE';
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    assertFailed(runInstaller(target, { verify: true }), 'manifest tamper verify');
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test('uninstall removes only verified ZeroToHero content and preserves project files', { timeout: 120_000 }, () => {
  const target = tempProject();
  const tamperedTarget = tempProject();
  try {
    const originals = new Map([
      ['AGENTS.md', 'user AGENTS instructions\n'],
      ['GEMINI.md', 'user GEMINI instructions\n'],
      ['.aider.conf.yml', 'read: [README.md]\nmodel: test\n']
    ]);
    for (const [relative, content] of originals) fs.writeFileSync(path.join(target, relative), content);
    const unrelated = path.join(target, '.cursor', 'rules', 'user.mdc');
    fs.mkdirSync(path.dirname(unrelated), { recursive: true });
    fs.writeFileSync(unrelated, 'project-owned rule\n');

    assertSucceeded(runInstaller(target), 'install before uninstall');
    assertSucceeded(runInstaller(target, { uninstall: true }), 'safe uninstall');

    for (const [relative, content] of originals) {
      assert.equal(fs.readFileSync(path.join(target, relative), 'utf8'), content, `${relative} was not restored semantically`);
    }
    assert.equal(fs.readFileSync(unrelated, 'utf8'), 'project-owned rule\n');
    assert.ok(!fs.existsSync(path.join(target, 'ZEROTOHERO.md')));
    assert.ok(!fs.existsSync(path.join(target, 'zerotohero')));
    assert.ok(!fs.existsSync(path.join(target, '.roo', 'rules', 'zerotohero.md')));
    assert.ok(fs.existsSync(path.join(target, '.zerotohero-backups')));

    assertSucceeded(runInstaller(tamperedTarget), 'install before tampered uninstall');
    const owned = path.join(tamperedTarget, 'zerotohero', 'SKILL.md');
    fs.appendFileSync(owned, '\nuser modification\n');
    const agentsBefore = hash(path.join(tamperedTarget, 'AGENTS.md'));
    assertFailed(runInstaller(tamperedTarget, { uninstall: true }), 'tampered uninstall');
    assert.ok(fs.existsSync(owned));
    assert.equal(hash(path.join(tamperedTarget, 'AGENTS.md')), agentsBefore, 'failed uninstall wrote managed files');
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
    fs.rmSync(tamperedTarget, { recursive: true, force: true });
  }
});

test('uninstall ownership metadata preserves empty files and user-owned Aider entries', { timeout: 120_000 }, () => {
  const emptyTarget = tempProject();
  const userAiderTarget = tempProject();
  const collisionTarget = tempProject();
  const manifestCollisionTarget = tempProject();
  try {
    for (const relative of ['AGENTS.md', 'GEMINI.md', '.aider.conf.yml']) {
      fs.writeFileSync(path.join(emptyTarget, relative), '');
    }
    assertSucceeded(runInstaller(emptyTarget), 'install over empty managed files');
    assertSucceeded(runInstaller(emptyTarget, { uninstall: true }), 'uninstall over empty managed files');
    for (const relative of ['AGENTS.md', 'GEMINI.md', '.aider.conf.yml']) {
      assert.ok(fs.existsSync(path.join(emptyTarget, relative)), `${relative} should remain because the installer did not create it`);
      assert.equal(fs.readFileSync(path.join(emptyTarget, relative), 'utf8'), '');
    }

    const aiderPath = path.join(userAiderTarget, '.aider.conf.yml');
    fs.writeFileSync(aiderPath, 'read: [ZEROTOHERO.md]\nmodel: original\n');
    assertSucceeded(runInstaller(userAiderTarget), 'install with user-owned Aider entry');
    const manifest = JSON.parse(fs.readFileSync(path.join(userAiderTarget, 'zerotohero', '.install-manifest.json'), 'utf8'));
    assert.equal(manifest.aider_entry_managed, false);
    fs.writeFileSync(aiderPath, 'model: user-updated\n');
    assertSucceeded(runInstaller(userAiderTarget, { uninstall: true }), 'uninstall with changed user-owned Aider entry');
    assert.equal(fs.readFileSync(aiderPath, 'utf8'), 'model: user-updated\n');

    const collision = path.join(collisionTarget, 'ZEROTOHERO.md');
    fs.writeFileSync(collision, 'project-owned collision\n');
    assertFailed(runInstaller(collisionTarget), 'project-owned namespace collision');
    assert.equal(fs.readFileSync(collision, 'utf8'), 'project-owned collision\n');
    assert.ok(!fs.existsSync(path.join(collisionTarget, 'zerotohero')));

    const manifestCollision = path.join(manifestCollisionTarget, 'zerotohero', '.install-manifest.json');
    fs.mkdirSync(path.dirname(manifestCollision), { recursive: true });
    fs.writeFileSync(manifestCollision, 'project-owned control file\n');
    assertFailed(runInstaller(manifestCollisionTarget), 'project-owned manifest collision');
    assert.equal(fs.readFileSync(manifestCollision, 'utf8'), 'project-owned control file\n');
    assert.deepEqual(fs.readdirSync(path.join(manifestCollisionTarget, 'zerotohero')), ['.install-manifest.json']);
    assert.ok(!fs.existsSync(path.join(manifestCollisionTarget, 'ZEROTOHERO.md')));

    assertFailed(runInstaller(collisionTarget, { verify: true, migrate: true }), 'verify and migrate are mutually exclusive');
    assertFailed(runInstaller(collisionTarget, { uninstall: true, migrate: true }), 'uninstall and migrate are mutually exclusive');
  } finally {
    fs.rmSync(emptyTarget, { recursive: true, force: true });
    fs.rmSync(userAiderTarget, { recursive: true, force: true });
    fs.rmSync(collisionTarget, { recursive: true, force: true });
    fs.rmSync(manifestCollisionTarget, { recursive: true, force: true });
  }
});

test('Aider block comments and unrelated YAML entries survive managed install and uninstall', { timeout: 120_000 }, () => {
  const target = tempProject();
  try {
    const original = [
      'other:',
      '  - ZEROTOHERO.md',
      'read: # keep this comment',
      '  - README.md',
      'model: test',
      ''
    ].join('\n');
    const aiderPath = path.join(target, '.aider.conf.yml');
    fs.writeFileSync(aiderPath, original);

    assertSucceeded(runInstaller(target), 'install with commented Aider block list');
    assertSucceeded(runInstaller(target, { verify: true }), 'verify commented Aider block list');
    const installed = fs.readFileSync(aiderPath, 'utf8');
    assert.match(installed, /^read: # keep this comment$/m);
    assert.match(installed, /^  - ZEROTOHERO\.md$/m);
    assert.match(installed, /^other:\n  - ZEROTOHERO\.md$/m);

    assertSucceeded(runInstaller(target, { uninstall: true }), 'uninstall commented Aider block list');
    assert.equal(fs.readFileSync(aiderPath, 'utf8'), original);
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test('duplicate installer-owned Aider entries block uninstall before any write', { timeout: 120_000 }, () => {
  const target = tempProject();
  try {
    const aiderPath = path.join(target, '.aider.conf.yml');
    fs.writeFileSync(aiderPath, 'read: [README.md]\n');
    assertSucceeded(runInstaller(target), 'install before duplicate Aider tamper');
    const tampered = fs.readFileSync(aiderPath, 'utf8')
      .replace(/\](\s*(?:#.*)?\r?\n)/, ', "ZEROTOHERO.md"]$1');
    fs.writeFileSync(aiderPath, tampered);
    const protectedFiles = [
      '.aider.conf.yml',
      'AGENTS.md',
      'zerotohero/SKILL.md',
      'zerotohero/.install-manifest.json'
    ];
    const before = new Map(protectedFiles.map((relative) => [relative, hash(path.join(target, relative))]));

    assertFailed(runInstaller(target, { uninstall: true }), 'duplicate managed Aider entry uninstall');
    for (const [relative, digest] of before) {
      assert.equal(hash(path.join(target, relative)), digest, `${relative} changed during failed uninstall`);
    }
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test('backup snapshots use an atomic random directory and ignore attacker-named child links', { timeout: 120_000 }, (t) => {
  const target = tempProject();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'zerotohero-backup-outside-'));
  try {
    const backupContainer = path.join(target, '.zerotohero-backups');
    fs.mkdirSync(backupContainer);
    const attacker = path.join(backupContainer, 'run-attacker');
    try {
      fs.symlinkSync(outside, attacker, isWindows ? 'junction' : 'dir');
    } catch (error) {
      if (error.code !== 'EPERM' && error.code !== 'EACCES') throw error;
      t.diagnostic(`nested link creation unavailable: ${error.code}`);
    }
    const before = new Set(fs.readdirSync(backupContainer));
    fs.writeFileSync(path.join(target, 'AGENTS.md'), 'project instructions\n');

    assertSucceeded(runInstaller(target), 'install with pre-existing backup child');
    const created = fs.readdirSync(backupContainer).filter((entry) => !before.has(entry));
    assert.ok(created.length > 0, 'a changed project file should create a backup snapshot');
    for (const entry of created) {
      assert.match(entry, /^run-[A-Za-z0-9]+$/);
      assert.equal(fs.lstatSync(path.join(backupContainer, entry)).isSymbolicLink(), false);
      assert.equal(fs.statSync(path.join(backupContainer, entry)).isDirectory(), true);
    }
    assert.deepEqual(fs.readdirSync(outside), []);
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test('unsafe markers and Aider YAML fail before payload writes', { timeout: 120_000 }, () => {
  const fixtures = [
    ['AGENTS.md', 'prefix <!-- zerotohero:start --> private <!-- zerotohero:end --> suffix\n'],
    ['AGENTS.md', '<!-- zerotohero:start -->\nmissing end\n'],
    ['.aider.conf.yml', 'read: >\n  README.md\n'],
    ['.aider.conf.yml', 'read:\n  nested: README.md\n'],
    ['.roo', 'user file blocks the required directory\n']
  ];
  for (const [relative, content] of fixtures) {
    const target = tempProject();
    try {
      fs.writeFileSync(path.join(target, relative), content);
      assertFailed(runInstaller(target), `preflight ${relative}: ${JSON.stringify(content)}`);
      assert.equal(fs.readFileSync(path.join(target, relative), 'utf8'), content);
      assert.ok(!fs.existsSync(path.join(target, 'zerotohero')));
      assert.ok(!fs.existsSync(path.join(target, 'ZEROTOHERO.md')));
      assert.ok(!fs.existsSync(path.join(target, '.agents')));
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
});

test('link and junction ancestors cannot redirect writes outside the target', { timeout: 120_000 }, (t) => {
  const target = tempProject();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'zerotohero-outside-'));
  try {
    try {
      fs.symlinkSync(outside, path.join(target, '.roo'), isWindows ? 'junction' : 'dir');
    } catch (error) {
      if (error.code === 'EPERM' || error.code === 'EACCES') {
        t.skip(`link creation is unavailable: ${error.code}`);
        return;
      }
      throw error;
    }
    assertFailed(runInstaller(target), 'linked adapter directory preflight');
    assert.deepEqual(fs.readdirSync(outside), []);
    assert.ok(!fs.existsSync(path.join(target, 'zerotohero')));
    assert.ok(!fs.existsSync(path.join(target, '.agents')));
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test('legacy Xskill paths are rejected by default and explicitly migrated with backup', { timeout: 120_000 }, () => {
  const target = tempProject();
  try {
    const legacy = path.join(target, '.agents', 'skills', 'xskill');
    fs.mkdirSync(legacy, { recursive: true });
    fs.writeFileSync(path.join(legacy, 'SKILL.md'), 'legacy router\n');
    assertFailed(runInstaller(target), 'legacy default preflight');
    assert.ok(!fs.existsSync(path.join(target, 'zerotohero')));

    assertSucceeded(runInstaller(target, { migrate: true }), 'explicit legacy migration');
    assert.ok(!fs.existsSync(legacy));
    assertSucceeded(runInstaller(target, { verify: true }), 'verify after legacy migration');
    const backups = walk(path.join(target, '.zerotohero-backups'))
      .map((file) => file.replace(/\\/g, '/'));
    assert.ok(backups.some((file) => file.endsWith('/legacy-xskill/.agents/skills/xskill/SKILL.md')));
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});

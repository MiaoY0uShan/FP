#!/usr/bin/env node
// ci-safe-sync-check.js — portable SHA-256 comparison of install packs
// Replaces sync-install-packs.ps1 -Check for non-Windows CI runners.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'fp');

const targets = [
  "install/codex/.agents/skills/fp/references/fp",
  "install/claude-code/.claude/skills/fp/references/fp",
  "install/gemini-cli/fp/fp",
  "install/github-copilot-cli/fp",
  "install/cursor/fp",
  "install/windsurf/fp",
  "install/cline/fp",
  "install/roo-code/fp",
  "install/opencode/fp",
  "install/kiro/fp",
  "install/github-copilot-editor/fp",
  "install/aider/fp",
  "install/universal/.fp-package/payload/fp"
];

const noFrontmatterTargets = [
  "install/universal/.fp-package/payload/.windsurf/rules/fp.md",
  "install/universal/.fp-package/payload/.roo/rules/fp.md",
  "install/universal/.fp-package/payload/.clinerules/fp.md",
  "install/universal/.fp-package/payload/.qoder/rules/fp.md",
  "install/universal/.fp-package/payload/.agents/rules/fp.md"
];

const claudeMdSource = path.join(root, 'fp', 'CLAUDE.md');
const claudeMdTargets = [
  "install/universal/.fp-package/payload/.claude/CLAUDE.md",
  "install/claude-code/.claude/CLAUDE.md"
];

const testSource = path.join(root, 'TEST_FP.md');
const testTargets = [
  "install/codex/TEST_FP.md",
  "install/claude-code/TEST_FP.md",
  "install/gemini-cli/TEST_FP.md",
  "install/github-copilot-cli/TEST_FP.md",
  "install/cursor/TEST_FP.md",
  "install/windsurf/TEST_FP.md",
  "install/cline/TEST_FP.md",
  "install/roo-code/TEST_FP.md",
  "install/opencode/TEST_FP.md",
  "install/kiro/TEST_FP.md",
  "install/github-copilot-editor/TEST_FP.md",
  "install/aider/TEST_FP.md",
  "install/universal/.fp-package/payload/TEST_FP.md"
];

const copyPasteSource = path.join(root, 'fp-copy-paste.md');
const copyPasteTarget = path.join(root, 'dist', 'fp-copy-paste.md');

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function compareDirectory(left, right) {
  const leftFiles = [];
  function walk(dir, base, out) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(base, full).replace(/\\/g, '/');
      if (entry.isDirectory()) walk(full, base, out);
      else out.push(rel);
    }
  }
  walk(left, left, leftFiles);
  leftFiles.sort();
  const rightFiles = [];
  if (!fs.existsSync(right)) return false;
  walk(right, right, rightFiles);
  rightFiles.sort();

  if (JSON.stringify(leftFiles) !== JSON.stringify(rightFiles)) return false;

  for (const rel of leftFiles) {
    if (sha256(path.join(left, rel)) !== sha256(path.join(right, rel))) return false;
  }
  return true;
}

let failures = 0;

// canonical metadata (LICENSE, THIRD_PARTY_NOTICES, VERSION)
for (const f of ['LICENSE', 'THIRD_PARTY_NOTICES.md', 'VERSION']) {
  const src = path.join(root, f);
  const dst = path.join(source, f);
  if (sha256(src) !== sha256(dst)) {
    console.error(`out of sync: fp/${f}`);
    failures++;
  } else {
    console.log(`ok: fp/${f}`);
  }
}

// directory targets
for (const t of targets) {
  const dst = path.join(root, t);
  if (!fs.existsSync(dst)) {
    console.error(`missing: ${t}`);
    failures++;
  } else if (!compareDirectory(source, dst)) {
    console.error(`out of sync: ${t}`);
    failures++;
  } else {
    console.log(`ok: ${t}`);
  }
}

// TEST_FP.md
for (const t of testTargets) {
  const dst = path.join(root, t);
  if (!fs.existsSync(dst)) {
    console.error(`missing: ${t}`);
    failures++;
  } else if (sha256(testSource) !== sha256(dst)) {
    console.error(`out of sync: ${t}`);
    failures++;
  } else {
    console.log(`ok: ${t}`);
  }
}

// copy-paste
if (!fs.existsSync(copyPasteTarget)) {
  console.error(`missing: dist/fp-copy-paste.md`);
  failures++;
} else if (sha256(copyPasteSource) !== sha256(copyPasteTarget)) {
  console.error(`out of sync: dist/fp-copy-paste.md`);
  failures++;
} else {
  console.log(`ok: dist/fp-copy-paste.md`);
}

// no-frontmatter
for (const t of noFrontmatterTargets) {
  const src = path.join(root, 'fp', 'CLAUDE.md');
  const dst = path.join(root, t);
  if (!fs.existsSync(dst)) {
    console.error(`missing: ${t}`);
    failures++;
  } else if (sha256(src) !== sha256(dst)) {
    console.error(`out of sync: ${t}`);
    failures++;
  } else {
    console.log(`ok: ${t}`);
  }
}

// CLAUDE.md
for (const t of claudeMdTargets) {
  const dst = path.join(root, t);
  if (!fs.existsSync(dst)) {
    console.error(`missing: ${t}`);
    failures++;
  } else if (sha256(claudeMdSource) !== sha256(dst)) {
    console.error(`out of sync: ${t}`);
    failures++;
  } else {
    console.log(`ok: ${t}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log(`\nall ok`);

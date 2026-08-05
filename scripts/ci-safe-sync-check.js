#!/usr/bin/env node
// ci-safe-sync-check.js — portable SHA-256 comparison of install packs
// Replaces sync-install-packs.ps1 -Check for non-Windows CI runners.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'fp');

// Target lists live in scripts/sync-manifest.json — the single source of truth
// shared with scripts/sync-install-packs.ps1. Edit the manifest, not this file.
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'sync-manifest.json'), 'utf8'));

const targets = manifest.fpTreeTargets;
const noFrontmatterTargets = manifest.noFrontmatterTargets;

const claudeMdSource = path.join(root, 'fp', 'CLAUDE.md');
const claudeMdTargets = manifest.claudeMdTargets;

const testSource = path.join(root, 'TEST_FP.md');
const testTargets = manifest.testFpTargets;

const copyPasteSource = path.join(root, manifest.copyPaste.source);
const copyPasteTarget = path.join(root, manifest.copyPaste.target);

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
for (const f of manifest.canonicalMetadata) {
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

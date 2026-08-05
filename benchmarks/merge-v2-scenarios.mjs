#!/usr/bin/env node
// Merge v2 scenario bundles into real trait files.
// usage: node benchmarks/merge-v2-scenarios.mjs <bundle.json> [bundleKey=realFile ...]
// Validates rubric weights (sum 1.0), the -v2- id marker, and id uniqueness.
// Bundle keys without an existing target file are skipped (held for review).
import fs from 'node:fs';
import path from 'node:path';

const [file, ...maps] = process.argv.slice(2);
if (!file) { console.error('usage: node merge-v2-scenarios.mjs <bundle.json> [key=realfile ...]'); process.exit(2); }
const remap = Object.fromEntries(maps.map(m => m.split('=')));
const bundle = JSON.parse(fs.readFileSync(file, 'utf8'));
const traitsDir = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'traits');

for (const [key, scenarios] of Object.entries(bundle)) {
  const target = path.join(traitsDir, remap[key] || key);
  if (!fs.existsSync(target)) { console.log(`SKIP (no target on disk): ${key}`); continue; }
  const t = JSON.parse(fs.readFileSync(target, 'utf8'));
  const have = new Set(t.scenarios.map(s => s.id));
  let n = 0;
  for (const s of scenarios) {
    const w = Object.values(s.rubric).reduce((a, d) => a + d.weight, 0);
    if (Math.abs(w - 1) > 0.001) throw new Error(`${s.id}: rubric weights sum ${w}`);
    if (!s.id.includes('-v2-')) throw new Error(`${s.id}: missing -v2- marker`);
    if (!have.has(s.id)) { t.scenarios.push(s); n++; }
  }
  fs.writeFileSync(target, JSON.stringify(t, null, 2) + '\n');
  console.log(`merged ${n} into ${path.basename(target)} (total ${t.scenarios.length})`);
}

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const retired = /README\.(?:ar|es|fr|hi|ja|pt|ru)\.md/;

test('root README languages are limited to English and Simplified Chinese', () => {
  const readmes = fs.readdirSync(root)
    .filter((name) => /^README(?:\..+)?\.md$/.test(name) || name === 'README.md')
    .sort();
  assert.deepEqual(readmes, ['README.md', 'README.zh-CN.md']);
});

test('remaining README language navigation has no retired translation links', () => {
  const english = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const chinese = fs.readFileSync(path.join(root, 'README.zh-CN.md'), 'utf8');
  assert.doesNotMatch(english, retired);
  assert.doesNotMatch(chinese, retired);
  assert.match(english, /README\.zh-CN\.md/);
  assert.match(english, /中文/);
  assert.match(chinese, /README\.md/);
  assert.match(chinese, /English/);
});
test('Chinese README mirrors English structure and media', () => {
  const english = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const chinese = fs.readFileSync(path.join(root, 'README.zh-CN.md'), 'utf8');
  const imageSources = (content) => [...content.matchAll(/<img src="([^"]+)"/g)].map((match) => match[1]);
  const h2 = (content) => content.split(/\r?\n/).filter((line) => line.startsWith('## ')).map((line) => line.slice(3));

  assert.deepEqual(imageSources(chinese), imageSources(english));
  assert.ok(h2(english).length >= 8, 'English README has core sections');
  assert.ok(h2(chinese).length >= 6, 'Chinese README has core sections');
  assert.ok(h2(chinese).includes('四条规则'));
  assert.ok(h2(chinese).includes('FP 到底解决了什么'));
  assert.ok(h2(chinese).includes('FAQ'));
});

test('Chinese README carries current English positioning and actionable-response copy', () => {
  const chinese = fs.readFileSync(path.join(root, 'README.zh-CN.md'), 'utf8');
  for (const marker of [
    '不再猜测，开始证明',
    '没有证据，就不算完成',
    '4,100',
    'Prompt 干扰',
    '路由精度',
    'v-final',
    'MIT License',
  ]) assert.match(chinese, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
});

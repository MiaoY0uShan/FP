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
  assert.match(english, /\[中文\]\(README\.zh-CN\.md\)/);
  assert.match(chinese, /\[English\]\(README\.md\)/);
});
test('Chinese README mirrors English structure and media', () => {
  const english = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const chinese = fs.readFileSync(path.join(root, 'README.zh-CN.md'), 'utf8');
  const imageSources = (content) => [...content.matchAll(/<img src="([^"]+)"/g)].map((match) => match[1]);
  const h2 = (content) => content.split(/\r?\n/).filter((line) => line.startsWith('## ')).map((line) => line.slice(3));

  assert.deepEqual(imageSources(chinese), imageSources(english));
  assert.equal((chinese.match(/```/g) || []).length, (english.match(/```/g) || []).length);
  assert.equal((chinese.match(/^\|---/gm) || []).length, (english.match(/^\|---/gm) || []).length);
  assert.equal(h2(chinese).length, h2(english).length);
  assert.deepEqual(h2(chinese), [
    '为什么选择 FP',
    '30 秒导览',
    '你会得到什么',
    '适配你的工作环境',
    '大约一分钟完成安装',
    '执行协议',
    '一眼扫过也不会丢失状态的回复',
    '分布式，但不混乱',
    '不被平台锁定的上下文和图',
    '学习，但不把偶然记成规则',
    '信任模型',
    'FAQ',
    '如果这些问题让你有共鸣',
    '开发',
    '影响来源',
    '许可',
  ]);
});

test('Chinese README carries current English positioning and actionable-response copy', () => {
  const chinese = fs.readFileSync(path.join(root, 'README.zh-CN.md'), 'utf8');
  for (const marker of [
    '让编码 agent 用证据收尾，而不是凭感觉宣布完成',
    'No proof, no done',
    '第 3 步，共 5 步',
    '已有测试覆盖约 15 分钟',
    '需要补覆盖约半天',
    'baseline/candidate',
    'Release 资产',
  ]) assert.match(chinese, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
});

const https = require('https');
const fs = require('fs');

const article = fs.readFileSync('benchmarks/results/ARTICLE.md', 'utf8');
const body = article + '\n\n---\n\n*Posted from benchmark data. Full code: `benchmarks/`*\n*Reproduce: `node benchmarks/real-eval-v2.mjs all --versions v0,v-final,v-minimal --trials 2 --model gpt-5.6-sol`*';

const payload = JSON.stringify({
  title: 'FP Benchmark 实验报告：1,416 次 API 调用，3 模型，从 "Baseline 赢了" 到 "少即是多"',
  body: body,
  labels: ['documentation']
});

const req = https.request({
  hostname: 'api.github.com',
  path: '/repos/MiaoY0uShan/FP/issues',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${process.env.GITHUB_TOKEN}',
    'Content-Type': 'application/json',
    'User-Agent': 'fp-release'
  }
}, res => {
  let d='';
  res.on('data', c => d+=c);
  res.on('end', () => {
    const r = JSON.parse(d);
    if (r.html_url) console.log('Posted: ' + r.html_url);
    else console.log('Error: ' + (r.message || d.slice(0,200)));
  });
});
req.write(payload);
req.end();

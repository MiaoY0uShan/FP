const https = require('https');
const fs = require('fs');

const article = fs.readFileSync('benchmarks/results/ARTICLE.md', 'utf8');
const body = article + '\n\n---\n\n*Posted from benchmark data. Full code: `benchmarks/`*\n*Reproduce: `node benchmarks/real-eval-v2.mjs all --versions v0,v-final,v-minimal --trials 2 --model gpt-5.6-sol`*';

const query = JSON.stringify({
  query: `mutation {
    createDiscussion(input: {
      repositoryId: "R_kgDOSMQ8ZA",
      categoryId: "DIC_kwDOSMQ8ZM4DCARm",
      title: "FP Benchmark 实验报告：1,416 次 API 调用，3 模型，从 Baseline 赢了 到 少即是多",
      body: ${JSON.stringify(body)}
    }) {
      discussion { url }
    }
  }`
});

const req = https.request({
  hostname: 'api.github.com',
  path: '/graphql',
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
    const url = r.data?.createDiscussion?.discussion?.url;
    if (url) console.log('✅ ' + url);
    else console.log('Error: ' + JSON.stringify(r.errors || r).slice(0,400));
  });
});
req.write(query);
req.end();

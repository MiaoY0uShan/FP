const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
  const pages = await browser.pages();
  const page = pages[0];
  
  await page.goto('https://discord.com/channels/1456806362351669492/1457119127939580046');
  await new Promise(r => setTimeout(r, 2000));
  
  // Click New Post
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '新帖' && btn.offsetParent !== null) {
        btn.click(); break;
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Title
  await page.evaluate(() => {
    const ta = document.querySelector('textarea[placeholder="标题"]');
    if (ta) { ta.focus(); ta.click(); }
  });
  await page.keyboard.type('FP - Finish with Proof: a portable execution protocol for coding agents', { delay: 3 });
  
  // Body
  await page.evaluate(() => {
    const el = document.querySelector('[aria-label="输入消息……"][role="textbox"]') || document.querySelector('[contenteditable="true"][role="textbox"]');
    if (el) { el.focus(); el.click(); }
  });
  
  await new Promise(r => setTimeout(r, 300));
  
  const lines = [
    'FP - Finish with Proof: a portable execution protocol that makes coding agents finish with proof, not vibes.',
    '',
    '85 lines | 4 core rules | on-demand profiles',
    '',
    'Install: npm i @miaoy0ushan/fp  or  pi install npm:@miaoy0ushan/fp',
    '',
    'Blind eval results (1,416 real API calls across 3 models):',
    '- GPT-5.6-Sol: v-final scores 3.57 (champion)',
    '- DeepSeek-v4-Pro: v-final scores 3.14 (champion)',
    '- Token consumption: -45%',
    '- Tool calls: -57%',
    '- Template reads: -89% (1 vs 9, zero wasted)',
    '',
    'Four core rules:',
    '1. Lock the goal — optimize the path, never the goal',
    '2. Diagnose before patching',
    '3. Verify before claiming done',
    '4. Be concise and actionable',
    '',
    'Zero dependencies. Pure prompt engineering. Multi-platform: Pi, Claude Code, Codex CLI, Gemini CLI, Cursor, OpenCode, and more.',
    '',
    'GitHub: https://github.com/MiaoY0uShan/FP',
    'npm: https://www.npmjs.com/package/@miaoy0ushan/fp',
    'ChatGPT GPT: https://chatgpt.com/g/g-6a660acb6f788191b426f01b55ca34d6-fp-coding-engineer',
    'Benchmarks: https://github.com/MiaoY0uShan/FP/blob/main/benchmarks/results/ARTICLE.md'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    await page.keyboard.type(lines[i], { delay: 2 });
    if (i < lines.length - 1) {
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
    }
    await new Promise(r => setTimeout(r, 30));
  }
  
  // Tag
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input:not([type="hidden"])');
    for (const inp of inputs) {
      if (inp.offsetParent && !inp.placeholder && !inp.readOnly && inp.type !== 'file') {
        inp.focus();
        inp.value = 'extension';
        inp.dispatchEvent(new Event('input', {bubbles: true}));
        inp.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
        break;
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  // Submit
  const posted = await page.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn && submitBtn.offsetParent) {
      submitBtn.click();
      return true;
    }
    return false;
  });
  
  console.log('Posted:', posted);
  await new Promise(r => setTimeout(r, 2000));
  console.log('URL:', page.url());
  
  await browser.disconnect();
})();

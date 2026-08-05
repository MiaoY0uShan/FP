const puppeteer = require('puppeteer-core');
const fs = require('fs');
const message = fs.readFileSync('C:/Users/fp/Desktop/github/fpskill/discord-message.txt', 'utf8');

(async () => {
  const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
  const pages = await browser.pages();
  const page = pages[0];
  
  // Find and focus the editor
  await page.evaluate(() => {
    const editor = document.querySelector('.public-DraftEditor-content') || document.querySelector('[contenteditable="true"][role="combobox"]');
    if (editor) {
      editor.focus();
      editor.click();
    }
  });
  
  // Type the message using keyboard (more reliable for Draft.js)
  await page.keyboard.type(message, { delay: 5 });
  
  // Press Enter to send
  await page.keyboard.press('Enter');
  
  console.log('SENT');
  await browser.disconnect();
})();

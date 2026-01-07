const puppeteer = require('puppeteer-core');
const { startFlow } = require('lighthouse');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();


  const flow = await startFlow(page, {
    name: 'Authenticated Dashboard Audit',
    configContext: { settings: { screenEmulation: { disabled: true } } }
  });

  console.log('Step 1: Logging in...');
  await page.goto('https://gradversion3.netlify.app/');
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', process.env.EMAIL);
  await page.type('input[type="password"]', process.env.PASSWORD);
  
 
  await page.click('.login-button');
  await page.waitForSelector('.dashboard-sidebar', { timeout: 15000 });
  console.log('Step 2: Dashboard detected!');

  console.log('Step 3: Capturing Authenticated Snapshot...');
  await flow.snapshot();

  const report = await flow.generateReport();
  const fs = require('fs');
  fs.writeFileSync('lh-report.html', report);
  
  console.log('Step 4: Report generated successfully!');
  await browser.close();
})();

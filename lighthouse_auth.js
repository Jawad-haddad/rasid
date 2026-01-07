const puppeteer = require('puppeteer-core');
const { startFlow } = require('lighthouse');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  const flow = await startFlow(page, {
    name: 'Authenticated Dashboard Audit',
    configContext: { 
        settings: { 
            screenEmulation: { disabled: true },
            formFactor: 'desktop' 
        } 
    }
  });

  console.log('Step 1: Logging in...');
  await page.goto('https://gradversion3.netlify.app/', { waitUntil: 'networkidle2' });
  
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', process.env.EMAIL);
  await page.type('input[type="password"]', process.env.PASSWORD);
  
  await Promise.all([
    page.click('.login-button'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  await page.waitForSelector('.dashboard-sidebar', { timeout: 15000 });
  console.log('Step 2: Dashboard detected!');

  console.log('Step 3: Auditing Dashboard interaction...');
  await flow.startTimespan({ stepName: 'Dashboard Load Interaction' });

  await flow.endTimespan();

  await flow.snapshot({ stepName: 'Final Dashboard State' });

  const reportHtml = await flow.generateReport();
  fs.writeFileSync('lh-report.html', reportHtml);
  
  const reportJson = JSON.parse(await flow.generateReport('json'));
  const perfScore = reportJson.steps[0].lhr.categories.performance.score;

  console.log(`Step 4: Audit Complete. Performance Score: ${perfScore * 100}`);

  await browser.close();

  if (perfScore < 0.8) {
    console.error(`FAILED: Performance score ${perfScore * 100} is below the 80 threshold.`);
    process.exit(1); 
  } else {
    console.log('SUCCESS: Performance threshold met.');
  }
})();

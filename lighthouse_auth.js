const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();

  console.log('Step 1: Navigating to Login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

  await page.type('#email', 'supajust2004@gmail.com');
  await page.type('#password', 'Supa4ever%');
  
  console.log('Step 2: Clicking Login...');
  await Promise.all([
    page.click('#login-button'), 
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);

  const localStorageData = await page.evaluate(() => JSON.stringify(localStorage));
  fs.writeFileSync('ls.json', localStorageData);

  const cookies = await page.cookies();
  fs.writeFileSync('cookies.json', JSON.stringify(cookies));

  console.log('Step 3: Session Saved Successfully!');
  await browser.close();
})();

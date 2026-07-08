import { chromium } from 'playwright-core';

export async function testBrisnet() {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote'
    ]
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://www.bfrdata.com/', { waitUntil: 'networkidle', timeout: 30000 });
    const screenshot = await page.screenshot({ encoding: 'base64' });
    const title = await page.title();
    await browser.close();
    return { success: true, title, screenshot };
  } catch (e) {
    await browser.close();
    return { success: false, error: e.message };
  }
}

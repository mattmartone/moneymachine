import { chromium } from 'playwright';
import { notify } from './notify.mjs';

export async function buyBrisnet(tracks, date) {
  const user = process.env.BRISNET_USER;
  const pass = process.env.BRISNET_PASS;
  const autoApprove = process.env.AUTO_APPROVE === 'true';

  if (!user || !pass) throw new Error('BRISNET_USER and BRISNET_PASS required in .env');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const screenshots = [];

  try {
    // Step 1: Navigate to login
    await notify(`Checking in. Task: buy ${tracks.join(', ')} for ${date}`);
    await page.goto('https://www.brisnet.com/product/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    screenshots.push(await page.screenshot({ path: `screenshots/01-login-page.png` }));

    // Step 2: Login
    await page.fill('input[name="username"], input[name="email"], input[type="text"]', user);
    await page.fill('input[name="password"], input[type="password"]', pass);
    await page.click('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Log In")');
    await page.waitForTimeout(5000);
    screenshots.push(await page.screenshot({ path: `screenshots/02-logged-in.png` }));
    await notify('Logged into Brisnet.');

    // Step 3: Navigate to PP Data Files
    await page.goto('https://www.brisnet.com/product/data-files/DRS', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    screenshots.push(await page.screenshot({ path: `screenshots/03-data-files.png` }));

    // Step 4: Select tracks
    for (const track of tracks) {
      try {
        await page.click(`input[value="${track}"], label:has-text("${track}"), td:has-text("${track}")`, { timeout: 5000 });
        console.log(`  Selected: ${track}`);
      } catch (e) {
        console.log(`  Could not select ${track}: ${e.message}`);
      }
    }
    await page.waitForTimeout(2000);
    screenshots.push(await page.screenshot({ path: `screenshots/04-tracks-selected.png` }));

    // Step 5: Add to cart
    await page.click('button:has-text("Add to Cart"), input[value*="Cart"], a:has-text("Add to Cart"), button:has-text("Add")');
    await page.waitForTimeout(3000);
    const cartScreenshot = await page.screenshot({ path: `screenshots/05-cart.png`, encoding: 'base64' });
    screenshots.push(cartScreenshot);
    await notify(`🛒 Cart loaded: ${tracks.join(', ')} for ${date}. Screenshot saved.`);

    if (!autoApprove) {
      await notify('⏸️ Waiting for approval. Set task status to "approved" to proceed.');
      await browser.close();
      return { status: 'awaiting_approval', cartScreenshot, tracks, date };
    }

    // Step 6: Checkout
    await notify('💳 Checking out...');
    await page.click('button:has-text("Checkout"), a:has-text("Checkout"), input[value*="Checkout"]');
    await page.waitForTimeout(5000);
    screenshots.push(await page.screenshot({ path: `screenshots/06-checkout.png` }));

    // Step 7: Download files
    const downloadDir = `downloads/${date}`;
    const { mkdirSync } = await import('fs');
    mkdirSync(downloadDir, { recursive: true });

    // Look for download links
    const downloadLinks = await page.$$('a[href*=".zip"], a[href*=".DRF"], a:has-text("Download")');
    const files = [];
    for (const link of downloadLinks) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30000 }),
        link.click()
      ]);
      const path = `${downloadDir}/${download.suggestedFilename()}`;
      await download.saveAs(path);
      files.push(path);
      console.log(`  Downloaded: ${path}`);
    }

    await notify(`✅ Done. ${files.length} files downloaded for ${date}.`);
    await browser.close();
    return { status: 'complete', files, tracks, date };

  } catch (error) {
    await page.screenshot({ path: `screenshots/error-${Date.now()}.png` }).catch(() => {});
    await browser.close();
    await notify(`❌ Error: ${error.message}`);
    return { status: 'error', error: error.message, tracks, date };
  }
}

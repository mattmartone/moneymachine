import { Actor } from 'apify';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

await Actor.init();

const input = await Actor.getInput();
const {
  brisnetUser,
  brisnetPass,
  tracks = [],
  raceDate = new Date().toISOString().split('T')[0],
  callbackUrl = null,
  dryRun = true
} = input || {};

if (!brisnetUser || !brisnetPass) {
  throw new Error('brisnetUser and brisnetPass are required');
}
if (!tracks.length) {
  throw new Error('tracks array is required (e.g. ["SAR", "GP", "MTH"])');
}

console.log(`Brisnet Purchase Actor — ${raceDate}`);
console.log(`Tracks: ${tracks.join(', ')}`);
console.log(`Dry run: ${dryRun}`);

chromium.use(stealth());
const proxyConfiguration = await Actor.createProxyConfiguration({ groups: ['RESIDENTIAL'] });
const proxyUrl = await proxyConfiguration.newUrl();
const browser = await chromium.launch({
  headless: true,
  proxy: { server: proxyUrl }
});
const page = await browser.newPage();

try {
  // Step 1: Navigate to Brisnet data files page directly
  console.log('Step 1: Loading brisnet.com/product/data-files/DRS...');
  try {
    await page.goto('https://www.brisnet.com/product/data-files/DRS', { timeout: 90000 });
  } catch (e) {
    console.log('  Initial load timed out, checking page state...');
  }
  const pageUrl = page.url();
  const pageTitle = await page.title().catch(() => 'unknown');
  console.log(`  Page URL: ${pageUrl}`);
  console.log(`  Page title: ${pageTitle}`);
  const pageContent = await page.content().catch(() => '');
  console.log(`  Page content length: ${pageContent.length}`);
  console.log(`  Has login form: ${pageContent.includes('login') || pageContent.includes('Login')}`);
  await page.screenshot({ path: 'screenshot-01-page.png', timeout: 60000 }).catch(() => console.log('  Screenshot failed'));
  console.log('  Step 1 complete');

  // Step 2: Login (we're already on the login page)
  console.log('Step 2: Logging in...');
  await page.waitForSelector('input[name="username"], input[name="email"], input[type="text"], input[name="user"]', { timeout: 10000 });
  await page.fill('input[name="username"], input[name="email"], input[type="text"], input[name="user"]', brisnetUser);
  await page.fill('input[name="password"], input[type="password"]', brisnetPass);
  await page.screenshot({ path: 'screenshot-02-pre-login.png' });
  await page.click('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In"), button:has-text("Log In")');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'screenshot-03-logged-in.png' });
  console.log('  Logged in');

  // Step 3: Navigate to PP Data Files
  console.log('Step 3: Navigating to PP Data Files...');
  await page.click('a:has-text("PP Data"), a[href*="ppdata"], a[href*="pp-data"]');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot-03-pp-page.png' });
  console.log('  PP Data page loaded');

  // Step 4: Select date and tracks
  console.log(`Step 4: Selecting date ${raceDate} and tracks...`);
  // Date selection depends on Brisnet's UI — may need to adjust selectors
  for (const track of tracks) {
    try {
      await page.click(`input[value="${track}"], label:has-text("${track}"), td:has-text("${track}")`);
      console.log(`  Selected: ${track}`);
    } catch (e) {
      console.log(`  Could not select ${track}: ${e.message}`);
    }
  }
  await page.screenshot({ path: 'screenshot-04-tracks-selected.png' });

  // Step 5: Add to cart
  console.log('Step 5: Adding to cart...');
  await page.click('button:has-text("Add to Cart"), input[value*="Cart"], a:has-text("Add to Cart")');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot-05-cart.png' });
  console.log('  Cart loaded');

  // Step 6: Screenshot cart for approval
  const cartScreenshot = await page.screenshot({ encoding: 'base64' });
  console.log('  Cart screenshot captured');

  // Store cart screenshot in Apify dataset for Street Boss to retrieve
  await Actor.pushData({
    status: 'cart_ready',
    date: raceDate,
    tracks,
    cartScreenshot,
    message: `Cart loaded with ${tracks.length} tracks for ${raceDate}. Awaiting approval.`
  });

  if (dryRun) {
    console.log('DRY RUN — stopping before checkout. Cart screenshot saved.');
  } else {
    // Step 7: Checkout
    console.log('Step 6: Checking out...');
    await page.click('button:has-text("Checkout"), a:has-text("Checkout"), input[value*="Checkout"]');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshot-06-checkout.png' });

    // Step 8: Download files
    console.log('Step 7: Downloading files...');
    // After checkout, Brisnet typically shows download links
    // This will need adjustment based on actual UI
    const downloads = [];
    const downloadLinks = await page.$$('a[href*=".zip"], a[href*=".DRF"], a:has-text("Download")');
    for (const link of downloadLinks) {
      const href = await link.getAttribute('href');
      if (href) downloads.push(href);
    }

    await Actor.pushData({
      status: 'purchased',
      date: raceDate,
      tracks,
      downloads,
      message: `Purchased ${tracks.length} tracks. ${downloads.length} files ready.`
    });

    // Step 9: POST files to Street Boss (if callback URL provided)
    if (callbackUrl && downloads.length > 0) {
      console.log(`Step 8: Posting files to ${callbackUrl}...`);
      // Download each file and POST to Street Boss
      for (const url of downloads) {
        const response = await page.request.get(url);
        const buffer = await response.body();
        await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': url.split('/').pop() },
          body: buffer
        });
        console.log(`  Uploaded: ${url.split('/').pop()}`);
      }
    }
  }

} catch (error) {
  console.error('Error:', error.message);
  await page.screenshot({ path: 'screenshot-error.png' });
  await Actor.pushData({
    status: 'error',
    error: error.message,
    date: raceDate,
    tracks
  });
} finally {
  await browser.close();
}

await Actor.exit();

// One-time login helper. Opens the agent's DEDICATED Chrome profile to the
// Brisnet login page and waits for you to log in by hand. Once you're logged in,
// the session persists in ./chrome-profile and every future agent run reuses it.
//
// Run:  node setup-login.mjs
import { chromium } from 'playwright';

const PROFILE_DIR = new URL('./chrome-profile', import.meta.url).pathname;
const MAX_WAIT_MS = 5 * 60 * 1000; // 5 minutes to finish logging in

const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1280, height: 900 },
  args: ['--disable-blink-features=AutomationControlled', '--no-first-run', '--no-default-browser-check', '--hide-crash-restore-bubble'],
});
await context.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });

// Tab 1: where YOU log in. We never touch or close this until we're sure.
const page = context.pages()[0] || await context.newPage();
await page.goto('https://www.brisnet.com/product/login', { waitUntil: 'domcontentloaded', timeout: 60000 });

// Tab 2: a hidden checker. We reload the data-files page here on a timer and read
// the account bar. Logged-in state is authoritative: the bar drops the "Login"
// link once you're authenticated (cookies are shared across tabs).
const checker = await context.newPage();

console.log('==============================================================');
console.log(' Please LOG IN to Brisnet in the FIRST Chrome window/tab.');
console.log(' Leave it open — I will detect login automatically and save it.');
console.log('==============================================================');

const start = Date.now();
let loggedIn = false;
let consecutive = 0;
while (Date.now() - start < MAX_WAIT_MS && !loggedIn) {
  await page.waitForTimeout(6000);
  try {
    await checker.goto('https://www.brisnet.com/product/data-files/DRS', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await checker.waitForTimeout(1500);
    const stillOut = await checker.evaluate(() => /\bLogin\b/.test(document.body.innerText.slice(0, 700)));
    if (!stillOut) { consecutive++; } else { consecutive = 0; }
    // Require two consecutive authenticated reads so a transient state can't fool us.
    if (consecutive >= 2) loggedIn = true;
  } catch { /* mid-navigation; try again next tick */ }
}

if (loggedIn) {
  await context.storageState({ path: 'brisnet-auth.json' });
  console.log('✅ Logged in — session saved to chrome-profile (+ brisnet-auth.json backup). Future runs will reuse it.');
} else {
  console.log('❌ Timed out waiting for login (5 min). Re-run: node setup-login.mjs');
}

await context.close();

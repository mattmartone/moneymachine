// Opens the agent's dedicated-profile Chrome to Brisnet login and HOLDS it open
// (never auto-closes). A background checker tab reports login state to the log
// every few seconds, and saves the session automatically once you're logged in.
import { chromium } from 'playwright';

const PROFILE_DIR = '/Users/mattmartone/Projects/moneymachine/associate/chrome-profile';
const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1280, height: 900 },
  args: ['--disable-blink-features=AutomationControlled', '--no-first-run', '--no-default-browser-check', '--hide-crash-restore-bubble'],
});
await context.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });

const page = context.pages()[0] || await context.newPage();
await page.goto('https://www.brisnet.com/product/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
const checker = await context.newPage();

console.log('LOGIN WINDOW OPEN. Log in on the first tab. Monitoring status...');

let saved = false;
let consecutive = 0;
const log = (m) => console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`);

// eslint-disable-next-line no-constant-condition
while (true) {
  await new Promise(r => setTimeout(r, 6000));
  try {
    await checker.goto('https://www.brisnet.com/product/data-files/DRS', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await checker.waitForTimeout(1500);
    const state = await checker.evaluate(() => {
      const bar = document.body.innerText.slice(0, 700);
      return { loggedOut: /\bLogin\b/.test(bar), hasForm: !!document.querySelector('input[name="password"]') };
    });
    if (!state.loggedOut) {
      consecutive++;
      log(`looks LOGGED IN (${consecutive}/2 confirmations)`);
      if (consecutive >= 2 && !saved) {
        await context.storageState({ path: 'brisnet-auth.json' });
        saved = true;
        log('✅ SESSION SAVED. You can stop now — Claude will take over.');
      }
    } else {
      consecutive = 0;
      log('still logged OUT (waiting for you to log in on the first tab)');
    }
  } catch (e) {
    log('check skipped: ' + e.message.split('\n')[0]);
  }
}

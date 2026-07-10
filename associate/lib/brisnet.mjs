import { chromium } from 'playwright';
import { notify, notifyImage, requestApproval, waitForApproval, replyInThread, react } from './notify.mjs';
import { query } from './db.mjs';

const PROFILE_DIR = new URL('../chrome-profile', import.meta.url).pathname;

// Resolve a track code (e.g. "GP") to the full name the Brisnet grid displays
// (e.g. "Gulfstream Park"), via track_aliases. Falls back to the input so a full
// name also works.
async function resolveTrackName(codeOrName) {
  const rows = await query('SELECT canonical_name FROM track_aliases WHERE alias = $1 LIMIT 1', [codeOrName]);
  return rows[0]?.canonical_name || codeOrName;
}

// Column 0 of the grid is "today" (Brisnet ET calendar); each further column is
// the next day. Map a YYYY-MM-DD target date to its column index.
function columnIndexForDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d, 12);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return Math.round((target - today) / 86400000);
}

async function isLoggedIn(page) {
  return page.evaluate(() => !/\bLogin\b/.test(document.body.innerText.slice(0, 700)));
}

async function cartCount(page) {
  return page.evaluate(() => {
    const m = document.body.innerText.match(/My Products\s*(\d+)/i);
    return m ? parseInt(m[1]) : null;
  });
}

// Automated login (works with the real credentials). The persistent profile
// usually keeps us logged in, so this only runs when the session has expired.
async function ensureLoggedIn(page) {
  await page.goto('https://www.brisnet.com/product/data-files/DRS', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  if (await isLoggedIn(page)) return true;

  const user = process.env.BRISNET_USER, pass = process.env.BRISNET_PASS;
  if (!user || !pass) throw new Error('Session expired and BRISNET_USER/BRISNET_PASS not set for re-login');
  await page.goto('https://www.brisnet.com/product/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[name="username"]', { timeout: 20000 });
  await page.fill('input[name="username"]', user);
  await page.fill('input[name="password"]', pass);
  await page.waitForTimeout(500);
  await Promise.all([
    page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {}),
    page.click('button:has-text("Login"), input[type="submit"], button[type="submit"]'),
  ]);
  await page.waitForTimeout(4000);
  await page.goto('https://www.brisnet.com/product/data-files/DRS', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  return isLoggedIn(page);
}

export async function buyBrisnet(tracks, date) {
  const autoApprove = process.env.AUTO_APPROVE === 'true';
  const col = columnIndexForDate(date);

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled', '--no-first-run', '--no-default-browser-check', '--hide-crash-restore-bubble'],
  });
  await context.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });
  const page = context.pages()[0] || await context.newPage();

  try {
    await notify(`Checking in. Task: buy ${tracks.join(', ')} for ${date}`);

    if (!(await ensureLoggedIn(page))) {
      await context.close();
      await notify('❌ Brisnet login failed / session could not be established.');
      return { status: 'error', error: 'login_failed', tracks, date };
    }
    await notify('✅ Logged into Brisnet.');

    if (col < 0) {
      await context.close();
      await notify(`❌ Date ${date} is in the past relative to the grid (column ${col}).`);
      return { status: 'error', error: `date_unavailable:${date}`, tracks, date };
    }

    await page.waitForSelector('.track.table-row', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Add each track's date-column card. The Angular grid re-renders constantly,
    // so a normal Playwright click times out — dispatch the DOM click in-page.
    const added = [], missed = [];
    for (const code of tracks) {
      const fullName = await resolveTrackName(code);
      const before = await cartCount(page);
      const result = await page.evaluate(({ name, c }) => {
        const rows = [...document.querySelectorAll('.track.table-row')];
        const r = rows.find(x => x.querySelector('.track-name')?.innerText?.trim() === name);
        if (!r) return 'no-row';
        const cells = [...r.querySelectorAll('div[data-ng-click^="buttonAction"]')];
        const cell = cells[c];
        if (!cell) return 'no-cell';
        const cls = cell.className || '';
        const icon = cell.querySelector('.bris-icon')?.className || '';
        if (/in-cart/.test(cls)) return 'already-in-cart';
        if (/disabled/.test(cls) || !/shopping-cart-add/.test(icon)) return 'not-available';
        cell.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        return 'clicked';
      }, { name: fullName, c: col });
      await page.waitForTimeout(2200);
      const after = await cartCount(page);
      if (result === 'clicked' && after > before) { added.push(code); console.log(`  added ${code} (${fullName})`); }
      else if (result === 'already-in-cart') { added.push(code); }
      else { missed.push(`${code}:${result}`); console.log(`  missed ${code} (${fullName}): ${result}`); }
    }

    if (!added.length) {
      await context.close();
      await notify(`❌ No cards added for ${date}. ${missed.join(', ')}`);
      return { status: 'error', error: 'no_tracks_added', tracks, date, missed };
    }

    // Open the cart / checkout page and screenshot it for approval.
    await page.goto('https://www.brisnet.com/product/checkout', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);
    const shotPath = `screenshots/cart-${date}.png`;
    await page.screenshot({ path: shotPath, fullPage: true });
    const total = await page.evaluate(() => (document.body.innerText.match(/Total.*?\$[\d.]+/is) || [''])[0].replace(/\s+/g, ' ').slice(0, 60));

    const summary = `${added.length} card(s) for ${date}: ${added.join(', ')}${missed.length ? ` (missed: ${missed.join(', ')})` : ''}. ${total}`;

    if (!autoApprove) {
      // Ask for approval in Slack and WAIT for a ✅/❌ reaction.
      const handle = await requestApproval(shotPath, `🛒 *Cart ready for ${date}* — ${summary}\nReact ✅ to APPROVE or ❌ to REJECT.`);
      const decision = await waitForApproval(handle, { timeoutMs: 180000, pollMs: 5000 });

      if (decision === 'rejected') {
        await react(handle, 'no_entry');
        await replyInThread(handle, '🚫 Rejected — no purchase made. Cart left as-is.');
        await context.close();
        return { status: 'rejected', screenshot: shotPath, tracks: added, missed, date };
      }
      if (decision !== 'approved') {
        await replyInThread(handle, '⌛ Approval timed out — no purchase made. Cart left as-is.');
        await context.close();
        return { status: 'awaiting_approval', screenshot: shotPath, tracks: added, missed, date };
      }

      // Acknowledge the approval in-thread (+ a "got it" reaction) — proof received.
      const at = new Date().toISOString().slice(11, 19);
      await react(handle, 'saluting_face');
      const submitting = process.env.SUBMIT_ON_APPROVAL === 'true';
      await replyInThread(handle, submitting
        ? `✅ Got it — approval received at ${at}Z. Submitting order...`
        : `✅ Got it — approval received at ${at}Z. (Test mode: order not submitted; set SUBMIT_ON_APPROVAL=true to purchase.)`);

      if (!submitting) {
        await context.close();
        return { status: 'approved', approved: true, screenshot: shotPath, tracks: added, missed, date };
      }
    } else {
      await notifyImage(shotPath, `🛒 Cart ready (auto-approve) — ${summary}`);
    }

    // Approved path: submit the order.
    await notify('💳 Submitting order...');
    await page.click('button:has-text("Submit Order"), input[value*="Submit" i]', { timeout: 15000 });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: `screenshots/order-${date}.png`, fullPage: true });

    // Download purchased files from My Products.
    await page.goto('https://www.brisnet.com/product/my-products', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);
    const downloadDir = `downloads/${date}`;
    const { mkdirSync } = await import('fs');
    mkdirSync(downloadDir, { recursive: true });
    const links = await page.$$('a[href*=".zip"], a[href*=".DRF"], a:has-text("Download")');
    const files = [];
    for (const link of links) {
      try {
        const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), link.click()]);
        const p = `${downloadDir}/${dl.suggestedFilename()}`;
        await dl.saveAs(p); files.push(p); console.log(`  downloaded ${p}`);
      } catch (e) { console.log('  download skipped:', e.message.split('\n')[0]); }
    }

    await notify(`✅ Order submitted. ${files.length} files downloaded for ${date}.`);
    await context.close();
    return { status: 'complete', files, tracks: added, missed, date };

  } catch (error) {
    await page.screenshot({ path: `screenshots/error-${date}.png` }).catch(() => {});
    await context.close();
    await notify(`❌ Error: ${error.message.split('\n')[0]}`);
    return { status: 'error', error: error.message, tracks, date };
  }
}

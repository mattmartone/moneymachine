# The Associate — Progress & Next Steps

_Last updated: 2026-07-09_

## What works today (verified end-to-end)

- **Setup:** `npm install` + `npx playwright install chromium` done. Runs on Node 25 via `node --env-file=.env index.mjs`.
- **Login:** Automated Brisnet login works with the correct password. Root cause of earlier failures was a **wrong password** (`netDiablo!23`), since reset to the correct one. Not a bot-detection issue.
- **Session:** A dedicated logged-in Chrome profile lives in `associate/chrome-profile/` (gitignored). `brisnet.mjs` reuses it and auto-re-logs-in with `BRISNET_USER`/`BRISNET_PASS` if the session expires.
- **Add to cart:** Brisnet's data-files page is an AngularJS grid (rows = full track names, columns = dates). The grid re-renders constantly, so normal Playwright clicks time out — we add cards via in-page `dispatchEvent('click')` on `div[data-ng-click^="buttonAction"]` at the target date column. Track code→full name via the `track_aliases` table.
- **Cart screenshot:** Navigates to `/product/checkout`, screenshots the order summary.
- **Slack image:** `notifyImage()` uploads the PNG via the bot token (files.getUploadURLExternal → PUT → completeUploadExternal).
- **Interactive approval (verified):** `requestApproval()` posts the cart + a ✅/❌ prompt (seeds the reactions); `waitForApproval()` polls `reactions.get` until a *real user* reacts. On ✅ the agent acknowledges **in-thread** (`replyInThread`) + adds a 🫡 reaction (`react`). On ❌ / timeout it backs out.
- **Full pipeline (verified):** `index.mjs` polls `agent_tasks`, picks up a `buy_brisnet` task, runs the whole flow, and stops at the approval gate.

## Config / infra

- **Slack app:** "FTC Pipeline", bot `ftc_pipeline`, channel `C0BAZ95022V` (Martone Family Business workspace).
- **Bot scopes:** `files:write`, `chat:write`, `reactions:read`, `reactions:write`.
- **Secrets** live in `associate/.env` (gitignored): DB URL, `BRISNET_USER`/`BRISNET_PASS`, `SLACK_WEBHOOK_URL`, `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`.
- **Safety flag:** `SUBMIT_ON_APPROVAL=false` — approval is proven WITHOUT spending money; set `true` to actually purchase on ✅.

## Loose ends to clean up

- **Test cart:** 3 cards (BTP/CBY/CT for 07/09) may still sit in the Brisnet cart, unpurchased.
- **Test task:** row `id=1` in `agent_tasks` is from testing (status `awaiting_approval`) — clean up.

## Always-on setup (installed 2026-07-09 eve)

- **`watch-thread.mjs`** rewritten with **auto date-rollover**: each poll it computes the local date, `ensureDayThread(date)` (posts the day root the first time → this is the midnight rollover), and ingests new files. Errors never crash the loop.
- **Persistent dedup:** `ingested_files` table (keyed by Slack file id) so restarts/reboots never re-parse or double-post. In-memory `seen` is just a fast-path.
- **LaunchAgent installed & running:** `deploy/com.ftc.associate.plist` → copied to `~/Library/LaunchAgents/com.ftc.associate.plist`, loaded via `launchctl bootstrap gui/$(id -u)`. `RunAtLoad` + `KeepAlive` + `ThrottleInterval 30`. Logs to `associate/logs/`.
  - Manage: `launchctl kickstart -k gui/$(id -u)/com.ftc.associate` (restart), `launchctl bootout gui/$(id -u)/com.ftc.associate` (stop/unload).
- **REQUIRED machine settings (user to apply on the Mini):**
  - `sudo pmset -a sleep 0 disksleep 0 womp 1` (never sleep, wake for network)
  - `sudo pmset -a autorestart 1` (power back on after a power failure)
  - Enable **auto-login** (System Settings → Users & Groups) so the LaunchAgent reloads after reboot. Requires **FileVault OFF**.
  - Note: LaunchAgents only run while the user is logged in. If you'd rather not enable auto-login, convert to a **LaunchDaemon** (the watcher needs no GUI/browser, so it can run at boot without login).

## Next steps (pick up here)

1. **Full integrated run of the NEW threaded approval** — we proved the approval loop in isolation and the full browser pipeline separately; do one run of `index.mjs` end-to-end that exercises the in-thread ack (browser → cart → Slack ✅ → thread reply).
2. **Buy the RIGHT date** — real use is buying *tomorrow's* card the night before. Verify the date→column mapping for future dates and around midnight (grid "today" is Brisnet ET; we compute the offset from local date).
3. **Purchase + download path (untested)** — with `SUBMIT_ON_APPROVAL=true`: verify the Submit Order click, My Products download links, and DRF parsing into Supabase actually work.
4. **Reconcile `checkApproved()`** — `index.mjs` still has the old "poll DB for status='approved'" flow. Approval now happens inline via Slack reactions inside `buyBrisnet`. Decide whether `checkApproved()` is still needed or should be removed/aligned.
5. **Headless vs headful for the Mac Mini** — currently `headless:false` + real Chrome channel. Decide the production mode and set up the LaunchAgent (`com.ftc.associate.plist`) for always-on.
6. **Robustness** — retries/timeouts on the browser steps, clearer error notifications, and handling of tracks that don't run on a given date.
7. **Manual/Slack-thread ingest path (NEW — built, needs scopes + test)** — Alternative to the browser purchase: the user buys on Brisnet from their phone, downloads the `.DRF` files, and uploads them into that **day's Slack thread**. The Associate watches the thread, downloads the files, and parses them into Supabase.
   - Code: `lib/slack_ingest.mjs` (`ensureDayThread`, `listThreadFiles`, `ingestThreadFiles`) + `watch-thread.mjs` runner. New table `day_threads(date, thread_ts, channel_id)`.
   - **Needs bot scopes:** `channels:history` (+ `groups:history` if channel is private), `files:read`. Reinstall.
   - **Test:** `node --env-file=.env watch-thread.mjs 2026-07-09`, then upload a `.DRF`/`.zip` into the day thread and confirm it parses + replies in-thread.
   - **Vision: the entire day lives in ONE thread** — cart approvals AND file uploads. Follow-up: route `requestApproval`/notifications into the day thread (currently top-level) so everything is threaded under the day root.

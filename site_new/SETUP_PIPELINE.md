# Race Day Pipeline — Setup & Operation Guide

## What Was Built

A unified cron (`/api/cron/race-day-pipeline`) that runs every 5 minutes on Vercel and handles the full race day lifecycle for Commission picks:

| Timing | Action |
|--------|--------|
| T-60 min | Pull live odds from Racing API |
| T-50 min | Check scratches, classify CONSEQUENTIAL/NON-CONSEQUENTIAL, rebuild box if needed |
| T-35 min | Send pre-race email to all members (odds, scratches, bet card) |
| T+15 min | Pull results, settle bets, log outcome |
| First run of day | Morning plan Slack notification |
| All races done | End-of-day summary |

Everything is driven by `post_time` in the database. No hardcoded race lists.

---

## Setup Steps (One-Time)

### 1. Set Vercel Environment Variables

Go to: Vercel Dashboard → moneymachine project → Settings → Environment Variables

Add or verify these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `POSTGRES_URL` | *(already set)* | Supabase connection string |
| `JWT_SECRET` | *(already set)* | For site auth |
| `RESEND_API_KEY` | *(org64.com Resend key — see memory reference)* | Email delivery |
| `CRON_SECRET` | *(already set — check current value)* | Auth for cron endpoint |
| `SLACK_WEBHOOK_URL` | *(see step 2)* | For Slack notifications |
| `RACING_API_USER` | *(Racing API basic auth username)* | Racing API auth |
| `RACING_API_PASS` | *(Racing API basic auth password)* | Racing API auth |
| `CLAUDE_API_KEY` | *(Matt's personal Anthropic API key — stored in 1Password)* | For Phase 2 (autonomous analysis) |

### 2. Create Slack Incoming Webhook

1. Go to: https://api.slack.com/apps (sign into your workspace)
2. Create New App → From Scratch → Name: "FTC Pipeline" → Select workspace
3. Go to "Incoming Webhooks" → Activate
4. Click "Add New Webhook to Workspace"
5. Select the channel where you want notifications (create a `#ftc-pipeline` channel or use an existing one)
6. Copy the webhook URL (looks like `https://hooks.slack.com/services/T.../B.../xxx`)
7. Add to Vercel env vars as `SLACK_WEBHOOK_URL`

### 3. Verify Vercel Pro (for 5-min cron)

Free Vercel tier only allows daily crons. The `*/5 * * * *` schedule requires Vercel Pro ($20/mo). Check your plan:
- Vercel Dashboard → Settings → Billing
- If on Free: cron will run once/day (not useful). Upgrade to Pro.
- If on Pro: cron runs every 5 minutes automatically.

### 4. Redeploy

After setting env vars, trigger a redeploy:
- Push any commit, OR
- Vercel Dashboard → Deployments → "..." → Redeploy

---

## How It Works (Race Day)

### Pre-Race Day (Wednesday)

1. Purchase Brisnet .DRF files for weekend tracks
2. Run: `node parse_drf_full.mjs ~/Downloads/SAR0621.DRF`
3. Run: `node pull_racing_api.mjs 2026-06-21` (pulls fields + POST TIMES from Racing API)
4. Verify post times populated: check the Today page or run:
   ```
   node db_query.mjs "SELECT track, race_number, post_time FROM races WHERE date = '2026-06-21' ORDER BY track, race_number"
   ```

### Race Day (Automated)

The pipeline handles everything once bets are in the DB with `conviction IS NOT NULL`.

**What you'll see on Slack:**
- `🏇 Today's card: 7 Commission picks across 3 tracks. First post: 2:52 PM ET.`
- `⚠️ Monmouth R5: Scratch: PP2 Cactus. NON-CONSEQUENTIAL. Win pick #5 Lord Berrier unaffected.`
- `📬 Monmouth R5: Pre-race email sent to members.`
- `✅ Monmouth R5: Results: PP1-PP6-PP5. EXACTA HIT. TRIFECTA HIT.`
- `🏁 Day complete. 7 Commission races settled. Total wagered: $1,411.60.`

**What members see:**
- Pre-race email ~35 min before post (odds, scratches, bet card)
- Results on the Today page updating automatically
- Activity tab on each race detail page

### If Post Times Are Missing

Pipeline will Slack you: `🚨 BLOCKED: 3 race(s) missing post times: BEL R3, R5, R7.`

Fix: re-run `node pull_racing_api.mjs 2026-06-21` (now reads `post_time_long` from API) or enter manually on the /races admin page.

---

## Testing

### Manual trigger (curl):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://fadethechalk.vercel.app/api/cron/race-day-pipeline
```

This will run one cycle of the pipeline and return JSON showing what actions were taken.

### Verify locally:

```bash
# Check today's Commission races
node db_query.mjs "SELECT r.track, r.race_number, r.post_time FROM races r JOIN bets b ON b.race_id = r.id WHERE r.date = CURRENT_DATE AND b.conviction IS NOT NULL"

# Check pipeline events for today
node db_query.mjs "SELECT event_type, message, created_at FROM pipeline_events WHERE date = CURRENT_DATE ORDER BY created_at"
```

---

## What's NOT Automated Yet (Phase 2)

- Full Phase 1-5 race analysis (still done via Claude Code session)
- Conversational Slack interaction (pipeline is one-way notifications only)
- Bet insertion (still done in the Claude Code analysis session)
- Post-mortem generation

These require Claude API integration, which is staged for Phase 2 (API key is set, architecture is ready).

---

## Rollback

If the pipeline causes issues:

1. **Disable cron:** In Vercel Dashboard → Settings → Crons → disable, OR change `vercel.json` schedule to a far-future date
2. **Revert to old scratch monitor:** `git revert HEAD` and push
3. **Old files still exist:** `api/cron/scratch-monitor.ts` and `api/cron/odds-monitor.ts` are still in the repo (not deleted). Re-enable by updating `vercel.json` back to the old path.

---

## Files Changed

| File | Change |
|------|--------|
| `api/cron/race-day-pipeline.ts` | NEW — the unified pipeline cron |
| `api/lab/activity.ts` | NEW — activity feed API endpoint |
| `src/pages/RaceDetail.tsx` | MODIFIED — added ACTIVITY tab |
| `vercel.json` | MODIFIED — cron points to new pipeline |
| `pull_racing_api.mjs` | MODIFIED — reads `post_time_long` for post times |
| `ARCHITECTURE.md` | NEW — full architecture documentation |
| `ARCHITECTURE_CURRENT_0615.md` | NEW — current state snapshot |
| `ARCHITECTURE_NEAR_FUTURE_0615.md` | NEW — agentic system design |

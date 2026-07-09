# The Associate — Local Browser Agent

Runs on the Mac Mini. Polls Supabase for tasks from Street Boss, executes them using a real browser (Playwright), and reports back.

## Setup (on Mac Mini)

```bash
cd associate
cp .env.example .env
# Edit .env with your Brisnet credentials

npm install
npx playwright install chromium

# Test run:
node index.mjs
```

## How It Works

1. Associate polls `agent_tasks` table every 5 minutes
2. When Street Boss posts a task (e.g. `buy_brisnet`), Associate picks it up
3. Opens real Chrome, logs into Brisnet, buys tracks, downloads files
4. Parses .DRF files into Supabase
5. Marks task complete, notifies Slack

## Run as LaunchAgent (always on)

Create `~/Library/LaunchAgents/com.ftc.associate.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.ftc.associate</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/Users/matt/associate/index.mjs</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/Users/matt/associate</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/Users/matt/associate/logs/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/matt/associate/logs/stderr.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
```

Then:
```bash
mkdir -p ~/associate/logs
launchctl load ~/Library/LaunchAgents/com.ftc.associate.plist
```

## Task Types

| Type | Payload | What It Does |
|------|---------|-------------|
| `buy_brisnet` | `{ tracks: ["SAR","GP"], date: "2026-07-08" }` | Logs into Brisnet, buys tracks, downloads & parses into DB |

## Task Status Flow

```
pending → in_progress → awaiting_approval → approved → in_progress → complete
                      → error
```

## Approval Flow

- If `AUTO_APPROVE=true` in .env: buys immediately after cart screenshot
- If `AUTO_APPROVE=false`: posts screenshot to Slack, waits for status to be set to `approved`

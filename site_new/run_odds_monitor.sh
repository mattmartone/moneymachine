#!/bin/bash
cd /Users/matt.martone/Documents/Projects/capo/money_machine/site_new
HOUR=$(date +%H)
if [ "$HOUR" -ge 10 ] && [ "$HOUR" -lt 22 ]; then
  node odds_monitor.mjs >> /tmp/ftc_odds_monitor.log 2>&1
fi

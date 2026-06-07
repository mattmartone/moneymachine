#!/bin/bash
# Publish a report PDF to Fade the Chalk
# Usage: ./scripts/publish-report.sh <pdf-path> <title> <track> <date> [races_analyzed] [summary]

PDF_PATH="$1"
TITLE="$2"
TRACK="$3"
DATE="$4"
RACES="${5:-1}"
SUMMARY="$6"

if [ -z "$PDF_PATH" ] || [ -z "$TITLE" ] || [ -z "$TRACK" ] || [ -z "$DATE" ]; then
  echo "Usage: ./scripts/publish-report.sh <pdf-path> <title> <track> <date> [races] [summary]"
  exit 1
fi

FILENAME=$(basename "$PDF_PATH")
FILEDATA=$(base64 -i "$PDF_PATH")

SITE_URL="${FTC_URL:-https://fadethechalk.vercel.app}"
ADMIN_SECRET="${ADMIN_SECRET:-ftc-admin}"

echo "Publishing: $TITLE ($TRACK, $DATE)"
echo "File: $FILENAME ($(wc -c < "$PDF_PATH" | tr -d ' ') bytes)"
echo "Target: $SITE_URL"

curl -s -X POST "$SITE_URL/api/reports/publish" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg title "$TITLE" \
    --arg track "$TRACK" \
    --arg date "$DATE" \
    --argjson races "$RACES" \
    --arg summary "$SUMMARY" \
    --arg filename "$FILENAME" \
    --arg fileData "$FILEDATA" \
    '{title: $title, track: $track, date: $date, races_analyzed: $races, summary: $summary, filename: $filename, fileData: $fileData}'
  )" | jq .

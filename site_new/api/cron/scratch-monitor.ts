import { query } from '../db.js';

const API_USER = 'DPoVaGs2XRopMmiHUcJDkHtC';
const API_PASS = 'YQJDPUITg7LCEP0Ascpu5t1S';
const BASE_URL = 'https://api.theracingapi.com/v1/north-america';
const RESEND_KEY = 're_L3cnNm7K_6Fu7rVh8Num5gULJemTdoK9y';

const MEET_IDS: Record<string, string> = {
  BAQ: 'BAQ_1781395200000',
  GP: 'GP_1781395200000',
  LRL: 'LRL_1781395200000',
  MTH: 'MTH_1781395200000',
  SA: 'SA_1781395200000',
};

interface WatchedRace {
  track_api: string;
  track_name: string;
  race_number: number;
  product: string;
  favorite: string;
  win_pick: string;
  box: string[];
  post_time_et?: string;
}

const WATCHED_RACES: WatchedRace[] = [
  // Commission Picks (with estimated post times ET)
  { track_api: 'LRL', track_name: 'Laurel', race_number: 3, product: 'Commission Pick 1', favorite: 'BIG TANKNESS', win_pick: 'BUSHIDO', box: ['BUSHIDO', 'TALENTED MAN', 'BIG TANKNESS', 'CACTUS'], post_time_et: '13:25' },
  { track_api: 'BAQ', track_name: 'Belmont', race_number: 7, product: 'Commission Pick 2', favorite: "MOMENT'S NOTICE", win_pick: 'MOMENTUM FILES', box: ['MOMENTUM FILES', 'SALMING', "TOGA D'ORO", "MOMENT'S NOTICE"], post_time_et: '15:56' },
  { track_api: 'BAQ', track_name: 'Belmont', race_number: 5, product: 'Commission Pick 3', favorite: 'HARD CIRCLE', win_pick: 'HONG KONG PHOOEY', box: ['HARD CIRCLE', 'HONG KONG PHOOEY', 'TAKE A STANCE', 'RAGING SEA CAPTAIN'], post_time_et: '14:52' },
  { track_api: 'LRL', track_name: 'Laurel', race_number: 7, product: 'Commission Pick 4', favorite: 'ONLY FOR NOW', win_pick: 'NICHE', box: ['NICHE', 'JUST PHILTORED', 'GERRARDS CROSS', 'THE TOWN TEMPTER'], post_time_et: '15:25' },
  { track_api: 'BAQ', track_name: 'Belmont', race_number: 9, product: 'Commission Pick 5', favorite: 'OCEAN ATLANTIQUE', win_pick: 'FROSTED OVER', box: ['FROSTED OVER', 'DETERMINEDLY', 'PRESIDER', 'BRIGADIER GENERAL'], post_time_et: '16:56' },
  { track_api: 'GP', track_name: 'Gulfstream', race_number: 8, product: 'Commission Pick 6', favorite: 'GREAT VENEZUELA', win_pick: 'VINDICATE CHA CHA', box: ['VINDICATE CHA CHA', 'TIFFANY GOLD', "TREE C'S KAI", 'JOKES UP'], post_time_et: '15:47' },
  { track_api: 'BAQ', track_name: 'Belmont', race_number: 3, product: 'Commission Pick 7', favorite: 'EGYPTIAN', win_pick: 'DROP ME A DIME', box: ['DROP ME A DIME', 'EGYPTIAN', 'SOLO JIM', 'FIRST PITCH'], post_time_et: '13:56' },
  // Monmouth Park Race Day
  { track_api: 'MTH', track_name: 'Monmouth', race_number: 5, product: 'MTH Race Day', favorite: 'GROUCH', win_pick: 'LORD BERRIER', box: ['GROUCH', 'NATURAL HARBOR', 'LORD BERRIER', "CHARLIE'S EXPRESS"] },
  { track_api: 'MTH', track_name: 'Monmouth', race_number: 6, product: 'MTH Race Day', favorite: 'SINGALONG KAYLA', win_pick: 'CELESTIAL EXPRESS', box: ['CELESTIAL EXPRESS', 'SINGALONG KAYLA', 'PRINCESS GLADYS', "POSTINO'S PROPHECY"] },
  { track_api: 'MTH', track_name: 'Monmouth', race_number: 7, product: 'MTH Race Day', favorite: "ELSIE'S SMILE", win_pick: "CASSIE'S VAULT", box: ["CASSIE'S VAULT", 'TOASTTOTHESTONES', 'LADY KHOZ', "ELSIE'S SMILE"] },
  { track_api: 'MTH', track_name: 'Monmouth', race_number: 8, product: 'MTH Race Day', favorite: 'MAGNETO', win_pick: 'FIRST NAVY JACK', box: ['FIRST NAVY JACK', 'CHAOS COMIN', 'REDEMPTION SPEIGHT', "JOEVIA'S FIRST", 'MAGNETO'] },
  // Santa Anita Race Day Pass
  { track_api: 'SA', track_name: 'Santa Anita', race_number: 4, product: 'SA Race Day', favorite: 'CLEVER CLOVER', win_pick: 'DES DOIGTS', box: ['CLEVER CLOVER', 'DES DOIGTS', 'ZOMBO BOMBO', 'ONE SMOKIN DUDE'] },
  { track_api: 'SA', track_name: 'Santa Anita', race_number: 5, product: 'SA Race Day', favorite: "CAN'T SLEEP", win_pick: 'TAHINI', box: ['TAHINI', 'IMABOUTAGO', 'YOUNG LOVE', 'KUWAITYA', "CAN'T SLEEP"] },
  { track_api: 'SA', track_name: 'Santa Anita', race_number: 9, product: 'SA Race Day', favorite: 'GOLD PHOENIX', win_pick: 'POOR CONNECTION', box: ['POOR CONNECTION', 'AMERICAN HOPE', 'LIVING LIFE', 'RIMPROTECTOR', 'GOLD PHOENIX'] },
  { track_api: 'SA', track_name: 'Santa Anita', race_number: 11, product: 'SA Race Day', favorite: 'KIKURIDE', win_pick: 'MARS MAGIC', box: ['NO CAP', 'SHOCKING GREY', 'MARS MAGIC', 'CANTO DELLA TERRA', 'KIKURIDE'] },
  { track_api: 'SA', track_name: 'Santa Anita', race_number: 12, product: 'SA Race Day', favorite: 'KING STEPHEN', win_pick: 'PRIVATE GEM', box: ['SHAMROCK GLITTER', 'PRIVATE GEM', 'THE OLD NINE', 'GOLDEN ALE', 'KING STEPHEN'] },
];

async function apiFetch(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${API_USER}:${API_PASS}`).toString('base64') }
  });
  return res.json();
}

async function sendEmailToAll(subject: string, html: string) {
  const users = await query(`SELECT email FROM users WHERE email IS NOT NULL`);
  const emails = users.rows.map((r: any) => r.email);

  for (const email of emails) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Fade the Chalk <noreply@org64.com>',
        to: [email],
        subject,
        html
      })
    });
  }
}

export default async function handler(req: any, res: any) {
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const etHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getHours();

  if (etHour < 11 || etHour >= 22) {
    return res.status(200).json({ message: 'Outside operating hours (11AM-10PM ET)' });
  }

  const alerts: string[] = [];

  for (const race of WATCHED_RACES) {
    const meetId = MEET_IDS[race.track_api];
    if (!meetId) continue;

    let data: any;
    try {
      data = await apiFetch(`/meets/${meetId}/entries`);
    } catch {
      continue;
    }

    const races = data.races || [];
    const apiRace = races.find((r: any) => parseInt(r.race_key?.race_number) === race.race_number);
    if (!apiRace) continue;

    const scratched = (apiRace.runners || [])
      .filter((r: any) => r.scratch_indicator === 'Y')
      .map((r: any) => (r.horse_name || '').toUpperCase());

    if (scratched.length === 0) continue;

    // Check if any scratched horse is in our box or is the favorite
    for (const scratchName of scratched) {
      const isFave = scratchName === race.favorite;
      const isWinPick = scratchName === race.win_pick;
      const isInBox = race.box.includes(scratchName);

      if (!isFave && !isInBox) continue;

      // Check if we already alerted on this scratch
      const existing = await query(
        `SELECT 1 FROM scratch_alerts WHERE track = $1 AND race_number = $2 AND horse_name = $3 AND date = CURRENT_DATE`,
        [race.track_name, race.race_number, scratchName]
      );
      if (existing.rows.length > 0) continue;

      // Record the alert
      await query(
        `INSERT INTO scratch_alerts (track, race_number, horse_name, date, is_favorite, is_win_pick, is_in_box)
         VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)`,
        [race.track_name, race.race_number, scratchName, isFave, isWinPick, isInBox]
      );

      let impact = '';
      if (isWinPick) {
        impact = '🚨 OUR WIN PICK IS SCRATCHED — NO WIN BET THIS RACE';
      } else if (isFave) {
        impact = '⚠️ FAVORITE SCRATCHED — vulnerability thesis changes, pace map shifts';
      } else if (isInBox) {
        impact = '⚠️ BOX HORSE SCRATCHED — exotic box reduced, consider adjustment';
      }

      alerts.push(
        `<div style="border: 2px solid #c00; padding: 12px; margin-bottom: 12px; font-family: monospace;">
          <h3 style="margin:0; color: #c00;">❌ SCRATCH: ${scratchName}</h3>
          <p style="margin:4px 0;"><strong>${race.track_name} R${race.race_number}</strong> — ${race.product}</p>
          <p style="margin:4px 0;">${impact}</p>
          <p style="margin:4px 0; font-size: 12px; color: #666;">Win pick: ${race.win_pick} | Fave: ${race.favorite}</p>
          <p style="margin:4px 0; font-size: 12px; color: #666;">Box: ${race.box.join(', ')}</p>
        </div>`
      );
    }
  }

  // Pre-race alerts — 45 min before Commission races (only)
  const etNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const currentMinutes = etNow.getHours() * 60 + etNow.getMinutes();

  const commissionRaces = WATCHED_RACES.filter(r => r.product.startsWith('Commission'));
  for (const race of commissionRaces) {
    if (!race.post_time_et) continue;
    const [h, m] = race.post_time_et.split(':').map(Number);
    const postMinutes = h * 60 + m;
    const minutesUntilPost = postMinutes - currentMinutes;

    if (minutesUntilPost >= 35 && minutesUntilPost <= 45) {
      const existing = await query(
        `SELECT 1 FROM scratch_alerts WHERE track = $1 AND race_number = $2 AND horse_name = 'PRE_RACE_ALERT' AND date = CURRENT_DATE`,
        [race.track_name, race.race_number]
      );
      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO scratch_alerts (track, race_number, horse_name, date, is_favorite, is_win_pick, is_in_box)
           VALUES ($1, $2, 'PRE_RACE_ALERT', CURRENT_DATE, false, false, false)`,
          [race.track_name, race.race_number]
        );

        const postFormatted = `${h > 12 ? h - 12 : h}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'} ET`;
        await sendEmailToAll(
          `⏰ ${race.track_name} R${race.race_number} posts in ~45 min — ${race.product}`,
          `<div style="font-family: monospace; padding: 16px; max-width: 600px;">
            <h2 style="color: #000080; margin-bottom: 4px;">⏰ PRE-RACE ALERT</h2>
            <p style="font-size: 18px; font-weight: bold;">${race.track_name} R${race.race_number} — ${race.product}</p>
            <p>Estimated post: <strong>${postFormatted}</strong></p>
            <div style="background: #ffffcc; border: 2px solid #000; padding: 12px; margin: 12px 0;">
              <p style="margin: 0;"><strong>Win pick:</strong> ${race.win_pick}</p>
              <p style="margin: 4px 0;"><strong>Fave:</strong> ${race.favorite}</p>
              <p style="margin: 4px 0;"><strong>Box:</strong> ${race.box.join(', ')}</p>
            </div>
            <p style="color: #666; font-size: 12px;">Check live odds now. Log in to review and adjust if needed.</p>
          </div>`
        );
      }
    }
  }

  if (alerts.length > 0) {
    const timeStr = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
    await sendEmailToAll(
      `🚨 FTC SCRATCH ALERT — ${alerts.length} horse${alerts.length > 1 ? 's' : ''} scratched from today's card`,
      `<div style="font-family: monospace; padding: 16px; max-width: 600px;">
        <h2 style="color: #c00; margin-bottom: 4px;">SCRATCH ALERT</h2>
        <p style="color: #666; margin-top: 0;">${timeStr} ET — Sunday June 14</p>
        ${alerts.join('')}
        <p style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
          The Commission is monitoring all 16 plays for scratches. Alerts fire only when the favorite or a horse in our exotic box is scratched.
        </p>
      </div>`
    );
  }

  return res.status(200).json({
    time: now.toISOString(),
    alerts_sent: alerts.length,
    races_checked: WATCHED_RACES.length
  });
}

const API_USER = process.env.RACING_API_USER;
const API_PASS = process.env.RACING_API_PASS;
const BASE_URL = 'https://api.theracingapi.com/v1/north-america';

const TARGET_TRACKS = ['BAQ', 'BEL', 'SAR', 'CD', 'GP', 'MTH', 'LRL', 'DEL', 'PRM', 'CBY', 'PID', 'IND', 'EMD'];
const EXCLUDED_TRACKS = ['CT', 'BTP', 'DED', 'EVD', 'FMT', 'MNR', 'TDN', 'FL', 'ARP', 'LS', 'HOU', 'ALB', 'SUN', 'WYO', 'WO'];

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${API_USER}:${API_PASS}`).toString('base64') }
  });
  if (!res.ok) return null;
  return res.json();
}

export async function scanCard(date) {
  const meetsData = await apiFetch(`/meets?start_date=${date}&end_date=${date}`);
  const meets = meetsData?.meets || [];

  const targetMeets = meets.filter(m => TARGET_TRACKS.includes(m.track_id) && !EXCLUDED_TRACKS.includes(m.track_id));

  const trackSummaries = [];

  for (const meet of targetMeets) {
    const entriesData = await apiFetch(`/meets/${meet.meet_id}/entries`);
    const races = entriesData?.races || [];

    let qualifying = 0;
    let totalRaces = races.length;
    let dirtRaces = 0;
    const qualifyingRaces = [];

    for (const race of races) {
      const surface = (race.surface_description || race.surface || '').toLowerCase();
      const isDirt = surface.includes('dirt') || surface === 'd' || (!surface.includes('turf') && !surface.includes('t'));
      const purse = parseInt(race.purse) || 0;
      const fieldSize = race.runners?.length || 0;
      const raceNum = parseInt(race.race_key?.race_number) || 0;
      const conditions = race.race_class || race.race_type_description || race.race_name || '';

      if (isDirt && purse >= 25000 && fieldSize >= 5) {
        qualifying++;
        qualifyingRaces.push({
          race_number: raceNum,
          conditions,
          purse,
          field_size: fieldSize,
          surface: 'Dirt'
        });
      }
      if (isDirt) dirtRaces++;
    }

    if (qualifying > 0) {
      trackSummaries.push({
        track_id: meet.track_id,
        track_name: meet.track_name,
        total_races: totalRaces,
        dirt_races: dirtRaces,
        qualifying,
        qualifyingRaces,
        cost: 1.50
      });
    }
  }

  return trackSummaries.sort((a, b) => b.qualifying - a.qualifying);
}

export function formatCardAlert(date, summaries) {
  if (summaries.length === 0) {
    return `*[Street Boss]* 🏇 Card Scan — ${date}\n_No qualifying races today._ All tracks either cancelled, turf-only, or below threshold. Sit tight.`;
  }

  const totalQualifying = summaries.reduce((s, t) => s + t.qualifying, 0);
  const totalCost = (summaries.length * 1.50).toFixed(2);

  let msg = `*[Street Boss]* 🏇 Card Scan — ${date}\n`;
  msg += `_${summaries.length} tracks active, ${totalQualifying} qualifying races (dirt, $25K+, 5+ field)_\n\n`;
  msg += `*Recommend Brisnet for:*\n`;

  for (const t of summaries) {
    msg += `• *${t.track_name}* (${t.track_id}) — ${t.qualifying} qualifying of ${t.total_races} total\n`;
  }

  msg += `\n_Estimated cost: $${totalCost}_`;
  msg += `\n\nUpload .DRF files when ready → scoring will run automatically.`;

  return msg;
}

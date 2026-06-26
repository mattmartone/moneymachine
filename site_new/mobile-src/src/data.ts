export type RaceStatus = 'upcoming' | 'live' | 'hit' | 'miss' | 'dropped';

export interface WagerHorse {
  pp: number;
  name: string;
  ml: string;
}

export interface Wager {
  type: string;
  bet: string;
  horses: WagerHorse[];
  cost: number;
  paid?: number;
  trackPays?: string;
}

export interface FieldEntry {
  pp: number;
  name: string;
  ml: string;
  live?: string;
  scratched?: boolean;
}

export interface Race {
  id: string;
  raceId: number;
  postTime: string;
  track: string;
  raceNumber: number;
  status: RaceStatus;
  conviction: string;
  skipReason?: string;
  doubleBet?: boolean;
  winPick: {
    name: string;
    pp: number;
    ml: string;
    live?: string;
  };
  exoticBox: number[];
  totalStake: number;
  collected: number;
  analysis: {
    paceThesis: string;
    vulnerability: string;
    strategies: string[];
  };
  wagers: Wager[];
  field: FieldEntry[];
}

// An optional promo video pinned to the top of the Race Day card. Set to null
// on days when there's nothing to feature — the card simply won't render.
export interface FeaturedVideo {
  youtubeId: string;
  tag: string;
  title: string;
  subtitle: string;
}

export let featuredVideo: FeaturedVideo | null = {
  youtubeId: '6loOvE5t51Y',
  tag: 'Race Day',
  title: 'Fade the Chalk — Today on the Board',
  subtitle: "A quick look at the plays we're fading and why"
};

// Mutable export so components that import synchronously get the latest data
// after fetchRaces() resolves.
export let mockRaces: Race[] = [];

// ---------- API helpers ----------

const API_HEADERS = { Authorization: 'Bearer public' };

interface ApiRace {
  id: number;
  race_number: number;
  post_time: string;
  has_results: boolean;
  conditions: string;
  distance: string;
  surface: string;
  field_size: number;
}

interface ApiCard {
  track: string;
  date: string;
  races: ApiRace[];
}

interface ApiPick {
  race_id: number;
  bet_type: string;
  stake: number;
  doubled: boolean;
  entries_used: string;
  conviction: string | null;
}

interface ApiResults {
  win_pp: number;
  win_horse: string;
  place_pp: number;
  place_horse: string;
  show_pp: number;
  show_horse: string;
  fourth_pp: number;
  fourth_horse: string;
  win_payout: number;
  exacta_payout: number;
  trifecta_payout: number;
  superfecta_payout: number;
}

function parseEntries(entriesUsed: string | string[]): { pp: number; name: string }[] {
  const items = Array.isArray(entriesUsed) ? entriesUsed : entriesUsed.split(',');
  return items.map((entry) => {
    const trimmed = String(entry).trim();
    const match = trimmed.match(/^#(\d+)\s+(.+)$/);
    if (match) {
      return { pp: parseInt(match[1], 10), name: match[2].trim() };
    }
    const numOnly = trimmed.replace(/^#/, '');
    const parsed = parseInt(numOnly, 10);
    if (!isNaN(parsed)) {
      return { pp: parsed, name: '' };
    }
    return { pp: 0, name: trimmed };
  });
}

function formatPostTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hours = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hours}:${String(m).padStart(2, '0')} ${period}`;
}

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function permutations(n: number, k: number): number {
  return factorial(n) / factorial(n - k);
}

export async function fetchRaces(date?: string): Promise<Race[]> {
  const dateParam = date ? `?date=${date}` : '';
  const picksRes = await fetch(`/api/lab/today${dateParam}`, { headers: API_HEADERS });

  if (!picksRes.ok) {
    console.error('Failed to fetch picks');
    return [];
  }

  const picksData = await picksRes.json();
  const picks: any[] = picksData.picks ?? [];

  // Update featured video from API
  if (picksData.video) {
    featuredVideo = {
      youtubeId: picksData.video.youtube_id,
      tag: 'Race Day',
      title: picksData.video.title || 'Fade the Chalk — Today on the Board',
      subtitle: "A quick look at the plays we're fading and why"
    };
  }

  // Build a lookup of race_id -> picks for that race
  // Group picks by race_id
  const picksByRace = new Map<number, any[]>();
  for (const pick of picks) {
    const existing = picksByRace.get(pick.race_id) ?? [];
    existing.push(pick);
    picksByRace.set(pick.race_id, existing);
  }

  // Get unique race IDs and fetch results + entries for all
  const raceIds = Array.from(picksByRace.keys());
  const resultsMap = new Map<number, ApiResults>();
  const entriesMap = new Map<number, FieldEntry[]>();
  await Promise.all(
    raceIds.map(async (raceId) => {
      try {
        const [resRes, entRes] = await Promise.all([
          fetch(`/api/lab/results?race_id=${raceId}`, { headers: API_HEADERS }),
          fetch(`/api/lab/entries?race_id=${raceId}`, { headers: API_HEADERS }),
        ]);
        if (resRes.ok) {
          const data = await resRes.json();
          if (data.results) resultsMap.set(raceId, data.results);
        }
        if (entRes.ok) {
          const data = await entRes.json();
          if (data.entries) {
            entriesMap.set(raceId, data.entries.map((e: any) => ({
              pp: e.post_position,
              name: e.horse_name,
              ml: e.morning_line_odds || '',
              live: e.live_odds || undefined,
              scratched: e.scratched || false,
            })));
          }
        }
      } catch {}
    })
  );

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isFutureDate = date ? date > todayStr : false;
  const currentTime = isFutureDate ? '23:59' : `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const races: Race[] = Array.from(picksByRace.entries()).map(([raceId, racePicks]) => {
    const results = resultsMap.get(raceId);
    const firstPick = racePicks[0];
    const track = firstPick.track || 'Unknown';
    const postTimeRaw = firstPick.post_time || null;
    const raceNumber = firstPick.race_number || 0;
    const isPostTimePassed = postTimeRaw ? postTimeRaw.slice(0, 5) < currentTime : false;

    // Compute total stake and build wagers
    let totalStake = 0;
    const wagers: Wager[] = [];
    let winPick = { name: '', pp: 0, ml: '' };
    let doubleBet = false;
    const allBoxPPs: number[] = [];

    const fieldForRace = entriesMap.get(raceId) || [];
    const lookupHorse = (pp: number): WagerHorse => {
      const found = fieldForRace.find((f) => f.pp === pp);
      return { pp, name: found?.name || '', ml: found?.ml || '' };
    };

    for (const pick of racePicks) {
      const entries = parseEntries(pick.entries_used);

      totalStake += pick.stake;

      if (pick.bet_type === 'win') {
        if (entries.length > 0) {
          const h = lookupHorse(entries[0].pp);
          winPick = { name: h.name, pp: h.pp, ml: h.ml };
        }
        doubleBet = pick.doubled;
        wagers.push({
          type: 'Win',
          bet: entries.map((e) => `#${e.pp}`).join(','),
          horses: entries.map((e) => lookupHorse(e.pp)),
          cost: pick.stake,
        });
      } else if (pick.bet_type === 'exacta') {
        entries.forEach((e) => {
          if (!allBoxPPs.includes(e.pp)) allBoxPPs.push(e.pp);
        });
        wagers.push({
          type: 'Exacta Box',
          bet: entries.map((e) => e.pp).join(','),
          horses: entries.map((e) => lookupHorse(e.pp)),
          cost: pick.stake,
        });
      } else if (pick.bet_type === 'trifecta') {
        entries.forEach((e) => {
          if (!allBoxPPs.includes(e.pp)) allBoxPPs.push(e.pp);
        });
        wagers.push({
          type: 'Trifecta Box',
          bet: entries.map((e) => e.pp).join(','),
          horses: entries.map((e) => lookupHorse(e.pp)),
          cost: pick.stake,
        });
      } else if (pick.bet_type === 'superfecta') {
        entries.forEach((e) => {
          if (!allBoxPPs.includes(e.pp)) allBoxPPs.push(e.pp);
        });
        wagers.push({
          type: 'Superfecta Box',
          bet: entries.map((e) => e.pp).join(','),
          horses: entries.map((e) => lookupHorse(e.pp)),
          cost: pick.stake,
        });
      }
    }

    // Calculate collected from results
    let collected = 0;
    if (results) {
      for (const pick of racePicks) {
        const entries = parseEntries(pick.entries_used);
        const n = entries.length;
        const pps = entries.map((e) => e.pp);

        if (pick.bet_type === 'win' && results.win_payout > 0 && pps[0] === results.win_pp) {
          collected += (results.win_payout / 2) * pick.stake;
        } else if (pick.bet_type === 'exacta' && results.exacta_payout > 0 &&
          pps.includes(results.win_pp) && pps.includes(results.place_pp)) {
          collected += results.exacta_payout * (pick.stake / permutations(n, 2));
        } else if (pick.bet_type === 'trifecta' && results.trifecta_payout > 0 &&
          pps.includes(results.win_pp) && pps.includes(results.place_pp) && pps.includes(results.show_pp)) {
          collected += results.trifecta_payout * (pick.stake / permutations(n, 3));
        } else if (pick.bet_type === 'superfecta' && results.superfecta_payout > 0 &&
          pps.includes(results.win_pp) && pps.includes(results.place_pp) &&
          pps.includes(results.show_pp) && results.fourth_pp > 0 && pps.includes(results.fourth_pp)) {
          collected += results.superfecta_payout * (pick.stake / permutations(n, 4));
        }
      }
    }

    // Determine status
    let status: RaceStatus;
    const conviction = firstPick.conviction || 'COMMISSION';
    if (results) {
      status = collected > 0 ? 'hit' : 'miss';
    } else if (isPostTimePassed) {
      status = conviction === 'DROPPED' ? 'dropped' : 'live';
    } else {
      status = conviction === 'DROPPED' ? 'dropped' : 'upcoming';
    }

    // Build exoticBox: for settled races show finish order, for unsettled show bet PPs
    let exoticBox: number[];
    if (results) {
      exoticBox = [results.win_pp, results.place_pp, results.show_pp, results.fourth_pp].filter(
        (pp) => pp > 0
      );
    } else {
      exoticBox = allBoxPPs;
    }

    // Update wager paid amounts and track pays if settled
    if (results) {
      for (let i = 0; i < racePicks.length; i++) {
        const pick = racePicks[i];
        const entries = parseEntries(pick.entries_used);
        const n = entries.length;
        const pps = entries.map((e) => e.pp);

        let wagerPaid = 0;
        let hit = false;

        if (pick.bet_type === 'win') {
          hit = pps.includes(results.win_pp);
          if (hit && results.win_payout > 0) {
            wagerPaid = (results.win_payout / 2) * pick.stake;
          }
        } else if (pick.bet_type === 'exacta') {
          hit = pps.includes(results.win_pp) && pps.includes(results.place_pp);
          if (hit && results.exacta_payout > 0) {
            const perCombo = pick.stake / permutations(n, 2);
            wagerPaid = results.exacta_payout * perCombo;
          }
        } else if (pick.bet_type === 'trifecta') {
          hit = pps.includes(results.win_pp) && pps.includes(results.place_pp) && pps.includes(results.show_pp);
          if (hit && results.trifecta_payout > 0) {
            const perCombo = pick.stake / permutations(n, 3);
            wagerPaid = results.trifecta_payout * perCombo;
          }
        } else if (pick.bet_type === 'superfecta') {
          hit = pps.includes(results.win_pp) && pps.includes(results.place_pp) &&
                pps.includes(results.show_pp) && results.fourth_pp > 0 && pps.includes(results.fourth_pp);
          if (hit && results.superfecta_payout > 0) {
            const perCombo = pick.stake / permutations(n, 4);
            wagerPaid = results.superfecta_payout * perCombo;
          }
        }

        const wagerIdx = wagers.findIndex((w) => {
          if (pick.bet_type === 'win') return w.type === 'Win';
          if (pick.bet_type === 'exacta') return w.type === 'Exacta Box';
          if (pick.bet_type === 'trifecta') return w.type === 'Trifecta Box';
          if (pick.bet_type === 'superfecta') return w.type === 'Superfecta Box';
          return false;
        });
        if (wagerIdx >= 0) {
          wagers[wagerIdx].paid = wagerPaid;
          if (pick.bet_type === 'win') {
            wagers[wagerIdx].trackPays = hit && results.win_payout > 0 ? `$${results.win_payout.toFixed(2)} on $2` : undefined;
          } else if (pick.bet_type === 'exacta') {
            wagers[wagerIdx].trackPays = hit && results.exacta_payout > 0 ? `$${results.exacta_payout.toFixed(2)} on $1` : undefined;
          } else if (pick.bet_type === 'trifecta') {
            wagers[wagerIdx].trackPays = hit && results.trifecta_payout > 0 ? `$${results.trifecta_payout.toFixed(2)} on $1` : undefined;
          } else if (pick.bet_type === 'superfecta') {
            wagers[wagerIdx].trackPays = hit && results.superfecta_payout > 0 ? `$${results.superfecta_payout.toFixed(2)} on $0.10` : undefined;
          }
        }
      }
    }

    return {
      id: String(raceId),
      raceId,
      postTime: postTimeRaw ? formatPostTime(postTimeRaw) : '—',
      track,
      raceNumber: raceNumber,
      status,
      conviction,
      skipReason: firstPick.skip_reason || undefined,
      doubleBet: doubleBet || undefined,
      winPick,
      exoticBox,
      totalStake,
      collected: parseFloat(collected.toFixed(2)),
      analysis: {
        paceThesis: firstPick.race_theory || '',
        vulnerability: '',
        strategies: racePicks
          .flatMap((p: any) => p.strategies_fired || [])
          .filter((s: string | null) => s !== null)
          .filter((s: string, i: number, arr: string[]) => arr.indexOf(s) === i),
      },
      wagers,
      field: entriesMap.get(raceId) || [],
    };
  });

  // Sort by post time
  races.sort((a, b) => {
    const parseTime = (t: string) => {
      const [time, period] = t.split(' ');
      const [h, m] = time.split(':').map(Number);
      let hours = h;
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + m;
    };
    return parseTime(a.postTime) - parseTime(b.postTime);
  });

  // Update the mutable export
  mockRaces = races;

  return races;
}

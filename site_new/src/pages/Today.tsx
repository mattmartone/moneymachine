import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppNav } from '../components/AppNav';
import { RaceTheory } from '../components/RaceTheory';

interface TodayRace {
  id: number;
  track: string;
  race_number: number;
  conditions: string;
  distance: string;
  surface: string;
  field_size: number;
  post_time: string | null;
  has_results?: boolean;
}

interface CommissionRace {
  race_id: number;
  has_win_bet: boolean;
  total_stake: number;
}

export function Today() {
  const navigate = useNavigate();
  const token = localStorage.getItem('ftc_token');
  const now0 = new Date();
  const today = `${now0.getFullYear()}-${String(now0.getMonth() + 1).padStart(2, '0')}-${String(now0.getDate()).padStart(2, '0')}`;

  const [races, setRaces] = useState<TodayRace[]>([]);
  const [commissionRaces, setCommissionRaces] = useState<Map<number, CommissionRace>>(new Map());
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [perfOpen, setPerfOpen] = useState(true);

  useEffect(() => {
    if (!token) { navigate('/'); return; }

    fetch('/api/lab/races', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.cards) {
          const todayRaces = data.cards
            .filter((c: any) => {
              const raw = typeof c.date === 'string' ? c.date : '';
              return raw.startsWith(today);
            })
            .flatMap((c: any) => c.races.map((r: any) => ({ ...r, track: c.track })));
          todayRaces.sort((a: TodayRace, b: TodayRace) => {
            if (!a.post_time && !b.post_time) return 0;
            if (!a.post_time) return 1;
            if (!b.post_time) return -1;
            return a.post_time.localeCompare(b.post_time);
          });
          setRaces(todayRaces);
          if (data.last_updated) setLastUpdated(data.last_updated);
        }
        setLoading(false);
      });

    fetch('/api/lab/today', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.picks) {
          const map = new Map<number, CommissionRace>();
          for (const pick of data.picks) {
            const existing = map.get(pick.race_id);
            if (existing) {
              existing.total_stake += pick.stake;
              if (pick.bet_type === 'win') existing.has_win_bet = true;
            } else {
              map.set(pick.race_id, {
                race_id: pick.race_id,
                has_win_bet: pick.bet_type === 'win',
                total_stake: pick.stake,
              });
            }
          }
          setCommissionRaces(map);
        }
      });

  }, [token, navigate, today]);

  // Fetch performance — re-runs when trackFilter changes
  useEffect(() => {
    if (!token) return;
    const trackParam = trackFilter !== 'all' && trackFilter !== 'commission' ? `?track=${encodeURIComponent(trackFilter)}` : '';
    fetch(`/api/lab/performance${trackParam}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setPerformance(data?.performance || null);
      })
      .catch(() => setPerformance(null));
  }, [token, trackFilter]);

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const tracks = Array.from(new Set(races.map(r => r.track))).sort();

  const filteredRaces = trackFilter === 'all'
    ? races
    : trackFilter === 'commission'
    ? races.filter(r => commissionRaces.has(r.id))
    : races.filter(r => r.track === trackFilter);

  const formatTime = (t: string | null) => {
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Categorize races: pending (just ran, no results), upcoming, results
  const pendingRaces: TodayRace[] = [];
  const upcomingRaces: TodayRace[] = [];
  const completedRaces: TodayRace[] = [];

  for (const race of filteredRaces) {
    if (race.has_results) {
      completedRaces.push(race);
    } else if (race.post_time && race.post_time < currentTime) {
      pendingRaces.push(race);
    } else {
      upcomingRaces.push(race);
    }
  }

  // Only show most recent pending race at top
  const mostRecentPending = pendingRaces.length > 0
    ? [pendingRaces[pendingRaces.length - 1]]
    : [];
  const olderPending = pendingRaces.slice(0, -1);

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
        <AppNav />

        <div className="bg-[#000080] text-white font-bold p-2 px-3 mb-4 flex justify-between items-center">
          <span className="font-serif">TODAY'S RACES</span>
          <div className="text-right">
            <span className="font-mono text-xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            {lastUpdated && (
              <div className="font-mono text-[10px] text-gray-300">Odds updated: {lastUpdated}</div>
            )}
          </div>
        </div>

        {/* Commission banner — filters to just our plays */}
        {commissionRaces.size > 0 && (
          <button
            onClick={() => setTrackFilter(trackFilter === 'commission' ? 'all' : 'commission')}
            className="w-full bg-[#ffffcc] border-2 border-black p-3 mb-4 font-mono text-sm text-left hover:bg-[#fff5aa] cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <span><strong>🤌 The Commission has {commissionRaces.size} plays today.</strong> {trackFilter === 'commission' ? 'Showing picks only. Tap for all →' : 'Tap to view picks →'}</span>
              <span className="font-bold text-[#000080]">${Array.from(commissionRaces.values()).reduce((s, c) => s + c.total_stake, 0).toFixed(0)} committed</span>
            </div>
          </button>
        )}

        {/* Track filter */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setTrackFilter('all')}
              className={`px-3 py-1 font-mono text-xs border ${trackFilter === 'all' ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-400 hover:bg-gray-100'}`}
            >
              ALL TRACKS
            </button>
            {tracks.map(t => (
              <button
                key={t}
                onClick={() => setTrackFilter(t)}
                className={`px-3 py-1 font-mono text-xs border ${trackFilter === t ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-400 hover:bg-gray-100'}`}
              >
                {t}
                {Array.from(commissionRaces.values()).some(c => races.find(r => r.id === c.race_id)?.track === t) && ' 🤌'}
              </button>
            ))}
          </div>
        </div>

        {/* Context subheader */}
        {!loading && filteredRaces.length > 0 && (
          <div className="font-mono text-xs text-gray-600 mb-3 px-1">
            {trackFilter === 'commission'
              ? `All Commission Races — ${filteredRaces.length} plays across ${new Set(filteredRaces.map(r => r.track)).size} tracks • $${Array.from(commissionRaces.values()).reduce((s, c) => s + c.total_stake, 0).toLocaleString()} committed`
              : trackFilter === 'all'
              ? `All races today — ${filteredRaces.length} across ${tracks.length} tracks`
              : `${trackFilter} — ${filteredRaces.length} races`
            }
          </div>
        )}

        {/* Performance Summary — collapsible */}
        {performance && commissionRaces.size > 0 && (
          <div className="mb-4 border-2 border-[#000080]">
            <button
              onClick={() => setPerfOpen(!perfOpen)}
              className="w-full flex justify-between items-center px-3 py-2 bg-[#000080] text-white font-mono text-xs font-bold cursor-pointer"
            >
              <span>DAY PERFORMANCE</span>
              <span>{perfOpen ? '▼' : '▶'} {performance.closed_races}/{performance.total_races} settled</span>
            </button>
            {perfOpen && (
              <div className="p-3 bg-white font-mono text-xs">
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div>
                    <div className="text-gray-500">RACES</div>
                    <div className="font-bold text-sm">{performance.closed_races} closed / {performance.open_races} open</div>
                  </div>
                  <div>
                    <div className="text-gray-500">WAGERED</div>
                    <div className="font-bold text-sm">${performance.total_wagered.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">COLLECTED</div>
                    <div className="font-bold text-sm">${performance.total_collected.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <div>
                    <span className="text-gray-500">NET: </span>
                    <span className={`font-bold text-lg ${performance.net >= 0 ? 'text-green-700' : 'text-web-red'}`}>
                      {performance.net >= 0 ? '+' : ''}${performance.net.toFixed(2)}
                    </span>
                  </div>
                  {performance.last_settled && (
                    <div className="text-[10px] text-gray-400">
                      Last updated: {new Date(performance.last_settled).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="font-mono animate-blink p-4">Loading races...</div>
        ) : filteredRaces.length === 0 ? (
          <div className="bg-white border-2 border-gray-400 p-8 text-center font-serif italic text-gray-500">
            No races found.
          </div>
        ) : (
          <div>
            {/* PENDING — most recent race awaiting results */}
            {mostRecentPending.length > 0 && (
              <div className="mb-4">
                <div className="font-mono text-xs font-bold text-orange-600 mb-1 uppercase">⏳ Awaiting Results</div>
                {mostRecentPending.map(race => (
                  <RaceRow key={race.id} race={race} commission={commissionRaces.get(race.id)} trackFilter={trackFilter} status="pending" />
                ))}
              </div>
            )}

            {/* UPCOMING — next to post onward */}
            {upcomingRaces.length > 0 && (
              <div className="mb-4">
                <div className="font-mono text-xs font-bold text-[#000080] mb-1 uppercase">Upcoming</div>
                <div className="space-y-1">
                  {upcomingRaces.map((race, idx) => (
                    <RaceRow key={race.id} race={race} commission={commissionRaces.get(race.id)} trackFilter={trackFilter} status={idx === 0 ? 'next' : 'upcoming'} />
                  ))}
                </div>
              </div>
            )}

            {/* COMPLETED — races with results + older pending */}
            {(completedRaces.length > 0 || olderPending.length > 0) && (
              <div className="mb-4">
                <div className="font-mono text-xs font-bold text-gray-500 mb-1 uppercase">Results</div>
                <div className="space-y-1">
                  {[...olderPending.reverse(), ...completedRaces.reverse()].map(race => (
                    <RaceRow key={race.id} race={race} commission={commissionRaces.get(race.id)} trackFilter={trackFilter} status="completed" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface RaceEntry {
  post_position: number;
  horse_name: string;
  running_style: string | null;
  morning_line_odds: string | null;
  scratched: boolean;
}

function RaceRow({ race, commission, trackFilter, status }: {
  race: any;
  commission?: { has_win_bet: boolean; total_stake: number };
  trackFilter: string;
  status: 'pending' | 'next' | 'upcoming' | 'completed';
}) {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<RaceEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [winPickPP, setWinPickPP] = useState<number | null>(null);

  const token = localStorage.getItem('ftc_token');

  const formatTime = (t: string | null) => {
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!expanded && entries.length === 0) {
      setLoadingEntries(true);
      fetch(`/api/lab/entries?race_id=${race.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data?.entries) setEntries(data.entries);
          setLoadingEntries(false);
        })
        .catch(() => setLoadingEntries(false));

      fetch('/api/lab/today', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data?.picks) {
            const winBet = data.picks.find((p: any) => String(p.race_id) === String(race.id) && p.bet_type === 'win');
            if (winBet?.entries_used?.[0]) {
              const pp = Number(winBet.entries_used[0].replace(/^#/, '').split(' ')[0]);
              if (!isNaN(pp)) setWinPickPP(pp);
            }
          }
        })
        .catch(() => {});
    }
    setExpanded(!expanded);
  };

  const favePP = entries.length > 0
    ? (() => {
        const sorted = [...entries]
          .filter(e => !e.scratched && e.morning_line_odds)
          .sort((a, b) => {
            const parseOdds = (o: string | null) => {
              if (!o) return 999;
              const parts = o.split('/');
              return parts.length === 2 ? Number(parts[0]) / Number(parts[1]) : Number(o);
            };
            return parseOdds(a.morning_line_odds) - parseOdds(b.morning_line_odds);
          });
        return sorted[0]?.post_position ?? null;
      })()
    : null;

  const borderClass = commission
    ? 'border-[#000080] bg-[#f0f0ff]'
    : status === 'pending'
    ? 'border-orange-400 bg-orange-50'
    : status === 'next'
    ? 'border-gray-600 bg-white'
    : status === 'completed'
    ? 'border-gray-300 bg-gray-100 opacity-60'
    : 'border-gray-400 bg-white hover:bg-[#fffbe0]';

  return (
    <div className={`border-2 transition-colors ${borderClass}`}>
      <div
        className="flex items-center gap-3 px-3 py-3 cursor-pointer"
        onClick={handleExpand}
      >
        <div className="font-mono text-2xl font-bold w-12 shrink-0 text-center text-[#000080]">
          {race.race_number}
        </div>
        <div className="w-px h-10 bg-gray-300 shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {(trackFilter === 'all' || trackFilter === 'commission') && (
              <span className="font-serif font-bold text-[#000080]">{race.track}</span>
            )}
            <span className="font-mono text-xs text-gray-500">{formatTime(race.post_time)}</span>
            {status === 'next' && <span className="font-mono text-[10px] bg-black text-white px-1.5 py-0.5">NEXT</span>}
            {status === 'pending' && <span className="font-mono text-[10px] bg-orange-500 text-white px-1.5 py-0.5">PENDING</span>}
            {commission && (
              <span className="font-mono text-[10px] bg-[#000080] text-white px-1.5 py-0.5">
                🤌 {commission.has_win_bet ? 'WIN + EXOTICS' : 'EXOTICS'}
              </span>
            )}
          </div>
          <div className="font-mono text-xs text-gray-600 mt-0.5 truncate">
            {race.conditions} • {race.distance} • {race.surface} • {race.field_size} horses
          </div>
        </div>
        {commission && (
          <div className="font-mono text-xs font-bold text-[#000080] shrink-0">
            ${commission.total_stake.toFixed(0)}
          </div>
        )}
        <span className="font-mono text-sm text-gray-400 shrink-0">{expanded ? '▼' : '→'}</span>
      </div>

      {/* Expanded: Race Theory animation */}
      {expanded && (
        <div className="px-3 pb-3">
          {loadingEntries ? (
            <div className="font-mono text-xs text-gray-500 animate-pulse py-2">Loading field...</div>
          ) : entries.filter(e => !e.scratched && e.running_style).length >= 3 ? (
            <RaceTheory
              entries={entries}
              surface={race.surface}
              winPickPP={winPickPP}
              favePP={favePP}
            />
          ) : entries.length > 0 ? (
            <div className="font-mono text-xs text-gray-500 py-2">Not enough style data for animation.</div>
          ) : null}
          <Link
            to={`/today/${race.id}`}
            className="block text-center font-mono text-xs text-[#000080] underline mt-1"
          >
            Full race details →
          </Link>
        </div>
      )}
    </div>
  );
}

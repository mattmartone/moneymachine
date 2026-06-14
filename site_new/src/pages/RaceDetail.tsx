import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppNav } from '../components/AppNav';

interface Entry {
  id: number;
  post_position: number;
  morning_line_odds: string | null;
  live_odds: string | null;
  jockey: string | null;
  trainer: string | null;
  weight: number | null;
  running_style: string | null;
  best_beyer: number | null;
  last_beyer: number | null;
  days_since_last: number | null;
  horse_name: string;
  sire: string | null;
  scratched: boolean;
}

interface Bet {
  id: number;
  bet_type: string;
  stake: number;
  doubled: boolean;
  conviction: string;
  entries_used: string[] | null;
}

interface Strategy {
  name: string;
  type: string;
  description: string;
  win_rate: number | null;
}

interface RaceResult {
  win_horse: string | null;
  win_pp: number | null;
  place_horse: string | null;
  place_pp: number | null;
  show_horse: string | null;
  show_pp: number | null;
  fourth_horse: string | null;
  fourth_pp: number | null;
  win_payout: number | null;
  exacta_payout: number | null;
  trifecta_payout: number | null;
  superfecta_payout: number | null;
  settled_at: string | null;
}

type Tab = 'field' | 'build' | 'results';

const TOKEN_COST = 200000;

export function RaceDetail() {
  const navigate = useNavigate();
  const { raceId } = useParams();
  const token = localStorage.getItem('ftc_token');

  const [entries, setEntries] = useState<Entry[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [raceInfo, setRaceInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('field');
  const [commissionUnlocked, setCommissionUnlocked] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [buildSearch, setBuildSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [oddsEdits, setOddsEdits] = useState<Record<number, string>>({});
  const [scratchList, setScratchList] = useState<number[]>([]);
  const [postTimeEdit, setPostTimeEdit] = useState('');
  const [saving, setSaving] = useState(false);
  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [resultForm, setResultForm] = useState({ win_pp: '', place_pp: '', show_pp: '', win_payout: '', exacta_payout: '', trifecta_payout: '', superfecta_payout: '' });
  const [resultSaving, setResultSaving] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    if (!raceId) return;

    // Check if admin (Matt)
    fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.email === 'mwmartone@gmail.com') setIsAdmin(true);
      })
      .catch(() => {});

    fetch(`/api/lab/entries?race_id=${raceId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.entries) {
          setEntries(data.entries);
          setScratchList(data.entries.filter((e: Entry) => e.scratched).map((e: Entry) => e.id));
        }
        setLoading(false);
      });

    fetch(`/api/lab/today`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.picks) {
          const raceBets = data.picks.filter((p: any) => String(p.race_id) === raceId);
          if (raceBets.length > 0) {
            setBets(raceBets);
            setRaceInfo({
              track: raceBets[0].track,
              race_number: raceBets[0].race_number,
              conditions: raceBets[0].conditions,
              distance: raceBets[0].distance,
              surface: raceBets[0].surface,
              field_size: raceBets[0].field_size,
              post_time: raceBets[0].post_time,
            });
          }
        }
      });

    fetch('/api/strategies', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.strategies) setStrategies(data.strategies.filter((s: any) => s.active));
      });

    fetch(`/api/lab/results?race_id=${raceId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.results) setRaceResult(data.results);
      })
      .catch(() => {});
  }, [token, navigate, raceId]);

  // If no race info from bets, try to get from entries
  useEffect(() => {
    if (!raceInfo && entries.length > 0) {
      fetch(`/api/lab/races`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data?.cards) {
            for (const card of data.cards) {
              const race = card.races.find((r: any) => String(r.id) === raceId);
              if (race) {
                setRaceInfo({ ...race, track: card.track });
                break;
              }
            }
          }
        });
    }
  }, [entries, raceInfo, raceId, token]);

  const formatTime = (t: string | null) => {
    if (!t) return 'TBD';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const winBet = bets.find(b => b.bet_type === 'win');
  const exotics = bets.filter(b => b.bet_type !== 'win');

  const filteredStrategies = strategies.filter(s =>
    !buildSearch || s.name.toLowerCase().includes(buildSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
        <AppNav />

        <button onClick={() => navigate('/today')} className="font-sans text-xs font-bold text-[#000080] underline mb-4">
          ← Back to today's races
        </button>

        {raceInfo && (
          <div className="bg-black text-white px-4 py-3 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-mono text-lg font-bold">{formatTime(raceInfo.post_time)}</span>
                <span className="mx-3 opacity-50">|</span>
                <span className="font-serif font-bold text-lg">{raceInfo.track} — R{raceInfo.race_number}</span>
              </div>
              <span className="font-mono text-sm">{raceInfo.distance} • {raceInfo.surface}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="font-mono text-xs text-gray-300">{raceInfo.conditions} • {raceInfo.field_size} horses</div>
              <div className="font-mono text-[10px] text-gray-400">Data loaded: {new Date().toLocaleDateString()} AM</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b-2 border-black mb-0">
          <button
            onClick={() => setActiveTab('field')}
            className={`px-4 py-2 font-serif font-bold text-sm border-2 border-b-0 -mb-[2px] ${
              activeTab === 'field' ? 'bg-white border-black z-10' : 'bg-web-gray border-gray-400 text-gray-600 hover:bg-gray-200'
            }`}
          >
            FIELD
          </button>
          <button
            onClick={() => setActiveTab('build')}
            className={`px-4 py-2 font-serif font-bold text-sm border-2 border-b-0 -mb-[2px] ml-1 ${
              activeTab === 'build' ? 'bg-white border-black z-10' : 'bg-web-gray border-gray-400 text-gray-600 hover:bg-gray-200'
            }`}
          >
            BUILD YOUR BETS
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 font-serif font-bold text-sm border-2 border-b-0 -mb-[2px] ml-1 ${
              activeTab === 'results' ? 'bg-white border-black z-10' : 'bg-web-gray border-gray-400 text-gray-600 hover:bg-gray-200'
            }`}
          >
            RESULTS {raceResult ? '✓' : ''}
          </button>
        </div>

        {/* Tab content */}
        <div className="border-2 border-t-0 border-black bg-white p-4">

          {/* FIELD TAB */}
          {activeTab === 'field' && (
            <div>
              {loading ? (
                <div className="font-mono animate-blink">Loading field...</div>
              ) : entries.length === 0 ? (
                <div className="p-6 text-center font-mono text-sm text-gray-500">No field data available for this race.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="web-table font-mono text-xs w-full min-w-[700px]">
                    <thead>
                      <tr>
                        <th className="py-2" title="Post Position — the gate the horse starts from">PP</th>
                        <th className="py-2 text-left">HORSE</th>
                        <th className="py-2" title="Morning Line Odds — the track handicapper's predicted odds before betting opens">ML</th>
                        <th className="py-2" title="Current live odds from the tote board — updates closer to post time">LIVE</th>
                        <th className="py-2" title="Running Style — how this horse typically races (speed, presser, stalker, closer)">STYLE</th>
                        <th className="py-2" title="Best Beyer — career-high speed figure. Higher = faster horse.">BEST</th>
                        <th className="py-2" title="Last Beyer — speed figure from most recent race">LAST</th>
                        <th className="py-2" title="Days since last race — lower means sharper fitness, higher means possible layoff">DAYS</th>
                        <th className="py-2 text-left">JOCKEY</th>
                        <th className="py-2 text-left">TRAINER</th>
                        {isAdmin && <th className="py-2"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map(e => {
                        const styleTooltip: Record<string, string> = {
                          'E': 'Speed — goes straight to the front and tries to wire the field',
                          'E/P': 'Presser — sits just off the speed, saves energy, kicks past tired leaders',
                          'P': 'Stalker — mid-pack early, makes one big run on the turn',
                          'S': 'Closer — drops to the back early, comes from way behind late',
                        };

                        const isScratched = scratchList.includes(e.id);
                        if (isScratched && !isAdmin) return null;

                        return (
                          <tr key={e.id} className={`hover:bg-[#ffffcc] ${isScratched ? 'opacity-40 line-through' : ''}`}>
                            <td className="font-bold text-center">{e.post_position}</td>
                            <td className="font-bold text-left">{e.horse_name}</td>
                            <td className="text-center">{e.morning_line_odds || '—'}</td>
                            <td className="text-center">
                              {isAdmin ? (
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={oddsEdits[e.id] ?? e.live_odds ?? ''}
                                  onChange={ev => setOddsEdits({ ...oddsEdits, [e.id]: ev.target.value })}
                                  className="w-14 px-1 py-0.5 border border-gray-400 font-mono text-xs text-center"
                                  placeholder="—"
                                />
                              ) : (
                                <span>{e.live_odds || '—'}</span>
                              )}
                            </td>
                            {isAdmin && (
                              <td className="text-center">
                                <button
                                  onClick={() => setScratchList(prev => prev.includes(e.id) ? prev.filter(id => id !== e.id) : [...prev, e.id])}
                                  className={`font-mono text-[10px] px-1 border ${scratchList.includes(e.id) ? 'bg-red-100 border-red-400 text-red-700 font-bold' : 'border-gray-300 text-gray-400 hover:text-red-600'}`}
                                >
                                  {scratchList.includes(e.id) ? 'SCR' : 'x'}
                                </button>
                              </td>
                            )}
                            <td className="text-center relative group/style">
                              <span
                                className={`px-1 cursor-help ${e.running_style === 'E' ? 'text-web-red font-bold' : e.running_style === 'E/P' ? 'text-orange-600' : e.running_style === 'S' ? 'text-blue-600' : ''}`}
                              >
                                {e.running_style || '—'}
                              </span>
                              {e.running_style && styleTooltip[e.running_style] && (
                                <div className="hidden group-hover/style:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[10px] rounded whitespace-nowrap">
                                  {styleTooltip[e.running_style]}
                                </div>
                              )}
                            </td>
                            <td className="text-center font-bold">{e.best_beyer || '—'}</td>
                            <td className="text-center">{e.last_beyer || '—'}</td>
                            <td className="text-center">{e.days_since_last || '—'}</td>
                            <td className="text-left">{e.jockey || '—'}</td>
                            <td className="text-left">{e.trainer || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-3 font-mono text-[10px] text-gray-500">
                <span className="text-web-red font-bold">E</span> = speed •
                <span className="text-orange-600 ml-1">E/P</span> = presser •
                P = stalker •
                <span className="text-blue-600 ml-1">S</span> = closer •
                <span className="ml-2 italic">Hover style letters for details</span>
              </div>

              {/* Commission Bets — shown below field when we have action */}
              {bets.length > 0 && (
                <div className="mt-6 border-t-4 border-[#000080] pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🤌</span>
                    <span className="font-serif font-bold text-[#000080] text-lg">THE COMMISSION'S BETS</span>
                    <span className="font-mono text-xs text-gray-500 ml-auto">${bets.reduce((s, b) => s + b.stake, 0).toFixed(2)} total</span>
                  </div>
                  {!commissionUnlocked ? (
                    <div className="bg-[#f0f0ff] border-2 border-[#000080] p-4 text-center">
                      <p className="font-mono text-sm text-gray-600 mb-3">
                        {bets.length} bet{bets.length > 1 ? 's' : ''} recommended • ${bets.reduce((s, b) => s + b.stake, 0).toFixed(2)} total stake
                      </p>
                      <button
                        onClick={() => setCommissionUnlocked(true)}
                        className="px-6 py-2 bg-[#000080] text-white font-sans font-bold text-sm border-2 border-black shadow-outset active:shadow-inset"
                      >
                        UNLOCK — {TOKEN_COST.toLocaleString()} tokens
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#f0f0ff] border-2 border-[#000080] p-4">
                      {winBet && (
                        <div className="mb-3 bg-[#ffffcc] border-2 border-black p-3">
                          <div className="font-sans font-bold text-web-red text-sm">WIN BET{winBet.doubled ? ' — DOUBLED STAKE' : ''}</div>
                          <div className="font-mono text-sm font-bold mt-1">
                            {winBet.entries_used?.length ? winBet.entries_used.join(', ') : '—'}
                          </div>
                          <div className="font-mono text-xs text-gray-600 mt-1">Stake: ${winBet.stake.toFixed(2)}</div>
                        </div>
                      )}
                      {!winBet && (
                        <div className="mb-3 font-mono text-sm text-gray-600 italic bg-gray-50 p-3 border border-gray-300">
                          Exotics only — fave is protected, no win bet against.
                        </div>
                      )}
                      <div className="space-y-2">
                        {exotics.map(bet => (
                          <div key={bet.id} className="border-b border-gray-200 pb-2">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-sm capitalize">{bet.bet_type} box</span>
                              <span className="font-mono font-bold">${bet.stake.toFixed(2)}</span>
                            </div>
                            {bet.entries_used?.length && (
                              <div className="font-mono text-xs text-gray-700 mt-1">
                                {bet.entries_used.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t-2 border-black flex justify-between">
                        <span className="font-sans font-bold text-sm">TOTAL STAKE</span>
                        <span className="font-mono text-lg font-bold">${bets.reduce((s, b) => s + b.stake, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin: save button for inline edits */}
              {isAdmin && (
                <div className="mt-4 border-t-2 border-gray-300 pt-3 flex items-center gap-3">
                  <button
                    onClick={async () => {
                      setSaving(true);
                      for (const entry of entries) {
                        const odds = oddsEdits[entry.id];
                        const isScratch = scratchList.includes(entry.id);
                        const wasScratch = entry.scratched;
                        const oddsChanged = odds !== undefined && odds !== (entry.live_odds || '');
                        const scratchChanged = isScratch !== !!wasScratch;
                        if (oddsChanged || scratchChanged) {
                          await fetch('/api/lab/entries', {
                            method: 'PATCH',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              entry_id: entry.id,
                              ...(oddsChanged ? { live_odds: odds || null } : {}),
                              ...(scratchChanged ? { scratched: isScratch } : {})
                            })
                          });
                        }
                      }
                      setSaving(false);
                      window.location.reload();
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-black text-white font-mono text-xs border-2 border-black"
                  >
                    {saving ? 'SAVING...' : 'SAVE LIVE ODDS'}
                  </button>
                  <span className="font-mono text-[10px] text-gray-400">Admin only — updates for all members</span>
                </div>
              )}
            </div>
          )}

          {/* BUILD YOUR BETS TAB */}
          {activeTab === 'build' && (
            <div>
              <div className="mb-4">
                <div className="font-serif text-lg font-bold mb-1">Build Your Bets</div>
                <p className="font-mono text-xs text-gray-600">
                  Select strategies to run against this field. Each strategy looks for a different edge in the data.
                </p>
              </div>

              <input
                type="text"
                value={buildSearch}
                onChange={e => setBuildSearch(e.target.value)}
                placeholder="Search strategies..."
                className="w-full mb-2 px-2 py-1 border-2 border-gray-400 shadow-inset font-mono text-sm"
              />

              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-gray-500">{selectedStrategies.length} selected</span>
                <div className="flex gap-3 font-sans text-xs font-bold">
                  <button type="button" onClick={() => setSelectedStrategies(strategies.map(s => s.name))} className="text-[#000080] underline">All</button>
                  <button type="button" onClick={() => setSelectedStrategies([])} className="text-[#000080] underline">Clear</button>
                </div>
              </div>

              <div className="border-2 border-gray-400 shadow-inset bg-gray-100 max-h-[28rem] overflow-y-auto divide-y divide-gray-300 mb-4">
                {filteredStrategies.map(s => (
                  <label
                    key={s.name}
                    className={`flex items-center gap-3 px-3 py-2 font-mono text-sm cursor-pointer hover:bg-[#ffffcc] ${selectedStrategies.includes(s.name) ? 'bg-[#fffbe0]' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStrategies.includes(s.name)}
                      onChange={() => setSelectedStrategies(prev =>
                        prev.includes(s.name) ? prev.filter(n => n !== s.name) : [...prev, s.name]
                      )}
                      className="w-4 h-4 shrink-0"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-[#000080]">{s.name}</span>
                      <div className="text-[10px] text-gray-500 mt-0.5">{s.description}</div>
                    </div>
                    <div className="text-right shrink-0">
                      {s.win_rate !== null && <div className="text-xs text-green-700 font-bold">{s.win_rate}% W</div>}
                      <div className="text-[10px] text-gray-400">$— earned</div>
                    </div>
                  </label>
                ))}
              </div>

              {selectedStrategies.length > 0 && (
                <div className="bg-[#ffffcc] border-2 border-black p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-sans font-bold text-sm">Run {selectedStrategies.length} strategies on this field</span>
                    <span className="font-mono text-lg font-bold">{TOKEN_COST.toLocaleString()} tokens</span>
                  </div>
                  <button
                    className="w-full px-6 py-3 bg-web-gray font-sans font-bold text-lg text-black border-2 border-black shadow-outset active:shadow-inset cursor-pointer"
                  >
                    RUN ANALYSIS
                  </button>
                </div>
              )}
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === 'results' && (
            <div>
              {raceResult ? (
                <div>
                  {/* Finish Order — clean, just position + PP + horse name */}
                  <div className="overflow-x-auto">
                    <table className="web-table font-mono text-xs w-full">
                      <thead>
                        <tr>
                          <th className="py-2">POS</th>
                          <th className="py-2">PP</th>
                          <th className="py-2 text-left">HORSE</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-[#fffbe0]">
                          <td className="text-center font-bold text-[#d4af37]">1st</td>
                          <td className="text-center font-bold">{raceResult.win_pp}</td>
                          <td className="text-left font-bold">{raceResult.win_horse}</td>
                        </tr>
                        <tr>
                          <td className="text-center font-bold text-gray-500">2nd</td>
                          <td className="text-center font-bold">{raceResult.place_pp || '—'}</td>
                          <td className="text-left font-bold">{raceResult.place_horse || '—'}</td>
                        </tr>
                        <tr>
                          <td className="text-center font-bold text-[#cd7f32]">3rd</td>
                          <td className="text-center font-bold">{raceResult.show_pp || '—'}</td>
                          <td className="text-left font-bold">{raceResult.show_horse || '—'}</td>
                        </tr>
                        {raceResult.fourth_pp && (
                          <tr>
                            <td className="text-center font-bold text-gray-400">4th</td>
                            <td className="text-center font-bold">{raceResult.fourth_pp}</td>
                            <td className="text-left font-bold">{raceResult.fourth_horse || '—'}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Payouts */}
                  <div className="overflow-x-auto mt-4">
                    <table className="web-table font-mono text-xs w-full">
                      <thead>
                        <tr>
                          <th className="py-2 text-left">WAGER</th>
                          <th className="py-2 text-left">WINNING #s</th>
                          <th className="py-2">PAYOUT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {raceResult.win_payout && (
                          <tr>
                            <td className="text-left font-bold">WIN ($2)</td>
                            <td className="text-left">{raceResult.win_pp}</td>
                            <td className="text-center font-bold text-green-700">${raceResult.win_payout.toFixed(2)}</td>
                          </tr>
                        )}
                        {raceResult.exacta_payout && (
                          <tr>
                            <td className="text-left font-bold">EXACTA ($1)</td>
                            <td className="text-left">{raceResult.win_pp}-{raceResult.place_pp}</td>
                            <td className="text-center font-bold text-green-700">${raceResult.exacta_payout.toFixed(2)}</td>
                          </tr>
                        )}
                        {raceResult.trifecta_payout && (
                          <tr>
                            <td className="text-left font-bold">TRIFECTA ($1)</td>
                            <td className="text-left">{raceResult.win_pp}-{raceResult.place_pp}-{raceResult.show_pp}</td>
                            <td className="text-center font-bold text-green-700">${raceResult.trifecta_payout.toFixed(2)}</td>
                          </tr>
                        )}
                        {raceResult.superfecta_payout && (
                          <tr>
                            <td className="text-left font-bold">SUPER ($0.10)</td>
                            <td className="text-left">{raceResult.win_pp}-{raceResult.place_pp}-{raceResult.show_pp}-{raceResult.fourth_pp || '?'}</td>
                            <td className="text-center font-bold text-green-700">${raceResult.superfecta_payout.toFixed(2)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Bet Performance — only if we had action on this race */}
                  {bets.length > 0 && (() => {
                    const wpp = String(raceResult.win_pp);
                    const ppp = String(raceResult.place_pp);
                    const spp = String(raceResult.show_pp);

                    const parsePP = (entry: string) => entry.replace(/^#/, '').split(' ')[0];

                    const betResults = bets.map(bet => {
                      const betKey = bet.bet_type.toLowerCase();
                      let hit = false;
                      let collected = 0;

                      if (betKey === 'win' && bet.entries_used?.length) {
                        const pickPP = parsePP(bet.entries_used[0]);
                        hit = pickPP === wpp;
                        if (hit && raceResult.win_payout) {
                          collected = (raceResult.win_payout / 2) * bet.stake;
                        }
                      } else if (betKey === 'exacta' && bet.entries_used?.length) {
                        const boxPPs = bet.entries_used.map(parsePP);
                        hit = boxPPs.includes(wpp) && boxPPs.includes(ppp);
                        if (hit && raceResult.exacta_payout) {
                          const n = boxPPs.length;
                          const combos = n * (n - 1);
                          const perCombo = bet.stake / combos;
                          collected = raceResult.exacta_payout * perCombo;
                        }
                      } else if (betKey === 'trifecta' && bet.entries_used?.length) {
                        const boxPPs = bet.entries_used.map(parsePP);
                        hit = boxPPs.includes(wpp) && boxPPs.includes(ppp) && boxPPs.includes(spp);
                        if (hit && raceResult.trifecta_payout) {
                          const n = boxPPs.length;
                          const combos = n * (n - 1) * (n - 2);
                          const perCombo = bet.stake / combos;
                          collected = raceResult.trifecta_payout * perCombo;
                        }
                      } else if (betKey === 'superfecta' && bet.entries_used?.length) {
                        const boxPPs = bet.entries_used.map(parsePP);
                        hit = boxPPs.includes(wpp) && boxPPs.includes(ppp) && boxPPs.includes(spp);
                        if (hit && raceResult.superfecta_payout) {
                          const n = boxPPs.length;
                          const combos = n * (n - 1) * (n - 2) * (n - 3);
                          const perCombo = bet.stake / combos;
                          collected = raceResult.superfecta_payout * perCombo;
                        }
                      }

                      return { ...bet, hit, collected, net: collected - bet.stake };
                    });

                    const totalStake = betResults.reduce((s, b) => s + b.stake, 0);
                    const totalCollected = betResults.reduce((s, b) => s + b.collected, 0);
                    const totalNet = totalCollected - totalStake;

                    return (
                      <div className="mt-6 border-t-4 border-[#000080] pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-serif font-bold text-[#000080] text-lg">COMMISSION BET PERFORMANCE</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="web-table font-mono text-xs w-full">
                            <thead>
                              <tr>
                                <th className="py-2 text-left">BET</th>
                                <th className="py-2">STAKE</th>
                                <th className="py-2">RESULT</th>
                                <th className="py-2">COLLECTED</th>
                                <th className="py-2">NET</th>
                              </tr>
                            </thead>
                            <tbody>
                              {betResults.map(bet => (
                                <tr key={bet.id} className={bet.hit ? 'bg-green-50' : ''}>
                                  <td className="text-left">
                                    <span className="font-bold capitalize">{bet.bet_type}{bet.doubled ? ' (2x)' : ''}</span>
                                    {bet.entries_used?.length && (
                                      <div className="text-[10px] text-gray-600 mt-0.5">{bet.entries_used.join(', ')}</div>
                                    )}
                                  </td>
                                  <td className="text-center">${bet.stake.toFixed(2)}</td>
                                  <td className="text-center">
                                    <span className={`font-bold ${bet.hit ? 'text-green-700' : 'text-web-red'}`}>
                                      {bet.hit ? 'HIT' : 'MISS'}
                                    </span>
                                  </td>
                                  <td className="text-center font-bold">{bet.hit ? `$${bet.collected.toFixed(2)}` : '—'}</td>
                                  <td className={`text-center font-bold ${bet.net >= 0 ? 'text-green-700' : 'text-web-red'}`}>
                                    {bet.net >= 0 ? '+' : ''}{bet.net.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="border-t-2 border-black">
                                <td className="text-left font-bold">TOTAL</td>
                                <td className="text-center font-bold">${totalStake.toFixed(2)}</td>
                                <td className="text-center">—</td>
                                <td className="text-center font-bold">${totalCollected.toFixed(2)}</td>
                                <td className={`text-center font-bold ${totalNet >= 0 ? 'text-green-700' : 'text-web-red'}`}>
                                  {totalNet >= 0 ? '+' : ''}${totalNet.toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {raceResult.settled_at && (
                    <div className="mt-3 font-mono text-[10px] text-gray-400">
                      Settled: {new Date(raceResult.settled_at).toLocaleString()}
                    </div>
                  )}

                  {/* Admin: edit results */}
                  {isAdmin && (
                    <div className="mt-4 border-t-2 border-gray-300 pt-3">
                      <button
                        onClick={() => {
                          setResultForm({
                            win_pp: raceResult.win_pp?.toString() || '',
                            place_pp: raceResult.place_pp?.toString() || '',
                            show_pp: raceResult.show_pp?.toString() || '',
                            win_payout: raceResult.win_payout?.toString() || '',
                            exacta_payout: raceResult.exacta_payout?.toString() || '',
                            trifecta_payout: raceResult.trifecta_payout?.toString() || '',
                            superfecta_payout: raceResult.superfecta_payout?.toString() || '',
                          });
                          setRaceResult(null);
                        }}
                        className="px-3 py-1 bg-gray-100 border border-gray-400 font-mono text-xs"
                      >
                        EDIT RESULTS
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {isAdmin ? (
                    <div>
                      <p className="font-mono text-xs text-gray-600 mb-4">Enter post positions for the top 3 finishers and payouts.</p>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div>
                          <label className="font-mono text-xs text-gray-600 block mb-1">WIN (PP#)</label>
                          <input type="number" value={resultForm.win_pp} onChange={e => setResultForm({...resultForm, win_pp: e.target.value})}
                            className="w-full px-2 py-1 border-2 border-gray-400 font-mono text-sm" placeholder="#" />
                        </div>
                        <div>
                          <label className="font-mono text-xs text-gray-600 block mb-1">PLACE (PP#)</label>
                          <input type="number" value={resultForm.place_pp} onChange={e => setResultForm({...resultForm, place_pp: e.target.value})}
                            className="w-full px-2 py-1 border-2 border-gray-400 font-mono text-sm" placeholder="#" />
                        </div>
                        <div>
                          <label className="font-mono text-xs text-gray-600 block mb-1">SHOW (PP#)</label>
                          <input type="number" value={resultForm.show_pp} onChange={e => setResultForm({...resultForm, show_pp: e.target.value})}
                            className="w-full px-2 py-1 border-2 border-gray-400 font-mono text-sm" placeholder="#" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="font-mono text-xs text-gray-600 block mb-1">WIN ($2)</label>
                          <input type="number" step="0.01" value={resultForm.win_payout} onChange={e => setResultForm({...resultForm, win_payout: e.target.value})}
                            className="w-full px-2 py-1 border-2 border-gray-400 font-mono text-sm" placeholder="$0.00" />
                        </div>
                        <div>
                          <label className="font-mono text-xs text-gray-600 block mb-1">EXACTA ($1)</label>
                          <input type="number" step="0.01" value={resultForm.exacta_payout} onChange={e => setResultForm({...resultForm, exacta_payout: e.target.value})}
                            className="w-full px-2 py-1 border-2 border-gray-400 font-mono text-sm" placeholder="$0.00" />
                        </div>
                        <div>
                          <label className="font-mono text-xs text-gray-600 block mb-1">TRIFECTA ($1)</label>
                          <input type="number" step="0.01" value={resultForm.trifecta_payout} onChange={e => setResultForm({...resultForm, trifecta_payout: e.target.value})}
                            className="w-full px-2 py-1 border-2 border-gray-400 font-mono text-sm" placeholder="$0.00" />
                        </div>
                        <div>
                          <label className="font-mono text-xs text-gray-600 block mb-1">SUPERFECTA ($0.10)</label>
                          <input type="number" step="0.01" value={resultForm.superfecta_payout} onChange={e => setResultForm({...resultForm, superfecta_payout: e.target.value})}
                            className="w-full px-2 py-1 border-2 border-gray-400 font-mono text-sm" placeholder="$0.00" />
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          setResultSaving(true);
                          await fetch('/api/lab/results', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              race_id: Number(raceId),
                              win_pp: resultForm.win_pp ? Number(resultForm.win_pp) : null,
                              place_pp: resultForm.place_pp ? Number(resultForm.place_pp) : null,
                              show_pp: resultForm.show_pp ? Number(resultForm.show_pp) : null,
                              win_payout: resultForm.win_payout ? Number(resultForm.win_payout) : null,
                              exacta_payout: resultForm.exacta_payout ? Number(resultForm.exacta_payout) : null,
                              trifecta_payout: resultForm.trifecta_payout ? Number(resultForm.trifecta_payout) : null,
                              superfecta_payout: resultForm.superfecta_payout ? Number(resultForm.superfecta_payout) : null,
                            })
                          });
                          setResultSaving(false);
                          window.location.reload();
                        }}
                        disabled={resultSaving}
                        className="w-full px-4 py-2 bg-black text-white font-mono text-sm border-2 border-black"
                      >
                        {resultSaving ? 'SAVING...' : 'SAVE RESULTS'}
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="font-mono text-sm text-gray-500">No results yet.</div>
                      <div className="font-mono text-xs text-gray-400 mt-1">Results are posted after the race is official.</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

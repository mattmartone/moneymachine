import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  scratched: boolean | null;
}

interface Bet {
  id: number;
  bet_type: string;
  stake: number;
  doubled: boolean;
  conviction: string;
}

type Tab = 'field' | 'commission' | 'lab';

const TOKEN_COST = 200000;

export function RaceDetail() {
  const navigate = useNavigate();
  const { raceId } = useParams();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('ftc_token');

  const [entries, setEntries] = useState<Entry[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [raceInfo, setRaceInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('field');
  const [commissionUnlocked, setCommissionUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    if (!raceId) return;

    fetch(`/api/lab/entries?race_id=${raceId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.entries) setEntries(data.entries.filter((e: Entry) => !e.scratched));
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
  }, [token, navigate, raceId]);

  const formatTime = (t: string | null) => {
    if (!t) return 'TBD';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const winBet = bets.find(b => b.bet_type === 'win');
  const exotics = bets.filter(b => b.bet_type !== 'win');

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
        <AppNav />

        <button onClick={() => navigate('/app/today')} className="font-sans text-xs font-bold text-[#000080] underline mb-4">
          ← Back to today's picks
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
            <div className="font-mono text-xs text-gray-300 mt-1">{raceInfo.conditions} • {raceInfo.field_size} horses</div>
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
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 font-serif font-bold text-sm border-2 border-b-0 -mb-[2px] ml-1 ${
              activeTab === 'lab' ? 'bg-white border-black z-10' : 'bg-web-gray border-gray-400 text-gray-600 hover:bg-gray-200'
            }`}
          >
            BUILD
          </button>
          <button
            onClick={() => setActiveTab('commission')}
            className={`px-4 py-2 font-serif font-bold text-sm border-2 border-b-0 -mb-[2px] ml-1 ${
              activeTab === 'commission' ? 'bg-white border-black z-10' : 'bg-web-gray border-gray-400 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🤌 COMMISSION
          </button>
        </div>

        {/* Tab content */}
        <div className="border-2 border-t-0 border-black bg-white p-4">

          {/* FIELD TAB — always free */}
          {activeTab === 'field' && (
            <div>
              {loading ? (
                <div className="font-mono animate-blink">Loading field...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="web-table font-mono text-xs w-full min-w-[700px]">
                    <thead>
                      <tr>
                        <th className="py-2">PP</th>
                        <th className="py-2 text-left">HORSE</th>
                        <th className="py-2">ML</th>
                        <th className="py-2">STYLE</th>
                        <th className="py-2">BEST</th>
                        <th className="py-2">LAST</th>
                        <th className="py-2">DAYS</th>
                        <th className="py-2 text-left">JOCKEY</th>
                        <th className="py-2 text-left">TRAINER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map(e => {
                        const isFave = entries.length > 0 && e.post_position === entries.reduce((fav, curr) => {
                          const fml = parseOdds(fav.morning_line_odds);
                          const cml = parseOdds(curr.morning_line_odds);
                          return cml < fml ? curr : fav;
                        }, entries[0]).post_position;

                        return (
                          <tr key={e.id} className={`hover:bg-[#ffffcc] ${isFave ? 'bg-[#ffe6e6]' : ''}`}>
                            <td className="font-bold text-center">{e.post_position}</td>
                            <td className="font-bold text-left">{e.horse_name}</td>
                            <td className="text-center">{e.live_odds || e.morning_line_odds || '—'}</td>
                            <td className="text-center">
                              <span className={`px-1 ${e.running_style === 'E' ? 'text-web-red font-bold' : e.running_style === 'E/P' ? 'text-orange-600' : e.running_style === 'S' ? 'text-blue-600' : ''}`}>
                                {e.running_style || '—'}
                              </span>
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
                <span className="bg-[#ffe6e6] px-1">Highlighted</span> = ML favorite •
                <span className="text-web-red font-bold ml-2">E</span> = speed •
                <span className="text-orange-600 ml-1">E/P</span> = presser •
                P = stalker •
                <span className="text-blue-600 ml-1">S</span> = closer
              </div>
            </div>
          )}

          {/* COMMISSION TAB — token gated */}
          {activeTab === 'commission' && (
            <div>
              {bets.length === 0 ? (
                <div className="p-6 text-center font-serif italic text-gray-500">
                  No Commission picks for this race.
                </div>
              ) : !commissionUnlocked ? (
                <div className="p-6 text-center">
                  <div className="font-serif text-lg mb-2">The Commission has spoken on this race.</div>
                  <p className="font-mono text-sm text-gray-600 mb-4">
                    {bets.length} bet{bets.length > 1 ? 's' : ''} recommended • ${bets.reduce((s, b) => s + b.stake, 0).toFixed(2)} total stake
                  </p>
                  <div className="bg-[#ffffcc] border-2 border-black p-4 inline-block mb-4">
                    <div className="font-mono text-sm text-gray-600">Unlock cost</div>
                    <div className="font-mono text-2xl font-bold">{TOKEN_COST.toLocaleString()} tokens</div>
                  </div>
                  <br />
                  <button
                    onClick={() => setCommissionUnlocked(true)}
                    className="px-8 py-3 bg-web-gray font-sans font-bold text-black border-2 border-black shadow-outset active:shadow-inset"
                  >
                    UNLOCK PICKS
                  </button>
                </div>
              ) : (
                <div>
                  {winBet && (
                    <div className="mb-4 bg-[#ffffcc] border-2 border-black p-4">
                      <div className="font-sans font-bold text-web-red mb-1">WIN BET{winBet.doubled ? ' — DOUBLED STAKE' : ''}</div>
                      <div className="font-mono text-sm">{winBet.conviction}</div>
                      <div className="font-mono text-xs text-gray-600 mt-1">Stake: ${winBet.stake.toFixed(2)}</div>
                    </div>
                  )}
                  {!winBet && (
                    <div className="mb-4 font-mono text-sm text-gray-600 italic bg-gray-50 p-3 border border-gray-300">
                      Exotics only — fave is protected, no win bet against.
                    </div>
                  )}
                  <div className="space-y-2">
                    {exotics.map(bet => (
                      <div key={bet.id} className="flex justify-between items-start border-b border-gray-200 pb-2">
                        <div>
                          <span className="font-mono font-bold text-sm capitalize">{bet.bet_type}</span>
                          <div className="font-mono text-xs text-gray-600 mt-0.5">{bet.conviction}</div>
                        </div>
                        <span className="font-mono font-bold">${bet.stake.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t-2 border-black flex justify-between">
                    <span className="font-sans font-bold">TOTAL STAKE</span>
                    <span className="font-mono text-lg font-bold">${bets.reduce((s, b) => s + b.stake, 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BUILD TAB — run your own analysis */}
          {activeTab === 'lab' && (
            <div className="p-6 text-center">
              <div className="font-serif text-lg mb-2">Build Your Own Bets</div>
              <p className="font-mono text-sm text-gray-600 mb-4">
                Select strategies from the marketplace. Run them against this field. Build your box.
              </p>
              <div className="bg-gray-100 border-2 border-gray-300 p-6 text-center font-mono text-sm text-gray-500">
                Coming soon — pick your strategies, see the scores, construct your exotic box.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function parseOdds(ml: string | null): number {
  if (!ml) return 999;
  try {
    if (ml.includes('/')) {
      const [n, d] = ml.split('/').map(Number);
      return n / d;
    }
    if (ml.includes('-')) {
      const [n, d] = ml.split('-').map(Number);
      return n / d;
    }
    return parseFloat(ml);
  } catch {
    return 999;
  }
}

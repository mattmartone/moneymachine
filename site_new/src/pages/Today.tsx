import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNav } from '../components/AppNav';

const TOKEN_COST_PER_RACE = 200000;

interface TodayRace {
  id: number;
  track: string;
  race_number: number;
  conditions: string;
  class: string;
  distance: string;
  surface: string;
  field_size: number;
  post_time: string | null;
}

interface MarketplaceStrategy {
  name: string;
  type: string;
  description: string;
  win_rate: number | null;
}

export function Today() {
  const navigate = useNavigate();
  const token = localStorage.getItem('ftc_token');
  const today = new Date().toISOString().split('T')[0];

  const [races, setRaces] = useState<TodayRace[]>([]);
  const [strategies, setStrategies] = useState<MarketplaceStrategy[]>([]);
  const [selectedRace, setSelectedRace] = useState<TodayRace | null>(null);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [userTokens, setUserTokens] = useState(0);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetch('/api/lab/races', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.cards) {
          const todayRaces = data.cards
            .filter((c: any) => {
              const d = typeof c.date === 'string' ? c.date.split('T')[0] : new Date(c.date).toISOString().split('T')[0];
              return d === today;
            })
            .flatMap((c: any) => c.races.map((r: any) => ({ ...r, track: c.track })));
          todayRaces.sort((a: TodayRace, b: TodayRace) => {
            if (!a.post_time && !b.post_time) return 0;
            if (!a.post_time) return 1;
            if (!b.post_time) return -1;
            return a.post_time.localeCompare(b.post_time);
          });
          setRaces(todayRaces);
        }
      });
    fetch('/api/strategies', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.strategies) setStrategies(data.strategies.filter((s: any) => s.active));
      });
    fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data?.tokens !== undefined) setUserTokens(data.tokens); });
  }, [token, navigate, today]);

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const nextRaceIdx = races.findIndex(r => r.post_time && r.post_time > currentTime);

  const filteredStrategies = strategies.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const cost = TOKEN_COST_PER_RACE;
  const canAfford = cost <= userTokens;

  const handleCheckout = async () => {
    if (!selectedRace || selectedStrategies.length === 0) return;
    if (!canAfford) { setErrorMsg('Insufficient tokens.'); setStatus('error'); return; }
    setStatus('submitting');
    try {
      const res = await fetch('/api/lab/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ race_ids: [selectedRace.id], strategies: selectedStrategies })
      });
      if (res.ok) {
        setStatus('success');
        setUserTokens(prev => prev - cost);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Something went wrong');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Failed. Try again.');
      setStatus('error');
    }
  };

  const formatTime = (t: string | null) => {
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
        <AppNav />

        <h3 className="font-serif text-xl font-bold mb-4 border-b-2 border-black pb-1">TODAY'S RACES</h3>

        {races.length === 0 ? (
          <div className="font-mono text-sm text-gray-500 p-6 border border-gray-300 bg-gray-50 text-center">
            No races loaded for today.
          </div>
        ) : !selectedRace ? (
          /* Timeline view */
          <div className="space-y-1">
            {races.map((race, idx) => {
              const isNext = idx === nextRaceIdx;
              const isPast = race.post_time ? race.post_time < currentTime : false;
              return (
                <div
                  key={race.id}
                  onClick={() => setSelectedRace(race)}
                  className={`flex items-center gap-4 px-4 py-3 border-2 cursor-pointer transition-colors
                    ${isNext ? 'border-[#000080] bg-[#e6e6ff] shadow-[4px_4px_0px_0px_rgba(0,0,128,0.3)]' : isPast ? 'border-gray-300 bg-gray-100 opacity-60' : 'border-gray-400 bg-white hover:bg-[#fffbe0]'}`}
                >
                  <div className="font-mono text-lg font-bold w-16 shrink-0 text-center">
                    {formatTime(race.post_time)}
                  </div>
                  <div className="w-px h-10 bg-gray-300 shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-[#000080]">{race.track}</span>
                      <span className="font-mono text-xs bg-gray-200 px-1.5 py-0.5 border border-gray-400">R{race.race_number}</span>
                      {isNext && <span className="font-mono text-[10px] bg-[#000080] text-white px-1.5 py-0.5">NEXT UP</span>}
                    </div>
                    <div className="font-mono text-xs text-gray-600 mt-0.5">
                      {race.conditions} • {race.distance} • {race.surface} • {race.field_size} horses
                    </div>
                  </div>
                  <span className="font-mono text-sm text-gray-400">→</span>
                </div>
              );
            })}
          </div>
        ) : status === 'success' ? (
          /* Success state */
          <div>
            <button
              onClick={() => { setSelectedRace(null); setSelectedStrategies([]); setStatus('idle'); }}
              className="font-sans text-xs font-bold text-[#000080] underline mb-4"
            >
              ← Back to timeline
            </button>
            <div className="bg-[#e6ffe6] border-4 border-[#008000] p-6 text-center">
              <div className="font-bold text-[#008000] text-xl mb-2">ORDER PLACED!</div>
              <p className="font-serif text-lg">Analysis for {selectedRace.track} R{selectedRace.race_number} is being processed.</p>
            </div>
          </div>
        ) : (
          /* Race detail + strategy selection + checkout */
          <div>
            <button
              onClick={() => { setSelectedRace(null); setSelectedStrategies([]); setStatus('idle'); }}
              className="font-sans text-xs font-bold text-[#000080] underline mb-4"
            >
              ← Back to timeline
            </button>

            {/* Race header */}
            <div className="bg-black text-white px-4 py-3 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-mono text-lg font-bold">{formatTime(selectedRace.post_time)}</span>
                  <span className="mx-3 opacity-50">|</span>
                  <span className="font-serif font-bold text-lg">{selectedRace.track} — R{selectedRace.race_number}</span>
                </div>
                <span className="font-mono text-sm">{selectedRace.distance} • {selectedRace.surface}</span>
              </div>
              <div className="font-mono text-xs text-gray-300 mt-1">{selectedRace.conditions} • {selectedRace.field_size} horses</div>
            </div>

            {/* Strategy selection */}
            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="font-sans font-bold text-sm">SELECT STRATEGIES</label>
                <div className="flex gap-3 font-sans text-xs font-bold">
                  <button type="button" onClick={() => setSelectedStrategies(strategies.map(s => s.name))} className="text-[#000080] underline">All</button>
                  <button type="button" onClick={() => setSelectedStrategies([])} className="text-[#000080] underline">Clear</button>
                </div>
              </div>

              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search strategies..."
                className="w-full mb-2 px-2 py-1 border-2 border-gray-400 shadow-inset font-mono text-sm"
              />

              <div className="border-2 border-gray-400 shadow-inset bg-gray-100 max-h-48 overflow-y-auto divide-y divide-gray-300">
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
                    <span className="font-bold text-[#000080]">{s.name}</span>
                    {s.win_rate !== null && <span className="text-xs text-green-700">{s.win_rate}% W</span>}
                  </label>
                ))}
              </div>
              <div className="font-mono text-xs text-gray-500 mt-1">{selectedStrategies.length} selected</div>
            </div>

            {/* Checkout */}
            {selectedStrategies.length > 0 && (
              <div className="bg-[#ffffcc] border-2 border-black p-4 shadow-inset mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-sans font-bold text-sm">{selectedRace.track} R{selectedRace.race_number}</span>
                  <span className="font-mono text-lg font-bold">{cost.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-sans text-sm text-gray-600">Your balance:</span>
                  <span className={`font-mono text-sm font-bold ${canAfford ? 'text-green-700' : 'text-web-red'}`}>
                    {canAfford ? `${(userTokens - cost).toLocaleString()} remaining` : 'INSUFFICIENT'}
                  </span>
                </div>
                {!canAfford && (
                  <a href="/shop" className="block mb-3 font-sans text-xs font-bold text-[#000080] underline text-center">Buy more tokens →</a>
                )}

                {status === 'error' && (
                  <div className="text-web-red font-bold text-sm mb-3 bg-[#ffe6e6] border border-web-red p-2">* {errorMsg}</div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={status === 'submitting' || !canAfford}
                  className="w-full px-6 py-3 bg-web-gray font-sans font-bold text-lg text-black border-2 border-black shadow-outset active:shadow-inset cursor-pointer disabled:opacity-50"
                >
                  {status === 'submitting' ? 'PROCESSING...' : 'RUN ANALYSIS'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNav } from '../components/AppNav';

interface CommissionRace {
  race_id: number;
  track: string;
  race_number: number;
  post_time: string | null;
}

interface Entry {
  id: number;
  horse_name: string;
  post_position: number;
  morning_line_odds: string | null;
  live_odds: string | null;
}

export function LiveOdds() {
  const navigate = useNavigate();
  const token = localStorage.getItem('ftc_token');

  const [races, setRaces] = useState<CommissionRace[]>([]);
  const [selectedRace, setSelectedRace] = useState<CommissionRace | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [oddsInput, setOddsInput] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetch('/api/lab/today', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.picks) {
          const seen = new Map<number, CommissionRace>();
          for (const pick of data.picks) {
            if (!seen.has(pick.race_id)) {
              seen.set(pick.race_id, {
                race_id: pick.race_id,
                track: pick.track,
                race_number: pick.race_number,
                post_time: pick.post_time,
              });
            }
          }
          const raceList = Array.from(seen.values()).sort((a, b) => {
            if (!a.post_time && !b.post_time) return 0;
            if (!a.post_time) return 1;
            if (!b.post_time) return -1;
            return a.post_time.localeCompare(b.post_time);
          });
          setRaces(raceList);
        }
        setLoading(false);
      });
  }, [token, navigate]);

  const loadEntries = (race: CommissionRace) => {
    setSelectedRace(race);
    setSaved(false);
    fetch(`/api/lab/entries?race_id=${race.race_id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.entries) {
          const sorted = data.entries.filter((e: Entry) => !e.scratched).sort((a: Entry, b: Entry) => a.post_position - b.post_position);
          setEntries(sorted);
          const initial: Record<number, string> = {};
          for (const e of sorted) {
            initial[e.id] = e.live_odds || '';
          }
          setOddsInput(initial);
        }
      });
  };

  const handleSave = async () => {
    setSaving(true);
    for (const entry of entries) {
      const odds = oddsInput[entry.id];
      if (odds && odds !== entry.live_odds) {
        await fetch('/api/lab/entries', {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry_id: entry.id, live_odds: odds })
        });
      }
    }
    setSaving(false);
    setSaved(true);
  };

  const formatTime = (t: string | null) => {
    if (!t) return 'TBD';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-lg mx-auto">
        <AppNav />

        <div className="bg-[#000080] text-white font-bold p-2 px-3 mb-4 text-center">
          <span className="font-serif">LIVE ODDS ENTRY</span>
        </div>

        {loading ? (
          <div className="font-mono animate-blink p-4 text-center">Loading...</div>
        ) : !selectedRace ? (
          <div>
            <p className="font-mono text-sm text-gray-600 mb-4 text-center">
              Select a Commission race to update live odds.
            </p>
            <div className="space-y-2">
              {races.map(race => (
                <button
                  key={race.race_id}
                  onClick={() => loadEntries(race)}
                  className="w-full p-4 border-2 border-black bg-white text-left hover:bg-[#ffffcc] active:bg-[#fffbe0]"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-serif font-bold text-lg text-[#000080]">{race.track}</span>
                      <span className="font-mono text-sm ml-2">R{race.race_number}</span>
                    </div>
                    <span className="font-mono text-sm">{formatTime(race.post_time)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => { setSelectedRace(null); setEntries([]); }}
              className="font-sans text-xs font-bold text-[#000080] underline mb-4"
            >
              ← Back to races
            </button>

            <div className="bg-black text-white px-3 py-2 mb-4 text-center">
              <span className="font-serif font-bold">{selectedRace.track} — R{selectedRace.race_number}</span>
              <span className="font-mono text-sm ml-2">{formatTime(selectedRace.post_time)}</span>
            </div>

            <div className="space-y-2">
              {entries.map(e => (
                <div key={e.id} className="flex items-center gap-3 border-b border-gray-300 pb-2">
                  <div className="font-mono text-xl font-bold w-8 text-center text-[#000080]">{e.post_position}</div>
                  <div className="flex-1">
                    <div className="font-mono text-sm font-bold">{e.horse_name}</div>
                    <div className="font-mono text-xs text-gray-500">ML: {e.morning_line_odds || '—'}</div>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={oddsInput[e.id] || ''}
                    onChange={ev => setOddsInput({ ...oddsInput, [e.id]: ev.target.value })}
                    placeholder="odds"
                    className="w-20 px-2 py-2 border-2 border-gray-400 font-mono text-lg text-center shadow-inset"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-4 px-6 py-4 bg-[#000080] text-white font-sans font-bold text-lg border-2 border-black shadow-outset active:shadow-inset disabled:opacity-50"
            >
              {saving ? 'SAVING...' : saved ? '✓ SAVED' : 'SAVE LIVE ODDS'}
            </button>

            {saved && (
              <div className="mt-3 bg-[#e6ffe6] border-2 border-green-600 p-3 text-center font-mono text-sm">
                Odds updated. Server will compare to ML and alert if bets need adjusting.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

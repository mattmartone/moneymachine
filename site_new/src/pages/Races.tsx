import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNav } from '../components/AppNav';

interface RaceCard {
  track: string;
  date: string;
  races: Race[];
}

interface Race {
  id: number;
  race_number: number;
  conditions: string;
  class: string;
  distance: string;
  surface: string;
  field_size: number;
}

interface Entry {
  id: number;
  post_position: number;
  horse_name: string;
  horse_id: number;
  sire: string;
  dam: string;
  morning_line_odds: string;
  live_odds: string | null;
  jockey: string;
  trainer: string;
  weight: number;
  owner: string;
  equipment: string;
  last_race_date: string;
  days_since_last: number;
  best_beyer: number;
  last_beyer: number;
  lifetime_earnings: number;
  running_style: string;
  scratched: boolean;
}

const STYLE_LABELS: Record<string, string> = {
  'E': 'Early Speed',
  'E/P': 'Presser',
  'P': 'Stalker',
  'S': 'Closer',
};

export function Races() {
  const navigate = useNavigate();
  const token = localStorage.getItem('ftc_token');
  const today = new Date().toISOString().split('T')[0];

  const [raceCards, setRaceCards] = useState<RaceCard[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetch('/api/lab/races', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data?.cards) setRaceCards(data.cards); })
      .catch(() => {});
  }, [token, navigate]);

  const cardsForDate = raceCards.filter(c => {
    const d = typeof c.date === 'string' ? c.date.split('T')[0] : new Date(c.date).toISOString().split('T')[0];
    return d === selectedDate;
  });

  const tracksForDate = cardsForDate.map(c => c.track);

  const racesForTrack = cardsForDate
    .filter(c => c.track === selectedTrack)
    .flatMap(c => c.races);

  const loadEntries = async (raceId: number) => {
    setLoading(true);
    setSelectedRaceId(raceId);
    setExpandedEntry(null);
    const race = racesForTrack.find(r => r.id === raceId) || null;
    setSelectedRace(race);

    const res = await fetch(`/api/lab/entries?race_id=${raceId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setEntries(data?.entries || []);
    setLoading(false);
  };

  const updateEntry = async (entryId: number, updates: { live_odds?: string; scratched?: boolean }) => {
    await fetch('/api/lab/entries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ entry_id: entryId, ...updates })
    });
    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, ...updates } : e
    ));
  };

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
        <AppNav />

        <h3 className="font-serif text-xl font-bold mb-4 border-b-2 border-black pb-1">RACES</h3>

        {/* Filters */}
        <div className="flex gap-3 items-center mb-4 flex-wrap">
          <button
            type="button"
            onClick={() => { setSelectedDate(today); setSelectedTrack(''); setSelectedRaceId(null); setEntries([]); }}
            className={`px-3 py-1 font-sans font-bold text-xs border-2 border-black ${selectedDate === today ? 'bg-[#000080] text-white' : 'bg-web-gray shadow-outset active:shadow-inset'}`}
          >
            TODAY
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => { setSelectedDate(e.target.value); setSelectedTrack(''); setSelectedRaceId(null); setEntries([]); }}
            className="px-2 py-1 border-2 border-gray-400 shadow-inset font-mono text-sm bg-white"
          />

          {tracksForDate.length > 0 && (
            <select
              value={selectedTrack}
              onChange={e => { setSelectedTrack(e.target.value); setSelectedRaceId(null); setEntries([]); }}
              className="px-2 py-1 border-2 border-gray-400 shadow-inset font-mono text-sm bg-white"
            >
              <option value="">Select track...</option>
              {tracksForDate.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          {selectedTrack && racesForTrack.length > 0 && (
            <div className="flex gap-1">
              {racesForTrack.map(race => (
                <button
                  key={race.id}
                  type="button"
                  onClick={() => loadEntries(race.id)}
                  className={`w-8 h-8 font-mono text-sm font-bold border-2 ${selectedRaceId === race.id ? 'border-[#000080] bg-[#e6e6ff] text-[#000080]' : 'border-gray-300 bg-white text-gray-600 hover:bg-[#fffbe0]'}`}
                >
                  {race.race_number}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* No data states */}
        {tracksForDate.length === 0 && (
          <div className="font-mono text-sm text-gray-500 p-4 border border-gray-300 bg-gray-50">
            No races loaded for {selectedDate === today ? 'today' : selectedDate}.
          </div>
        )}

        {/* Race header */}
        {selectedRace && (
          <div className="bg-black text-white px-4 py-2 mb-3 font-mono text-sm flex justify-between items-center">
            <span className="font-bold">R{selectedRace.race_number} — {selectedTrack}</span>
            <span>{[selectedRace.class, selectedRace.distance, selectedRace.surface].filter(Boolean).join(' • ')}</span>
          </div>
        )}

        {/* Loading */}
        {loading && <div className="font-mono text-sm text-gray-500 p-4">Loading field...</div>}

        {/* Entries */}
        {!loading && entries.length > 0 && (
          <div className="space-y-1">
            {/* Header row */}
            <div className="flex items-center gap-4 px-3 py-1 border-b-2 border-gray-400">
              <span className="font-mono text-[10px] font-bold text-gray-500 w-6 text-center shrink-0">PP</span>
              <span className="font-mono text-[10px] font-bold text-gray-500 flex-1">HORSE</span>
              <span className="font-mono text-[10px] font-bold text-gray-500 w-20 text-center shrink-0">STYLE</span>
              <span className="font-mono text-[10px] font-bold text-gray-500 w-14 text-center shrink-0">ML</span>
              <span className="font-mono text-[10px] font-bold text-gray-500 w-14 text-center shrink-0">LIVE</span>
              <span className="font-mono text-[10px] font-bold text-gray-500 w-28 text-right shrink-0">JOCKEY / TRAINER</span>
              <span className="font-mono text-[10px] font-bold text-gray-500 w-8 text-right shrink-0">BSR</span>
              <span className="font-mono text-[10px] font-bold text-gray-500 shrink-0 w-5"></span>
              <span className="font-mono text-[10px] font-bold text-gray-500 shrink-0 w-3"></span>
            </div>
            {entries.map(entry => {
              const isExpanded = expandedEntry === entry.id;
              const isScratch = entry.scratched;
              return (
                <div key={entry.id} className={`border-2 ${isScratch ? 'border-gray-300 bg-gray-100 opacity-60' : 'border-gray-400 bg-white'}`}>
                  {/* Collapsed row */}
                  <div
                    className="flex items-center gap-4 px-3 py-2 cursor-pointer hover:bg-[#fffbe0]"
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                  >
                    <span className="font-mono text-sm font-bold w-6 text-center shrink-0">{entry.post_position || '—'}</span>
                    <span className={`font-serif font-bold flex-1 ${isScratch ? 'line-through text-gray-500' : 'text-[#000080]'}`}>
                      {entry.horse_name}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 bg-gray-200 border border-gray-400 w-20 text-center shrink-0">
                      {entry.running_style ? (STYLE_LABELS[entry.running_style] || entry.running_style) : '—'}
                    </span>
                    <input
                      type="text"
                      defaultValue={entry.morning_line_odds || ''}
                      placeholder="ML"
                      onClick={e => e.stopPropagation()}
                      onBlur={e => {
                        const val = e.target.value.trim();
                        if (val !== (entry.morning_line_odds || '')) {
                          updateEntry(entry.id, { morning_line_odds: val || undefined });
                        }
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      className="font-mono text-xs w-14 text-center px-1 py-0.5 border border-gray-300 bg-white focus:border-[#000080] outline-none shrink-0"
                    />
                    <input
                      type="text"
                      defaultValue={entry.live_odds || ''}
                      placeholder="live"
                      onClick={e => e.stopPropagation()}
                      onBlur={e => {
                        const val = e.target.value.trim();
                        if (val !== (entry.live_odds || '')) {
                          updateEntry(entry.id, { live_odds: val || undefined });
                        }
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      className="font-mono text-xs w-14 text-center px-1 py-0.5 border border-gray-300 bg-white focus:border-[#000080] outline-none shrink-0"
                    />
                    <div className="font-mono text-[10px] text-gray-500 w-28 text-right shrink-0 leading-tight">
                      <div>{entry.jockey || '—'}</div>
                      <div className="text-gray-400">{entry.trainer || '—'}</div>
                    </div>
                    <span className="font-mono text-xs text-gray-500 w-8 text-right shrink-0">{entry.last_beyer || '—'}</span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); updateEntry(entry.id, { scratched: !isScratch }); }}
                      className={`font-mono text-[10px] px-1.5 py-0.5 border shrink-0 ${isScratch ? 'border-[#008000] text-[#008000] bg-[#e6ffe6]' : 'border-gray-300 text-gray-400 hover:border-web-red hover:text-web-red'}`}
                      title={isScratch ? 'Reinstate' : 'Scratch'}
                    >
                      {isScratch ? '✓' : '✕'}
                    </button>
                    <span className="font-mono text-[10px] text-gray-400 cursor-pointer shrink-0">{isExpanded ? '▼' : '▶'}</span>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-300 px-4 py-3 bg-[#fafafa]">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono mb-3">
                        <div><span className="text-gray-500">Trainer:</span> {entry.trainer || '—'}</div>
                        <div><span className="text-gray-500">Jockey:</span> {entry.jockey || '—'}</div>
                        <div><span className="text-gray-500">Weight:</span> {entry.weight || '—'}</div>
                        <div><span className="text-gray-500">Sire:</span> {entry.sire || '—'}</div>
                        <div><span className="text-gray-500">Dam:</span> {entry.dam || '—'}</div>
                        <div><span className="text-gray-500">Owner:</span> {entry.owner || '—'}</div>
                        <div><span className="text-gray-500">ML Odds:</span> {entry.morning_line_odds || '—'}</div>
                        <div><span className="text-gray-500">Live Odds:</span> {entry.live_odds || 'not set'}</div>
                        <div><span className="text-gray-500">Style:</span> {entry.running_style ? (STYLE_LABELS[entry.running_style] || entry.running_style) : '—'}</div>
                        <div><span className="text-gray-500">Best Beyer:</span> {entry.best_beyer || '—'}</div>
                        <div><span className="text-gray-500">Last Beyer:</span> {entry.last_beyer || '—'}</div>
                        <div><span className="text-gray-500">Days Since:</span> {entry.days_since_last || '—'}</div>
                        <div><span className="text-gray-500">Earnings:</span> {entry.lifetime_earnings ? `$${entry.lifetime_earnings.toLocaleString()}` : '—'}</div>
                        <div><span className="text-gray-500">Equipment:</span> {entry.equipment || '—'}</div>
                        <div><span className="text-gray-500">Last Race:</span> {entry.last_race_date || '—'}</div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-4 items-center border-t border-gray-300 pt-3">
                        <div className="flex items-center gap-2">
                          <label className="font-sans text-xs font-bold">LIVE ODDS:</label>
                          <input
                            type="text"
                            defaultValue={entry.live_odds || ''}
                            placeholder="e.g. 5/1"
                            onBlur={e => {
                              if (e.target.value !== (entry.live_odds || '')) {
                                updateEntry(entry.id, { live_odds: e.target.value || undefined });
                              }
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                            className="w-20 px-2 py-1 border-2 border-gray-400 shadow-inset font-mono text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => updateEntry(entry.id, { scratched: !isScratch })}
                          className={`px-3 py-1 font-sans font-bold text-xs border-2 ${isScratch ? 'border-[#008000] text-[#008000] bg-[#e6ffe6]' : 'border-web-red text-web-red bg-[#ffe6e6]'}`}
                        >
                          {isScratch ? 'REINSTATE' : 'SCRATCH'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && selectedRaceId && entries.length === 0 && (
          <div className="font-mono text-sm text-gray-500 p-4 border border-gray-300">No entries loaded for this race.</div>
        )}
      </div>
    </div>
  );
}

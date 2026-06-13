import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppNav } from '../components/AppNav';

interface TodayRace {
  id: number;
  track: string;
  race_number: number;
  conditions: string;
  distance: string;
  surface: string;
  field_size: number;
  post_time: string | null;
}

interface CommissionRace {
  race_id: number;
  has_win_bet: boolean;
  total_stake: number;
}

export function Today() {
  const navigate = useNavigate();
  const token = localStorage.getItem('ftc_token');
  const today = new Date().toISOString().split('T')[0];

  const [races, setRaces] = useState<TodayRace[]>([]);
  const [commissionRaces, setCommissionRaces] = useState<Map<number, CommissionRace>>(new Map());
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

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

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const tracks = ['all', 'commission', ...Array.from(new Set(races.map(r => r.track)))];

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

  const nextRaceIdx = filteredRaces.findIndex(r => r.post_time && r.post_time > currentTime);

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
        <AppNav />

        <div className="bg-[#000080] text-white font-bold p-2 px-3 mb-4 flex justify-between items-center">
          <span className="font-serif">TODAY'S RACES</span>
          <span className="font-mono text-xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>

        {/* Track filter */}
        <div className="flex flex-wrap gap-1 mb-4">
          {tracks.map(t => (
            <button
              key={t}
              onClick={() => setTrackFilter(t)}
              className={`px-3 py-1 font-mono text-xs border ${trackFilter === t ? 'bg-black text-white border-black' : t === 'commission' ? 'bg-[#000080] text-white border-[#000080] hover:bg-[#0000aa]' : 'bg-white text-black border-gray-400 hover:bg-gray-100'}`}
            >
              {t === 'all' ? 'ALL TRACKS' : t === 'commission' ? '🤌 COMMISSION' : t}
            </button>
          ))}
        </div>

        {commissionRaces.size > 0 && (
          <button
            onClick={() => setTrackFilter('commission')}
            className="w-full bg-[#ffffcc] border-2 border-black p-3 mb-4 font-mono text-sm text-left hover:bg-[#fff5aa] cursor-pointer flex justify-between items-center"
          >
            <span><strong>🤌 The Commission has {commissionRaces.size} plays today.</strong> Tap to view picks →</span>
            <span className="font-bold text-[#000080]">${Array.from(commissionRaces.values()).reduce((s, c) => s + c.total_stake, 0).toFixed(0)} committed</span>
          </button>
        )}

        {loading ? (
          <div className="font-mono animate-blink p-4">Loading races...</div>
        ) : filteredRaces.length === 0 ? (
          <div className="bg-white border-2 border-gray-400 p-8 text-center font-serif italic text-gray-500">
            No races loaded for today.
          </div>
        ) : (
          <div className="space-y-1">
            {filteredRaces.map((race, idx) => {
              const isNext = idx === nextRaceIdx;
              const isPast = race.post_time ? race.post_time < currentTime : false;
              const commission = commissionRaces.get(race.id);

              return (
                <Link
                  key={race.id}
                  to={`/today/${race.id}`}
                  className={`flex items-center gap-3 px-3 py-3 border-2 transition-colors no-underline text-black
                    ${commission ? 'border-[#000080] bg-[#f0f0ff]' : isNext ? 'border-gray-600 bg-white' : isPast ? 'border-gray-300 bg-gray-100 opacity-60' : 'border-gray-400 bg-white hover:bg-[#fffbe0]'}`}
                >
                  <div className="font-mono text-sm font-bold w-14 shrink-0 text-center">
                    {formatTime(race.post_time)}
                  </div>
                  <div className="w-px h-8 bg-gray-300 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-[#000080]">{race.track}</span>
                      <span className="font-mono text-xs bg-gray-200 px-1.5 py-0.5 border border-gray-400">R{race.race_number}</span>
                      {isNext && <span className="font-mono text-[10px] bg-black text-white px-1.5 py-0.5">NEXT</span>}
                      {commission && (
                        <span className="font-mono text-[10px] bg-[#000080] text-white px-1.5 py-0.5">
                          🤌 {commission.has_win_bet ? 'WIN + EXOTICS' : 'EXOTICS'}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-gray-600 mt-0.5 truncate">
                      {race.conditions} • {race.distance} • {race.surface} • {race.field_size}h
                    </div>
                  </div>
                  {commission && (
                    <div className="font-mono text-xs font-bold text-[#000080] shrink-0">
                      ${commission.total_stake.toFixed(0)}
                    </div>
                  )}
                  <span className="font-mono text-sm text-gray-400 shrink-0">→</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNav } from '../components/AppNav';

interface CommissionPick {
  id: number;
  race_id: number;
  bet_type: string;
  stake: number;
  doubled: boolean;
  conviction: string;
  track: string;
  race_number: number;
  conditions: string;
  distance: string;
  surface: string;
  field_size: number;
  post_time: string | null;
}

export function Today() {
  const navigate = useNavigate();
  const token = localStorage.getItem('ftc_token');

  const [picks, setPicks] = useState<CommissionPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetch('/api/lab/today', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.picks) setPicks(data.picks);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, navigate]);

  const formatTime = (t: string | null) => {
    if (!t) return 'TBD';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const grouped = picks.reduce((acc: Record<string, CommissionPick[]>, pick) => {
    const key = `${pick.track}-R${pick.race_number}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(pick);
    return acc;
  }, {});

  const raceGroups = Object.entries(grouped).sort(([, a], [, b]) => {
    const ptA = a[0].post_time || 'ZZ';
    const ptB = b[0].post_time || 'ZZ';
    return ptA.localeCompare(ptB);
  });

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
        <AppNav />

        <div className="bg-[#000080] text-white font-bold p-2 px-3 mb-4 flex justify-between items-center">
          <span className="font-serif">THE COMMISSION'S PICKS</span>
          <span className="font-mono text-xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>

        <div className="bg-[#ffffcc] border-2 border-black p-3 mb-6 font-mono text-sm">
          <strong>{raceGroups.length} races on the card.</strong> Ordered by post time — next up is first.
          {picks.length > 0 && (
            <span className="ml-2">Total outlay: <strong>${picks.reduce((sum, p) => sum + p.stake, 0).toFixed(2)}</strong></span>
          )}
        </div>

        {loading ? (
          <div className="font-mono animate-blink p-4">Loading today's picks...</div>
        ) : raceGroups.length === 0 ? (
          <div className="bg-white border-2 border-gray-400 p-8 text-center font-serif italic text-gray-500">
            No Commission picks posted for today yet. Check back closer to post time.
          </div>
        ) : (
          <div className="space-y-6">
            {raceGroups.map(([key, bets], idx) => {
              const race = bets[0];
              const isNext = race.post_time ? race.post_time > currentTime : false;
              const isPast = race.post_time ? race.post_time < currentTime : false;
              const winBet = bets.find(b => b.bet_type === 'win');
              const exotics = bets.filter(b => b.bet_type !== 'win');
              const totalStake = bets.reduce((sum, b) => sum + b.stake, 0);

              return (
                <div
                  key={key}
                  className={`border-2 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isNext && idx === 0 ? 'border-[#000080]' : isPast ? 'border-gray-300 opacity-60' : 'border-black'}`}
                >
                  <div className={`px-4 py-2 flex justify-between items-center ${isNext && idx === 0 ? 'bg-[#000080] text-white' : 'bg-black text-white'}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-bold">{formatTime(race.post_time)}</span>
                      <span className="opacity-50">|</span>
                      <span className="font-serif font-bold">{race.track} — R{race.race_number}</span>
                      {isNext && idx === 0 && <span className="font-mono text-[10px] bg-white text-[#000080] px-1.5 py-0.5 ml-2">NEXT UP</span>}
                    </div>
                    <span className="font-mono text-sm">${totalStake.toFixed(2)}</span>
                  </div>

                  <div className="px-4 py-1 bg-gray-100 border-b border-gray-300 font-mono text-xs text-gray-600">
                    {race.conditions} • {race.distance} • {race.surface} • {race.field_size} horses
                  </div>

                  <div className="p-4">
                    {winBet && (
                      <div className="mb-3 bg-[#ffffcc] border border-black p-3">
                        <div className="font-sans font-bold text-sm text-web-red mb-1">WIN BET{winBet.doubled ? ' — DOUBLED' : ''}</div>
                        <div className="font-mono text-sm">{winBet.conviction}</div>
                        <div className="font-mono text-xs text-gray-600 mt-1">Stake: ${winBet.stake.toFixed(2)}</div>
                      </div>
                    )}

                    {!winBet && (
                      <div className="mb-3 font-mono text-xs text-gray-500 italic">
                        Exotics only — fave is protected, no win bet against.
                      </div>
                    )}

                    <div className="space-y-1">
                      {exotics.map(bet => (
                        <div key={bet.id} className="flex justify-between items-center font-mono text-sm border-b border-gray-200 py-1">
                          <div>
                            <span className="font-bold capitalize">{bet.bet_type}</span>
                            <span className="text-gray-500 ml-2 text-xs">{bet.conviction}</span>
                          </div>
                          <span className="font-bold">${bet.stake.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

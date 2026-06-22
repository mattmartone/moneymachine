import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

type FilterType = 'model' | 'strategies' | 'horses' | 'trainers' | 'jockeys' | 'barns' | 'bet_types';

const SAMPLE_DATA: Record<FilterType, { name: string; fires: number; wins: number; roi: number; net: number }[]> = {
  model: [
    { name: 'Commission Model', fires: 62, wins: 18, roi: 25, net: 2383 },
    { name: 'Random Baseline', fires: 62, wins: 6, roi: -34, net: -1892 },
  ],
  strategies: [
    { name: 'Spot the Vulnerable Favorite', fires: 38, wins: 12, roi: 31, net: 1420 },
    { name: 'Pace Makes the Race', fires: 35, wins: 10, roi: 22, net: 980 },
    { name: 'Beyer Ceiling Box', fires: 42, wins: 14, roi: 18, net: 1150 },
    { name: 'Key Against the Favorite', fires: 22, wins: 8, roi: 35, net: 890 },
    { name: 'S1 — Elite Jockey on Bomb', fires: 8, wins: 3, roi: 62, net: 540 },
    { name: 'S4 — Hot Barn at a Price', fires: 12, wins: 4, roi: 28, net: 380 },
    { name: 'S5 — Distance Stretch-out', fires: 15, wins: 5, roi: 19, net: 310 },
  ],
  horses: [
    { name: 'KING FARRO', fires: 2, wins: 1, roi: 180, net: 420 },
    { name: 'MARKETPLACEOFIDEAS', fires: 1, wins: 1, roi: 220, net: 310 },
    { name: 'MOON SNIPER', fires: 1, wins: 0, roi: -100, net: -136 },
  ],
  trainers: [
    { name: 'Chad Brown', fires: 8, wins: 3, roi: 42, net: 560 },
    { name: 'Todd Pletcher', fires: 6, wins: 2, roi: 18, net: 220 },
    { name: 'Steve Asmussen', fires: 5, wins: 1, roi: -12, net: -85 },
  ],
  jockeys: [
    { name: 'Irad Ortiz Jr', fires: 10, wins: 4, roi: 38, net: 680 },
    { name: 'Flavien Prat', fires: 7, wins: 2, roi: 22, net: 310 },
    { name: 'Joel Rosario', fires: 6, wins: 2, roi: 15, net: 180 },
  ],
  barns: [
    { name: 'Brown (Belmont)', fires: 5, wins: 2, roi: 48, net: 380 },
    { name: 'Pletcher (Saratoga)', fires: 4, wins: 1, roi: 12, net: 90 },
  ],
  bet_types: [
    { name: 'Win', fires: 62, wins: 8, roi: -22, net: -680 },
    { name: 'Exacta', fires: 62, wins: 18, roi: 32, net: 1420 },
    { name: 'Trifecta', fires: 62, wins: 12, roi: 45, net: 1180 },
    { name: 'Superfecta', fires: 62, wins: 6, roi: 82, net: 463 },
  ],
};

const FILTER_LABELS: Record<FilterType, string> = {
  model: 'Model vs Random',
  strategies: 'Strategies',
  horses: 'Horses',
  trainers: 'Trainers',
  jockeys: 'Jockeys',
  barns: 'Barns',
  bet_types: 'Bet Types',
};

type SortKey = 'name' | 'fires' | 'wins' | 'roi' | 'net';

export function Performance() {
  const [filter, setFilter] = useState<FilterType>('model');
  const [liveData, setLiveData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('net');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchLiveData = async (f: FilterType) => {
    if (liveData[f]) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lab/performance-detail?filter=${f}`, {
        headers: { Authorization: 'Bearer public' }
      });
      const json = await res.json();
      if (json.data) setLiveData(prev => ({ ...prev, [f]: json.data }));
    } catch {}
    setLoading(false);
  };

  // Auto-fetch on mount and filter change
  if (!liveData[filter] && !loading) fetchLiveData(filter);

  const rawData = liveData[filter] || [];
  const data = [...rawData].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  return (
    <div className="pb-24 min-h-screen bg-app">
      <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">
            Performance
          </h1>
          <p className="text-xs text-muted font-medium leading-tight mt-0.5">
            Lifetime results and model accuracy
          </p>
        </div>
      </div>

      <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-6">
        {/* Filter toggles */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(Object.keys(FILTER_LABELS) as FilterType[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                filter === key
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-gray-700 hover:bg-app'
              }`}>
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>

        {loading && (
          <div className="bg-app border border-border rounded-xl px-3 py-4 mb-4 text-center">
            <p className="text-xs text-muted">Loading...</p>
          </div>
        )}

        {!loading && !liveData[filter] && (
          <div className="bg-app border border-border rounded-xl px-3 py-4 mb-4 text-center">
            <p className="text-xs text-muted">No data available for this filter yet.</p>
          </div>
        )}

        {/* Model vs Random table */}
        {filter === 'model' && data.length > 0 && (
          <div>
            <p className="text-xs text-muted mb-4 leading-relaxed italic">
              Can an AI beat random chance at picking horses? We test every race day. Same races, same bets, same stakes — just random picks vs our model. The exacta rate tells the story.
            </p>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-app border-b border-border">
                  <tr>
                    <th className="py-2.5 px-2 text-[10px] uppercase tracking-wider text-muted font-semibold">Date</th>
                    <th className="py-2.5 px-2 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Model P/L</th>
                    <th className="py-2.5 px-2 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Random P/L</th>
                    <th className="py-2.5 px-2 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Model Win</th>
                    <th className="py-2.5 px-2 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Rand Win</th>
                    <th className="py-2.5 px-2 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Model EX</th>
                    <th className="py-2.5 px-2 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Rand EX</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((row: any, idx: number) => {
                    const modelBetter = row.model_net > row.random_net;
                    return (
                      <tr key={idx} className={modelBetter ? 'bg-success/5' : ''}>
                        <td className="py-2.5 px-2 text-gray-900 font-medium text-xs whitespace-nowrap">{row.date}</td>
                        <td className={`py-2.5 px-2 text-right tabular-nums font-semibold text-xs ${row.model_net >= 0 ? 'text-success' : 'text-gray-700'}`}>
                          {row.model_net >= 0 ? '+' : '-'}${Math.abs(row.model_net)}
                        </td>
                        <td className={`py-2.5 px-2 text-right tabular-nums font-semibold text-xs ${row.random_net >= 0 ? 'text-success' : 'text-gray-700'}`}>
                          {row.random_net >= 0 ? '+' : '-'}${Math.abs(row.random_net)}
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-xs text-gray-700">{row.model_win_rate != null ? row.model_win_rate + '%' : '—'}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-xs text-gray-700">{row.random_win_rate != null ? row.random_win_rate + '%' : '—'}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-xs font-semibold text-primary">{row.model_exacta_rate != null ? row.model_exacta_rate + '%' : '—'}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-xs text-gray-700">{row.random_exacta_rate != null ? row.random_exacta_rate + '%' : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Standard results table */}
        {filter !== 'model' && data.length > 0 && <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-app border-b border-border">
              <tr>
                {([['name', 'Name', ''], ['fires', 'Fires', 'text-right'], ['wins', 'Wins', 'text-right'], ['roi', 'ROI', 'text-right'], ['net', 'Net', 'text-right']] as [SortKey, string, string][]).map(([key, label, align]) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className={`py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold cursor-pointer select-none hover:text-gray-900 transition-colors ${align} ${sortBy === key ? 'text-gray-900' : 'text-muted'}`}>
                    {label} {sortBy === key && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 text-gray-900 font-medium text-xs">{row.name}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">{row.fires}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">{row.wins}</td>
                  <td className={`py-2.5 px-3 text-right tabular-nums font-semibold ${row.roi >= 0 ? 'text-success' : 'text-gray-700'}`}>
                    {row.roi >= 0 ? '+' : ''}{row.roi}%
                  </td>
                  <td className={`py-2.5 px-3 text-right tabular-nums font-semibold ${row.net >= 0 ? 'text-success' : 'text-gray-700'}`}>
                    {row.net >= 0 ? '+' : '-'}${Math.abs(row.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}

      </main>
    </div>
  );
}

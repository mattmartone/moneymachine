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

export function Performance() {
  const [filter, setFilter] = useState<FilterType>('model');
  const data = SAMPLE_DATA[filter];

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

        {/* Sample data indicator */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-primary" />
          <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Sample Data</span>
        </div>

        {/* Results table */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-app border-b border-border">
              <tr>
                <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted font-semibold">Name</th>
                <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Fires</th>
                <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Wins</th>
                <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">ROI</th>
                <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 text-gray-900 font-medium text-xs">{row.name}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">{row.fires}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">{row.wins}</td>
                  <td className={`py-2.5 px-3 text-right tabular-nums font-semibold ${row.roi >= 0 ? 'text-success' : 'text-danger'}`}>
                    {row.roi >= 0 ? '+' : ''}{row.roi}%
                  </td>
                  <td className={`py-2.5 px-3 text-right tabular-nums font-semibold ${row.net >= 0 ? 'text-success' : 'text-danger'}`}>
                    {row.net >= 0 ? '+' : '-'}${Math.abs(row.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Zap, Clock, CheckCircle, XCircle } from 'lucide-react';

type FilterType = 'today' | 'model' | 'strategies' | 'horses' | 'trainers' | 'jockeys' | 'barns' | 'bet_types';

const SAMPLE_DATA: Record<FilterType, any[]> = {
  today: [],
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
  today: 'Today',
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
  const [filter, setFilter] = useState<FilterType>('today');
  const [liveData, setLiveData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('net');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [insights, setInsights] = useState<string[]>([]);
  const [insightsLoaded, setInsightsLoaded] = useState(false);
  const [chartView, setChartView] = useState<'earnings' | 'hitrate'>('earnings');

  useEffect(() => {
    if (!insightsLoaded) {
      fetch('/api/lab/insights', { headers: { Authorization: 'Bearer public' } })
        .then(r => r.json())
        .then(json => { if (json.insights) setInsights(json.insights); })
        .catch(() => {})
        .finally(() => setInsightsLoaded(true));
    }
  }, [insightsLoaded]);

  const fetchLiveData = async (f: FilterType) => {
    if (liveData[f]) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lab/performance-detail?filter=${f}`, {
        headers: { Authorization: 'Bearer public' }
      });
      const json = await res.json();
      if (f === 'today') {
        setLiveData(prev => ({ ...prev, [f]: json }));
      } else if (json.data) {
        setLiveData(prev => ({ ...prev, [f]: json.data }));
      }
    } catch {}
    setLoading(false);
  };

  // Auto-fetch on mount and filter change
  if (!liveData[filter] && !loading) fetchLiveData(filter);

  const rawData = liveData[filter] || [];
  const data = (filter === 'model' || filter === 'today') ? rawData : [...rawData].sort((a, b) => {
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
            {filter === 'today' ? "Today's strategies in play" : 'Lifetime results and model accuracy'}
          </p>
        </div>
      </div>

      <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-6">
        {/* Model version banner */}
        <div className="bg-gray-900 text-white rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Model</p>
            <p className="text-sm font-semibold">Claudio Pronto v2.0 <span className="text-gray-400 font-normal">— Exacta-First</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Live since</p>
            <p className="text-sm font-medium">Jul 3, 2026</p>
          </div>
        </div>

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

        {/* Today — Strategies in Play (Commission + Capo tiers) */}
        {filter === 'today' && liveData['today'] && (
          (() => {
            const todayData = liveData['today'] as any;
            const commissionStrats = todayData.commission || todayData.data || [];
            const capoStrats = todayData.capo || [];
            const allStrats = [...commissionStrats, ...capoStrats];
            const hasData = allStrats.length > 0;

            if (!hasData) return (
              <div className="bg-surface border border-border rounded-2xl px-4 py-8 text-center shadow-sm">
                <Clock className="w-6 h-6 text-muted mx-auto mb-2" />
                <p className="text-xs text-muted">No races in play today.</p>
              </div>
            );

            const totalNet = allStrats.reduce((sum: number, s: any) => sum + (s.net || 0), 0);
            const totalWagered = allStrats.reduce((sum: number, s: any) => sum + (s.wagered || 0), 0);
            const totalFires = allStrats.reduce((sum: number, s: any) => sum + (s.fires || 0), 0);
            const totalSettled = allStrats.reduce((sum: number, s: any) => sum + (s.settled || 0), 0);

            const renderStratGroup = (strat: any, idx: number) => (
              <div key={idx} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-border bg-app">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{strat.name}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                        {strat.fires} {strat.fires === 1 ? 'race' : 'races'}
                      </span>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${strat.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {strat.net >= 0 ? '+' : '-'}${Math.abs(Math.round(strat.net))}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {strat.races?.map((race: any, rIdx: number) => {
                    const raceNet = race.bets.reduce((s: number, b: any) => s + b.net, 0);
                    const anyHit = race.bets.some((b: any) => b.hit);
                    const isSettled = race.status === 'settled';
                    return (
                      <div key={rIdx} className="px-4 py-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isSettled ? (
                              anyHit ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                            )}
                            <div>
                              <span className="text-xs font-semibold text-gray-900">{race.track} R{race.race_number}</span>
                              {race.post_time && <span className="text-[10px] text-muted ml-1.5">{race.post_time}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            {isSettled ? (
                              <span className={`text-xs font-bold tabular-nums ${raceNet >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {raceNet >= 0 ? '+' : '-'}${Math.abs(Math.round(raceNet))}
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-amber-600">Pending</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-1 ml-5">
                          {race.bets.map((b: any, bIdx: number) => (
                            <span key={bIdx} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              !isSettled ? 'bg-amber-50 text-amber-700' :
                              b.hit ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {b.bet_type}{b.doubled ? ' 2x' : ''} ${b.stake}
                            </span>
                          ))}
                        </div>
                        {race.rationale && (
                          <p className="text-[10px] text-muted mt-1 ml-5 italic">{race.rationale}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );

            return (
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="bg-surface border border-border rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted">Today's Strategies</p>
                      <p className="text-xs text-gray-600 mt-0.5">{totalFires} races &middot; {totalSettled} settled</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold tabular-nums ${totalNet >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {totalNet >= 0 ? '+' : '-'}${Math.abs(Math.round(totalNet))}
                      </p>
                      <p className="text-[10px] text-muted">${Math.round(totalWagered)} wagered</p>
                    </div>
                  </div>
                </div>

                {/* Commission section */}
                {commissionStrats.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-900">Commission</span>
                      <span className="flex-1 h-px bg-border" />
                    </div>
                    {commissionStrats.map(renderStratGroup)}
                  </>
                )}

                {/* Capo section */}
                {capoStrats.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mt-4">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Capo</span>
                      <span className="flex-1 h-px bg-border" />
                    </div>
                    {capoStrats.map(renderStratGroup)}
                  </>
                )}
              </div>
            );
          })()
        )}

        {/* Model vs Random chart + table */}
        {filter === 'model' && data.length > 0 && (
          <div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">Model Update — July 3, 2026</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Performance below reflects <strong>Claudio Pronto v1</strong> (win-first, flat staking). As of today we're running <strong>Claudio Pronto v2.0 — Exacta-First</strong>: pool-weighted allocation, win bets only on triple-signal (S4+S5+S9), fixed distance data pipeline. Prior period preserved for comparison.
              </p>
            </div>
            <p className="text-xs text-muted mb-4 leading-relaxed italic">
              Can an AI beat random chance at picking horses? We test every race day. Same races, same bets, same stakes — just random picks vs our model. The exacta rate tells the story.
            </p>

            {/* Chart view toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setChartView('earnings')}
                className={`text-[10px] font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  chartView === 'earnings' ? 'bg-gray-900 text-white' : 'bg-surface border border-border text-gray-600'
                }`}>
                Earnings
              </button>
              <button
                onClick={() => setChartView('hitrate')}
                className={`text-[10px] font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  chartView === 'hitrate' ? 'bg-gray-900 text-white' : 'bg-surface border border-border text-gray-600'
                }`}>
                Hit Rate
              </button>
            </div>

            {/* Hit Rate chart */}
            {chartView === 'hitrate' && (() => {
              const monthMap: Record<string, number> = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
              const withWinRate = [...data].filter((r: any) => r.model_win_rate != null).sort((a: any, b: any) => {
                const [aMonth, aDay] = a.date.split(' ');
                const [bMonth, bDay] = b.date.split(' ');
                return new Date(2026, monthMap[aMonth] || 0, parseInt(aDay)).getTime() - new Date(2026, monthMap[bMonth] || 0, parseInt(bDay)).getTime();
              });

              if (withWinRate.length === 0) return <div className="text-xs text-muted text-center py-8">No hit rate data yet.</div>;

              const chartH = 120;
              const chartW = 300;
              const pad = 20;
              const daysInMonth = 30;

              const allRates = withWinRate.flatMap((r: any) => [r.model_win_rate, r.random_win_rate]).filter(Boolean);
              const maxPct = Math.ceil((Math.max(...allRates) + 5) / 5) * 5;

              const toY = (pct: number) => pad + ((maxPct - pct) / maxPct) * (chartH - pad * 2);
              const toX = (day: number) => pad + ((day - 1) / (daysInMonth - 1)) * (chartW - pad * 2);

              // Parse day number from "Jun 21" format
              const getDay = (dateStr: string) => parseInt(dateStr.split(' ')[1]);

              const lastModel = withWinRate[withWinRate.length - 1];

              // Build paths connecting only data points
              const modelPath = withWinRate.map((r: any, i: number) => `${i === 0 ? 'M' : 'L'} ${toX(getDay(r.date))} ${toY(r.model_win_rate)}`).join(' ');
              const randomPath = withWinRate.map((r: any, i: number) => `${i === 0 ? 'M' : 'L'} ${toX(getDay(r.date))} ${toY(r.random_win_rate)}`).join(' ');

              return (
                <div className="bg-surface border border-border rounded-2xl p-4 mb-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">Win Rate — June</span>
                    <span className="text-xs font-bold text-emerald-600">
                      Model: {lastModel.model_win_rate}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted mb-3">Model win rate vs random each race day. Green should climb, grey should stay flat.</p>
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: '140px' }}>
                    {/* Y-axis grid */}
                    {Array.from({ length: Math.floor(maxPct / 5) }, (_, i) => (i + 1) * 5).map(pct => (
                      <g key={pct}>
                        <line x1={pad} y1={toY(pct)} x2={chartW - pad} y2={toY(pct)} stroke="#f3f4f6" strokeWidth="0.5" />
                        <text x={pad - 3} y={toY(pct) + 1.5} textAnchor="end" fontSize="7" fill="#9ca3af">{pct}%</text>
                      </g>
                    ))}
                    {/* X-axis baseline */}
                    <line x1={pad} y1={toY(0)} x2={chartW - pad} y2={toY(0)} stroke="#e5e7eb" strokeWidth="0.5" />
                    {/* Week markers */}
                    {[1, 8, 15, 22, 29].map(day => (
                      <g key={day}>
                        <line x1={toX(day)} y1={toY(0)} x2={toX(day)} y2={toY(0) + 3} stroke="#d1d5db" strokeWidth="0.5" />
                        <text x={toX(day)} y={toY(0) + 9} textAnchor="middle" fontSize="7" fill="#9ca3af">{day}</text>
                      </g>
                    ))}
                    {/* Random line (grey, dashed) */}
                    <path d={randomPath} fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,3" />
                    {/* Model line (green, solid) */}
                    <path d={modelPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Random dots */}
                    {withWinRate.map((r: any, i: number) => (
                      <circle key={`r${i}`} cx={toX(getDay(r.date))} cy={toY(r.random_win_rate)} r="3" fill="#9ca3af" />
                    ))}
                    {/* Model dots */}
                    {withWinRate.map((r: any, i: number) => (
                      <circle key={`m${i}`} cx={toX(getDay(r.date))} cy={toY(r.model_win_rate)} r="3.5" fill="#10b981" />
                    ))}
                  </svg>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Model
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Random
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Cumulative P/L divergence chart */}
            {chartView === 'earnings' && (() => {
              const monthMap: Record<string, number> = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
              const sorted = [...data].sort((a: any, b: any) => {
                const [aMonth, aDay] = a.date.split(' ');
                const [bMonth, bDay] = b.date.split(' ');
                const da = new Date(2026, monthMap[aMonth] || 0, parseInt(aDay));
                const db = new Date(2026, monthMap[bMonth] || 0, parseInt(bDay));
                return da.getTime() - db.getTime();
              });

              // Two cumulative lines: model and random, with spread shown as green fill between them
              let modelCum = 0, randomCum = 0;
              const points = sorted.map((row: any) => {
                modelCum += row.model_net || 0;
                randomCum += row.random_net || 0;
                return { date: row.date, model: modelCum, random: randomCum };
              });

              const allVals = points.flatMap(p => [p.model, p.random]);
              const minVal = Math.min(...allVals);
              const maxVal = Math.max(...allVals);
              const range = maxVal - minVal || 1;
              const chartH = 140;
              const chartW = 100;
              const pad = 14;

              const toY = (val: number) => pad + ((maxVal - val) / range) * (chartH - pad * 2);
              const toX = (idx: number) => points.length > 1 ? (idx / (points.length - 1)) * chartW : 50;

              const modelPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.model)}`).join(' ');
              const randomPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.random)}`).join(' ');

              // Fill between model (top) and random (bottom) = the spread
              const spreadFill = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.model)}`).join(' ')
                + ' ' + [...points].reverse().map((p, i) => `L ${toX(points.length - 1 - i)} ${toY(p.random)}`).join(' ') + ' Z';

              // Grey fill under random line to bottom of chart
              const randomFill = randomPath + ` L ${toX(points.length - 1)} ${chartH - pad} L ${toX(0)} ${chartH - pad} Z`;

              const totalEdge = points.length > 0 ? (points[points.length - 1].model - points[points.length - 1].random) : 0;
              const trending = points.length >= 3 && (points[points.length - 1].model - points[points.length - 1].random) > (points[points.length - 2].model - points[points.length - 2].random);

              return (
                <div className="bg-surface border border-border rounded-2xl p-4 mb-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">Model vs Random</span>
                    <span className={`text-sm font-bold ${totalEdge >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      Edge: {totalEdge >= 0 ? '+' : '-'}${Math.abs(Math.round(totalEdge))}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted mb-2">Green area = how much the model is beating random. Wider = bigger edge.</p>
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: '150px' }} preserveAspectRatio="none">
                    {/* Grey fill under random */}
                    <path d={randomFill} fill="#9ca3af" opacity="0.08" />
                    {/* Green spread fill between model and random */}
                    <path d={spreadFill} fill="#10b981" opacity="0.2" />
                    {/* Random line (grey) */}
                    <path d={randomPath} fill="none" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                    {/* Model line (green) */}
                    <path d={modelPath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {/* End dots */}
                    {points.length > 0 && (
                      <>
                        <circle cx={toX(points.length - 1)} cy={toY(points[points.length - 1].model)} r="2.5" fill="#10b981" />
                        <circle cx={toX(points.length - 1)} cy={toY(points[points.length - 1].random)} r="2" fill="#9ca3af" />
                      </>
                    )}
                    {/* Date labels */}
                    {points.map((p, i) => (
                      <text key={`l${i}`} x={toX(i)} y={chartH - 2} textAnchor="middle" fontSize="3.5" fill="#9ca3af">{p.date.split(' ')[1]}</text>
                    ))}
                  </svg>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
                        <span className="w-3 h-0.5 bg-emerald-500 rounded inline-block" /> Model
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <span className="w-3 h-0.5 bg-gray-400 rounded inline-block" /> Random
                      </span>
                    </div>
                    {trending && <span className="text-[10px] text-emerald-600 font-semibold">Widening ↑</span>}
                  </div>
                </div>
              );
            })()}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-app border-b border-border">
                  <tr>
                    <th className="py-2.5 px-2 text-[10px] uppercase tracking-wider text-muted font-semibold">Date</th>
                    <th className="py-2.5 px-1 text-[10px] uppercase tracking-wider text-muted font-semibold text-center" title="Model beat random">W</th>
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
                    const isFirstV1 = idx > 0 && row.date && row.date.includes('Jun');
                    const prevRow = idx > 0 ? data[idx - 1] : null;
                    const showDivider = prevRow && !prevRow.date?.includes('Jun') && row.date?.includes('Jun');
                    return (
                      <React.Fragment key={idx}>
                        {idx === 0 && data.length > 0 && (
                          <tr className="bg-gray-900">
                            <td colSpan={8} className="py-2 px-3 text-center">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                                ▲ Claudio Pronto v2.0 — Exacta-First (Jul 3, 2026)
                              </span>
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="py-2.5 px-2 text-gray-900 text-xs whitespace-nowrap">{row.date}</td>
                          <td className="py-2.5 px-1 text-center">
                            {row.model_net > row.random_net && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-xs text-gray-700">
                            {row.model_net >= 0 ? '+' : '-'}${Math.abs(row.model_net)}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-xs text-gray-700">
                            {row.random_net >= 0 ? '+' : '-'}${Math.abs(row.random_net)}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-xs text-gray-700">{row.model_win_rate != null ? row.model_win_rate + '%' : '—'}</td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-xs text-gray-700">{row.random_win_rate != null ? row.random_win_rate + '%' : '—'}</td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-xs text-gray-700">{row.model_exacta_rate != null ? row.model_exacta_rate + '%' : '—'}</td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-xs text-gray-700">{row.random_exacta_rate != null ? row.random_exacta_rate + '%' : '—'}</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights callouts */}
        {filter === 'model' && insights.length > 0 && (
          <div className="mt-6 bg-surface border border-border rounded-2xl px-4 py-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">Insights</span>
            </div>
            <ul className="space-y-2">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-xs text-gray-700 leading-relaxed">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Standard results table */}
        {filter !== 'model' && filter !== 'today' && data.length > 0 && <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
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
                <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider font-semibold text-muted text-right">Win %</th>
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
                  <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">
                    {row.fires > 0 ? Math.round((row.wins / row.fires) * 100) : 0}%
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

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TrackRace {
  id: number;
  race_number: number;
  distance: string;
  surface: string;
  purse: number;
  conditions: string;
  post_time: string;
  field_size: number;
  race_theory: string | null;
}

interface DetPick {
  status: string;
  conviction: string;
  composite_score: number;
  signal_score: number;
  win_pick_pp: number;
  win_pick_name: string;
  win_pick_ml: string;
  win_pick_style: string;
  win_pick_beyer: number;
  box_pps: number[];
  box_names: string[];
  pace_scenario: string;
  fave_vulnerable: boolean;
  fave_name: string;
  fave_style: string;
  vulnerability_reason: string;
  race_theory: string;
}

interface FablePick {
  bettable: boolean;
  skip_reason: string | null;
  conviction: string;
  pace_scenario: string;
  pace_reasoning: string;
  fave_pp: number;
  fave_name: string;
  fave_vulnerable: boolean;
  vulnerability_reasoning: string;
  win_pick_pp: number;
  win_pick_name: string;
  win_pick_ml: string;
  win_pick_thesis: string;
  box_pps: number[];
  conviction_reasoning: string;
}

interface FieldEntry {
  post_position: number;
  horse_name: string;
  morning_line_odds: string;
  running_style: string;
  best_beyer: number;
  last_beyer: number;
  scratched: boolean;
}

interface Result {
  win_pp: number;
  win_horse: string;
  place_pp: number;
  place_horse: string;
  show_pp: number;
  show_horse: string;
}

const API_HEADERS = { Authorization: 'Bearer public' };

export function TrackCard({ track = 'Saratoga', selectedDate }: { track?: string; selectedDate?: string }) {
  const [races, setRaces] = useState<TrackRace[]>([]);
  const [det, setDet] = useState<Record<number, DetPick>>({});
  const [fable, setFable] = useState<Record<number, FablePick>>({});
  const [results, setResults] = useState<Record<number, Result>>({});
  const [entries, setEntries] = useState<Record<number, FieldEntry[]>>({});
  const [sourceTab, setSourceTab] = useState<'deterministic' | 'fable'>('deterministic');
  const [expandedRace, setExpandedRace] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const date = selectedDate || new Date().toISOString().split('T')[0];
    fetch(`/api/lab/track-card?date=${date}&track=${encodeURIComponent(track)}`, { headers: API_HEADERS })
      .then(r => r.json())
      .then(data => {
        setRaces(data.races || []);
        setDet(data.deterministic || {});
        setFable(data.fable || {});
        setResults(data.results || {});
        setEntries(data.entries || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedDate, track]);

  const formatPostTime = (pt: string) => {
    if (!pt) return '—';
    const [h, m] = pt.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  };

  if (loading) {
    return (
      <div className="p-4 max-w-md md:max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-surface rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="p-4 max-w-md md:max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">{track}</h1>
          <p className="text-sm text-muted">{races.length} races today</p>
        </div>

        {/* Source tabs */}
        <div className="flex gap-1 bg-app border border-border rounded-xl p-1 mb-6">
          <button
            onClick={() => setSourceTab('deterministic')}
            className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-colors ${sourceTab === 'deterministic' ? 'bg-surface text-gray-900 shadow-sm' : 'text-muted hover:text-gray-700'}`}>
            Deterministic
          </button>
          <button
            onClick={() => setSourceTab('fable')}
            className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-colors ${sourceTab === 'fable' ? 'bg-surface text-gray-900 shadow-sm' : 'text-muted hover:text-gray-700'}`}>
            Fable
          </button>
        </div>

        {/* Race cards */}
        <div className="space-y-3">
          {races.map((race, idx) => {
            const detPick = det[race.id];
            const fablePick = fable[race.id];
            const result = results[race.id];
            const field = entries[race.id] || [];
            const pick = sourceTab === 'deterministic' ? detPick : fablePick;
            const isExpanded = expandedRace === race.id;

            const hasPick = sourceTab === 'deterministic'
              ? detPick && detPick.status === 'scored' && detPick.win_pick_name
              : fablePick && fablePick.bettable && fablePick.win_pick_name;

            const conviction = sourceTab === 'deterministic' ? detPick?.conviction : fablePick?.conviction;
            const winPickName = sourceTab === 'deterministic' ? detPick?.win_pick_name : fablePick?.win_pick_name;
            const winPickMl = sourceTab === 'deterministic' ? detPick?.win_pick_ml : fablePick?.win_pick_ml;
            const winPickPP = sourceTab === 'deterministic' ? detPick?.win_pick_pp : fablePick?.win_pick_pp;
            const boxPPs = sourceTab === 'deterministic' ? (detPick?.box_pps || []) : (fablePick?.box_pps || []);
            const paceScenario = sourceTab === 'deterministic' ? detPick?.pace_scenario : fablePick?.pace_scenario;
            const skipReason = sourceTab === 'deterministic'
              ? (detPick?.status === 'blocked' ? `Blocked: ${detPick.vulnerability_reason || 'gate'}` : null)
              : (fablePick && !fablePick.bettable ? fablePick.skip_reason : null);

            const theory = sourceTab === 'deterministic'
              ? (detPick?.race_theory || race.race_theory)
              : fablePick?.win_pick_thesis;

            const paceReasoning = sourceTab === 'fable' ? fablePick?.pace_reasoning : null;
            const vulnReasoning = sourceTab === 'deterministic'
              ? detPick?.vulnerability_reason
              : fablePick?.vulnerability_reasoning;

            // Result badge
            let resultBadge = null;
            if (result) {
              const winHit = result.win_pp === winPickPP;
              const placeHit = result.win_pp === winPickPP || result.place_pp === winPickPP;
              const exactaHit = boxPPs.includes(result.win_pp) && boxPPs.includes(result.place_pp);
              if (winHit) resultBadge = { text: 'WIN', color: 'bg-green-500' };
              else if (exactaHit) resultBadge = { text: 'EXACTA', color: 'bg-green-500' };
              else if (placeHit) resultBadge = { text: 'PLACE', color: 'bg-yellow-500' };
              else resultBadge = { text: 'MISS', color: 'bg-red-400' };
            }

            return (
              <div
                key={race.id}
                className="bg-surface border border-border rounded-2xl shadow-soft overflow-hidden">

                {/* Collapsed header */}
                <button
                  onClick={() => setExpandedRace(isExpanded ? null : race.id)}
                  className="w-full text-left p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">R{race.race_number}</span>
                        <span className="text-xs text-muted">{formatPostTime(race.post_time)}</span>
                        <span className="text-xs text-muted">•</span>
                        <span className="text-xs text-muted">{race.distance} {race.surface}</span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">{race.conditions} • ${(race.purse / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {resultBadge && hasPick && (
                        <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${resultBadge.color}`}>
                          {resultBadge.text}
                        </span>
                      )}
                      {conviction && hasPick && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          conviction === 'HIGH' ? 'bg-green-100 text-green-800' :
                          conviction === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {conviction}
                        </span>
                      )}
                      {!hasPick && (
                        <span className="text-[10px] font-medium text-muted px-2 py-0.5 rounded-full bg-gray-100">
                          {skipReason ? 'SKIP' : 'NO PLAY'}
                        </span>
                      )}
                    </div>
                  </div>
                  {hasPick && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-700">
                        PP{winPickPP} {winPickName}
                      </span>
                      <span className="text-xs text-muted">({winPickMl})</span>
                      {paceScenario && (
                        <span className="text-[10px] bg-app border border-border px-1.5 py-0.5 rounded text-muted">
                          {paceScenario.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    {/* Pace reasoning (Fable) or vulnerability (Deterministic) */}
                    {paceReasoning && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted mb-1">Pace Read</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{paceReasoning}</p>
                      </div>
                    )}
                    {vulnReasoning && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted mb-1">Vulnerability</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{vulnReasoning}</p>
                      </div>
                    )}
                    {/* Theory / thesis */}
                    {theory && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted mb-1">
                          {sourceTab === 'fable' ? 'Thesis' : 'Theory'}
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed">{theory}</p>
                      </div>
                    )}
                    {skipReason && !hasPick && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted mb-1">Skip Reason</p>
                        <p className="text-xs text-gray-700">{skipReason}</p>
                      </div>
                    )}
                    {/* Box */}
                    {hasPick && boxPPs.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted mb-1">Exacta Box</p>
                        <div className="flex gap-1.5">
                          {boxPPs.map((pp: number) => {
                            const horse = field.find(e => e.post_position === pp);
                            const isWinPick = pp === winPickPP;
                            return (
                              <span key={pp} className={`text-xs px-2 py-1 rounded-lg border ${
                                isWinPick ? 'bg-green-50 border-green-200 font-semibold text-green-800' : 'bg-surface border-border text-gray-700'
                              }`}>
                                {pp} {horse?.horse_name?.split(' ').slice(0, 2).join(' ') || ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Field table */}
                    {field.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted mb-1">Field</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-muted text-[10px]">
                                <th className="text-left py-1 pr-2">PP</th>
                                <th className="text-left py-1 pr-2">Horse</th>
                                <th className="text-left py-1 pr-2">ML</th>
                                <th className="text-left py-1 pr-2">Style</th>
                                <th className="text-right py-1">Beyer</th>
                              </tr>
                            </thead>
                            <tbody>
                              {field.filter(e => !e.scratched).map(e => (
                                <tr key={e.post_position} className={`border-t border-border/50 ${
                                  e.post_position === winPickPP ? 'bg-green-50' :
                                  boxPPs.includes(e.post_position) ? 'bg-yellow-50/50' : ''
                                }`}>
                                  <td className="py-1 pr-2 font-mono">{e.post_position}</td>
                                  <td className="py-1 pr-2 font-medium truncate max-w-[120px]">{e.horse_name}</td>
                                  <td className="py-1 pr-2 text-muted">{e.morning_line_odds || '—'}</td>
                                  <td className="py-1 pr-2 text-muted">{e.running_style || '—'}</td>
                                  <td className="py-1 text-right tabular-nums">{e.best_beyer || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {/* Result */}
                    {result && (
                      <div className="bg-app rounded-lg p-2">
                        <p className="text-[10px] font-bold uppercase text-muted mb-1">Result</p>
                        <p className="text-xs">
                          <span className="font-semibold">1st:</span> {result.win_horse} (PP{result.win_pp}) •
                          <span className="font-semibold"> 2nd:</span> {result.place_horse} (PP{result.place_pp}) •
                          <span className="font-semibold"> 3rd:</span> {result.show_horse} (PP{result.show_pp})
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

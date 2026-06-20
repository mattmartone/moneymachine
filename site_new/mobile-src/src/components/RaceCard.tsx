import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Race } from '../data';
import { ChevronDown, Zap } from 'lucide-react';
interface RaceCardProps {
  race: Race;
}
// Readable full track names from the short codes used in the data.
const TRACK_NAMES: Record<string, string> = {
  AQU: 'Aqueduct',
  BEL: 'Belmont',
  SAR: 'Saratoga',
  CD: 'Churchill Downs',
  SA: 'Santa Anita',
  GP: 'Gulfstream',
  DMR: 'Del Mar',
  KEE: 'Keeneland'
};
export function RaceCard({ race }: RaceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const trackName = TRACK_NAMES[race.track] ?? race.track;
  // Races that haven't run yet show our projected finishing order (top pick first).
  const notRun = race.status === 'upcoming' || race.status === 'live';
  const projectedOrder = [
  race.winPick.pp,
  ...race.exoticBox.filter((n) => n !== race.winPick.pp)];

  // Settled races carry a per-bet payout breakdown in the wagering plan.
  const isSettled = race.status === 'hit' || race.status === 'miss';
  const net = race.collected - race.totalStake;
  // Right-side meta: status badge for non-upcoming races; the post time for upcoming.
  const renderRightMeta = () => {
    switch (race.status) {
      case 'upcoming':
        // Post time now shows under the race number on the left.
        return null;
      case 'live':
        return (
          <span className="bg-success/10 border border-success/20 text-success px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
            Live
          </span>);

      case 'hit':
      case 'miss':
        // Settled outcomes move to the status tab at the bottom of the card.
        return null;
      case 'dropped':
        return (
          <span className="bg-app border border-border text-muted/60 px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold">
            Dropped
          </span>);

    }
  };
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden transition-colors shadow-soft">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 focus:outline-none">
        
        {/* Collapsed view: race number on the left, projected horse order on the right */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-start gap-3">
            {/* Left: track + race number (hero) with small post time beneath */}
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-widest text-muted font-semibold truncate">
                {trackName}
              </span>
              <div className="flex items-baseline gap-0.5 leading-none">
                <span className="text-sm font-bold text-muted">R</span>
                <span className="text-3xl font-bold text-gray-900 tabular-nums leading-none">
                  {race.raceNumber}
                </span>
              </div>
              <span className="text-xs text-muted tabular-nums mt-1">
                {race.postTime}
              </span>
            </div>

            {/* Right: live/dropped status, then the projected order numbers */}
            <div className="flex flex-col items-end gap-2 min-w-0">
              {renderRightMeta() &&
              <div className="flex items-center">{renderRightMeta()}</div>
              }

              {isSettled ? (
                <div className="flex flex-col items-end">
                  <span className={`text-lg font-bold tabular-nums ${net >= 0 ? 'text-success' : 'text-danger'}`}>
                    {net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}
                  </span>
                </div>
              ) : race.exoticBox.length > 0 && (
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">
                    Projected order
                  </span>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {projectedOrder.map(
                    (num, idx) =>
                    <span
                      key={idx}
                      className="min-w-[1.75rem] text-center text-sm font-bold tabular-nums px-1.5 py-1 rounded-md border border-border text-gray-900">

                          {num}
                        </span>

                  )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Win pick pill removed — info is in wagering plan */}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded &&
        <motion.div
          initial={{
            height: 0,
            opacity: 0
          }}
          animate={{
            height: 'auto',
            opacity: 1
          }}
          exit={{
            height: 0,
            opacity: 0
          }}
          transition={{
            duration: 0.2,
            ease: 'easeInOut'
          }}
          className="overflow-hidden border-t border-border bg-app/50">
          
            <div className="p-4 space-y-5">

              {/* Race theory */}
              {race.analysis.paceThesis && (
              <div className="border-t border-border pt-4">
                <h4 className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1.5">
                  Race Theory
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {race.analysis.paceThesis}
                </p>
              </div>
              )}

              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
                  Strategies Firing
                </h4>
                <div className="flex flex-wrap gap-2">
                  {race.analysis.strategies.map((strategy, idx) =>
                <span
                  key={idx}
                  className="bg-surface border border-border text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                  
                      {strategy}
                    </span>
                )}
                </div>
              </div>

              {race.wagers.length > 0 ?
            <div className="pt-2">
                  <h4 className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-3">
                    Wagering Plan
                  </h4>
                  <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-app border-b border-border">
                        <tr>
                          <th className="py-2 px-3 text-[10px] uppercase tracking-wider text-muted font-semibold">
                            Type
                          </th>
                          <th className="py-2 px-3 text-[10px] uppercase tracking-wider text-muted font-semibold">
                            Bet
                          </th>
                          <th className="py-2 px-3 text-[10px] uppercase tracking-wider text-muted font-semibold text-right">
                            Wagered
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {race.wagers.map((wager, idx) =>
                        <tr key={idx}>
                              <td className="py-2.5 px-3 text-gray-700">
                                {wager.type}
                              </td>
                              <td className="py-2.5 px-3 font-semibold tabular-nums text-gray-900">
                                {wager.bet}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-gray-900">
                                ${wager.cost}
                              </td>
                            </tr>
                    )}
                      </tbody>
                      <tfoot className="bg-app border-t border-border">
                        <tr>
                            <td
                        colSpan={2}
                        className="py-2.5 px-3 text-right text-[10px] uppercase tracking-wider text-muted font-semibold">

                              Total
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold tabular-nums text-gray-900">
                              ${race.totalStake}
                            </td>
                          </tr>
                      </tfoot>
                    </table>
                  </div>
                </div> :

            <div className="pt-2 text-sm text-muted italic">
                  No wagers placed for this race.
                </div>
            }

              {/* Race Result table — below wagering plan for settled races */}
              {(race.status === 'hit' || race.status === 'miss') &&
            <div className="bg-surface border border-border rounded-xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                      Race Result
                    </span>
                    <span
                  className={`text-xs font-bold uppercase tracking-wider ${race.status === 'hit' ? 'text-success' : 'text-danger'}`}>
                      {race.status === 'hit' ? '✓ Hit' : '✗ Miss'}
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-gray-900 mb-3">
                    #{race.exoticBox[0]} — #{race.exoticBox[1]} — #{race.exoticBox[2]}{race.exoticBox[3] ? ` — #${race.exoticBox[3]}` : ''}
                  </div>
                  <table className="w-full text-left text-xs tabular-nums">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-1.5 text-[9px] uppercase tracking-wider text-muted font-semibold">Bet</th>
                        <th className="py-1.5 text-[9px] uppercase tracking-wider text-muted font-semibold">Wagered</th>
                        <th className="py-1.5 text-[9px] uppercase tracking-wider text-muted font-semibold">Track Pays</th>
                        <th className="py-1.5 text-[9px] uppercase tracking-wider text-muted font-semibold">Result</th>
                        <th className="py-1.5 text-[9px] uppercase tracking-wider text-muted font-semibold">Collected</th>
                        <th className="py-1.5 text-[9px] uppercase tracking-wider text-muted font-semibold">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {race.wagers.map((wager, idx) => {
                        const paid = wager.paid ?? 0;
                        const wagerNet = paid - wager.cost;
                        const hit = paid > 0;
                        return (
                          <tr key={idx} className="border-b border-border/50">
                            <td className="py-1.5 text-gray-700">{wager.type}</td>
                            <td className="py-1.5 text-gray-900">${wager.cost}</td>
                            <td className="py-1.5 text-muted">{wager.trackPays || '—'}</td>
                            <td className={`py-1.5 font-semibold ${hit ? 'text-success' : 'text-muted/60'}`}>{hit ? 'HIT' : 'miss'}</td>
                            <td className={`py-1.5 font-semibold ${hit ? 'text-success' : 'text-muted/60'}`}>{paid > 0 ? `$${paid.toFixed(2)}` : '—'}</td>
                            <td className={`py-1.5 font-semibold ${wagerNet >= 0 ? 'text-success' : 'text-danger'}`}>{wagerNet >= 0 ? '+' : '-'}${Math.abs(wagerNet).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border">
                        <td className="py-2 font-bold text-gray-900">Total</td>
                        <td className="py-2 font-bold text-gray-900">${race.totalStake}</td>
                        <td></td>
                        <td></td>
                        <td className={`py-2 font-bold ${net >= 0 ? 'text-success' : 'text-danger'}`}>${race.collected.toFixed(2)}</td>
                        <td className={`py-2 font-bold ${net >= 0 ? 'text-success' : 'text-danger'}`}>{net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
            }
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Bottom tab: expand affordance */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 border-t focus:outline-none bg-app/40 border-border">

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
            Wagering plan
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
            {isExpanded ? 'Less' : 'Tap to expand'}
          </span>
          <motion.div
            animate={{
              rotate: isExpanded ? 180 : 0
            }}
            transition={{
              duration: 0.2
            }}
            className="text-muted">
            
            <ChevronDown size={16} />
          </motion.div>
        </div>
      </button>
    </div>);

}
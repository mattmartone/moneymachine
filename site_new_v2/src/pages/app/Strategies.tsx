import React from 'react';
const STRATEGIES = [
{
  id: 'vulnerable-fave',
  name: 'Spot the Vulnerable Favorite',
  desc: 'Find races where the favorite is set up to fail — boxed inside, pace duel, no clean trip — then back the horse that profits.',
  winRate: '67%',
  roi: '+56%',
  form: 'W-W-L',
  status: 'HOT SIGNAL'
},
{
  id: 'troubled-trip',
  name: 'Troubled Trip',
  desc: 'Horses that hit real trouble last out but were running well. The public sees the bad finish; we see the excuse and the price.',
  winRate: '50%',
  roi: '+50%',
  form: 'W-L',
  status: 'HOT SIGNAL'
},
{
  id: 'hot-barn',
  name: 'S4 — Hot Barn at a Price',
  desc: 'Trainers winning 15%+ at the meet running a horse at 6/1 or higher. The barn is live regardless of public perception.',
  winRate: '50%',
  roi: 'TBD',
  form: 'W-P',
  status: 'STABLE'
},
{
  id: 'earnings-leader',
  name: 'S9 — Earnings Leader',
  desc: 'The richest horse in the field has proven they belong. Strongest in graded stakes where class floor is highest.',
  winRate: '33%',
  roi: 'TBD',
  form: 'W-L-L',
  status: 'STABLE'
},
{
  id: 'late-tote',
  name: 'S2 — Late Tote Action',
  desc: 'Sharp money flowing in. When a horse drops 3+ points from morning line, trainers, owners, or syndicates know something.',
  winRate: '33%',
  roi: 'TBD',
  form: 'W-L-L',
  status: 'STABLE'
},
{
  id: 'elite-jockey',
  name: 'S1 — Elite Jockey on Bomb',
  desc: 'Top-3 meet riders don\'t waste mounts. If they choose a 12/1+ shot over shorter-priced options, someone knows something.',
  winRate: '100%',
  roi: 'TBD',
  form: 'W',
  status: 'STABLE'
},
{
  id: 'trigger-a',
  name: 'Trigger A — Fave Exclusion',
  desc: 'Removed favorites from exacta boxes when vulnerable. Cost us $491 in one race. Replaced by Key Against.',
  winRate: '0%',
  roi: '-100%',
  form: 'L-L-L',
  status: 'RETIRED'
}];

export function Strategies() {
  return (
    <div>
      <div className="bg-[#000080] text-white font-bold p-1 px-2 mb-6">
        <span>Active & Retired Strategies</span>
      </div>

      <div className="mb-6 font-serif text-lg">
        <p>
          Review the current performance of our algorithmic models. Only active
          strategies are available for order.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {STRATEGIES.map((strat) =>
        <div
          key={strat.id}
          className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${strat.status === 'RETIRED' ? 'opacity-70 bg-gray-200' : ''}`}>
          
            <div
            className={`text-white font-sans font-bold p-1 px-2 flex justify-between items-center ${strat.status === 'RETIRED' ? 'bg-gray-500' : 'bg-[#000080]'}`}>
            
              <span>Strategy: {strat.name}</span>
              <span
              className={`px-1 text-xs ${strat.status === 'HOT SIGNAL' ? 'bg-yellow-400 text-black animate-blink' : strat.status === 'RETIRED' ? 'bg-gray-300 text-gray-700' : 'bg-white text-[#000080]'}`}>
              
                {strat.status}
              </span>
            </div>
            <div className="p-4">
              <p className="font-serif text-sm mb-4 h-10">{strat.desc}</p>
              <table
              className={`web-table font-mono text-sm mb-4 ${strat.status === 'RETIRED' ? 'border-gray-500' : ''}`}>
              
                <tbody>
                  <tr>
                    <th
                    className={`w-1/2 ${strat.status === 'RETIRED' ? 'bg-gray-300' : ''}`}>
                    
                      Win Rate
                    </th>
                    <td
                    className={`font-bold ${strat.status === 'RETIRED' ? 'text-web-red' : 'text-web-green'}`}>
                    
                      {strat.winRate}
                    </td>
                  </tr>
                  <tr>
                    <th
                    className={
                    strat.status === 'RETIRED' ? 'bg-gray-300' : ''
                    }>
                    
                      30d ROI
                    </th>
                    <td
                    className={`font-bold ${strat.status === 'RETIRED' ? 'text-web-red' : strat.roi.startsWith('+') ? 'text-web-green' : 'text-black'}`}>
                    
                      {strat.roi}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="font-sans text-xs font-bold mb-1 text-gray-600">
                RECENT FORM:
              </div>
              <div
              className={`font-mono text-lg tracking-widest font-bold p-2 border border-gray-400 ${strat.status === 'RETIRED' ? 'bg-gray-300 text-web-red' : 'bg-gray-100 text-web-green'}`}>
              
                {strat.form}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>);

}
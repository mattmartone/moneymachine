import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const STRATEGIES = [
  { name: 'Spot the Vulnerable Favorite', type: 'Offensive', winRate: '67%', itm: '67%', form: 'W-W-L', status: 'hot', desc: 'Find races where the favorite is set up to fail, then back the horse that profits from the chaos.' },
  { name: 'Troubled Trip', type: 'BOLO', winRate: '50%', itm: '50%', form: 'W-L', status: 'hot', desc: 'Horses that hit real trouble last out. The public sees the bad finish; we see the excuse and the price.' },
  { name: 'S4 — Hot Barn at a Price', type: 'Signal (+2)', winRate: '50%', itm: '100%', form: 'W-P', status: 'active', desc: 'Trainers winning 15%+ at the meet on a horse at 6/1 or higher.' },
  { name: 'S9 — Earnings Leader', type: 'Signal (+1/+2)', winRate: '33%', itm: '33%', form: 'W-L-L', status: 'active', desc: 'Richest horse in the field. Strongest in graded stakes.' },
  { name: 'S2 — Late Tote Action', type: 'Signal (+3)', winRate: '33%', itm: '33%', form: 'W-L-L', status: 'active', desc: 'Sharp money flowing. Horse drops 3+ points from ML by post.' },
  { name: 'S1 — Elite Jockey on Bomb', type: 'Signal (+3)', winRate: '100%', itm: '100%', form: 'W', status: 'active', desc: 'Top-3 meet rider picks a 12/1+ shot. They know something.' },
  { name: 'S6 — Best Last-Race Beyer', type: 'Signal (+1)', winRate: '0%', itm: '33%', form: 'L-P-L', status: 'active', desc: 'Highest speed figure in most recent race. Proven they can run fast.' },
  { name: 'Trigger A — Fave Exclusion', type: 'RETIRED', winRate: '0%', itm: '0%', form: 'L-L-L', status: 'retired', desc: 'Excluded favorites from exacta boxes. Cost us $491. Replaced by Key Against.' },
];

export function Strategies() {
  const navigate = useNavigate();
  const user = localStorage.getItem('ftc_token');

  if (!user) {
    navigate('/');
    return null;
  }

  const storedUser = JSON.parse(localStorage.getItem('ftc_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('ftc_token');
    localStorage.removeItem('ftc_user');
    navigate('/');
  };

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-serif text-3xl font-bold">FADE THE CHALK</h1>
            <div className="font-sans text-sm">
              <span className="font-mono mr-4">{storedUser?.email}</span>
              <button onClick={handleLogout} className="web-link font-bold">LOG OUT</button>
            </div>
          </div>
          <nav className="bg-web-gray border-2 border-black p-2 shadow-outset font-sans text-sm font-bold flex gap-6">
            <Link to="/reports" className="web-link">REPORTS</Link>
            <Link to="/strategies" className="web-link">STRATEGIES</Link>
          </nav>
        </header>

        <div className="mb-6">
          <h2 className="font-serif text-2xl font-bold bg-black text-white inline-block px-2 py-1 mb-4">
            STRATEGY FORM CHARTS
          </h2>
          <p className="font-serif text-lg">
            Each strategy is tracked like a horse. Win rate, ITM%, and recent form — visible before you bet.
          </p>
        </div>

        <div className="space-y-4">
          {STRATEGIES.map(strat => (
            <div
              key={strat.name}
              className={`border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${strat.status === 'retired' ? 'opacity-60 bg-gray-200' : 'bg-white'}`}
            >
              <div className={`font-sans font-bold p-1 px-2 flex justify-between items-center ${strat.status === 'retired' ? 'bg-gray-500 text-white' : 'bg-[#000080] text-white'}`}>
                <span>{strat.name}</span>
                {strat.status === 'hot' && (
                  <span className="bg-yellow-400 text-black px-1 text-xs animate-blink">HOT</span>
                )}
                {strat.status === 'retired' && (
                  <span className="bg-gray-300 text-gray-700 px-1 text-xs">RETIRED</span>
                )}
              </div>
              <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <p className="font-serif text-sm text-gray-700 mb-2">{strat.desc}</p>
                  <span className="font-mono text-xs text-gray-500">{strat.type}</span>
                </div>
                <div className="flex gap-6 font-mono text-sm">
                  <div className="text-center">
                    <div className={`font-bold ${strat.status === 'retired' ? 'text-web-red' : 'text-web-green'}`}>{strat.winRate}</div>
                    <div className="text-xs text-gray-500">Win%</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold ${strat.status === 'retired' ? 'text-web-red' : 'text-web-green'}`}>{strat.itm}</div>
                    <div className="text-xs text-gray-500">ITM%</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold tracking-widest ${strat.status === 'retired' ? 'text-web-red' : 'text-web-green'}`}>{strat.form}</div>
                    <div className="text-xs text-gray-500">Form</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

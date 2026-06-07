import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

interface Strategy {
  name: string;
  type: string;
  description: string;
  active: boolean;
  win_rate: number | null;
  itm_rate: number | null;
  form: string | null;
  best_conditions: string | null;
  trend: string | null;
}

const TABS = [
  { key: 'signal', label: 'SIGNALS' },
  { key: 'bolo', label: 'BOLOs' },
  { key: 'offensive', label: 'OFFENSIVE' },
  { key: 'rule', label: 'RULES' },
];

export function Strategies() {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('signal');

  useEffect(() => {
    const token = localStorage.getItem('ftc_token');
    if (!token) { navigate('/'); return; }

    fetch('/api/strategies', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) { navigate('/'); return; }
        return res.json();
      })
      .then(data => {
        if (data) setStrategies(data.strategies || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  const storedUser = JSON.parse(localStorage.getItem('ftc_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('ftc_token');
    localStorage.removeItem('ftc_user');
    navigate('/');
  };

  const filtered = strategies.filter(s => s.type === activeTab);

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Logo className="w-12 h-12" />
              <h1 className="font-serif text-3xl font-bold">FADE THE CHALK</h1>
            </div>
            <div className="font-sans text-sm">
              <span className="font-mono mr-4">{storedUser?.email}</span>
              <button onClick={handleLogout} className="web-link font-bold">LOG OUT</button>
            </div>
          </div>
          <nav className="bg-web-gray border-2 border-black p-2 shadow-outset font-sans text-sm font-bold flex gap-6">
            <Link to="/reports" className="web-link">DASHBOARD</Link>
            <Link to="/strategies" className="web-link">STRATEGIES</Link>
            <Link to="/contact" className="web-link">CONTACT</Link>
          </nav>
        </header>

        <h3 className="font-serif text-xl font-bold mb-4 border-b-2 border-black pb-1">
          STRATEGIES
        </h3>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1 font-sans font-bold text-sm border-2 ${activeTab === tab.key ? 'bg-white border-black shadow-inset' : 'bg-web-gray border-white border-r-black border-b-black shadow-outset'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="font-mono animate-blink p-4">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border-2 border-gray-400 p-8 text-center font-serif italic text-gray-500">
            No strategies in this category.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(strat => (
              <div
                key={strat.name}
                className={`border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${!strat.active ? 'opacity-60 bg-gray-200' : 'bg-white'}`}
              >
                <div className={`font-sans font-bold p-1 px-2 flex justify-between items-center ${!strat.active ? 'bg-gray-500 text-white' : 'bg-[#000080] text-white'}`}>
                  <span>{strat.name}</span>
                  {strat.trend === 'up' && strat.active && (
                    <span className="bg-yellow-400 text-black px-1 text-xs animate-blink">HOT</span>
                  )}
                  {!strat.active && (
                    <span className="bg-gray-300 text-gray-700 px-1 text-xs">RETIRED</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-serif text-sm text-gray-700 mb-2">{strat.description}</p>
                  <div className="flex items-center justify-end">
                    <div className="flex gap-6 font-mono text-sm">
                      {strat.win_rate !== null && (
                        <div className="text-center">
                          <div className={`font-bold ${!strat.active ? 'text-web-red' : 'text-web-green'}`}>{strat.win_rate}%</div>
                          <div className="text-xs text-gray-500">Win</div>
                        </div>
                      )}
                      {strat.itm_rate !== null && (
                        <div className="text-center">
                          <div className={`font-bold ${!strat.active ? 'text-web-red' : 'text-web-green'}`}>{strat.itm_rate}%</div>
                          <div className="text-xs text-gray-500">ITM</div>
                        </div>
                      )}
                      {strat.form && (
                        <div className="text-center">
                          <div className={`font-bold tracking-widest ${!strat.active ? 'text-web-red' : 'text-web-green'}`}>{strat.form}</div>
                          <div className="text-xs text-gray-500">Form</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

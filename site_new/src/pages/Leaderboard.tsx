import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

interface Leader {
  name: string;
  strategies_approved: number;
  lifetime_earned: number;
  total_usage: number;
}

export function Leaderboard() {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  const storedUser = JSON.parse(localStorage.getItem('ftc_user') || '{}');
  const token = localStorage.getItem('ftc_token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }

    fetch('/api/leaderboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data) setLeaders(data.leaders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem('ftc_token');
    localStorage.removeItem('ftc_user');
    navigate('/');
  };

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Logo className="w-14 h-14" />
              <h1 className="font-serif text-3xl font-bold">FADE THE CHALK</h1>
            </div>
            <div className="font-sans text-sm">
              <span className="font-mono mr-4">{storedUser?.email}</span>
              <button onClick={handleLogout} className="web-link font-bold">LOG OUT</button>
            </div>
          </div>
          <nav className="bg-web-gray border-2 border-black p-2 shadow-outset font-sans text-sm font-bold flex gap-6">
            <Link to="/reports" className="web-link">DASHBOARD</Link>
            <Link to="/strategies" className="web-link">MARKETPLACE</Link>
            <Link to="/board" className="web-link">BOARD</Link>
            <Link to="/submit" className="web-link">SUBMIT</Link>
            <Link to="/leaderboard" className="web-link">LEADERBOARD</Link>
            <Link to="/contact" className="web-link">CONTACT</Link>
          </nav>
        </header>

        <h3 className="font-serif text-xl font-bold mb-4 border-b-2 border-black pb-1">
          TOP HANDICAPPERS
        </h3>

        {loading ? (
          <div className="font-mono animate-blink p-4">Loading...</div>
        ) : leaders.length === 0 ? (
          <div className="bg-white border-2 border-gray-400 p-8 text-center font-serif italic text-gray-500">
            No handicappers on the board yet. <Link to="/submit" className="web-link">Submit a strategy</Link> to get started.
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <table className="web-table font-mono text-sm w-full">
              <thead>
                <tr>
                  <th className="py-2 px-3 text-left">#</th>
                  <th className="py-2 px-3 text-left">HANDICAPPER</th>
                  <th className="py-2 px-3 text-center">STRATEGIES</th>
                  <th className="py-2 px-3 text-center">USAGE</th>
                  <th className="py-2 px-3 text-right">EARNINGS</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((leader, i) => (
                  <tr key={leader.name} className="hover:bg-[#ffffcc]">
                    <td className="px-3 py-2 font-bold">{i + 1}</td>
                    <td className="px-3 py-2 font-bold">{leader.name || 'Anonymous'}</td>
                    <td className="px-3 py-2 text-center">{leader.strategies_approved}</td>
                    <td className="px-3 py-2 text-center">{leader.total_usage.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-bold text-web-green">${leader.lifetime_earned.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

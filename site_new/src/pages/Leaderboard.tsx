import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNav } from '../components/AppNav';

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

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
        <AppNav />

        <h3 className="font-serif text-xl font-bold mb-4 border-b-2 border-black pb-1">
          TOP HANDICAPPERS
        </h3>

        {loading ? (
          <div className="font-mono animate-blink p-4">Loading...</div>
        ) : leaders.length === 0 ? (
          <div className="bg-white border-2 border-gray-400 p-8 text-center font-serif italic text-gray-500">
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

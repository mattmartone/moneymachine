import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  membership_status: string;
  tokens: number;
  lifetime_tokens_used: number;
  reports_downloaded: number;
  lifetime_billed: number;
}

export function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const storedUser = JSON.parse(localStorage.getItem('ftc_user') || '{}');
  const token = localStorage.getItem('ftc_token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }

    fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) { navigate('/'); return; }
        return res.json();
      })
      .then(data => {
        if (data) setUsers(data.users || []);
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
      <div className="web-container max-w-5xl mx-auto">
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
            <Link to="/strategies" className="web-link">STRATEGIES</Link>
            <Link to="/contact" className="web-link">CONTACT</Link>
            <Link to="/users" className="web-link text-web-red">MEMBERS</Link>
          </nav>
        </header>

        <h3 className="font-serif text-xl font-bold mb-4 border-b-2 border-black pb-1">
          MEMBERS
        </h3>

        {loading ? (
          <div className="font-mono animate-blink p-4">Loading...</div>
        ) : (
          <div className="overflow-x-auto border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <table className="web-table font-mono text-xs w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className="py-2 px-2">Name</th>
                  <th className="py-2 px-2">Email</th>
                  <th className="py-2 px-2">Joined</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Tokens</th>
                  <th className="py-2 px-2">Used</th>
                  <th className="py-2 px-2">Reports</th>
                  <th className="py-2 px-2">Billed</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#ffffcc]">
                    <td className="px-2 py-1 font-bold">{u.name || '—'}</td>
                    <td className="px-2 py-1">{u.email}</td>
                    <td className="px-2 py-1">{u.created_at?.split('T')[0]}</td>
                    <td className="px-2 py-1">
                      <span className={`font-bold ${u.membership_status === 'active' ? 'text-web-green' : u.membership_status === 'free' ? 'text-web-blue' : 'text-gray-500'}`}>
                        {u.membership_status}
                      </span>
                    </td>
                    <td className="px-2 py-1 font-bold">{u.tokens?.toLocaleString()}</td>
                    <td className="px-2 py-1">{u.lifetime_tokens_used?.toLocaleString()}</td>
                    <td className="px-2 py-1">{u.reports_downloaded}</td>
                    <td className="px-2 py-1">${u.lifetime_billed?.toFixed(2)}</td>
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

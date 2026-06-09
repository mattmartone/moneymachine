import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

export function AppNav() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('ftc_user') || '{}');
  const token = localStorage.getItem('ftc_token');
  const [balance, setBalance] = useState<number | null>(null);
  const [subStatus, setSubStatus] = useState<string>('none');

  useEffect(() => {
    if (!token) return;
    fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.tokens !== undefined) setBalance(data.tokens);
        if (data?.subscription_status) setSubStatus(data.subscription_status);
      })
      .catch(() => {});
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('ftc_token');
    localStorage.removeItem('ftc_user');
    navigate('/');
  };

  const isAdmin = storedUser?.role === 'admin';
  const needsSub = balance !== null && balance === 0 && subStatus !== 'active';

  return (
    <header className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Logo className="w-14 h-14" />
          <h1 className="font-serif text-3xl font-bold">FADE THE CHALK</h1>
        </div>
        <div className="font-sans text-sm flex items-center gap-4">
          <Link to="/shop" className={`font-mono font-bold border-2 border-black px-2 py-1 shadow-outset hover:bg-[#ffffcc] ${needsSub ? 'bg-[#ffffcc]' : ''}`}>
            {balance === null ? '—' : balance === 0 ? 'GET TOKENS' : `${balance.toLocaleString()} tokens`}
          </Link>
          <button onClick={handleLogout} className="web-link font-bold">LOG OUT</button>
        </div>
      </div>

      {needsSub && (
        <Link to="/shop" className="block mb-4 bg-[#000080] text-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#0000a0] transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-sans font-bold text-lg">Join the crew — $10/month</div>
              <div className="font-serif text-sm opacity-90">Get 1,000,000 tokens and start running personalized race analysis today.</div>
            </div>
            <div className="font-sans font-bold text-xl border-2 border-white px-4 py-2">
              SUBSCRIBE →
            </div>
          </div>
        </Link>
      )}

      <nav className="bg-web-gray border-2 border-black p-2 shadow-outset font-sans text-sm font-bold flex gap-6">
        <Link to="/today" className="web-link">TODAY</Link>
        <Link to="/reports" className="web-link">DASHBOARD</Link>
        <Link to="/strategies" className="web-link">STRATEGIES MARKETPLACE</Link>
        <Link to="/lab" className="web-link">MY LAB</Link>
        <Link to="/board" className="web-link">BULLETIN BOARD</Link>
        <Link to="/contact" className="web-link">CONTACT</Link>
        {isAdmin && <Link to="/users" className="web-link text-web-red">MEMBERS</Link>}
        {isAdmin && <Link to="/races" className="web-link text-web-red">RACES</Link>}
      </nav>
    </header>
  );
}

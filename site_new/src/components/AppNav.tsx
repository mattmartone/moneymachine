import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

export function AppNav() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('ftc_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('ftc_token');
    localStorage.removeItem('ftc_user');
    navigate('/');
  };

  const isAdmin = storedUser?.role === 'admin';

  return (
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
        <Link to="/strategies" className="web-link">STRATEGIES MARKETPLACE</Link>
        <Link to="/lab" className="web-link">MY LAB</Link>
        <Link to="/board" className="web-link">BULLETIN BOARD</Link>
        <Link to="/contact" className="web-link">CONTACT</Link>
        {isAdmin && <Link to="/users" className="web-link text-web-red">MEMBERS</Link>}
        {isAdmin && <Link to="/admin/submissions" className="web-link text-web-red">REVIEW</Link>}
      </nav>
    </header>
  );
}

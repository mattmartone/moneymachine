import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';

export function Contact() {
  const navigate = useNavigate();
  const token = localStorage.getItem('ftc_token');
  const user = JSON.parse(localStorage.getItem('ftc_user') || '{}');

  if (!token) { navigate('/'); return null; }

  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name || '', email: user.email, message })
      });
      if (res.ok) {
        setStatus('sent');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ftc_token');
    localStorage.removeItem('ftc_user');
    navigate('/');
  };

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-2xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Logo className="w-12 h-12" />
              <h1 className="font-serif text-3xl font-bold">FADE THE CHALK</h1>
            </div>
            <div className="font-sans text-sm">
              <span className="font-mono mr-4">{user?.email}</span>
              <button onClick={handleLogout} className="web-link font-bold">LOG OUT</button>
            </div>
          </div>
          <nav className="bg-web-gray border-2 border-black p-2 shadow-outset font-sans text-sm font-bold flex gap-6">
            <Link to="/reports" className="web-link">DASHBOARD</Link>
            <Link to="/strategies" className="web-link">STRATEGIES</Link>
            <Link to="/contact" className="web-link">CONTACT</Link>
          </nav>
        </header>

        <h2 className="font-serif text-2xl font-bold bg-black text-white inline-block px-2 py-1 mb-6">
          CONTACT
        </h2>

        {status === 'sent' ? (
          <div className="bg-[#e6ffe6] border-2 border-[#008000] p-6 text-[#008000] font-bold text-center">
            MESSAGE SENT. We'll get back to you.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 font-mono text-sm text-gray-600">
              From: {user.name || user.email}
            </div>

            <div className="mb-6">
              <label className="block font-sans font-bold text-sm mb-1">Message:</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={5}
                className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset outline-none focus:bg-[#ffffcc] font-mono resize-none"
                required
              />
            </div>

            {status === 'error' && (
              <div className="text-web-red font-bold text-sm mb-4 bg-[#ffe6e6] border border-web-red p-2">
                * Something went wrong. Try again.
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="px-6 py-2 bg-web-gray font-sans font-bold text-black border-2 border-black shadow-outset active:shadow-inset cursor-pointer disabled:opacity-70"
            >
              {status === 'sending' ? 'SENDING...' : 'SEND MESSAGE'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Onboard() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setStatus('saving');
    const token = localStorage.getItem('ftc_token');

    try {
      const res = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: name.trim(), source: source.trim() })
      });

      if (res.ok) {
        const user = JSON.parse(localStorage.getItem('ftc_user') || '{}');
        user.name = name.trim();
        user.onboarded = true;
        localStorage.setItem('ftc_user', JSON.stringify(user));
        navigate('/reports');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen font-serif p-4 flex items-center justify-center">
      <div className="web-container max-w-lg">
        <h1 className="font-serif text-3xl font-bold mb-2 text-center">WELCOME TO FADE THE CHALK</h1>
        <p className="text-center font-serif text-lg mb-6">Tell us a bit about yourself.</p>

        <form onSubmit={handleSubmit} className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-4">
            <label className="block font-sans font-bold text-sm mb-1">Your Name:</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="First and last"
              className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset outline-none focus:bg-[#ffffcc] font-mono"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block font-sans font-bold text-sm mb-1">How did you hear about us?</label>
            <select
              value={source}
              onChange={e => setSource(e.target.value)}
              className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset font-mono"
            >
              <option value="">Select one...</option>
              <option value="friend">A friend told me</option>
              <option value="twitter">Twitter / X</option>
              <option value="racing-forum">Racing forum</option>
              <option value="search">Google search</option>
              <option value="other">Other</option>
            </select>
          </div>

          {status === 'error' && (
            <div className="text-web-red font-bold text-sm mb-4 bg-[#ffe6e6] border border-web-red p-2">
              Something went wrong. Try again.
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'saving'}
            className="px-6 py-2 bg-web-gray font-sans font-bold text-black border-2 border-black shadow-outset active:shadow-inset cursor-pointer disabled:opacity-70"
          >
            {status === 'saving' ? 'SAVING...' : 'GET IN →'}
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';

export function SiteModal() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    fetch('/api/auth/send-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #1a0a00 0%, #0d0d0d 40%, #1a0505 70%, #0d0d0d 100%)' }}>

      {/* Thermometer icon */}
      <div className="mb-6">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect x="18" y="4" width="8" height="28" rx="4" fill="#333" stroke="#555" strokeWidth="1"/>
          <circle cx="22" cy="36" r="6" fill="#333" stroke="#555" strokeWidth="1"/>
          <rect x="20" y="14" width="4" height="20" rx="2" fill="#ef4444"/>
          <circle cx="22" cy="36" r="4" fill="#ef4444"/>
        </svg>
      </div>

      {/* Main heading */}
      <h1 className="text-white text-3xl font-light mb-2 tracking-tight">
        Temperature
      </h1>
      <p className="text-gray-400 text-base mb-10 text-center max-w-xs">
        The card needs to cool down before you can bet it.
      </p>

      {/* Claudio section */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl max-w-sm w-full p-5 text-center">
        <img
          src="/claudio.png"
          alt="Claudio Pronto"
          className="w-28 h-28 mx-auto mb-3 object-contain"
        />
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Claudio Pronto</p>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          I ran the card. Extreme heat — cancellations across multiple tracks. Nothing qualifies today.
        </p>

        {submitted ? (
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg py-3 px-4">
            <p className="text-green-300 text-sm font-medium">You're on the list. We'll reach out when we're back.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-sm text-white placeholder-gray-500 mb-3 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
            />
            <button
              type="submit"
              className="w-full bg-white/10 border border-white/20 text-white/80 font-medium text-sm py-3 px-6 rounded-full hover:bg-white/20 transition-colors"
            >
              Alert Me When We're Back
            </button>
          </form>
        )}
        <p className="mt-3 text-xs text-gray-600">
          Get notified when the next card drops.
        </p>
      </div>
    </div>
  );
}

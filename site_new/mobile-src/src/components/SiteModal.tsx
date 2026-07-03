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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <img
          src="/claudio.png"
          alt="Claudio Pronto"
          className="w-44 h-44 mx-auto mb-5 object-contain"
        />
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Claudio Pronto
        </p>

        {/* Temperature notice */}
        <div className="bg-gray-900 rounded-xl py-5 px-4 my-4 text-center">
          <svg width="32" height="32" viewBox="0 0 44 44" fill="none" className="mx-auto mb-3">
            <rect x="18" y="4" width="8" height="28" rx="4" fill="#444" stroke="#666" strokeWidth="1"/>
            <circle cx="22" cy="36" r="6" fill="#444" stroke="#666" strokeWidth="1"/>
            <rect x="20" y="14" width="4" height="20" rx="2" fill="#ef4444"/>
            <circle cx="22" cy="36" r="4" fill="#ef4444"/>
          </svg>
          <h2 className="text-white text-xl font-light mb-1">Temperature</h2>
          <p className="text-gray-400 text-sm">
            The card needs to cool down before you can bet it.
          </p>
        </div>

        <p className="text-gray-600 text-sm mt-4 mb-2">
          Drop your email to get notified when we're back in action.
        </p>

        {submitted ? (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg py-3 px-4">
            <p className="text-green-800 text-sm font-medium">You're on the list. We'll reach out when we're back.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full border border-gray-300 rounded-lg py-3 px-4 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <button
              type="submit"
              className="w-full bg-gray-900 text-white font-semibold text-sm py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Alert Me When We're Back
            </button>
          </form>
        )}
        <p className="mt-3 text-xs text-gray-400">
          Get notified when the next card drops.
        </p>
      </div>
    </div>
  );
}

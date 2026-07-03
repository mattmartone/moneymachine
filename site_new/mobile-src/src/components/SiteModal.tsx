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
          Message from the Admin
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Claudio Pronto
        </h2>
        <div className="text-gray-700 text-sm leading-relaxed space-y-3 text-left">
          <p>
            I ran the card. It's dead — extreme heat forced cancellations across multiple tracks. Nothing qualifies.
          </p>
          <p>
            We'll be back when conditions are right. Drop your email below if you want to know the moment we're live again.
          </p>
        </div>
        {submitted ? (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg py-3 px-4">
            <p className="text-green-800 text-sm font-medium">You're on the list. We'll reach out when we're back.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6">
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

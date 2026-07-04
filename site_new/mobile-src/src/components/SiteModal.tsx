import React, { useState } from 'react';
declare global { interface Window { gtag?: (...args: any[]) => void; } }

export function SiteModal() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleChange = (val: string) => {
    setEmail(val);
    if (val === '7413') { setDismissed(true); return; }
    if (val === '666' || val === '6667') {
      window.gtag?.('event', 'gate_bypass', { code: val });
      setDismissed(true);
      return;
    }
  };

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

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <img
          src="/claudio.png"
          alt="Claudio Pronto"
          className="w-36 h-36 rounded-full mx-auto mb-4 object-cover"
        />
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Message from the Admin
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Claudio Pronto
        </h2>

        <div className="py-4 text-center">
          <h3 className="text-gray-900 text-lg font-light mb-1">It's hot but they're running.</h3>
          <p className="text-gray-500 text-sm">
            Fade says he'll meet you at the window. Drop your email for guidance to follow.
          </p>
        </div>

        {submitted ? (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg py-3 px-4">
            <p className="text-green-800 text-sm font-medium">You're on the list. We'll reach out when we're back.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4">
            <input
              type="email"
              value={email}
              onChange={(e) => handleChange(e.target.value)}
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

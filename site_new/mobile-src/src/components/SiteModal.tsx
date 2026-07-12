import React, { useState } from 'react';
declare global { interface Window { gtag?: (...args: any[]) => void; } }

export function SiteModal() {
  const [code, setCode] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [rejected, setRejected] = useState(false);

  const handleChange = (val: string) => {
    setCode(val);
    setRejected(false);
    if (val === '7581') {
      window.gtag?.('event', 'gate_bypass', { code: val });
      window.gtag?.('event', 'page_view', { page_path: '/gate-bypass/' + val });
      setDismissed(true);
      return;
    }
    if (val.length >= 3 && val !== '758' && val !== '7581') {
      setRejected(true);
    }
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
          <h3 className="text-gray-900 text-lg font-light mb-1">The card is live.</h3>
          <p className="text-gray-500 text-sm">
            Enter your passcode to access today's picks.
          </p>
        </div>

        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={code}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter code"
          className={`w-full border rounded-lg py-3 px-4 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${rejected ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
        />

        {rejected && (
          <div className="mt-4 bg-gray-900 rounded-xl py-4 px-5 text-left">
            <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">All codes are dead.</p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Sign up for the <strong className="text-white">Milano</strong> package — exclusive access to Claudio's daily picks, race theories, and Commission alerts.
            </p>
            <p className="text-white text-lg font-bold mt-2">$99/mo</p>
            <a
              href="/api/shop/milano"
              className="mt-3 inline-block w-full bg-white text-gray-900 font-semibold text-sm py-2.5 px-6 rounded-lg text-center hover:bg-gray-100 transition-colors"
            >
              Join the Milano
            </a>
          </div>
        )}

        {!rejected && (
          <p className="mt-3 text-xs text-gray-400">
            Don't have a code? <a href="/api/shop/milano" className="underline text-gray-600">Join the Milano — $99/mo</a>
          </p>
        )}
      </div>
    </div>
  );
}

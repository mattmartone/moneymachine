import React, { useState } from 'react';
declare global { interface Window { gtag?: (...args: any[]) => void; } }

export function SiteModal() {
  const [code, setCode] = useState('');
  const [dismissed, setDismissed] = useState(false);

  const handleChange = (val: string) => {
    setCode(val);
    if (val === '7413') { setDismissed(true); return; }
    if (val === '666' || val === '6667') {
      window.gtag?.('event', 'gate_bypass', { code: val });
      window.gtag?.('event', 'page_view', { page_path: '/gate-bypass/' + val });
      setDismissed(true);
      return;
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
          className="w-full border border-gray-300 rounded-lg py-3 px-4 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <p className="mt-3 text-xs text-gray-400">
          Don't have a code? <a href="https://fadethechalk.vercel.app/" className="underline text-gray-600">Learn about membership</a>
        </p>
      </div>
    </div>
  );
}

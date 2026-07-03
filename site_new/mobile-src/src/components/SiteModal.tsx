import React from 'react';

export function SiteModal() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <img
          src="/claudio.png"
          alt="Claudio Pronto"
          className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-gray-100 object-cover"
        />
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Message from the Admin
        </p>
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          Claudio Pronto
        </h2>
        <div className="text-gray-700 text-sm leading-relaxed space-y-3 text-left">
          <p>
            No action today. Extreme heat has forced cancellations across multiple tracks — the card is dead.
          </p>
          <p>
            The Commission doesn't chase. We sit when the edge isn't there.
          </p>
          <p>
            We'll be back when conditions are right. In the meantime — if you've been following along and want in on the next live card, now's your window.
          </p>
        </div>
        <a
          href="mailto:noreply@org64.com?subject=FTC%20Membership%20Inquiry"
          className="mt-6 inline-block w-full bg-gray-900 text-white font-semibold text-sm py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Request Access
        </a>
        <p className="mt-3 text-xs text-gray-400">
          Membership is by invitation only.
        </p>
      </div>
    </div>
  );
}

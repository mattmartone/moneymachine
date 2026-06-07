import React from 'react';
export function Account() {
  return (
    <div>
      <div className="bg-[#000080] text-white font-bold p-1 px-2 mb-6">
        <span>Account Settings</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="font-serif text-xl font-bold mb-4 border-b-2 border-gray-400 pb-2">
            PROFILE
          </h3>

          <div className="space-y-4 font-sans">
            <div>
              <label className="block font-bold text-sm text-gray-600">
                Email Address:
              </label>
              <div className="font-mono text-lg">user@example.com</div>
            </div>
            <div>
              <label className="block font-bold text-sm text-gray-600">
                Member Since:
              </label>
              <div className="font-mono text-lg">June 6, 2026</div>
            </div>
            <div className="pt-4 border-t border-gray-300">
              <p className="font-serif text-sm text-gray-600">
                Login is via magic link — no password needed. We'll send a link to your email each time you sign in.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="font-serif text-xl font-bold mb-4 border-b-2 border-gray-400 pb-2">
            PLAN
          </h3>

          <div className="bg-[#ffffcc] border-2 border-black p-4 mb-4 shadow-inset">
            <div className="font-bold text-web-red mb-1">
              PAY-PER-USE
            </div>
            <p className="font-serif text-sm">
              You pay per race analyzed. Cost covers data + compute + a small margin.
            </p>
          </div>

          <div className="font-sans space-y-2 mb-6">
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-bold text-gray-600">
                Free Analyses Remaining:
              </span>
              <span className="font-mono font-bold text-web-green">1 race day</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-bold text-gray-600">Lifetime Orders:</span>
              <span className="font-mono font-bold">0</span>
            </div>
          </div>

          <div className="font-serif text-sm text-gray-600">
            Pricing: per race × strategies selected. First full card is free.
          </div>
        </div>
      </div>
    </div>);

}
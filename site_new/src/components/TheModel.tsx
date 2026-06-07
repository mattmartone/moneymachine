import React from 'react';
export function TheModel() {
  return (
    <section id="the-model" className="py-4">
      <h2 className="font-serif text-2xl font-bold text-black mb-4 bg-black text-white inline-block px-2 py-1">
        THE MODEL: TREATED LIKE ATHLETES
      </h2>

      <div className="mb-6 font-serif text-lg">
        <p className="mb-2">
          We don't run one monolithic algorithm. We run specialized strategies — each independently scored, tracked, and evaluated like a horse's past performances.
        </p>
        <p>
          When a strategy gets hot, we weight it up. When it stops cashing, it gets retired.
          <strong> You only bet with signals that are currently winning.</strong>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Card */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#000080] text-white font-sans font-bold p-1 px-2 flex justify-between items-center">
            <span>Spot the Vulnerable Favorite</span>
            <span className="bg-yellow-400 text-black px-1 text-xs animate-blink">
              HOT
            </span>
          </div>
          <div className="p-4">
            <p className="font-serif text-sm mb-3 text-gray-700">
              Find races where the favorite is set up to fail, then back the horse whose style profits from that chaos.
            </p>
            <table className="web-table font-mono text-sm mb-4">
              <tbody>
                <tr>
                  <th className="w-1/2">Win Rate</th>
                  <td className="text-web-green font-bold">67%</td>
                </tr>
                <tr>
                  <th>ITM Rate</th>
                  <td className="text-web-green font-bold">67%</td>
                </tr>
              </tbody>
            </table>
            <div className="font-sans text-xs font-bold mb-1">RECENT FORM:</div>
            <div className="font-mono text-lg tracking-widest text-web-green font-bold bg-gray-100 p-2 border border-gray-400">
              W-W-L
            </div>
          </div>
        </div>

        {/* Retired Card */}
        <div className="bg-gray-200 border-2 border-gray-500 shadow-[4px_4px_0px_0px_rgba(128,128,128,1)] opacity-80">
          <div className="bg-gray-500 text-white font-sans font-bold p-1 px-2 flex justify-between items-center">
            <span>Trigger A — Fave Exclusion</span>
            <span className="bg-gray-300 text-gray-700 px-1 text-xs">
              RETIRED
            </span>
          </div>
          <div className="p-4">
            <p className="font-serif text-sm mb-3 text-gray-500">
              Removed favorites from exacta boxes when vulnerable. Cost us $491 in one race. Retired after 3 consecutive failures.
            </p>
            <table className="web-table font-mono text-sm mb-4 border-gray-500">
              <tbody>
                <tr>
                  <th className="w-1/2 bg-gray-300">Win Rate</th>
                  <td className="text-web-red">0%</td>
                </tr>
                <tr>
                  <th className="bg-gray-300">ITM Rate</th>
                  <td className="text-web-red">0%</td>
                </tr>
              </tbody>
            </table>
            <div className="font-sans text-xs font-bold mb-1 text-gray-600">
              RECENT FORM:
            </div>
            <div className="font-mono text-lg tracking-widest text-web-red bg-gray-300 p-2 border border-gray-400">
              L-L-L
            </div>
          </div>
        </div>
      </div>
    </section>);

}
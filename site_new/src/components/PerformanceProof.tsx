import React from 'react';
export function PerformanceProof() {
  return (
    <section id="proof" className="py-4">
      <div className="text-center mb-6">
        <h2 className="font-serif text-3xl font-bold text-web-red mb-2">
          *** RESULTS ***
        </h2>
        <h3 className="font-serif text-2xl font-bold text-black">
          Belmont Stakes Day 2026 — Saratoga
        </h3>
      </div>

      <div className="bg-white border-4 border-black p-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="web-table font-mono text-center w-full min-w-[500px]">
          <thead>
            <tr>
              <th className="text-lg py-3">ROI</th>
              <th className="text-lg py-3">RACES</th>
              <th className="text-lg py-3">WIN PICKS</th>
              <th className="text-lg py-3">EXACTAS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-3xl font-bold text-web-green py-4 bg-[#e6ffe6]">
                +56%
              </td>
              <td className="text-2xl font-bold py-4">12</td>
              <td className="text-2xl font-bold py-4">3 hit (25%)</td>
              <td className="text-2xl font-bold py-4">4 hit (33%)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white border-2 border-black p-4 mt-4 font-mono text-sm text-center">
        <div className="font-bold text-web-green">Called the Belmont Stakes winner: Golden Tempo (5/1) — not the favorite.</div>
      </div>

      <p className="text-center font-sans text-sm mt-4 text-gray-600 italic">
        * Paper bets. 2 race days tracked. Past performance is not indicative of future results.
      </p>
    </section>);

}
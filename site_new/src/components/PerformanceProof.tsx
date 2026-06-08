import React from 'react';
export function PerformanceProof() {
  return (
    <section id="proof" className="py-4">
      <div className="text-center mb-6">
        <h2 className="font-serif text-3xl font-bold text-web-red mb-2">
          *** THIS WEEK'S RESULTS ***
        </h2>
        <h3 className="font-serif text-2xl font-bold text-black">
          Saratoga — June 6 &amp; 7, 2026
        </h3>
      </div>

      <div className="bg-white border-4 border-black p-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="web-table font-mono text-center w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="text-sm py-3">DAY</th>
              <th className="text-sm py-3">RACES</th>
              <th className="text-sm py-3">WAGERED</th>
              <th className="text-sm py-3">COLLECTED</th>
              <th className="text-sm py-3">P/L</th>
              <th className="text-sm py-3">ROI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3 font-bold">June 6 (Belmont Day)</td>
              <td className="py-3">12</td>
              <td className="py-3">$1,564</td>
              <td className="py-3">$2,434</td>
              <td className="py-3 text-web-green font-bold">+$870</td>
              <td className="py-3 text-web-green font-bold">+56%</td>
            </tr>
            <tr>
              <td className="py-3 font-bold">June 7</td>
              <td className="py-3">6</td>
              <td className="py-3">$904</td>
              <td className="py-3">$1,340</td>
              <td className="py-3 text-web-green font-bold">+$436</td>
              <td className="py-3 text-web-green font-bold">+48%</td>
            </tr>
            <tr className="border-t-4 border-black bg-[#e6ffe6]">
              <td className="py-4 font-bold text-lg">WEEK TOTAL</td>
              <td className="py-4 text-lg font-bold">18</td>
              <td className="py-4 text-lg font-bold">$2,468</td>
              <td className="py-4 text-lg font-bold">$3,774</td>
              <td className="py-4 text-lg text-web-green font-bold">+$1,306</td>
              <td className="py-4 text-lg text-web-green font-bold">+53%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white border-2 border-black p-4 mt-4 font-mono text-sm text-center space-y-1">
        <div className="font-bold text-web-green">Called the Belmont Stakes winner: Golden Tempo (5/1) — not the favorite.</div>
        <div className="font-bold text-web-green">Race 11 clean sweep: Win + Exacta + Trifecta on King Farro (4/1).</div>
      </div>

      <p className="text-center font-sans text-sm mt-4 text-gray-600 italic">
        * 3 race days tracked. All profitable. Past performance is not indicative of future results.
      </p>
    </section>);

}
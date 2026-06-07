import React from 'react';
export function PerformanceProof() {
  return (
    <section id="proof" className="py-4">
      <div className="text-center mb-6">
        <h2 className="font-serif text-3xl font-bold text-web-red mb-2">
          *** RECENT PERFORMANCE ***
        </h2>
        <h3 className="font-serif text-2xl font-bold text-black">
          Belmont Day 2026: Our active models crushed the card.
        </h3>
      </div>

      <div className="bg-white border-4 border-black p-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="web-table font-mono text-center w-full min-w-[500px]">
          <thead>
            <tr>
              <th className="text-lg py-3">TOTAL ROI</th>
              <th className="text-lg py-3">RACES PLAYED</th>
              <th className="text-lg py-3">WINNERS CALLED</th>
              <th className="text-lg py-3">HIT RATE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-3xl font-bold text-web-green py-4 bg-[#e6ffe6]">
                +56%
              </td>
              <td className="text-2xl font-bold py-4">13</td>
              <td className="text-2xl font-bold py-4">3</td>
              <td className="text-2xl font-bold py-4">33%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-center font-sans text-sm mt-4 text-gray-600 italic">
        * Past performance is not indicative of future results.
      </p>
    </section>);

}
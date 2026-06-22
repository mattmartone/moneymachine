import React from 'react';
export function PerformanceProof() {
  return (
    <section id="proof" className="py-4">
      <div className="text-center mb-6">
        <h2 className="font-serif text-3xl font-bold text-web-red mb-2">
          *** PAST PERFORMANCE ***
        </h2>
        <h3 className="font-serif text-2xl font-bold text-black">
          Lifetime Record — 6 Race Days
        </h3>
      </div>

      <div className="bg-white border-4 border-black p-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="web-table font-mono text-center w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="text-sm py-3">DATE</th>
              <th className="text-sm py-3">TRACK</th>
              <th className="text-sm py-3">RACES</th>
              <th className="text-sm py-3">WAGERED</th>
              <th className="text-sm py-3">COLLECTED</th>
              <th className="text-sm py-3">P/L</th>
              <th className="text-sm py-3">ROI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3 font-bold">May 24</td>
              <td className="py-3">Churchill Downs</td>
              <td className="py-3">6</td>
              <td className="py-3">$554</td>
              <td className="py-3">$611</td>
              <td className="py-3 text-web-green font-bold">+$57</td>
              <td className="py-3 text-web-green font-bold">+10%</td>
            </tr>
            <tr>
              <td className="py-3 font-bold">June 6</td>
              <td className="py-3">Saratoga</td>
              <td className="py-3">12</td>
              <td className="py-3">$1,564</td>
              <td className="py-3">$2,434</td>
              <td className="py-3 text-web-green font-bold">+$870</td>
              <td className="py-3 text-web-green font-bold">+56%</td>
            </tr>
            <tr>
              <td className="py-3 font-bold">June 7</td>
              <td className="py-3">Saratoga</td>
              <td className="py-3">6</td>
              <td className="py-3">$904</td>
              <td className="py-3">$1,340</td>
              <td className="py-3 text-web-green font-bold">+$436</td>
              <td className="py-3 text-web-green font-bold">+48%</td>
            </tr>
            <tr>
              <td className="py-3 font-bold">June 11</td>
              <td className="py-3">Multi-Track</td>
              <td className="py-3">5</td>
              <td className="py-3">$788</td>
              <td className="py-3">$221</td>
              <td className="py-3 text-web-red font-bold">-$567</td>
              <td className="py-3 text-web-red font-bold">-72%</td>
            </tr>
            <tr>
              <td className="py-3 font-bold">June 13</td>
              <td className="py-3">Multi-Track</td>
              <td className="py-3">4</td>
              <td className="py-3">$346</td>
              <td className="py-3">$184</td>
              <td className="py-3 text-web-red font-bold">-$162</td>
              <td className="py-3 text-web-red font-bold">-47%</td>
            </tr>
            <tr>
              <td className="py-3 font-bold">June 14</td>
              <td className="py-3">Multi-Track</td>
              <td className="py-3">7</td>
              <td className="py-3">$1,412</td>
              <td className="py-3">$2,327</td>
              <td className="py-3 text-web-green font-bold">+$915</td>
              <td className="py-3 text-web-green font-bold">+65%</td>
            </tr>
            <tr>
              <td className="py-3 font-bold">June 18</td>
              <td className="py-3">Multi-Track</td>
              <td className="py-3">4</td>
              <td className="py-3">$852</td>
              <td className="py-3">$1,386</td>
              <td className="py-3 text-web-green font-bold">+$534</td>
              <td className="py-3 text-web-green font-bold">+63%</td>
            </tr>
            <tr>
              <td className="py-3 font-bold">June 19</td>
              <td className="py-3">Multi-Track</td>
              <td className="py-3">10</td>
              <td className="py-3">$1,514</td>
              <td className="py-3">$1,480</td>
              <td className="py-3 text-web-red font-bold">-$34</td>
              <td className="py-3 text-web-red font-bold">-2%</td>
            </tr>
            <tr>
              <td className="py-3 font-bold">June 20</td>
              <td className="py-3">Multi-Track</td>
              <td className="py-3">8</td>
              <td className="py-3">$1,543</td>
              <td className="py-3">$1,888</td>
              <td className="py-3 text-web-green font-bold">+$345</td>
              <td className="py-3 text-web-green font-bold">+22%</td>
            </tr>
            <tr>
              <td className="py-3 font-bold">June 21</td>
              <td className="py-3">Multi-Track</td>
              <td className="py-3">11</td>
              <td className="py-3">$1,534</td>
              <td className="py-3">$1,685</td>
              <td className="py-3 text-web-green font-bold">+$151</td>
              <td className="py-3 text-web-green font-bold">+10%</td>
            </tr>
            <tr className="border-t-4 border-black bg-[#e6ffe6]">
              <td className="py-4 font-bold text-lg" colSpan={2}>LIFETIME</td>
              <td className="py-4 text-lg font-bold">73</td>
              <td className="py-4 text-lg font-bold">$11,011</td>
              <td className="py-4 text-lg font-bold">$13,556</td>
              <td className="py-4 text-lg text-web-green font-bold">+$2,545</td>
              <td className="py-4 text-lg text-web-green font-bold">+23%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white border-2 border-black p-4 mt-4 font-mono text-sm text-center space-y-1">
      </div>

      <p className="text-center font-sans text-sm mt-4 text-gray-600 italic">
        * Past performance is not indicative of future results.
      </p>
    </section>);

}
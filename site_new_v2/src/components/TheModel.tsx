import React from 'react';
export function TheModel() {
  return (
    <section id="the-model" className="py-4">
      <h2 className="font-serif text-2xl font-bold text-black mb-4 bg-black text-white inline-block px-2 py-1">
        THE MODEL: TREATED LIKE ATHLETES
      </h2>

      <div className="mb-6 font-serif text-lg">
        <p className="mb-2">
          We don't just run one monolithic algorithm. We run dozens of
          specialized strategies simultaneously. Each strategy is scored,
          tracked, and evaluated like a horse's past performance.
        </p>
        <p>
          When a strategy gets hot, we weight its signals up. When a strategy
          loses its edge, it gets retired.
          <strong>You only see the signals that are currently winning.</strong>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Card */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#000080] text-white font-sans font-bold p-1 px-2 flex justify-between items-center">
            <span>Strategy: Alpha-7</span>
            <span className="bg-yellow-400 text-black px-1 text-xs animate-blink">
              HOT SIGNAL
            </span>
          </div>
          <div className="p-4">
            <h3 className="font-serif text-xl font-bold mb-2">
              Maiden Claimers
            </h3>
            <table className="web-table font-mono text-sm mb-4">
              <tbody>
                <tr>
                  <th className="w-1/2">Win Rate</th>
                  <td className="text-web-green font-bold">34.2%</td>
                </tr>
                <tr>
                  <th>30d ROI</th>
                  <td className="text-web-green font-bold">+18.5%</td>
                </tr>
              </tbody>
            </table>
            <div className="font-sans text-xs font-bold mb-1">RECENT FORM:</div>
            <div className="font-mono text-lg tracking-widest text-web-green font-bold bg-gray-100 p-2 border border-gray-400">
              W-L-W-W-L-W
            </div>
          </div>
        </div>

        {/* Retired Card */}
        <div className="bg-gray-200 border-2 border-gray-500 shadow-[4px_4px_0px_0px_rgba(128,128,128,1)] opacity-80">
          <div className="bg-gray-500 text-white font-sans font-bold p-1 px-2 flex justify-between items-center">
            <span>Strategy: Beta-2</span>
            <span className="bg-gray-300 text-gray-700 px-1 text-xs">
              RETIRED
            </span>
          </div>
          <div className="p-4">
            <h3 className="font-serif text-xl font-bold mb-2 line-through text-gray-600">
              Turf Routes
            </h3>
            <table className="web-table font-mono text-sm mb-4 border-gray-500">
              <tbody>
                <tr>
                  <th className="w-1/2 bg-gray-300">Win Rate</th>
                  <td className="text-web-red">12.1%</td>
                </tr>
                <tr>
                  <th className="bg-gray-300">30d ROI</th>
                  <td className="text-web-red">-8.4%</td>
                </tr>
              </tbody>
            </table>
            <div className="font-sans text-xs font-bold mb-1 text-gray-600">
              RECENT FORM:
            </div>
            <div className="font-mono text-lg tracking-widest text-web-red bg-gray-300 p-2 border border-gray-400">
              L-L-L-W-L-L
            </div>
          </div>
        </div>
      </div>
    </section>);

}
import React from 'react';
export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-4">
      <h2 className="font-serif text-2xl font-bold text-black mb-4 bg-black text-white inline-block px-2 py-1">
        HOW IT WORKS
      </h2>

      <div className="bg-white border-2 border-black p-6">
        <ol className="list-decimal list-inside space-y-6 font-serif text-lg">
          <li className="font-bold text-xl">
            <span className="text-web-blue underline">Pick your races</span>
            <p className="font-normal text-base mt-1 ml-6 text-gray-800">
              Select the track and card you want analyzed. We parse the full DRF past performances for every race.
            </p>
          </li>
          <li className="font-bold text-xl">
            <span className="text-web-blue underline">
              Choose your strategies
            </span>
            <p className="font-normal text-base mt-1 ml-6 text-gray-800">
              Browse the strategy marketplace. Each one has a win rate, ROI, and form chart — like a horse with PPs. Pick the signals you trust.
            </p>
          </li>
          <li className="font-bold text-xl">
            <span className="text-web-blue underline">Get your picks</span>
            <p className="font-normal text-base mt-1 ml-6 text-gray-800">
              Receive scored picks with conviction levels, bet structure (Win + Exacta Box + Trifecta Box), and the reasoning behind each play.
            </p>
          </li>
        </ol>
      </div>
    </section>);

}
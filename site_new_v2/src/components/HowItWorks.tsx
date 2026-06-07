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
              Select the tracks and cards you want to play. We cover major North
              American circuits.
            </p>
          </li>
          <li className="font-bold text-xl">
            <span className="text-web-blue underline">
              Choose your strategies
            </span>
            <p className="font-normal text-base mt-1 ml-6 text-gray-800">
              Filter active AI models by ROI, win rate, and recent form. Fade
              the chalk or hunt longshots.
            </p>
          </li>
          <li className="font-bold text-xl">
            <span className="text-web-blue underline">Get your picks</span>
            <p className="font-normal text-base mt-1 ml-6 text-gray-800">
              Receive exact win probabilities and fair value odds minutes before
              post time.
            </p>
          </li>
        </ol>
      </div>
    </section>);

}
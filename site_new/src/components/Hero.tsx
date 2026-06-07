import React from 'react';
import { EmailCapture } from './EmailCapture';
export function Hero() {
  return (
    <section id="home" className="text-center py-6">
      <div className="mb-6">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-black mb-2">
          AI-powered handicapping.
        </h2>
        <h3 className="font-serif text-2xl md:text-3xl text-web-red italic mb-6">
          "Strategies that run like horses."
        </h3>

        <div className="bg-white border-2 border-black p-4 max-w-2xl mx-auto text-left font-serif text-lg leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <p className="mb-2">
            <strong>ATTENTION HORSEPLAYERS:</strong> An LLM reads the DRF, scores every horse against proven signals, and builds your bets.
          </p>
          <p>
            Each strategy has a form chart.{' '}
            <span className="bg-yellow-200 font-bold px-1">
              Underperformers get retired. Hot signals get weighted up.
            </span>
          </p>
        </div>
      </div>

      <div className="bg-web-gray border-2 border-black p-6 max-w-lg mx-auto shadow-outset">
        <h4 className="font-sans font-bold text-lg mb-4 text-center animate-blink text-web-red">
          *** GET A FREE RACE DAY ANALYSIS ***
        </h4>
        <EmailCapture buttonText="Send me picks" />
      </div>
    </section>);

}
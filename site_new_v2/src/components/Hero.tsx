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
            <strong>ATTENTION HORSEPLAYERS:</strong> We score, track, and bet
            algorithmic signals.
          </p>
          <p>
            Underperformers get retired.{' '}
            <span className="bg-yellow-200 font-bold px-1">
              Hot signals get weighted up.
            </span>
          </p>
        </div>
      </div>

      <div className="bg-web-gray border-2 border-black p-6 max-w-lg mx-auto shadow-outset">
        <h4 className="font-sans font-bold text-lg mb-2 text-center animate-blink text-web-red">
          *** GET ONE DAY OF ANALYSIS — FREE ***
        </h4>
        <p className="font-serif text-base mb-4 text-center">
          Drop your email and we'll send a full day's worth of picks and
          signals, on the house.
        </p>
        <EmailCapture buttonText="Get free analysis" />
      </div>
    </section>);

}
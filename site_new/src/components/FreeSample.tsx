import React from 'react';
import { EmailCapture } from './EmailCapture';
export function FreeSample() {
  return (
    <section id="free-sample" className="py-4">
      <div className="bg-[#ffffcc] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto relative">
        {/* Retro "FREE" Badge */}
        <div className="absolute -top-4 -right-4 bg-web-red text-white font-sans font-bold text-xl px-4 py-2 border-2 border-black transform rotate-12 animate-blink shadow-outset">
          FREE!
        </div>

        <h2 className="font-serif text-3xl font-bold text-black mb-4 uppercase text-center border-b-2 border-black pb-2">
          See What You Get.
        </h2>

        <div className="font-serif text-lg mb-6 space-y-4 text-center">
          <p>
            Enter your email and get a <strong>free race day analysis</strong> — the same output paying members receive.
          </p>
          <p className="text-gray-800">
            Scored picks, conviction levels, bet structure, and the signal reasoning behind every play.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-4 mb-6">
          <div className="flex flex-col items-center gap-2">
            <svg width="64" height="80" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0H44L64 20V80H0V0Z" fill="#f5f5f5" stroke="black" strokeWidth="2"/>
              <path d="M44 0L64 20H44V0Z" fill="#ddd" stroke="black" strokeWidth="1"/>
              <text x="32" y="50" textAnchor="middle" fontFamily="monospace" fontSize="8" fontWeight="bold" fill="#333">RACE DAY</text>
              <text x="32" y="62" textAnchor="middle" fontFamily="monospace" fontSize="7" fill="#666">ANALYSIS</text>
              <text x="32" y="74" textAnchor="middle" fontFamily="monospace" fontSize="6" fill="#999">.PDF</text>
            </svg>
            <div className="font-mono text-xs text-gray-600">FadeTheChalk_BelmontDay_2026.pdf</div>
          </div>
        </div>

        <div className="bg-web-gray border-2 border-black p-4 shadow-outset">
          <h4 className="font-sans font-bold text-center mb-3">
            Get your free analysis:
          </h4>
          <EmailCapture buttonText="Send me picks" />
        </div>
      </div>
    </section>);

}
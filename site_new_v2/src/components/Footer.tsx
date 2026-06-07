import React from 'react';
export function Footer() {
  return (
    <footer className="py-6 text-center">
      <div
        id="waitlist"
        className="bg-web-gray border-2 border-black p-6 max-w-2xl mx-auto shadow-outset mb-8">
        
        <h2 className="font-serif text-2xl font-bold text-black mb-2">
          GET YOUR FREE SAMPLE REPORT
        </h2>
        <p className="font-serif text-lg mb-6">
          See exactly what you get — download our actual Belmont Day 2026 tip
          sheet. No waitlist, no payment.
        </p>
        <a
          href="#free-sample"
          className="inline-block px-8 py-3 bg-web-gray font-sans font-bold text-lg text-black border-2 border-black shadow-outset active:shadow-inset active:pt-3.5 active:pl-8.5 cursor-pointer">
          
          DOWNLOAD FREE SAMPLE &raquo;
        </a>
      </div>

      <div className="font-sans text-xs text-gray-600 flex flex-col items-center gap-4">
        <div className="border-2 border-black inline-block bg-black text-web-green font-mono font-bold px-3 py-1 tracking-widest">
          0 1 3 3 7
        </div>
        <p>You are visitor number 1337.</p>

        <div className="flex gap-4 mb-2">
          <a href="#" className="web-link">
            Home
          </a>
          <span>|</span>
          <a href="#" className="web-link">
            Contact Webmaster
          </a>
          <span>|</span>
          <a href="#" className="web-link">
            Disclaimer
          </a>
        </div>

        <p className="max-w-md">
          For entertainment purposes only. Play responsibly.
          <br />
          Best viewed in Netscape Navigator 4.0 or Internet Explorer 5.0 at
          800x600 resolution.
        </p>
        <p>
          &copy; {new Date().getFullYear()} Fade the Chalk. All rights reserved.
        </p>
      </div>
    </footer>);

}
import React from 'react';
export function Footer() {
  return (
    <footer className="py-6 text-center">
      <div className="font-sans text-xs text-gray-600 flex flex-col items-center gap-4">
        <div className="border-2 border-black inline-block bg-black text-web-green font-mono font-bold px-3 py-1 tracking-widest">
          0 1 3 3 7
        </div>
        <p>You are visitor number 1337.</p>

        <div className="flex gap-4 mb-2">
          <a href="#home" className="web-link">
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
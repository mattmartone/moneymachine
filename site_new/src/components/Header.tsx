import React, { useState } from 'react';
import { Logo } from './Logo';
import { AuthModal } from './AuthModal';
export function Header() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };
  return (
    <>
      <header className="text-center mb-6">
        <div className="flex flex-col items-center justify-center gap-2 mb-4">
          <Logo className="w-64 h-auto" />
        </div>
        <nav className="bg-web-gray border-2 border-black p-2 shadow-outset font-sans text-sm font-bold flex flex-wrap justify-center gap-4 md:gap-8">
          <a href="#home" className="web-link">
            HOME
          </a>
          <a href="#how-it-works" className="web-link">
            HOW IT WORKS
          </a>
          <a href="#the-model" className="web-link">
            THE MODEL
          </a>
          <a href="#proof" className="web-link">
            PERFORMANCE
          </a>
          <button
            onClick={() => openAuth('login')}
            className="web-link cursor-pointer bg-transparent border-none p-0">
            
            LOG IN
          </button>
          <button
            onClick={() => openAuth('signup')}
            className="web-link text-web-red cursor-pointer bg-transparent border-none p-0">
            
            SIGN UP
          </button>
        </nav>
      </header>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode} />
      
    </>);

}
import React, { useState } from 'react';
import { Check, Moon, Sun, Lock } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../theme';

const ACCOUNT_PIN = '7413';

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  if (!unlocked) {
    return (
      <div className="pb-24 min-h-screen bg-app flex items-center justify-center">
        <div className="bg-surface border border-border rounded-2xl p-6 w-72 shadow-sm text-center">
          <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={20} className="text-primary" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 mb-1">Account Locked</h2>
          <p className="text-xs text-muted mb-4">Enter PIN to access account settings</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pinInput}
            onChange={(e) => {
              setPinError(false);
              setPinInput(e.target.value);
              if (e.target.value.length === 4) {
                if (e.target.value === ACCOUNT_PIN) {
                  setUnlocked(true);
                } else {
                  setPinError(true);
                  setPinInput('');
                }
              }
            }}
            placeholder="••••"
            className={`w-full text-center text-2xl tracking-[0.5em] font-bold bg-app border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 ${pinError ? 'border-danger' : 'border-border'}`}
          />
          {pinError && <p className="text-xs text-danger mt-2">Incorrect PIN</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-app">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">
            Account
          </h1>
          <p className="text-xs text-muted font-medium leading-tight mt-0.5">
            Personalize your experience
          </p>
        </div>
      </div>

      <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-6">
        <section aria-labelledby="appearance-heading">
          <h2
            id="appearance-heading"
            className="text-[11px] uppercase tracking-widest font-bold text-muted mb-1">
            
            Appearance
          </h2>
          <p className="text-xs text-muted mb-4 leading-relaxed">
            Pick a color palette. Your choice is saved and applied instantly
            across the app — try one out for a while.
          </p>

          <div className="space-y-2.5">
            {THEMES.map((option) => {
              const isActive = option.id === theme;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  aria-pressed={isActive}
                  className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${isActive ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:bg-app'}`}>
                  
                  {/* Swatch */}
                  <span
                    className="relative shrink-0 w-12 h-12 rounded-lg border border-border overflow-hidden flex"
                    style={{
                      backgroundColor: option.swatch.bg
                    }}
                    aria-hidden="true">
                    
                    <span
                      className="w-1/2 h-full"
                      style={{
                        backgroundColor: option.swatch.primary
                      }} />
                    
                    <span
                      className="w-1/2 h-full"
                      style={{
                        backgroundColor: option.swatch.accent
                      }} />
                    
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-900">
                        {option.name}
                      </span>
                      {option.dark ?
                      <Moon size={12} className="text-muted" /> :

                      <Sun size={12} className="text-muted" />
                      }
                    </span>
                    <span className="block text-xs text-muted leading-snug mt-0.5">
                      {option.description}
                    </span>
                  </span>

                  <span
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${isActive ? 'bg-primary border-primary text-white' : 'border-border text-transparent'}`}>
                    
                    <Check size={14} />
                  </span>
                </button>);

            })}
          </div>
        </section>
      </main>
    </div>);

}
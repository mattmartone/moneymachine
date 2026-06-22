import React from 'react';
import { Search } from 'lucide-react';

export function Research() {
  return (
    <div className="pb-24 min-h-screen bg-app">
      <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">
            Research
          </h1>
          <p className="text-xs text-muted font-medium leading-tight mt-0.5">
            Race data, signals, and deep dives
          </p>
        </div>
      </div>

      <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-6">
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={20} className="text-primary" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 mb-1">Coming Soon</h2>
          <p className="text-xs text-muted">
            Historical race data, signal backtesting, and handicapping research tools.
          </p>
        </div>
      </main>
    </div>
  );
}

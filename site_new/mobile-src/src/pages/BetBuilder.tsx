import React, { useState } from 'react';
import { Send, MessageSquare, MapPin } from 'lucide-react';

type Mode = 'choose' | 'chat' | 'tracks';

export function BetBuilder() {
  const [mode, setMode] = useState<Mode>('choose');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input.trim() }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: 'This feature is coming soon. The AI agent will execute your strategies across all qualifying races and find where your angles hit with the highest conviction.' }]);
    }, 800);
  };

  if (mode === 'choose') {
    return (
      <div className="pb-24 min-h-screen bg-app flex flex-col">
        <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
          <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4">
            <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">
              AI Bet Builder
            </h1>
            <p className="text-xs text-muted font-medium leading-tight mt-0.5">
              Your handicapping agent — loaded with historical and live race data across North America
            </p>
          </div>
        </div>

        <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-8 flex-1 flex flex-col justify-center gap-4">
          <button
            onClick={() => setMode('chat')}
            className="bg-surface border border-border rounded-2xl p-5 text-left hover:border-primary/30 transition-colors shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl shrink-0">
                <MessageSquare size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-1">Describe your angle</h2>
                <p className="text-xs text-muted leading-relaxed">
                  Tell the AI what you're thinking — a strategy, a hunch, a track bias — and it'll build a wagering plan across today's races.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode('tracks')}
            className="bg-surface border border-border rounded-2xl p-5 text-left hover:border-primary/30 transition-colors shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl shrink-0">
                <MapPin size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-1">Start with a track</h2>
                <p className="text-xs text-muted leading-relaxed">
                  Browse today's tracks and races. Pick the ones you want analyzed and the AI will find the best angles.
                </p>
              </div>
            </div>
          </button>

          <div className="bg-app border border-border rounded-xl px-3 py-2 mt-4">
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold text-center">Coming Soon</p>
          </div>
        </main>
      </div>
    );
  }

  if (mode === 'tracks') {
    return (
      <div className="pb-24 min-h-screen bg-app">
        <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
          <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => setMode('choose')} className="text-muted hover:text-gray-900 text-sm font-semibold">← Back</button>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">
              Today's Tracks
            </h1>
          </div>
        </div>

        <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-6">
          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <MapPin size={24} className="text-primary mx-auto mb-3" />
            <h2 className="text-sm font-bold text-gray-900 mb-1">Track browser coming soon</h2>
            <p className="text-xs text-muted">
              Browse all tracks running today, view fields, and select races for AI analysis.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Chat mode
  return (
    <div className="pb-24 min-h-screen bg-app flex flex-col">
      <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => setMode('choose')} className="text-muted hover:text-gray-900 text-sm font-semibold">← Back</button>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">
            AI Bet Builder
          </h1>
        </div>
      </div>

      <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-4 flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.length === 0 && (
            <div className="text-center pt-12">
              <p className="text-sm text-muted">Describe your angle, strategy, or what you're looking for today.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {['I like closers in big fields', 'Find pace duels today', 'Help me build a new strategy', 'Where are the vulnerable favorites?'].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setInput(suggestion); }}
                    className="text-xs bg-surface border border-border px-3 py-1.5 rounded-full text-gray-700 hover:bg-app transition-colors">
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-none'
                  : 'bg-surface border border-border text-gray-900 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-app pt-2 pb-4">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe your angle..."
              className="w-full bg-surface border border-border rounded-full pl-4 pr-12 py-3 text-sm text-gray-900 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-1.5 p-2 bg-primary text-white rounded-full disabled:opacity-50 transition-colors">
              <Send size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

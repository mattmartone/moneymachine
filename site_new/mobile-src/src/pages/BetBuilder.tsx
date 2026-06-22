import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, MapPin, ChevronRight, Check } from 'lucide-react';

type Mode = 'choose' | 'chat' | 'tracks' | 'races' | 'strategies' | 'results';

interface Track { name: string; races: number }
interface RaceOption { id: number; number: number; conditions: string; distance: string; surface: string; field_size: number }
interface Strategy { id: number; name: string }

export function BetBuilder() {
  const [mode, setMode] = useState<Mode>('choose');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);

  // Track-first flow state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [races, setRaces] = useState<RaceOption[]>([]);
  const [selectedRaces, setSelectedRaces] = useState<number[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<number[]>([]);

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

  // Fetch tracks when entering track mode
  useEffect(() => {
    if (mode === 'tracks' && tracks.length === 0) {
      fetch('/api/lab/races?today=true', { headers: { Authorization: 'Bearer public' } })
        .then(r => r.json())
        .then(data => {
          if (data.tracks) setTracks(data.tracks);
        })
        .catch(() => {});
    }
  }, [mode]);

  // Fetch races when track is selected
  useEffect(() => {
    if (mode === 'races' && selectedTrack) {
      fetch(`/api/lab/races?track=${encodeURIComponent(selectedTrack)}`, { headers: { Authorization: 'Bearer public' } })
        .then(r => r.json())
        .then(data => {
          if (data.races) setRaces(data.races);
        })
        .catch(() => {});
    }
  }, [mode, selectedTrack]);

  // Fetch strategies
  useEffect(() => {
    if (mode === 'strategies' && strategies.length === 0) {
      fetch('/api/lab/strategies', { headers: { Authorization: 'Bearer public' } })
        .then(r => r.json())
        .then(data => {
          if (data.strategies) setStrategies(data.strategies);
        })
        .catch(() => {});
    }
  }, [mode]);

  if (mode === 'tracks') {
    return (
      <div className="pb-24 min-h-screen bg-app">
        <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
          <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => setMode('choose')} className="text-muted hover:text-gray-900 text-sm font-semibold">← Back</button>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">Select a Track</h1>
          </div>
        </div>
        <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-4">
          <div className="space-y-2">
            {tracks.map((track) => (
              <button
                key={track.name}
                onClick={() => { setSelectedTrack(track.name); setMode('races'); }}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between hover:border-primary/30 transition-colors">
                <span className="text-sm font-semibold text-gray-900">{track.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{track.races} races</span>
                  <ChevronRight size={16} className="text-muted" />
                </div>
              </button>
            ))}
            {tracks.length === 0 && <p className="text-xs text-muted text-center py-8">Loading tracks...</p>}
          </div>
        </main>
      </div>
    );
  }

  if (mode === 'races') {
    const allSelected = selectedRaces.length === races.length;
    return (
      <div className="pb-24 min-h-screen bg-app">
        <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
          <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => { setMode('tracks'); setSelectedRaces([]); }} className="text-muted hover:text-gray-900 text-sm font-semibold">← Back</button>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">{selectedTrack}</h1>
          </div>
        </div>
        <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-4">
          <p className="text-xs text-muted mb-3">Select races to analyze</p>
          <button
            onClick={() => setSelectedRaces(allSelected ? [] : races.map(r => r.id))}
            className="text-xs font-semibold text-primary mb-3">
            {allSelected ? 'Deselect all' : 'Select all races'}
          </button>
          <div className="space-y-2">
            {races.map((race) => {
              const selected = selectedRaces.includes(race.id);
              return (
                <button
                  key={race.id}
                  onClick={() => setSelectedRaces(prev => selected ? prev.filter(id => id !== race.id) : [...prev, race.id])}
                  className={`w-full border rounded-xl px-4 py-3 flex items-center justify-between transition-colors ${selected ? 'bg-primary/5 border-primary/30' : 'bg-surface border-border'}`}>
                  <div className="text-left">
                    <span className="text-sm font-semibold text-gray-900">R{race.number}</span>
                    <span className="text-xs text-muted ml-2">{race.conditions}</span>
                    <div className="text-[10px] text-muted mt-0.5">{race.distance} · {race.surface} · {race.field_size} horses</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'bg-primary border-primary' : 'border-border'}`}>
                    {selected && <Check size={12} className="text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedRaces.length > 0 && (
            <button
              onClick={() => setMode('strategies')}
              className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-semibold text-sm">
              Next: Select Strategies ({selectedRaces.length} race{selectedRaces.length > 1 ? 's' : ''})
            </button>
          )}
        </main>
      </div>
    );
  }

  if (mode === 'strategies') {
    return (
      <div className="pb-24 min-h-screen bg-app">
        <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
          <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => setMode('races')} className="text-muted hover:text-gray-900 text-sm font-semibold">← Back</button>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">Select Strategies</h1>
          </div>
        </div>
        <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-4">
          <p className="text-xs text-muted mb-3">Choose strategies to execute against your selected races</p>
          <div className="space-y-2">
            {strategies.map((strat) => {
              const selected = selectedStrategies.includes(strat.id);
              return (
                <button
                  key={strat.id}
                  onClick={() => setSelectedStrategies(prev => selected ? prev.filter(id => id !== strat.id) : [...prev, strat.id])}
                  className={`w-full border rounded-xl px-4 py-3 flex items-center justify-between transition-colors ${selected ? 'bg-primary/5 border-primary/30' : 'bg-surface border-border'}`}>
                  <span className="text-sm font-medium text-gray-900">{strat.name}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'bg-primary border-primary' : 'border-border'}`}>
                    {selected && <Check size={12} className="text-white" />}
                  </div>
                </button>
              );
            })}
            {strategies.length === 0 && <p className="text-xs text-muted text-center py-8">Loading strategies...</p>}
          </div>
          {selectedStrategies.length > 0 && (
            <button
              onClick={() => setMode('results')}
              className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-semibold text-sm">
              Execute ({selectedStrategies.length} strateg{selectedStrategies.length > 1 ? 'ies' : 'y'} × {selectedRaces.length} race{selectedRaces.length > 1 ? 's' : ''})
            </button>
          )}
        </main>
      </div>
    );
  }

  if (mode === 'results') {
    return (
      <div className="pb-24 min-h-screen bg-app">
        <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
          <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => setMode('strategies')} className="text-muted hover:text-gray-900 text-sm font-semibold">← Back</button>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">Wagering Plan</h1>
          </div>
        </div>
        <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-6">
          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <p className="text-sm font-bold text-gray-900 mb-2">Executing...</p>
            <p className="text-xs text-muted mb-4">
              {selectedStrategies.length} strateg{selectedStrategies.length > 1 ? 'ies' : 'y'} × {selectedRaces.length} race{selectedRaces.length > 1 ? 's' : ''} at {selectedTrack}
            </p>
            <div className="bg-app border border-border rounded-xl px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">Coming Soon</p>
              <p className="text-xs text-muted mt-1">The AI will analyze each race against your selected strategies and return a full wagering plan with conviction levels.</p>
            </div>
          </div>
          <button
            onClick={() => { setMode('choose'); setSelectedRaces([]); setSelectedStrategies([]); setSelectedTrack(''); }}
            className="w-full mt-4 border border-border bg-surface py-3 rounded-xl font-semibold text-sm text-gray-700">
            Start Over
          </button>
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

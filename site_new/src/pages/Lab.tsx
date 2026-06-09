import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNav } from '../components/AppNav';

interface Analysis {
  id: number;
  status: string;
  tokens_spent: number;
  created_at: string;
  filename: string;
  track: string;
}

interface RaceCard {
  track: string;
  date: string;
  races: Race[];
}

interface Race {
  id: number;
  track: string;
  date: string;
  race_number: number;
  conditions: string;
  class: string;
  distance: string;
  surface: string;
  field_size: number;
  entries_count: number;
}

interface MarketplaceStrategy {
  name: string;
  type: string;
  description: string;
  win_rate: number | null;
  itm_rate: number | null;
  best_conditions: string | null;
  trend: string | null;
}

interface UserStrategy {
  id: number;
  title: string;
  description: string;
  logic: string;
  conditions: string;
  visibility: string;
  created_at: string;
}

const TOKEN_COST_PER_RACE = 200000;

export function Lab() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'analyze' | 'library'>('analyze');

  // Library state
  const [userStrategies, setUserStrategies] = useState<UserStrategy[]>([]);
  const [favorites, setFavorites] = useState<MarketplaceStrategy[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLogic, setNewLogic] = useState('');
  const [newConditions, setNewConditions] = useState('');

  // Race cards state
  const [raceCards, setRaceCards] = useState<RaceCard[]>([]);

  // Analyze state
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [allStrategies, setAllStrategies] = useState<MarketplaceStrategy[]>([]);
  const [userTokens, setUserTokens] = useState(0);

  const token = localStorage.getItem('ftc_token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    loadAll();
  }, [navigate, token]);

  const loadAll = () => {
    loadRaceCards();
    loadUserStrategies();
    loadFavorites();
    loadAnalyses();
    loadAllStrategies();
    loadTokenBalance();
  };

  const loadRaceCards = () => {
    fetch('/api/lab/races', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data) setRaceCards(data.cards || []); })
      .catch(() => {});
  };

  const loadUserStrategies = () => {
    fetch('/api/lab/strategies', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data) setUserStrategies(data.strategies || []); })
      .catch(() => {});
  };

  const loadFavorites = () => {
    fetch('/api/lab/favorites', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data) setFavorites(data.favorites || []); })
      .catch(() => {});
  };

  const loadAnalyses = () => {
    fetch('/api/lab/analyses', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data) setAnalyses(data.analyses || []); })
      .catch(() => {});
  };

  const loadAllStrategies = () => {
    fetch('/api/strategies', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data) {
          const active = (data.strategies || []).filter((s: any) => s.active);
          setAllStrategies(active);
        }
      })
      .catch(() => {});
  };

  const loadTokenBalance = () => {
    fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data?.tokens !== undefined) setUserTokens(data.tokens); })
      .catch(() => {});
  };

  const createStrategy = async () => {
    if (!newTitle || !newLogic) return;
    await fetch('/api/lab/strategies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: newTitle, description: newDescription, logic: newLogic, conditions: newConditions, visibility: 'private' })
    });
    setNewTitle(''); setNewDescription(''); setNewLogic(''); setNewConditions('');
    setShowCreateForm(false);
    loadUserStrategies();
  };

  const deleteStrategy = async (id: number) => {
    await fetch('/api/lab/strategies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id })
    });
    loadUserStrategies();
  };

  const removeFavorite = async (name: string) => {
    await fetch('/api/lab/favorites', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ strategy_name: name })
    });
    loadFavorites();
  };


  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-3xl mx-auto">
        <AppNav />

        <h3 className="font-serif text-xl font-bold mb-2 border-b-2 border-black pb-1">
          MY LAB
        </h3>

        {/* Tabs */}
        <div className="flex border-b-2 border-black mb-4">
          <button
            onClick={() => setTab('analyze')}
            className={`px-4 py-2 font-sans font-bold text-sm border-2 border-b-0 border-black -mb-[2px] ${tab === 'analyze' ? 'bg-white' : 'bg-gray-200 text-gray-600'}`}
          >
            RUN ANALYSIS
          </button>
          <button
            onClick={() => setTab('library')}
            className={`px-4 py-2 font-sans font-bold text-sm border-2 border-b-0 border-black -mb-[2px] ml-1 ${tab === 'library' ? 'bg-white' : 'bg-gray-200 text-gray-600'}`}
          >
            MY STRATEGIES
          </button>
        </div>


        {/* MY STRATEGIES TAB */}
        {tab === 'library' && (
          <div>
            <div className="bg-[#ffffcc] border-2 border-black p-4 mb-6 shadow-outset font-serif text-sm">
              <p className="text-gray-700">Your personal strategy library. Create custom strategies or save favorites from the marketplace. These are the strategies available to you when you run an analysis.</p>
            </div>

            {/* Custom strategies */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-sans font-bold text-sm">PRIVATE STRATEGIES</h4>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-3 py-1 bg-web-gray font-sans font-bold text-xs border-2 border-black shadow-outset active:shadow-inset"
                >
                  {showCreateForm ? 'CANCEL' : '+ CREATE NEW'}
                </button>
              </div>

              {showCreateForm && (
                <div className="bg-white border-2 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="mb-3">
                    <label className="block font-sans font-bold text-xs mb-1">STRATEGY NAME *</label>
                    <input
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="e.g., Turf Closers in Big Fields"
                      className="w-full border-2 border-gray-400 shadow-inset p-2 font-mono text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block font-sans font-bold text-xs mb-1">DESCRIPTION</label>
                    <input
                      value={newDescription}
                      onChange={e => setNewDescription(e.target.value)}
                      placeholder="Short description of what this strategy looks for"
                      className="w-full border-2 border-gray-400 shadow-inset p-2 font-mono text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block font-sans font-bold text-xs mb-1">LOGIC / RULES *</label>
                    <textarea
                      value={newLogic}
                      onChange={e => setNewLogic(e.target.value)}
                      placeholder="Describe the logic: what triggers this strategy? What are you looking for in the data?"
                      rows={4}
                      className="w-full border-2 border-gray-400 shadow-inset p-2 font-mono text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block font-sans font-bold text-xs mb-1">BEST CONDITIONS</label>
                    <input
                      value={newConditions}
                      onChange={e => setNewConditions(e.target.value)}
                      placeholder="e.g., Turf routes, 8+ horses, Saratoga"
                      className="w-full border-2 border-gray-400 shadow-inset p-2 font-mono text-sm"
                    />
                  </div>
                  <button
                    onClick={createStrategy}
                    disabled={!newTitle || !newLogic}
                    className="px-4 py-2 bg-web-gray font-sans font-bold text-sm border-2 border-black shadow-outset active:shadow-inset disabled:opacity-50"
                  >
                    SAVE STRATEGY
                  </button>
                </div>
              )}

              {userStrategies.length === 0 && !showCreateForm ? (
                <div className="border border-gray-300 p-4 text-center font-serif text-sm text-gray-500">
                  No private strategies yet. Create one to personalize your analysis.
                </div>
              ) : (
                <div className="space-y-2">
                  {userStrategies.map(s => (
                    <div key={s.id} className="bg-white border border-gray-400 p-3 flex justify-between items-start">
                      <div>
                        <span className="font-serif font-bold text-[#000080]">{s.title}</span>
                        {s.description && <p className="font-serif text-xs text-gray-600 mt-0.5">{s.description}</p>}
                        <p className="font-mono text-xs text-gray-400 mt-1">{s.conditions || 'All conditions'}</p>
                      </div>
                      <button
                        onClick={() => deleteStrategy(s.id)}
                        className="font-sans text-xs font-bold text-web-red px-2 py-0.5 border border-web-red hover:bg-[#ffe6e6]"
                      >
                        DELETE
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Favorites from marketplace */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-sans font-bold text-sm">MARKETPLACE FAVORITES</h4>
                <a href="/strategies" className="font-sans text-xs font-bold text-[#000080] underline">Browse Marketplace →</a>
              </div>

              {favorites.length === 0 ? (
                <div className="border border-gray-300 p-4 text-center font-serif text-sm text-gray-500">
                  No favorites yet. Browse the <a href="/strategies" className="text-[#000080] underline">Strategies Marketplace</a> and save the ones you like.
                </div>
              ) : (
                <div className="space-y-2">
                  {favorites.map(s => (
                    <div key={s.name} className="bg-white border border-gray-400 p-3 flex justify-between items-start">
                      <div>
                        <span className="font-serif font-bold text-[#000080]">{s.name}</span>
                        <span className="ml-2 font-mono text-xs px-1 bg-gray-200">{s.type}</span>
                        {s.win_rate !== null && (
                          <span className="ml-2 font-mono text-xs text-web-green">{s.win_rate}% W</span>
                        )}
                        {s.description && <p className="font-serif text-xs text-gray-600 mt-0.5">{s.description}</p>}
                      </div>
                      <button
                        onClick={() => removeFavorite(s.name)}
                        className="font-sans text-xs font-bold text-gray-500 px-2 py-0.5 border border-gray-400 hover:bg-gray-100"
                      >
                        REMOVE
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RUN ANALYSIS TAB */}
        {tab === 'analyze' && (
          <AnalyzePanel
            raceCards={raceCards}
            allStrategies={allStrategies}
            userStrategies={userStrategies}
            userTokens={userTokens}
            token={token!}
            analyses={analyses}
            onComplete={() => { loadTokenBalance(); loadAnalyses(); }}
          />
        )}
      </div>
    </div>
  );
}

function AnalyzePanel({ raceCards, allStrategies, userStrategies, userTokens, token, analyses, onComplete }: {
  raceCards: RaceCard[];
  allStrategies: MarketplaceStrategy[];
  userStrategies: UserStrategy[];
  userTokens: number;
  token: string;
  analyses: Analysis[];
  onComplete: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedRaceIds, setSelectedRaceIds] = useState<number[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [stratTab, setStratTab] = useState<'marketplace' | 'private'>('marketplace');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const cardsForDate = raceCards.filter(c => {
    const d = typeof c.date === 'string' ? c.date.split('T')[0] : new Date(c.date).toISOString().split('T')[0];
    return d === selectedDate;
  });

  const allRaceIdsForDate = cardsForDate.flatMap(c => c.races.map(r => r.id));

  const filteredMarketplace = allStrategies.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPrivate = userStrategies.filter(s =>
    !search || s.title.toLowerCase().includes(search.toLowerCase())
  );

  const cost = selectedRaceIds.length * TOKEN_COST_PER_RACE;
  const canAfford = cost <= userTokens;

  const handleSubmit = async () => {
    if (!canAfford) { setErrorMsg('Insufficient tokens.'); setStatus('error'); return; }
    setStatus('submitting');
    try {
      const res = await fetch('/api/lab/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ race_ids: selectedRaceIds, strategies: selectedStrategies })
      });
      if (res.ok) {
        setStatus('success');
        setSelectedRaceIds([]);
        setSelectedStrategies([]);
        onComplete();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Something went wrong');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Submission failed. Try again.');
      setStatus('error');
    }
  };

  return (
    <div>
      {status === 'success' ? (
        <div className="bg-[#e6ffe6] border-4 border-[#008000] p-6 mb-6 text-center">
          <div className="font-bold text-[#008000] text-xl mb-2">ORDER RECEIVED!</div>
          <p className="font-serif text-lg mb-2">Your analysis is being processed.</p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-4 px-4 py-1 bg-web-gray font-sans font-bold border-2 border-black shadow-outset active:shadow-inset"
          >
            RUN ANOTHER
          </button>
        </div>
      ) : (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">

          {/* Date picker */}
          <div className="mb-5">
            <label className="block font-sans font-bold text-sm mb-2">DATE</label>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => { setSelectedDate(today); setSelectedRaceIds([]); }}
                className={`px-4 py-2 font-sans font-bold text-sm border-2 border-black ${selectedDate === today ? 'bg-[#000080] text-white' : 'bg-web-gray shadow-outset active:shadow-inset'}`}
              >
                TODAY
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); setSelectedRaceIds([]); }}
                className="px-3 py-2 border-2 border-gray-400 shadow-inset font-mono text-sm bg-white"
              />
            </div>
          </div>

          {/* Tracks + races inline */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="font-sans font-bold text-sm">RACES</label>
              {allRaceIdsForDate.length > 0 && (
                <div className="flex gap-3 font-sans text-xs font-bold">
                  <button type="button" onClick={() => setSelectedRaceIds(allRaceIdsForDate)} className="text-[#000080] underline">Select all</button>
                  <button type="button" onClick={() => setSelectedRaceIds([])} className="text-[#000080] underline">Clear</button>
                </div>
              )}
            </div>

            {cardsForDate.length === 0 ? (
              <div className="font-mono text-sm text-gray-500 p-3 border border-gray-300 bg-gray-50">
                No races loaded for {selectedDate === today ? 'today' : selectedDate}.
              </div>
            ) : (
              <div className="space-y-3">
                {cardsForDate.map(card => {
                  const trackRaceIds = card.races.map(r => r.id);
                  const allTrackSelected = trackRaceIds.every(id => selectedRaceIds.includes(id));
                  return (
                    <div key={card.track} className="border-2 border-gray-300 p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (allTrackSelected) {
                              setSelectedRaceIds(prev => prev.filter(id => !trackRaceIds.includes(id)));
                            } else {
                              setSelectedRaceIds(prev => [...new Set([...prev, ...trackRaceIds])]);
                            }
                          }}
                          className={`px-3 py-1 font-sans font-bold text-sm border-2 border-black ${allTrackSelected ? 'bg-[#000080] text-white' : 'bg-web-gray shadow-outset active:shadow-inset'}`}
                        >
                          {card.track}
                        </button>
                        <div className="flex gap-1 flex-wrap">
                          {card.races.map(race => {
                            const sel = selectedRaceIds.includes(race.id);
                            return (
                              <button
                                key={race.id}
                                type="button"
                                onClick={() => setSelectedRaceIds(prev =>
                                  prev.includes(race.id) ? prev.filter(id => id !== race.id) : [...prev, race.id]
                                )}
                                className={`w-8 h-8 font-mono text-sm font-bold border-2 ${sel ? 'border-[#000080] bg-[#e6e6ff] text-[#000080]' : 'border-gray-300 bg-white text-gray-600 hover:bg-[#fffbe0] hover:border-gray-400'}`}
                              >
                                {race.race_number}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedRaceIds.length > 0 && (
              <div className="font-mono text-xs text-gray-500 mt-2">{selectedRaceIds.length} race{selectedRaceIds.length > 1 ? 's' : ''} selected</div>
            )}
          </div>

          {/* Strategies — always visible */}
          <div className="mb-5">
            <label className="block font-sans font-bold text-sm mb-2">STRATEGIES</label>

            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search strategies..."
              className="w-full mb-2 px-2 py-1 border-2 border-gray-400 shadow-inset font-mono text-sm"
            />

            <div className="flex border-b border-gray-400 mb-2">
              <button
                type="button"
                onClick={() => setStratTab('marketplace')}
                className={`px-3 py-1 font-sans font-bold text-xs border border-b-0 -mb-[1px] ${stratTab === 'marketplace' ? 'bg-white border-gray-400' : 'bg-gray-200 text-gray-500 border-transparent'}`}
              >
                MARKETPLACE ({filteredMarketplace.length})
              </button>
              <button
                type="button"
                onClick={() => setStratTab('private')}
                className={`px-3 py-1 font-sans font-bold text-xs border border-b-0 -mb-[1px] ml-1 ${stratTab === 'private' ? 'bg-white border-gray-400' : 'bg-gray-200 text-gray-500 border-transparent'}`}
              >
                PRIVATE ({filteredPrivate.length})
              </button>
              <div className="flex-1" />
              <button type="button" onClick={() => {
                setSelectedStrategies([...allStrategies.map(s => s.name), ...userStrategies.map(s => s.title)]);
              }} className="font-sans text-xs font-bold text-[#000080] underline px-2">All</button>
              <button type="button" onClick={() => setSelectedStrategies([])} className="font-sans text-xs font-bold text-[#000080] underline px-2">Clear</button>
            </div>

            <div className="border-2 border-gray-400 shadow-inset bg-gray-100 max-h-40 overflow-y-auto divide-y divide-gray-300">
              {stratTab === 'marketplace' && filteredMarketplace.map(s => (
                <label
                  key={s.name}
                  className={`flex items-center gap-3 px-3 py-2 font-mono text-sm cursor-pointer hover:bg-[#ffffcc] ${selectedStrategies.includes(s.name) ? 'bg-[#fffbe0]' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStrategies.includes(s.name)}
                    onChange={() => setSelectedStrategies(prev =>
                      prev.includes(s.name) ? prev.filter(n => n !== s.name) : [...prev, s.name]
                    )}
                    className="w-4 h-4 shrink-0"
                  />
                  <span className="font-bold text-[#000080]">{s.name}</span>
                  {s.win_rate !== null && <span className="text-xs text-green-700">{s.win_rate}% W</span>}
                </label>
              ))}
              {stratTab === 'private' && (filteredPrivate.length === 0 ? (
                <div className="px-3 py-4 text-center font-serif text-sm text-gray-500">No private strategies{search ? ' matching search' : ''}.</div>
              ) : filteredPrivate.map(s => (
                <label
                  key={`priv-${s.id}`}
                  className={`flex items-center gap-3 px-3 py-2 font-mono text-sm cursor-pointer hover:bg-[#ffffcc] ${selectedStrategies.includes(s.title) ? 'bg-[#fffbe0]' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStrategies.includes(s.title)}
                    onChange={() => setSelectedStrategies(prev =>
                      prev.includes(s.title) ? prev.filter(n => n !== s.title) : [...prev, s.title]
                    )}
                    className="w-4 h-4 shrink-0"
                  />
                  <span className="font-bold text-[#000080]">{s.title}</span>
                  <span className="font-sans text-[10px] px-1 bg-[#e6e6ff] border border-[#000080] text-[#000080]">PRIVATE</span>
                </label>
              )))}
            </div>
            <div className="font-mono text-xs text-gray-500 mt-1">{selectedStrategies.length} strategies selected</div>
          </div>

          {/* Checkout — visible when both races and strategies selected */}
          {selectedRaceIds.length > 0 && selectedStrategies.length > 0 && (
            <div className="border-t-2 border-black pt-4">
              <div className="bg-[#ffffcc] border-2 border-black p-4 shadow-inset mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-sans font-bold text-sm">Order:</span>
                  <span className="font-mono text-sm">{selectedRaceIds.length} race{selectedRaceIds.length > 1 ? 's' : ''} × {selectedStrategies.length} strateg{selectedStrategies.length > 1 ? 'ies' : 'y'}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-sans text-sm">Cost:</span>
                  <span className="font-mono text-lg font-bold">{cost.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-sans text-sm text-gray-600">Balance:</span>
                  <span className={`font-mono text-sm font-bold ${canAfford ? 'text-green-700' : 'text-web-red'}`}>
                    {canAfford ? `${(userTokens - cost).toLocaleString()} remaining` : 'INSUFFICIENT'}
                  </span>
                </div>
                {!canAfford && (
                  <a href="/shop" className="block mt-2 font-sans text-xs font-bold text-[#000080] underline text-center">Buy more tokens →</a>
                )}
              </div>

              {status === 'error' && (
                <div className="text-web-red font-bold text-sm mb-4 bg-[#ffe6e6] border border-web-red p-2">* {errorMsg}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={status === 'submitting' || !canAfford}
                className="w-full px-6 py-3 bg-web-gray font-sans font-bold text-lg text-black border-2 border-black shadow-outset active:shadow-inset cursor-pointer disabled:opacity-50"
              >
                {status === 'submitting' ? 'PROCESSING...' : `RUN ANALYSIS — ${cost.toLocaleString()} TOKENS`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order history */}
      {analyses.length > 0 && (
        <>
          <h4 className="font-sans font-bold text-sm mb-3 border-b border-black pb-1">ORDER HISTORY</h4>
          <div className="space-y-2">
            {analyses.map(a => (
              <div key={a.id} className="bg-white border border-gray-400 p-3 flex justify-between items-center">
                <div>
                  <span className="font-serif font-bold">{a.track || a.filename}</span>
                  <span className="font-mono text-xs text-gray-500 ml-3">{a.created_at?.split('T')[0]}</span>
                  <span className="font-mono text-xs text-gray-500 ml-3">{a.tokens_spent} tokens</span>
                </div>
                <span className={`font-mono text-xs font-bold px-2 py-0.5 ${a.status === 'complete' ? 'bg-[#e6ffe6] text-[#008000]' : a.status === 'failed' ? 'bg-[#ffe6e6] text-web-red' : 'bg-[#ffffcc] text-black'}`}>
                  {a.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

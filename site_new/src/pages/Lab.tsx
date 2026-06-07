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

const TOKEN_COST_PER_STRATEGY = 15000;

export function Lab() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'library' | 'analyze'>('library');

  // Library state
  const [userStrategies, setUserStrategies] = useState<UserStrategy[]>([]);
  const [favorites, setFavorites] = useState<MarketplaceStrategy[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLogic, setNewLogic] = useState('');
  const [newConditions, setNewConditions] = useState('');

  // Analyze state
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [allStrategies, setAllStrategies] = useState<MarketplaceStrategy[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [userTokens, setUserTokens] = useState(0);

  const storedUser = JSON.parse(localStorage.getItem('ftc_user') || '{}');
  const token = localStorage.getItem('ftc_token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    loadAll();
  }, [navigate, token]);

  const loadAll = () => {
    loadUserStrategies();
    loadFavorites();
    loadAnalyses();
    loadAllStrategies();
    loadTokenBalance();
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

  // Library actions
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

  // Analyze actions
  const combinedStrategies = [
    ...allStrategies.map(s => ({ name: s.name, source: 'marketplace' as const })),
    ...userStrategies.map(s => ({ name: s.title, source: 'custom' as const })),
  ];

  const estimatedCost = selectedStrategies.length * TOKEN_COST_PER_STRATEGY;
  const remainingAfter = userTokens - estimatedCost;
  const canAfford = remainingAfter >= 0;

  const toggleStrategy = (name: string) => {
    setSelectedStrategies(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const selectAll = () => setSelectedStrategies(combinedStrategies.map(s => s.name));
  const selectNone = () => setSelectedStrategies([]);
  const selectLibrary = () => {
    const libraryNames = [
      ...userStrategies.map(s => s.title),
      ...favorites.map(s => s.name),
    ];
    setSelectedStrategies(libraryNames.filter(n => combinedStrategies.some(cs => cs.name === n)));
  };

  const readFileAsBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || selectedStrategies.length === 0) return;
    if (!canAfford) { setErrorMsg('Insufficient tokens.'); setStatus('error'); return; }

    setStatus('uploading');
    setErrorMsg('');

    try {
      const fileData = await readFileAsBase64(file);
      const res = await fetch('/api/lab/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ filename: file.name, strategies: selectedStrategies, fileData })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setFile(null);
        setSelectedStrategies([]);
        loadAnalyses();
        loadTokenBalance();
      } else {
        setErrorMsg(data.error || 'Something went wrong');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Upload failed. Try again.');
      setStatus('error');
    }
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
            onClick={() => setTab('library')}
            className={`px-4 py-2 font-sans font-bold text-sm border-2 border-b-0 border-black -mb-[2px] ${tab === 'library' ? 'bg-white' : 'bg-gray-200 text-gray-600'}`}
          >
            MY STRATEGIES
          </button>
          <button
            onClick={() => setTab('analyze')}
            className={`px-4 py-2 font-sans font-bold text-sm border-2 border-b-0 border-black -mb-[2px] ml-1 ${tab === 'analyze' ? 'bg-white' : 'bg-gray-200 text-gray-600'}`}
          >
            RUN ANALYSIS
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
                <h4 className="font-sans font-bold text-sm">CUSTOM STRATEGIES</h4>
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
                  No custom strategies yet. Create one to personalize your analysis.
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
          <div>
            <div className="bg-[#ffffcc] border-2 border-black p-4 mb-6 shadow-outset font-serif text-sm">
              <p className="text-gray-700">Upload your DRF race book and select strategies. We'll run your personalized analysis and deliver the report to your email.</p>
            </div>

            {status === 'success' ? (
              <div className="bg-[#e6ffe6] border-4 border-[#008000] p-6 mb-6 text-center">
                <div className="font-bold text-[#008000] text-xl mb-2">ORDER RECEIVED!</div>
                <p className="font-serif text-lg mb-2">Your race book has been submitted for analysis.</p>
                <p className="font-serif">Your report will be sent to <strong>{storedUser.email}</strong> once processing is complete.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-4 px-4 py-1 bg-web-gray font-sans font-bold border-2 border-black shadow-outset active:shadow-inset"
                >
                  SUBMIT ANOTHER
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
                {/* Step 1: Upload PDF */}
                <div className="mb-6">
                  <label className="block font-sans font-bold text-sm mb-1">1. UPLOAD RACE BOOK (PDF)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full font-mono text-sm"
                    required
                  />
                  {file && <div className="font-mono text-xs text-gray-600 mt-1">{file.name} ({(file.size / 1024).toFixed(0)} KB)</div>}
                  <p className="font-serif text-xs text-gray-500 mt-1">Track, date, and race info will be extracted from the PDF.</p>
                </div>

                {/* Step 2: Select Strategies */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-sans font-bold text-sm">2. SELECT STRATEGIES</label>
                    <div className="flex gap-3 font-sans text-xs font-bold">
                      <button type="button" onClick={selectLibrary} className="web-link">My Library</button>
                      <button type="button" onClick={selectAll} className="web-link">All</button>
                      <button type="button" onClick={selectNone} className="web-link">Clear</button>
                    </div>
                  </div>
                  <div className="border-2 border-gray-400 shadow-inset bg-gray-100 max-h-48 overflow-y-auto divide-y divide-gray-300">
                    {combinedStrategies.map(s => (
                      <label
                        key={s.name}
                        className={`flex items-center gap-3 px-3 py-2 font-mono text-sm cursor-pointer hover:bg-[#ffffcc] ${selectedStrategies.includes(s.name) ? 'bg-[#fffbe0]' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStrategies.includes(s.name)}
                          onChange={() => toggleStrategy(s.name)}
                          className="w-4 h-4 shrink-0"
                        />
                        <span className="font-bold text-[#000080]">{s.name}</span>
                        {s.source === 'custom' && (
                          <span className="font-sans text-[10px] px-1 bg-[#e6e6ff] border border-[#000080] text-[#000080]">CUSTOM</span>
                        )}
                      </label>
                    ))}
                  </div>
                  <div className="font-mono text-xs text-gray-500 mt-1">{selectedStrategies.length} of {combinedStrategies.length} selected</div>
                </div>

                {/* Step 3: Cost Summary / Checkout */}
                <div className="border-t-2 border-black pt-4 mb-4">
                  <div className="bg-[#ffffcc] border-2 border-black p-4 shadow-inset">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-sans font-bold text-sm">Estimated cost:</span>
                      <span className="font-mono text-xl font-bold">{estimatedCost.toLocaleString()} tokens</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-sans text-sm text-gray-600">Your balance:</span>
                      <span className="font-mono text-sm">{userTokens.toLocaleString()} tokens</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-400 pt-2">
                      <span className="font-sans text-sm font-bold">After this analysis:</span>
                      <span className={`font-mono text-sm font-bold ${canAfford ? 'text-web-green' : 'text-web-red'}`}>
                        {canAfford ? remainingAfter.toLocaleString() : 'INSUFFICIENT'} tokens
                      </span>
                    </div>
                    {!canAfford && (
                      <a href="/shop" className="block mt-2 font-sans text-xs font-bold text-[#000080] underline text-center">
                        Buy more tokens →
                      </a>
                    )}
                  </div>
                </div>

                {status === 'error' && (
                  <div className="text-web-red font-bold text-sm mb-4 bg-[#ffe6e6] border border-web-red p-2">
                    * {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'uploading' || !file || !canAfford || selectedStrategies.length === 0}
                  className="w-full px-6 py-3 bg-web-gray font-sans font-bold text-lg text-black border-2 border-black shadow-outset active:shadow-inset cursor-pointer disabled:opacity-50"
                >
                  {status === 'uploading' ? 'PROCESSING...' : `CHECKOUT — ${estimatedCost.toLocaleString()} TOKENS`}
                </button>
              </form>
            )}

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
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

interface Analysis {
  id: number;
  status: string;
  tokens_spent: number;
  created_at: string;
  filename: string;
  track: string;
}

interface Strategy {
  name: string;
  type: string;
  description: string;
}

const TOKEN_COST_PER_STRATEGY = 15000; // 15,000 tokens per strategy (300K for all 20 strategies)

export function Lab() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [userTokens, setUserTokens] = useState(0);

  const storedUser = JSON.parse(localStorage.getItem('ftc_user') || '{}');
  const token = localStorage.getItem('ftc_token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    loadAnalyses();
    loadStrategies();
    loadTokenBalance();
  }, [navigate, token]);

  const loadAnalyses = () => {
    fetch('/api/lab/analyses', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data) setAnalyses(data.analyses || []); })
      .catch(() => {});
  };

  const loadStrategies = () => {
    fetch('/api/strategies', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          const active = (data.strategies || []).filter((s: any) => s.active);
          setStrategies(active);
          setSelectedStrategies(active.map((s: any) => s.name));
        }
      })
      .catch(() => {});
  };

  const loadTokenBalance = () => {
    fetch('/api/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data?.tokens !== undefined) setUserTokens(data.tokens); })
      .catch(() => {});
  };

  const estimatedCost = selectedStrategies.length * TOKEN_COST_PER_STRATEGY;
  const remainingAfter = userTokens - estimatedCost;
  const canAfford = remainingAfter >= 0;

  const toggleStrategy = (name: string) => {
    setSelectedStrategies(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const selectAll = () => setSelectedStrategies(strategies.map(s => s.name));
  const selectNone = () => setSelectedStrategies([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || selectedStrategies.length === 0) return;
    if (!canAfford) { setErrorMsg('Insufficient tokens.'); setStatus('error'); return; }

    setStatus('uploading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/lab/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ filename: file.name, strategies: selectedStrategies })
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

  const handleLogout = () => {
    localStorage.removeItem('ftc_token');
    localStorage.removeItem('ftc_user');
    navigate('/');
  };

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-3xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Logo className="w-14 h-14" />
              <h1 className="font-serif text-3xl font-bold">FADE THE CHALK</h1>
            </div>
            <div className="font-sans text-sm">
              <span className="font-mono mr-4">{storedUser?.email}</span>
              <button onClick={handleLogout} className="web-link font-bold">LOG OUT</button>
            </div>
          </div>
          <nav className="bg-web-gray border-2 border-black p-2 shadow-outset font-sans text-sm font-bold flex gap-6">
            <Link to="/reports" className="web-link">DASHBOARD</Link>
            <Link to="/strategies" className="web-link">STRATEGIES MARKETPLACE</Link>
            <Link to="/lab" className="web-link">MY LAB</Link>
            <Link to="/board" className="web-link">BULLETIN BOARD</Link>
            <Link to="/contact" className="web-link">CONTACT</Link>
          </nav>
        </header>

        <h3 className="font-serif text-xl font-bold mb-2 border-b-2 border-black pb-1">
          MY LAB
        </h3>

        <div className="bg-[#ffffcc] border-2 border-black p-4 mb-6 shadow-outset font-serif text-sm">
          <p className="font-bold mb-2">How it works:</p>
          <p className="text-gray-700">Upload your DRF race book, select which strategies to run against it, and we'll deliver your picks report to your email. Your $10/month subscription gives you 1,000,000 tokens — a full card analysis with all strategies costs ~300,000.</p>
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
                  <button type="button" onClick={selectAll} className="web-link">Select All</button>
                  <button type="button" onClick={selectNone} className="web-link">Clear</button>
                </div>
              </div>
              <div className="border-2 border-gray-400 shadow-inset bg-gray-100 max-h-48 overflow-y-auto divide-y divide-gray-300">
                {strategies.map(s => (
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
                  </label>
                ))}
              </div>
              <div className="font-mono text-xs text-gray-500 mt-1">{selectedStrategies.length} of {strategies.length} selected</div>
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
    </div>
  );
}

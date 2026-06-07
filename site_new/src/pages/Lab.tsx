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

export function Lab() {
  const navigate = useNavigate();
  const [track, setTrack] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const storedUser = JSON.parse(localStorage.getItem('ftc_user') || '{}');
  const token = localStorage.getItem('ftc_token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    loadAnalyses();
  }, [navigate, token]);

  const loadAnalyses = () => {
    fetch('/api/lab/analyses', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data) setAnalyses(data.analyses || []); })
      .catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !track.trim()) return;

    setStatus('uploading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/lab/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ track: track.trim(), filename: file.name })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setFile(null);
        setTrack('');
        loadAnalyses();
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
          <p className="text-gray-700 mb-2">Upload a DRF race book PDF for the track and card you want analyzed. Our AI will process it through available strategies and deliver your picks report to your email.</p>
          <p className="text-gray-700">Each analysis costs ~1,000 tokens (estimated) from your monthly allotment. A $10/month subscription gives you 10,000 tokens — enough for about 10 full card analyses.</p>
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
            <div className="mb-4">
              <label className="block font-sans font-bold text-sm mb-1">Track:</label>
              <input
                type="text"
                value={track}
                onChange={e => setTrack(e.target.value)}
                placeholder="e.g. Saratoga, Churchill Downs"
                className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset font-mono outline-none focus:bg-[#ffffcc]"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block font-sans font-bold text-sm mb-1">DRF Race Book (PDF):</label>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full font-mono text-sm"
                required
              />
              {file && <div className="font-mono text-xs text-gray-600 mt-1">{file.name} ({(file.size / 1024).toFixed(0)} KB)</div>}
            </div>

            {status === 'error' && (
              <div className="text-web-red font-bold text-sm mb-4 bg-[#ffe6e6] border border-web-red p-2">
                * {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'uploading' || !file}
              className="px-6 py-2 bg-web-gray font-sans font-bold text-black border-2 border-black shadow-outset active:shadow-inset cursor-pointer disabled:opacity-70"
            >
              {status === 'uploading' ? 'UPLOADING...' : 'SUBMIT FOR ANALYSIS'}
            </button>
          </form>
        )}

        {analyses.length > 0 && (
          <>
            <h4 className="font-sans font-bold text-sm mb-3 border-b border-black pb-1">YOUR ANALYSES</h4>
            <div className="space-y-2">
              {analyses.map(a => (
                <div key={a.id} className="bg-white border border-gray-400 p-3 flex justify-between items-center">
                  <div>
                    <span className="font-serif font-bold">{a.track || a.filename}</span>
                    <span className="font-mono text-xs text-gray-500 ml-3">{a.created_at?.split('T')[0]}</span>
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

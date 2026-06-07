import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

interface Submission {
  id: number;
  title: string;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

export function Submit() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [logic, setLogic] = useState('');
  const [conditions, setConditions] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const storedUser = JSON.parse(localStorage.getItem('ftc_user') || '{}');
  const token = localStorage.getItem('ftc_token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    loadSubmissions();
  }, [navigate, token]);

  const loadSubmissions = () => {
    fetch('/api/submissions', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data) setSubmissions(data.submissions || []); })
      .catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !logic.trim()) return;
    setStatus('submitting');

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), logic: logic.trim(), conditions: conditions.trim() })
      });
      if (res.ok) {
        setStatus('success');
        setTitle(''); setDescription(''); setLogic(''); setConditions('');
        loadSubmissions();
      } else {
        setStatus('error');
      }
    } catch {
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
            <Link to="/strategies" className="web-link">MARKETPLACE</Link>
            <Link to="/board" className="web-link">BOARD</Link>
            <Link to="/submit" className="web-link">SUBMIT</Link>
            <Link to="/leaderboard" className="web-link">LEADERBOARD</Link>
            <Link to="/contact" className="web-link">CONTACT</Link>
          </nav>
        </header>

        <h3 className="font-serif text-xl font-bold mb-2 border-b-2 border-black pb-1">
          SUBMIT A STRATEGY
        </h3>

        <div className="bg-[#ffffcc] border-2 border-black p-4 mb-6 shadow-outset font-serif text-sm">
          <p className="font-bold mb-2">Approval criteria:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Unique</strong> — not a duplicate of an existing strategy on the marketplace.</li>
            <li><strong>Executable</strong> — based on data available in the DRF race book (past performances, speed figures, jockey/trainer stats, running styles, odds, etc.).</li>
          </ol>
          <p className="mt-2 text-gray-700">The more detail you provide about how to execute with race book data, the faster we can review. We may follow up for clarification.</p>
        </div>

        {status === 'success' && (
          <div className="bg-[#e6ffe6] border-2 border-[#008000] p-4 mb-6 text-[#008000] font-bold text-center">
            SUBMITTED! We'll review your strategy and get back to you.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
          <div className="mb-4">
            <label className="block font-sans font-bold text-sm mb-1">Strategy Title:</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give it a name"
              className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset font-mono outline-none focus:bg-[#ffffcc]"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block font-sans font-bold text-sm mb-1">Short Description (public-facing):</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does it do? One sentence."
              className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset font-mono outline-none focus:bg-[#ffffcc]"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block font-sans font-bold text-sm mb-1">Logic / Methodology (private — for review only):</label>
            <textarea
              value={logic}
              onChange={e => setLogic(e.target.value)}
              placeholder="How does it work? What do you look for in the race book data? Be specific about what data points drive the decision."
              rows={5}
              className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset font-mono resize-none outline-none focus:bg-[#ffffcc]"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block font-sans font-bold text-sm mb-1">Conditions (optional):</label>
            <input
              type="text"
              value={conditions}
              onChange={e => setConditions(e.target.value)}
              placeholder="When does it apply? e.g. dirt sprints, turf routes, large fields, specific class levels"
              className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset font-mono outline-none focus:bg-[#ffffcc]"
            />
          </div>

          {status === 'error' && (
            <div className="text-web-red font-bold text-sm mb-4 bg-[#ffe6e6] border border-web-red p-2">
              * Something went wrong. Try again.
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="px-6 py-2 bg-web-gray font-sans font-bold text-black border-2 border-black shadow-outset active:shadow-inset cursor-pointer disabled:opacity-70"
          >
            {status === 'submitting' ? 'SUBMITTING...' : 'SUBMIT FOR REVIEW'}
          </button>
        </form>

        {submissions.length > 0 && (
          <>
            <h4 className="font-sans font-bold text-sm mb-3 border-b border-black pb-1">YOUR SUBMISSIONS</h4>
            <div className="space-y-2">
              {submissions.map(s => (
                <div key={s.id} className="bg-white border border-gray-400 p-3 flex justify-between items-center">
                  <div>
                    <span className="font-serif font-bold">{s.title}</span>
                    <span className="font-mono text-xs text-gray-500 ml-3">{s.created_at?.split('T')[0]}</span>
                  </div>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 ${s.status === 'approved' ? 'bg-[#e6ffe6] text-[#008000]' : s.status === 'rejected' ? 'bg-[#ffe6e6] text-web-red' : 'bg-[#ffffcc] text-black'}`}>
                    {s.status.toUpperCase()}
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

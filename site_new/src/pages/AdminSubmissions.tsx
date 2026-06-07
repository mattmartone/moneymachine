import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNav } from '../components/AppNav';

interface Submission {
  id: number;
  title: string;
  description: string;
  logic: string;
  conditions: string;
  status: string;
  submitter_name: string;
  submitter_email: string;
  created_at: string;
}

export function AdminSubmissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [stratName, setStratName] = useState('');

  const token = localStorage.getItem('ftc_token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    loadSubmissions();
  }, [navigate, token]);

  const loadSubmissions = () => {
    fetch('/api/admin/submissions', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 403) { navigate('/reports'); return; }
        return res.json();
      })
      .then(data => {
        if (data) setSubmissions(data.submissions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    const res = await fetch('/api/admin/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id, action, admin_notes: notes, strategy_name: stratName || undefined })
    });
    if (res.ok) {
      setActionId(null);
      setNotes('');
      setStratName('');
      loadSubmissions();
    }
  };

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-5xl mx-auto">
        <AppNav />

        <h3 className="font-serif text-xl font-bold mb-4 border-b-2 border-black pb-1">
          SUBMISSION REVIEW QUEUE
        </h3>

        {loading ? (
          <div className="font-mono animate-blink p-4">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="bg-white border-2 border-gray-400 p-8 text-center font-serif italic text-gray-500">
            No submissions to review.
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map(s => (
              <div key={s.id} className={`border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${s.status === 'pending' ? 'bg-white' : s.status === 'approved' ? 'bg-[#e6ffe6]' : 'bg-gray-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-serif text-lg font-bold">{s.title}</h4>
                    <div className="font-mono text-xs text-gray-600">
                      by {s.submitter_name || s.submitter_email} · {s.created_at?.split('T')[0]}
                    </div>
                  </div>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 ${s.status === 'approved' ? 'bg-[#008000] text-white' : s.status === 'rejected' ? 'bg-web-red text-white' : 'bg-[#ffffcc] text-black border border-black'}`}>
                    {s.status.toUpperCase()}
                  </span>
                </div>

                <div className="mb-2">
                  <div className="font-sans text-xs font-bold text-gray-500">DESCRIPTION (public):</div>
                  <p className="font-serif text-sm">{s.description}</p>
                </div>

                <div className="mb-2">
                  <div className="font-sans text-xs font-bold text-gray-500">LOGIC (private):</div>
                  <p className="font-mono text-xs bg-gray-100 p-2 border border-gray-300 whitespace-pre-wrap">{s.logic}</p>
                </div>

                {s.conditions && (
                  <div className="mb-2">
                    <div className="font-sans text-xs font-bold text-gray-500">CONDITIONS:</div>
                    <p className="font-serif text-sm">{s.conditions}</p>
                  </div>
                )}

                {s.status === 'pending' && (
                  <div className="mt-4 border-t border-gray-300 pt-3">
                    {actionId === s.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={stratName}
                          onChange={e => setStratName(e.target.value)}
                          placeholder="Strategy name (or leave blank to use title)"
                          className="w-full px-2 py-1 border border-gray-400 shadow-inset font-mono text-sm"
                        />
                        <input
                          type="text"
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="Admin notes (optional)"
                          className="w-full px-2 py-1 border border-gray-400 shadow-inset font-mono text-sm"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(s.id, 'approve')} className="px-4 py-1 bg-[#008000] text-white font-bold border border-black shadow-outset active:shadow-inset">APPROVE</button>
                          <button onClick={() => handleAction(s.id, 'reject')} className="px-4 py-1 bg-web-red text-white font-bold border border-black shadow-outset active:shadow-inset">REJECT</button>
                          <button onClick={() => setActionId(null)} className="px-4 py-1 bg-web-gray font-bold border border-black shadow-outset active:shadow-inset">CANCEL</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setActionId(s.id)} className="px-4 py-1 bg-web-gray font-sans font-bold border-2 border-black shadow-outset active:shadow-inset">
                        REVIEW
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

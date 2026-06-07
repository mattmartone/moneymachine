import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AppNav } from '../components/AppNav';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  tokens: number;
  lifetime_tokens_used: number;
  reports_downloaded: number;
  lifetime_billed: number;
  membership_status: string;
  role: string;
  created_at: string;
  last_login: string;
}

interface Comm {
  id: number;
  type: string;
  subject: string;
  body: string;
  created_at: string;
}

interface Analysis {
  id: number;
  status: string;
  tokens_spent: number;
  created_at: string;
  filename: string;
}

export function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [comms, setComms] = useState<Comm[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('ftc_token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }

    fetch(`/api/admin/member?id=${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 403) { navigate('/reports'); return; }
        return res.json();
      })
      .then(data => {
        if (data) {
          setUser(data.user);
          setComms(data.comms || []);
          setAnalyses(data.analyses || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, token, navigate]);

  if (loading) return <div className="min-h-screen font-mono p-8 animate-blink">Loading...</div>;
  if (!user) return <div className="min-h-screen font-mono p-8">Member not found.</div>;

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
        <AppNav />

        <Link to="/users" className="web-link font-sans text-sm font-bold mb-4 inline-block">&laquo; Back to Members</Link>

        {/* Profile Header */}
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-serif text-2xl font-bold">{user.name || '—'}</h2>
              <div className="font-mono text-sm text-gray-600">{user.email}</div>
            </div>
            <span className={`font-mono text-xs font-bold px-2 py-1 border border-black ${user.membership_status === 'active' ? 'bg-[#e6ffe6] text-[#008000]' : 'bg-[#e6f0ff] text-[#000080]'}`}>
              {user.membership_status?.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-sm">
            <div>
              <div className="text-xs text-gray-500">Tokens</div>
              <div className="font-bold text-lg">{user.tokens?.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Lifetime Used</div>
              <div>{user.lifetime_tokens_used?.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Joined</div>
              <div>{user.created_at?.split('T')[0]}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Last Login</div>
              <div>{user.last_login?.split('T')[0] || 'Never'}</div>
            </div>
          </div>
        </div>

        {/* Orders */}
        {analyses.length > 0 && (
          <div className="mb-6">
            <h3 className="font-sans font-bold text-sm mb-3 border-b-2 border-black pb-1">ORDERS</h3>
            <div className="space-y-2">
              {analyses.map(a => (
                <div key={a.id} className="bg-white border border-gray-400 p-3 flex justify-between items-center">
                  <div>
                    <span className="font-serif font-bold">{a.filename || `Analysis #${a.id}`}</span>
                    <span className="font-mono text-xs text-gray-500 ml-3">{a.created_at?.split('T')[0]}</span>
                    <span className="font-mono text-xs text-gray-500 ml-3">{a.tokens_spent?.toLocaleString()} tokens</span>
                  </div>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 ${a.status === 'complete' ? 'bg-[#e6ffe6] text-[#008000]' : a.status === 'failed' ? 'bg-[#ffe6e6] text-web-red' : 'bg-[#ffffcc] text-black'}`}>
                    {a.status?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Communications Log */}
        <div>
          <h3 className="font-sans font-bold text-sm mb-3 border-b-2 border-black pb-1">COMMUNICATIONS</h3>
          {comms.length === 0 ? (
            <div className="font-mono text-sm text-gray-500 p-4">No communications yet.</div>
          ) : (
            <div className="space-y-2">
              {comms.map(c => (
                <div key={c.id} className="bg-white border border-gray-300 p-3">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-sans font-bold text-sm">{c.subject}</div>
                    <span className="font-mono text-xs text-gray-500 shrink-0 ml-4">{c.created_at?.split('T')[0]}</span>
                  </div>
                  <div className="font-mono text-xs text-gray-600 mb-1">
                    <span className={`px-1 py-0.5 border ${c.type === 'allocation' ? 'border-[#008000] text-[#008000]' : c.type === 'order_confirmation' ? 'border-[#000080] text-[#000080]' : 'border-gray-400 text-gray-600'}`}>
                      {c.type}
                    </span>
                  </div>
                  <div className="font-serif text-sm text-gray-700">{c.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppNav } from '../components/AppNav';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  membership_status: string;
  tokens: number;
  lifetime_tokens_used: number;
  reports_downloaded: number;
  lifetime_billed: number;
}

export function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTokens, setEditTokens] = useState('');

  const token = localStorage.getItem('ftc_token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    loadUsers();
  }, [navigate, token]);

  const loadUsers = () => {
    fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) { navigate('/'); return; }
        return res.json();
      })
      .then(data => {
        if (data) setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleAllocate = async (userId: number) => {
    const amount = parseInt(editTokens);
    if (isNaN(amount)) return;

    await fetch('/api/admin/allocate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId, tokens: amount })
    });

    setEditingId(null);
    setEditTokens('');
    loadUsers();
  };

  const handleSetTokens = async (userId: number) => {
    const newBalance = parseInt(editTokens);
    if (isNaN(newBalance)) return;

    const user = users.find(u => u.id === userId);
    if (!user) return;

    const diff = newBalance - user.tokens;

    await fetch('/api/admin/allocate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId, tokens: diff })
    });

    setEditingId(null);
    setEditTokens('');
    loadUsers();
  };

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-5xl mx-auto">
        <AppNav />

        <h3 className="font-serif text-xl font-bold mb-4 border-b-2 border-black pb-1">
          MEMBERS
        </h3>

        {loading ? (
          <div className="font-mono animate-blink p-4">Loading...</div>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Link to={`/users/${u.id}`} className="font-serif font-bold text-lg web-link">{u.name || '—'}</Link>
                    <div className="font-mono text-xs text-gray-600">{u.email}</div>
                  </div>
                  <div className="font-mono text-xs text-gray-500">
                    Joined {u.created_at?.split('T')[0]}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 font-mono text-sm mt-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">Tokens</div>
                    <div className="font-bold">{u.tokens?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Used</div>
                    <div>{u.lifetime_tokens_used?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Status</div>
                    <div className={`font-bold ${u.membership_status === 'active' ? 'text-web-green' : 'text-web-blue'}`}>{u.membership_status}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Billed</div>
                    <div>${u.lifetime_billed?.toFixed(2)}</div>
                  </div>
                </div>

                {editingId === u.id ? (
                  <div className="flex gap-2 items-center mt-2 border-t border-gray-300 pt-2">
                    <input
                      type="number"
                      value={editTokens}
                      onChange={e => setEditTokens(e.target.value)}
                      placeholder="New token balance"
                      className="px-2 py-1 border border-gray-400 shadow-inset font-mono text-sm w-40"
                    />
                    <button
                      onClick={() => handleSetTokens(u.id)}
                      className="px-3 py-1 bg-[#008000] text-white font-bold text-xs border border-black shadow-outset active:shadow-inset"
                    >SET</button>
                    <button
                      onClick={() => { setEditingId(null); setEditTokens(''); }}
                      className="px-3 py-1 bg-web-gray font-bold text-xs border border-black shadow-outset active:shadow-inset"
                    >CANCEL</button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2 border-t border-gray-300 pt-2">
                    <button
                      onClick={() => { setEditingId(u.id); setEditTokens('1000000'); }}
                      className="px-3 py-1 bg-web-gray font-sans font-bold text-xs border border-black shadow-outset active:shadow-inset"
                    >ALLOCATE 1M</button>
                    <button
                      onClick={() => { setEditingId(u.id); setEditTokens(String(u.tokens)); }}
                      className="px-3 py-1 bg-web-gray font-sans font-bold text-xs border border-black shadow-outset active:shadow-inset"
                    >EDIT BALANCE</button>
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

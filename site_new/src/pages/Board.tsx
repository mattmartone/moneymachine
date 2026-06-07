import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

interface Post {
  id: number;
  title: string;
  body: string;
  author_name: string;
  likes: number;
  dislikes: number;
  pinned: boolean;
  created_at: string;
  comment_count: number;
}

export function Board() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem('ftc_user') || '{}');
  const token = localStorage.getItem('ftc_token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    loadPosts();
  }, [navigate, token]);

  const loadPosts = () => {
    fetch('/api/board', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data) setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setPosting(true);

    const res = await fetch('/api/board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: title.trim(), body: body.trim() })
    });

    if (res.ok) {
      setTitle('');
      setBody('');
      setShowForm(false);
      loadPosts();
    }
    setPosting(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('ftc_token');
    localStorage.removeItem('ftc_user');
    navigate('/');
  };

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-4xl mx-auto">
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
            <Link to="/strategies" className="web-link">STRATEGIES</Link>
            <Link to="/board" className="web-link">BOARD</Link>
            <Link to="/contact" className="web-link">CONTACT</Link>
          </nav>
        </header>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-bold border-b-2 border-black pb-1">
            BULLETIN BOARD
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-1 bg-web-gray font-sans font-bold text-sm border-2 border-black shadow-outset active:shadow-inset"
          >
            {showForm ? 'CANCEL' : 'NEW POST'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handlePost} className="bg-[#ffffcc] border-2 border-black p-4 mb-6 shadow-outset">
            <div className="mb-3">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Subject"
                className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset font-mono outline-none focus:bg-white"
                required
              />
            </div>
            <div className="mb-3">
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset font-mono resize-none outline-none focus:bg-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={posting}
              className="px-6 py-1 bg-web-gray font-sans font-bold border-2 border-black shadow-outset active:shadow-inset disabled:opacity-70"
            >
              {posting ? 'POSTING...' : 'POST'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="font-mono animate-blink p-4">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="bg-white border-2 border-gray-400 p-8 text-center font-serif italic text-gray-500">
            No posts yet. Be the first.
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <Link
                key={post.id}
                to={`/board/${post.id}`}
                className="block bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffffcc]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    {post.pinned && <span className="font-sans text-xs font-bold text-web-red mr-2">PINNED</span>}
                    <span className="font-serif font-bold">{post.title}</span>
                  </div>
                  <div className="font-mono text-xs text-gray-500">
                    {post.created_at?.split('T')[0]}
                  </div>
                </div>
                <div className="font-mono text-xs text-gray-600 mt-1">
                  by {post.author_name || 'anon'} · {post.comment_count || 0} replies · 👍 {post.likes} 👎 {post.dislikes}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

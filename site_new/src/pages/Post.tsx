import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

interface PostData {
  id: number;
  title: string;
  body: string;
  author_name: string;
  likes: number;
  dislikes: number;
  created_at: string;
}

interface Comment {
  id: number;
  body: string;
  author_name: string;
  likes: number;
  dislikes: number;
  created_at: string;
}

export function Post() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem('ftc_user') || '{}');
  const token = localStorage.getItem('ftc_token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    loadPost();
  }, [id, token, navigate]);

  const loadPost = () => {
    fetch(`/api/board/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setPost(data.post || null);
          setComments(data.comments || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);

    const res = await fetch(`/api/board/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ body: comment.trim() })
    });

    if (res.ok) {
      setComment('');
      loadPost();
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
            <Link to="/strategies" className="web-link">STRATEGIES MARKETPLACE</Link>
            <Link to="/lab" className="web-link">MY LAB</Link>
            <Link to="/board" className="web-link">BULLETIN BOARD</Link>
            <Link to="/contact" className="web-link">CONTACT</Link>
          </nav>
        </header>

        <Link to="/board" className="web-link font-sans text-sm font-bold mb-4 inline-block">&laquo; Back to Board</Link>

        {loading ? (
          <div className="font-mono animate-blink p-4">Loading...</div>
        ) : !post ? (
          <div className="bg-white border-2 border-gray-400 p-8 text-center font-serif italic text-gray-500">
            Post not found.
          </div>
        ) : (
          <>
            {/* Post */}
            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
              <h2 className="font-serif text-xl font-bold mb-2">{post.title}</h2>
              <div className="font-mono text-xs text-gray-500 mb-3">
                by {post.author_name || 'anon'} · {post.created_at?.split('T')[0]} · 👍 {post.likes} 👎 {post.dislikes}
              </div>
              <p className="font-serif whitespace-pre-wrap">{post.body}</p>
            </div>

            {/* Comments */}
            <h4 className="font-sans font-bold text-sm mb-3 border-b border-black pb-1">
              REPLIES ({comments.length})
            </h4>

            {comments.length === 0 ? (
              <div className="font-serif italic text-gray-500 mb-6">No replies yet.</div>
            ) : (
              <div className="space-y-3 mb-6">
                {comments.map(c => (
                  <div key={c.id} className="bg-gray-100 border border-gray-400 p-3 ml-4">
                    <div className="font-mono text-xs text-gray-500 mb-1">
                      {c.author_name || 'anon'} · {c.created_at?.split('T')[0]} · 👍 {c.likes} 👎 {c.dislikes}
                    </div>
                    <p className="font-serif text-sm whitespace-pre-wrap">{c.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply form */}
            <form onSubmit={handleComment} className="bg-[#ffffcc] border-2 border-black p-4 shadow-outset">
              <div className="font-sans font-bold text-sm mb-2">REPLY:</div>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Write a reply..."
                rows={3}
                className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset font-mono resize-none outline-none focus:bg-white mb-3"
                required
              />
              <button
                type="submit"
                disabled={posting}
                className="px-6 py-1 bg-web-gray font-sans font-bold border-2 border-black shadow-outset active:shadow-inset disabled:opacity-70"
              >
                {posting ? 'POSTING...' : 'REPLY'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

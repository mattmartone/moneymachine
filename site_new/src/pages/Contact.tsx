import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      if (res.ok) {
        setStatus('sent');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-2xl mx-auto">
        <header className="mb-6">
          <h1 className="font-serif text-3xl font-bold mb-4">FADE THE CHALK</h1>
          <nav className="bg-web-gray border-2 border-black p-2 shadow-outset font-sans text-sm font-bold flex gap-6">
            <Link to="/" className="web-link">HOME</Link>
            <Link to="/contact" className="web-link">CONTACT</Link>
          </nav>
        </header>

        <h2 className="font-serif text-2xl font-bold bg-black text-white inline-block px-2 py-1 mb-6">
          CONTACT THE WEBMASTER
        </h2>

        {status === 'sent' ? (
          <div className="bg-[#e6ffe6] border-2 border-[#008000] p-6 text-[#008000] font-bold text-center">
            MESSAGE SENT. We'll get back to you.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4">
              <label className="block font-sans font-bold text-sm mb-1">Name:</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset outline-none focus:bg-[#ffffcc] font-mono"
              />
            </div>

            <div className="mb-4">
              <label className="block font-sans font-bold text-sm mb-1">Email:</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset outline-none focus:bg-[#ffffcc] font-mono"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block font-sans font-bold text-sm mb-1">Message:</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={5}
                className="w-full px-2 py-1 bg-white border-2 border-gray-400 shadow-inset outline-none focus:bg-[#ffffcc] font-mono resize-none"
                required
              />
            </div>

            {status === 'error' && (
              <div className="text-web-red font-bold text-sm mb-4 bg-[#ffe6e6] border border-web-red p-2">
                * Something went wrong. Try again.
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="px-6 py-2 bg-web-gray font-sans font-bold text-black border-2 border-black shadow-outset active:shadow-inset cursor-pointer disabled:opacity-70"
            >
              {status === 'sending' ? 'SENDING...' : 'SEND MESSAGE'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}
export function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login'
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setSent(false);
    }
  }, [isOpen, initialMode]);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('ftc_token', data.token);
        localStorage.setItem('ftc_user', JSON.stringify(data.user));
        window.location.href = '/reports';
      } else {
        setError(data.error || 'Invalid PIN.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    // Check if this email gets PIN auth
    setLoading(true);
    try {
      const res = await fetch('/api/auth/check-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.usePin) {
        setShowPin(true);
        setLoading(false);
        return;
      }
    } catch {}

    try {
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError('Something went wrong. Try again.');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-web-gray border-2 border-black shadow-outset w-full max-w-md font-sans">
        {/* Title Bar */}
        <div className="bg-[#000080] text-white font-bold p-1 px-2 flex justify-between items-center">
          <span>Fade the Chalk — Member Access</span>
          <button
            onClick={onClose}
            className="bg-web-gray text-black border border-white border-r-black border-b-black px-1.5 leading-none hover:bg-gray-300 active:border-black active:border-r-white active:border-b-white"
            aria-label="Close">
            X
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {sent ? (
            <div className="text-center">
              <div className="p-4 bg-[#e6ffe6] border-2 border-[#008000] text-[#008000] font-bold mb-4">
                LINK SENT!
              </div>
              <p className="font-serif text-lg mb-4">
                Check your email for a magic link from <strong>picks@org64.com</strong>.
              </p>
              <p className="font-serif mb-4">
                Click it to complete your signup and unlock your <span className="text-web-red font-bold">free race day analysis</span>.
              </p>
              <p className="font-mono text-xs text-gray-600">
                Sent to: {email}
              </p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b-2 border-gray-400 pb-2">
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`px-4 py-1 font-bold ${mode === 'login' ? 'bg-web-gray shadow-inset pt-1.5 pl-4.5' : 'bg-web-gray shadow-outset'}`}>
                  Log In
                </button>
                <button
                  onClick={() => { setMode('signup'); setError(''); }}
                  className={`px-4 py-1 font-bold ${mode === 'signup' ? 'bg-web-gray shadow-inset pt-1.5 pl-4.5' : 'bg-web-gray shadow-outset'}`}>
                  Sign Up
                </button>
              </div>

              {mode === 'signup' && (
                <div className="mb-4 bg-[#ffffcc] border-2 border-black p-2 text-center shadow-outset">
                  <span className="font-bold text-web-red">
                    ★ NEW MEMBER BONUS ★
                  </span>
                  <p className="text-sm font-bold text-black">
                    Sign up &amp; get your first{' '}
                    <span className="text-web-red">race day analysis FREE</span>.
                  </p>
                </div>
              )}

              <p className="font-serif text-sm text-gray-700 mb-4">
                No password needed. We'll email you a magic link to sign in.
              </p>

              {/* Form */}
              {showPin ? (
                <form onSubmit={handlePinSubmit} className="space-y-4">
                  {error && (
                    <div className="text-web-red font-bold text-sm bg-[#ffe6e6] border border-web-red p-2">
                      * {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold mb-1">PIN:</label>
                    <input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter PIN"
                      autoFocus
                      className="w-full px-2 py-1 bg-white shadow-inset outline-none focus:bg-[#ffffcc] font-mono text-lg tracking-widest"
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-1 bg-web-gray font-bold shadow-outset active:shadow-inset active:pt-1.5 active:pl-6.5 disabled:opacity-70">
                      {loading ? 'Verifying...' : 'Sign In'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="text-web-red font-bold text-sm bg-[#ffe6e6] border border-web-red p-2">
                      * {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold mb-1">
                      Email Address:
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-2 py-1 bg-white shadow-inset outline-none focus:bg-[#ffffcc]"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-1 bg-web-gray font-bold shadow-outset active:shadow-inset active:pt-1.5 active:pl-6.5 disabled:opacity-70">
                      {loading ? 'Checking...' : mode === 'login' ? 'Continue' : 'Sign Up'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>);
}

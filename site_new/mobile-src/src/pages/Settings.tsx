import React, { useState, useEffect } from 'react';
import { Check, Moon, Sun, Lock, User, Coins, LogOut } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { THEMES } from '../theme';

const API_HEADERS = { 'Authorization': 'Bearer public' };

export function Settings() {
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('ftc_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResetSent(false);
    setResetError('');
    try {
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      if (res.ok) setResetSent(true);
      else setResetError('Failed to send. Try again.');
    } catch { setResetError('Network error.'); }
  };

  const handleSignOut = () => {
    localStorage.removeItem('ftc_token');
    localStorage.removeItem('ftc_user');
    window.location.href = '/signin';
  };

  return (
    <div className="pb-24 min-h-screen bg-app">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">
            Account
          </h1>
        </div>
      </div>

      <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-6 space-y-6">

        {/* User Info */}
        <section className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{user?.name || user?.email || 'Member'}</p>
              <p className="text-xs text-muted">{user?.email || ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-semibold uppercase tracking-wider">Role:</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold text-[10px] uppercase">{user?.role || 'member'}</span>
          </div>
        </section>

        {/* Token Balance */}
        <section className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-muted mb-3">
            Token Balance
          </h2>
          <div className="flex items-center gap-3">
            <Coins size={24} className="text-primary" />
            <span className="text-2xl font-bold text-gray-900">{user?.tokens ? Number(user.tokens).toLocaleString() : '—'}</span>
          </div>
          <p className="text-xs text-muted mt-2">Tokens are used when running custom race analysis. Each login costs 1,000 tokens.</p>
        </section>

        {/* Recent Activity */}
        <section className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-muted mb-3">
            Recent Activity
          </h2>
          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex justify-between py-2 border-b border-border">
              <span>Login</span>
              <span className="text-muted">-1,000 tokens</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span>Login</span>
              <span className="text-muted">-1,000 tokens</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Subscription started</span>
              <span className="text-primary font-semibold">+5,000,000 tokens</span>
            </div>
          </div>
        </section>

        {/* Password Reset */}
        <section className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-muted mb-3">
            Security
          </h2>
          <button
            onClick={handleResetPassword}
            className="w-full text-sm font-semibold bg-app border border-border rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors">
            Send sign-in link to email
          </button>
          {resetSent && <p className="text-xs text-primary mt-2">Link sent to {user?.email}</p>}
          {resetError && <p className="text-xs text-danger mt-2">{resetError}</p>}
        </section>

        {/* Appearance */}
        <section className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-muted mb-3">
            Appearance
          </h2>
          <div className="space-y-2.5">
            {THEMES.map((option) => {
              const isActive = option.id === theme;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  aria-pressed={isActive}
                  className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-app'}`}>
                  <span
                    className="shrink-0 w-10 h-10 rounded-lg border border-border overflow-hidden flex"
                    style={{ backgroundColor: option.swatch.bg }}>
                    <span className="w-1/2 h-full" style={{ backgroundColor: option.swatch.primary }} />
                    <span className="w-1/2 h-full" style={{ backgroundColor: option.swatch.accent }} />
                  </span>
                  <span className="flex-1">
                    <span className="text-sm font-bold text-gray-900">{option.name}</span>
                    <span className="block text-xs text-muted">{option.description}</span>
                  </span>
                  <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center border ${isActive ? 'bg-primary border-primary text-white' : 'border-border text-transparent'}`}>
                    <Check size={12} />
                  </span>
                </button>);
            })}
          </div>
        </section>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-danger bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 hover:bg-danger/10 transition-colors mb-8">
          <LogOut size={16} />
          Sign Out
        </button>
      </main>
    </div>);

}
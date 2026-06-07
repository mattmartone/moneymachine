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
    }
  }, [isOpen, initialMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    // Simulate success
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }, 2000);
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
          {success ?
          <div className="p-4 bg-[#e6ffe6] border-2 border-[#008000] text-[#008000] font-bold text-center mb-4">
              SUCCESS!{' '}
              {mode === 'login' ?
            'Logging in...' :
            'Account created — 12 FREE picks unlocked!'}
            </div> :

          <>
              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b-2 border-gray-400 pb-2">
                <button
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`px-4 py-1 font-bold ${mode === 'login' ? 'bg-web-gray shadow-inset pt-1.5 pl-4.5' : 'bg-web-gray shadow-outset'}`}>
                
                  Log In
                </button>
                <button
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`px-4 py-1 font-bold ${mode === 'signup' ? 'bg-web-gray shadow-inset pt-1.5 pl-4.5' : 'bg-web-gray shadow-outset'}`}>
                
                  Sign Up
                </button>
              </div>

              {mode === 'signup' &&
            <div className="mb-4 bg-[#ffffcc] border-2 border-black p-2 text-center shadow-outset">
                  <span className="font-bold text-web-red">
                    ★ NEW MEMBER BONUS ★
                  </span>
                  <p className="text-sm font-bold text-black">
                    Create an account &amp; get your first{' '}
                    <span className="text-web-red">12 picks FREE</span>.
                  </p>
                </div>
            }

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error &&
              <div className="text-web-red font-bold text-sm bg-[#ffe6e6] border border-web-red p-2">
                    * {error}
                  </div>
              }

                <div>
                  <label className="block text-sm font-bold mb-1">
                    Email Address:
                  </label>
                  <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-2 py-1 bg-white shadow-inset outline-none focus:bg-[#ffffcc]" />
                
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1">
                    Password:
                  </label>
                  <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-2 py-1 bg-white shadow-inset outline-none focus:bg-[#ffffcc]" />
                
                </div>

                {mode === 'signup' &&
              <div>
                    <label className="block text-sm font-bold mb-1">
                      Confirm Password:
                    </label>
                    <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-2 py-1 bg-white shadow-inset outline-none focus:bg-[#ffffcc]" />
                
                  </div>
              }

                <div className="flex items-center justify-between pt-4">
                  <button
                  type="submit"
                  className="px-6 py-1 bg-web-gray font-bold shadow-outset active:shadow-inset active:pt-1.5 active:pl-6.5">
                  
                    {mode === 'login' ? 'Log In' : 'Create Account'}
                  </button>

                  {mode === 'login' &&
                <a
                  href="#"
                  className="web-link text-sm"
                  onClick={(e) => e.preventDefault()}>
                  
                      Forgot password?
                    </a>
                }
                </div>
              </form>
            </>
          }
        </div>
      </div>
    </div>);

}
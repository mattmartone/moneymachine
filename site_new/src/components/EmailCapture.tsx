import React, { useState } from 'react';
interface EmailCaptureProps {
  buttonText?: string;
  className?: string;
}
export function EmailCapture({
  buttonText = 'Get early access',
  className = ''
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'>(
    'idle');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };
  if (status === 'success') {
    return (
      <div
        className={`p-4 bg-[#e6ffe6] border-2 border-[#008000] text-[#008000] font-sans font-bold text-center ${className}`}>

        CHECK YOUR EMAIL. Click the magic link to get in.
      </div>);

  }
  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col sm:flex-row gap-2 items-center justify-center ${className}`}>
      
      <div className="relative flex-1 w-full max-w-xs">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="Enter your email address..."
          className="w-full px-2 py-1 font-sans text-black bg-white shadow-inset outline-none focus:bg-[#ffffcc]"
          aria-label="Email address" />
        
        {status === 'error' &&
        <span className="absolute -bottom-5 left-0 text-xs font-sans text-web-red font-bold">
            * Invalid email address!
          </span>
        }
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-4 py-1 bg-web-gray font-sans font-bold text-black shadow-outset active:shadow-inset active:pt-1.5 active:pl-4.5 cursor-pointer disabled:opacity-70">
        
        {status === 'loading' ? 'Processing...' : buttonText}
      </button>
    </form>);

}
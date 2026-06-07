import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function Verify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setError('No token provided.');
      return;
    }

    fetch(`/api/auth/verify?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setStatus('error');
          setError(data.error);
        } else {
          localStorage.setItem('ftc_token', data.token);
          localStorage.setItem('ftc_user', JSON.stringify(data.user));
          setStatus('success');
          setTimeout(() => {
            if (!data.user.onboarded) {
              navigate('/onboard');
            } else {
              navigate('/reports');
            }
          }, 1500);
        }
      })
      .catch(() => {
        setStatus('error');
        setError('Something went wrong. Try again.');
      });
  }, [params, navigate]);

  return (
    <div className="min-h-screen font-serif p-4 flex items-center justify-center">
      <div className="web-container max-w-md text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">FADE THE CHALK</h1>
        {status === 'verifying' && (
          <div className="bg-web-gray border-2 border-black p-6 shadow-outset">
            <p className="font-mono animate-blink">Verifying your link...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="bg-[#e6ffe6] border-2 border-[#008000] p-6 text-[#008000] font-bold">
            You're in. Redirecting...
          </div>
        )}
        {status === 'error' && (
          <div className="bg-[#ffe6e6] border-2 border-web-red p-6 text-web-red font-bold">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppNav } from '../components/AppNav';

const PACKS = [
  { id: 'pack_1m', name: '1,000,000', tokens: 1000000, price: '$10', description: '~3 full card analyses' },
  { id: 'pack_2.5m', name: '2,500,000', tokens: 2500000, price: '$20', description: '~8 full card analyses' },
  { id: 'pack_5m', name: '5,000,000', tokens: 5000000, price: '$35', description: '~16 full card analyses' },
];

export function Shop() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [userTokens, setUserTokens] = useState(0);

  const token = localStorage.getItem('ftc_token');

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data?.tokens !== undefined) setUserTokens(data.tokens); })
      .catch(() => {});
  }, [token, navigate]);

  const success = searchParams.get('success') === 'true';
  const cancelled = searchParams.get('cancelled') === 'true';

  const handleBuy = async (packId: string) => {
    setLoading(packId);
    try {
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ pack_id: packId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen font-serif p-2 md:p-4">
      <div className="web-container max-w-3xl mx-auto">
        <AppNav />

        <h3 className="font-serif text-xl font-bold mb-2 border-b-2 border-black pb-1">
          TOKEN SHOP
        </h3>

        <div className="bg-[#ffffcc] border-2 border-black p-4 mb-6 shadow-outset font-serif text-sm">
          <p className="font-bold mb-1">Your balance: <span className="font-mono">{userTokens.toLocaleString()} tokens</span></p>
          <p className="text-gray-700">Running low? Re-up. The model don't wait and neither should you.</p>
        </div>

        {success && (
          <div className="bg-[#e6ffe6] border-4 border-[#008000] p-4 mb-6 text-center font-bold text-[#008000]">
            Payment received. Tokens are being credited to your account.
          </div>
        )}

        {cancelled && (
          <div className="bg-[#ffffcc] border-2 border-black p-4 mb-6 text-center font-mono text-sm">
            Checkout cancelled. No charge.
          </div>
        )}

        <div className="space-y-4">
          {PACKS.map(pack => (
            <div key={pack.id} className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
              <div>
                <div className="font-serif font-bold text-xl">{pack.name} tokens</div>
                <div className="font-mono text-sm text-gray-600">{pack.description}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold mb-2">{pack.price}</div>
                <button
                  onClick={() => handleBuy(pack.id)}
                  disabled={loading === pack.id}
                  className="px-6 py-2 bg-web-gray font-sans font-bold text-sm border-2 border-black shadow-outset active:shadow-inset cursor-pointer disabled:opacity-50"
                >
                  {loading === pack.id ? 'LOADING...' : 'BUY'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 font-mono text-xs text-gray-500 text-center">
          Tokens never expire. Use 'em this week or next month — they're yours.
        </div>
      </div>
    </div>
  );
}

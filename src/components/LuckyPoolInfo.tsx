import React, { useEffect, useState } from 'react';
import { useSolanaWallet } from '../hooks/useSolanaWallet';

interface LuckyPoolData {
  pool: number;
  lastWinner: string | null;
  lastAmount: number;
}

export const LuckyPoolInfo: React.FC = () => {
  const [data, setData] = useState<LuckyPoolData>({ pool: 0, lastWinner: null, lastAmount: 0 });
  const { user } = useSolanaWallet();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/lucky-pool');
        const json = await res.json();
        setData(json);
      } catch (e) {
        setData({ pool: 0, lastWinner: null, lastAmount: 0 });
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const referralLink = user && user.fullAddress ? `${window.location.origin}?ref=${user.fullAddress}` : '';

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-black/80 border border-yellow-400/40 rounded-xl p-3 mb-3 shadow-neon-yellow font-mono text-yellow-200 max-w-xs">
      <div className="flex items-center space-x-2 mb-1">
        <span className="text-2xl">🍀</span>
        <span className="font-bold text-lg">Lucky Pool</span>
      </div>
      <div className="text-yellow-300 text-xl font-bold mb-1">{data.pool.toFixed(3)} SOL</div>
      {data.lastWinner && data.lastAmount > 0 && (
        <div className="text-xs text-yellow-400 mt-2">
          🎉 Wallet <span className="font-mono font-bold">{data.lastWinner.slice(0,4)}...{data.lastWinner.slice(-4)}</span> a gagné {data.lastAmount.toFixed(2)} SOL !
        </div>
      )}
      <div className="text-xs text-yellow-300 mt-2">Misez pour tenter de remporter la Lucky Pool !</div>
      {user && user.fullAddress && (
        <div className="mt-3 p-2 bg-yellow-900/30 rounded border border-yellow-400/20">
          <div className="text-xs text-yellow-200 mb-1">Votre lien de parrainage :</div>
          <div className="flex items-center space-x-1">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-black/40 border border-yellow-400/30 rounded px-2 py-1 text-yellow-200 text-xs font-mono"
              style={{ minWidth: 0 }}
            />
            <button
              onClick={handleCopy}
              className="px-2 py-1 rounded bg-yellow-500/80 text-black text-xs font-bold ml-1 hover:bg-yellow-400 transition-all"
            >{copied ? 'Copié !' : 'Copier'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LuckyPoolInfo; 
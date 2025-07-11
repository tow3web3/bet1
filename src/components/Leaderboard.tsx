import React, { useEffect, useState } from 'react';

interface LeaderboardEntry {
  wallet: string;
  totalGains: number;
}

interface LeaderboardProps {
  onClose: () => void;
}

const medalColors = [
  'bg-yellow-400 text-yellow-900', // Or
  'bg-gray-300 text-gray-800',     // Argent
  'bg-orange-700 text-yellow-100'  // Bronze
];

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        setEntries(data);
      } catch (e) {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
    interval = setInterval(fetchLeaderboard, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-xl shadow-2xl border-2 border-green-400/40 w-full max-w-md p-6 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-2 right-2 text-green-400 hover:text-green-200 text-2xl font-bold">×</button>
        <h2 className="text-2xl font-bold text-green-300 mb-4 text-center drop-shadow-neon">🏆 Leaderboard</h2>
        {loading ? (
          <div className="text-center text-green-200 py-8">Chargement...</div>
        ) : entries.length === 0 ? (
          <div className="text-center text-green-400/70 text-sm py-8">Aucun gain enregistré pour l'instant.</div>
        ) : (
          <ol className="space-y-2">
            {entries.map((entry, idx) => (
              <li key={entry.wallet} className={`flex items-center justify-between p-3 rounded-lg border border-green-400/20 ${idx < 3 ? medalColors[idx] : 'bg-black/30 text-green-100'}`}>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg w-6 text-center">{idx + 1}</span>
                  <span className="font-mono text-xs">{entry.wallet.slice(0, 4)}...{entry.wallet.slice(-4)}</span>
                </div>
                <span className="font-bold text-green-200">{entry.totalGains.toFixed(4)} SOL</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}; 
import React, { useEffect, useState } from 'react';

interface LuckyPoolData {
  pool: number;
}

export const FluxDetails: React.FC = () => {
  const [battle, setBattle] = useState<any>(null);
  const [luckyPool, setLuckyPool] = useState<number>(0);

  useEffect(() => {
    const fetchBattle = async () => {
      try {
        const res = await fetch('/api/battle');
        const data = await res.json();
        setBattle(data);
      } catch {}
    };
    const fetchLucky = async () => {
      try {
        const res = await fetch('/api/lucky-pool');
        const data = await res.json();
        setLuckyPool(data.pool || 0);
      } catch {}
    };
    fetchBattle();
    fetchLucky();
    const interval = setInterval(() => { fetchBattle(); fetchLucky(); }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Calculs
  let totalMise = 0, totalFee = 0, totalBurn = 0, totalLucky = 0;
  if (battle && battle.bets) {
    for (const bet of battle.bets) {
      const mise = bet.amount / 0.85; // On remonte à la mise initiale
      totalMise += mise;
      totalFee += mise * 0.05;
      totalBurn += mise * 0.05;
      totalLucky += mise * 0.05;
    }
  }

  return (
    <div className="bg-black/80 border border-blue-400/40 rounded-xl p-3 mb-3 shadow-neon-blue font-mono text-blue-200 max-w-xs">
      <div className="flex items-center space-x-2 mb-1">
        <span className="text-2xl">🔎</span>
        <span className="font-bold text-lg">Détail des flux</span>
      </div>
      <div className="text-xs text-blue-300 mb-2">Combat en cours</div>
      <div className="text-xs mb-1">Total misé : <span className="font-bold text-white">{totalMise.toFixed(4)} SOL</span></div>
      <div className="text-xs mb-1">Total fees envoyés : <span className="font-bold text-yellow-300">{totalFee.toFixed(4)} SOL</span></div>
      <div className="text-xs mb-1">Total burn à retirer : <span className="font-bold text-red-400">{totalBurn.toFixed(4)} SOL</span></div>
      <div className="text-xs mb-1">Total Lucky Pool (combat) : <span className="font-bold text-green-300">{totalLucky.toFixed(4)} SOL</span></div>
      <div className="text-xs mb-1">Lucky Pool globale : <span className="font-bold text-green-400">{luckyPool.toFixed(4)} SOL</span></div>
      <div className="mt-3 text-xs text-blue-200">
        <b>Répartition pour chaque mise :</b><br/>
        <span className="font-mono">0.02 SOL → 0.017 SOL pool, 0.001 SOL fee, 0.001 SOL burn, 0.001 SOL Lucky Pool</span>
      </div>
    </div>
  );
};

export default FluxDetails; 
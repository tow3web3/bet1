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

  // Calculs dynamiques combat en cours
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

  // Schéma pour une mise de 0.02 SOL
  const exampleMise = 0.02;
  const examplePool = exampleMise * 0.85;
  const exampleFee = exampleMise * 0.05;
  const exampleBurn = exampleMise * 0.05;
  const exampleLucky = exampleMise * 0.05;

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
      <div className="mt-4 mb-2 text-xs text-blue-200 font-mono font-bold">Répartition pour une mise de 0.02 SOL :</div>
      <table className="w-full text-xs mb-2 border-separate border-spacing-y-1">
        <tbody>
          <tr>
            <td className="text-green-200">Pool du combat (85%)</td>
            <td className="text-right text-green-300 font-bold">{examplePool.toFixed(4)} SOL</td>
          </tr>
          <tr>
            <td className="text-yellow-200">Fee (5%)</td>
            <td className="text-right text-yellow-300 font-bold">{exampleFee.toFixed(4)} SOL</td>
          </tr>
          <tr>
            <td className="text-red-200">Burn (5%)</td>
            <td className="text-right text-red-400 font-bold">{exampleBurn.toFixed(4)} SOL</td>
          </tr>
          <tr>
            <td className="text-green-400">Lucky Pool (5%)</td>
            <td className="text-right text-green-400 font-bold">{exampleLucky.toFixed(4)} SOL</td>
          </tr>
          <tr className="border-t border-blue-400">
            <td className="text-blue-200 font-bold">Total</td>
            <td className="text-right text-blue-200 font-bold">{exampleMise.toFixed(4)} SOL</td>
          </tr>
        </tbody>
      </table>
      <div className="text-xs text-blue-100 mt-2">
        <b>Explications :</b><br/>
        <span className="text-green-200">• Le <b>Pool du combat</b> est partagé équitablement entre les gagnants à la fin du combat.</span><br/>
        <span className="text-yellow-200">• Le <b>Fee</b> est envoyé automatiquement au wallet de fee.</span><br/>
        <span className="text-red-200">• Le <b>Burn</b> doit être retiré manuellement du wallet pool.</span><br/>
        <span className="text-green-400">• La <b>Lucky Pool</b> grossit à chaque mise et est gagnée lors du tirage spécial.</span>
      </div>
    </div>
  );
};

export default FluxDetails; 
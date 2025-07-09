import React from 'react';
import { TrendingUp, Users, Coins, Timer, Wifi, WifiOff } from 'lucide-react';
import { Battle } from '../types';

interface GameStatsProps {
  battle: Battle | null;
  connected?: boolean;
  connectedUsers?: number;
}

export const GameStats: React.FC<GameStatsProps> = ({ battle, connected = false, connectedUsers = 0 }) => {
  const stats = [
    {
      icon: connected ? Wifi : WifiOff,
      label: 'Connexion',
      value: connected ? 'Connecté' : 'Déconnecté',
      color: connected ? 'text-green-400' : 'text-red-400'
    },
    {
      icon: Users,
      label: 'Joueurs Connectés',
      value: connectedUsers,
      color: 'text-blue-400'
    },
    {
      icon: Coins,
      label: 'Pool Total',
      value: `${battle?.totalPool.toFixed(2) || '0.00'} SOL`,
      color: 'text-yellow-400'
    },
    {
      icon: TrendingUp,
      label: 'Paris Totaux',
      value: battle ? battle.teams[0].bets + battle.teams[1].bets : 0,
      color: 'text-green-400'
    },
    {
      icon: Timer,
      label: 'Statut Combat',
      value: battle?.status === 'active' ? 'ACTIF' : 
             battle?.status === 'waiting' ? 'ATTENTE' : 
             battle?.status === 'finished' ? 'TERMINÉ' : 'AUCUN',
      color: 'text-purple-400'
    },
    {
      icon: Users,
      label: 'Participants',
      value: battle?.participants || 0,
      color: 'text-cyan-400'
    }
  ];

  return (
    <div className="bg-black/90 p-3 rounded-xl border border-green-400/30 shadow-neon-green font-mono">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-green-300 drop-shadow-neon">Stats Temps Réel</h3>
        <div className={`flex items-center space-x-1 ${connected ? 'text-green-400' : 'text-red-400'}`}>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-xs font-medium">{connected ? 'Sync' : 'Off'}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, index) => (
          <div key={index} className="bg-black/30 rounded p-2 flex flex-col items-center border border-green-400/10">
            <stat.icon className={`w-4 h-4 mb-1 ${stat.color}`} />
            <span className="text-2xs text-green-200">{stat.label}</span>
            <p className="text-xs font-bold text-green-100">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
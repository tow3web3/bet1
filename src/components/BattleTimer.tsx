import React, { useState, useEffect } from 'react';
import { Clock, Zap, Trophy } from 'lucide-react';
import { Battle } from '../types';

interface BattleTimerProps {
  battle: Battle | null;
}

export const BattleTimer: React.FC<BattleTimerProps> = ({ battle }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100); // Mise à jour plus fréquente pour une meilleure fluidité

    return () => clearInterval(interval);
  }, []);

  if (!battle) {
    return (
      <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-400">Aucun combat</span>
        </div>
        <div className="text-2xl font-bold text-gray-400">--:--</div>
      </div>
    );
  }

  const getTimerInfo = () => {
    switch (battle.status) {
      case 'waiting': {
        const timeToStart = Math.max(0, battle.startTime.getTime() - currentTime);
        const secondsToStart = Math.ceil(timeToStart / 1000);
        const minutes = Math.floor(secondsToStart / 60);
        const seconds = secondsToStart % 60;
        return {
          icon: Clock,
          label: 'Combat commence dans',
          time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10 border-yellow-500/20',
          progress: Math.max(0, (15000 - timeToStart) / 15000 * 100)
        };
      }
      
      case 'active': {
        const elapsedTime = Math.max(0, currentTime - battle.startTime.getTime());
        const remainingTime = Math.max(0, 45000 - elapsedTime);
        const remainingSeconds = Math.ceil(remainingTime / 1000);
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        const isUrgent = remainingSeconds <= 10;
        
        return {
          icon: Zap,
          label: 'Temps de pari restant',
          time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
          color: isUrgent ? 'text-red-400 animate-pulse' : 'text-green-400',
          bgColor: isUrgent ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20',
          progress: (elapsedTime / 45000) * 100
        };
      }
      
      case 'finished': {
        const timeSinceEnd = battle.endTime ? Math.max(0, currentTime - battle.endTime.getTime()) : 0;
        const timeToNext = Math.max(0, 10000 - timeSinceEnd);
        const secondsToNext = Math.ceil(timeToNext / 1000);
        
        return {
          icon: Trophy,
          label: 'Prochain combat dans',
          time: `0:${secondsToNext.toString().padStart(2, '0')}`,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10 border-blue-500/20',
          progress: ((10000 - timeToNext) / 10000) * 100
        };
      }
      
      default: {
        return {
          icon: Clock,
          label: 'Statut inconnu',
          time: '--:--',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10 border-gray-500/20',
          progress: 0
        };
      }
    }
  };

  const timerInfo = getTimerInfo();
  const IconComponent = timerInfo.icon;

  return (
    <div className={`${timerInfo.bgColor} border rounded-lg p-4 text-center transition-all duration-300`}>
      <div className="flex items-center justify-center space-x-2 mb-2">
        <IconComponent className={`w-5 h-5 ${timerInfo.color}`} />
        <span className={`text-sm font-medium ${timerInfo.color}`}>{timerInfo.label}</span>
      </div>
      
      <div className={`text-4xl font-bold mb-3 ${timerInfo.color} font-mono`}>
        {timerInfo.time}
      </div>
      
      {/* Barre de progression */}
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-100 ease-linear ${
            battle.status === 'waiting' 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
              : battle.status === 'active'
              ? timerInfo.color.includes('red')
                ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' 
                : 'bg-gradient-to-r from-green-500 to-blue-500'
              : 'bg-gradient-to-r from-blue-500 to-purple-500'
          }`}
          style={{ 
            width: `${Math.min(100, Math.max(0, timerInfo.progress))}%` 
          }}
        />
      </div>
      
      {/* Message de statut */}
      <div className="mt-2">
        {battle.status === 'waiting' && (
          <p className="text-xs text-yellow-300">Préparez-vous pour le combat!</p>
        )}
        {battle.status === 'active' && (
          <p className="text-xs text-green-300">Paris ouverts - Choisissez votre champion!</p>
        )}
        {battle.status === 'finished' && battle.winner && (
          <p className="text-xs text-blue-300">
            {battle.teams.find(t => t.id === battle.winner)?.name} a gagné!
          </p>
        )}
      </div>
    </div>
  );
};
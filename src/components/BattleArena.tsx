import React, { useState } from 'react';
import { Zap, Users, Clock, Trophy, Coins } from 'lucide-react';
import { Battle } from '../types';
import { useWallet } from '../hooks/useWallet';

interface BattleArenaProps {
  battle: Battle | null;
}

export const BattleArena: React.FC<BattleArenaProps> = ({ battle }) => {
  const { user, placeBet } = useWallet();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [betting, setBetting] = useState(false);

  const handleBet = async (teamId: string) => {
    if (!user || betting) return;
    
    setBetting(true);
    const success = await placeBet(teamId, 0.1);
    
    if (success) {
      setSelectedTeam(teamId);
      // Add visual feedback
      setTimeout(() => setSelectedTeam(null), 3000);
    }
    
    setBetting(false);
  };

  if (!battle) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-purple-900 p-8 rounded-2xl border border-purple-500/20">
        <div className="text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-bold text-white mb-2">No Active Battle</h2>
          <p className="text-purple-200">Waiting for next battle to start...</p>
        </div>
      </div>
    );
  }

  const getBattleStatus = () => {
    switch (battle.status) {
      case 'waiting':
        return { text: 'Waiting to Start', color: 'text-yellow-400' };
      case 'active':
        return { text: 'Battle in Progress', color: 'text-green-400' };
      case 'finished':
        return { text: 'Battle Finished', color: 'text-blue-400' };
      default:
        return { text: 'Unknown', color: 'text-gray-400' };
    }
  };

  const status = getBattleStatus();

  return (
    <div className="bg-gradient-to-br from-gray-900 to-purple-900 p-6 rounded-2xl border border-purple-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-purple-500 rounded-full flex items-center justify-center">
            <Zap className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Battle Arena</h2>
            <p className={`text-sm ${status.color}`}>{status.text}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-white">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold">{battle.totalPool.toFixed(2)} SOL</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="font-semibold">{battle.participants}</span>
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-2 gap-6">
        {battle.teams.map((team, index) => (
          <div
            key={team.id}
            className={`relative bg-gradient-to-br ${team.color} p-6 rounded-2xl transition-all duration-300 ${
              selectedTeam === team.id ? 'ring-4 ring-green-400 ring-opacity-50' : ''
            } ${battle.winner === team.id ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''}`}
          >
            {battle.winner === team.id && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-900" />
              </div>
            )}
            
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">{team.avatar}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{team.name}</h3>
              <div className="bg-black/20 rounded-lg p-3 mb-4">
                <p className="text-white text-sm">Bets: {team.bets}</p>
                <p className="text-white text-sm">Total: {team.totalAmount.toFixed(2)} SOL</p>
              </div>
            </div>
            
            {battle.status === 'active' && user && (
              <button
                onClick={() => handleBet(team.id)}
                disabled={betting || selectedTeam === team.id}
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                  selectedTeam === team.id
                    ? 'bg-green-500 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105`}
              >
                {selectedTeam === team.id ? '✓ Bet Placed!' : betting ? 'Betting...' : 'Bet 0.1 SOL'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Battle Progress */}
      {battle.status === 'active' && (
        <div className="mt-6 bg-black/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-200 text-sm">Battle Progress</span>
            <span className="text-white text-sm">
              {Math.floor((Date.now() - battle.startTime.getTime()) / 1000)}s
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((Date.now() - battle.startTime.getTime()) / 300, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
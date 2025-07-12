import React, { useState } from 'react';
import { Zap, Users, Clock, Trophy, Coins, AlertCircle, Timer } from 'lucide-react';
import { Battle } from '../types';
import { useSolanaWallet } from '../hooks/useSolanaWallet';
import { useGlobalBattle } from '../hooks/useGlobalBattle';
import { BattleTimer } from './BattleTimer';

interface RealBattleArenaProps {
  battle: Battle | null;
}

export const RealBattleArena: React.FC<RealBattleArenaProps> = ({ battle }) => {
  console.log('[DEBUG] RealBattleArena render avec battle:', battle);
  
  const { user, placeBet: walletPlaceBet, loading } = useSolanaWallet();
  const { placeBet: globalPlaceBet, addChatMessage } = useGlobalBattle();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [betting, setBetting] = useState(false);

  // Vérifie si l'utilisateur a déjà parié sur ce combat
  let hasAlreadyBet = false;
  if (user && battle) {
    const betKey = `bet_${battle.id}_${user.fullAddress}`;
    hasAlreadyBet = !!localStorage.getItem(betKey);
  }

  const handleBet = async (teamId: string, teamName: string) => {
    if (!user || betting || loading) return;
    if (hasAlreadyBet) {
      addChatMessage('❌ Vous avez déjà parié sur ce combat !', user.fullAddress || user.address);
      return;
    }
    
    const betAmount = 0.02;
    
    if (user.balance < betAmount) {
      addChatMessage('❌ Solde insuffisant pour parier!', user.fullAddress || user.address);
      return;
    }
    
    setBetting(true);
    
    try {
      // Placer le pari sur la blockchain
      const success = await walletPlaceBet(teamId, betAmount);
      
      if (success) {
        // Enregistre le pari localement pour empêcher un second pari
        if (user.fullAddress && battle) {
          const betKey = `bet_${battle.id}_${user.fullAddress}`;
          localStorage.setItem(betKey, JSON.stringify({ teamId, date: Date.now() }));
        }
        // Mettre à jour le combat global
        if (user.fullAddress) {
          globalPlaceBet(teamId, betAmount, user.fullAddress);
          // Message court de pari dans le chat combat
          addChatMessage('', user.fullAddress, 'bet', { amount: betAmount, teamName });
        setSelectedTeam(teamId);
        
        // Effacer la sélection après 3 secondes
        setTimeout(() => setSelectedTeam(null), 3000);
      } else {
           addChatMessage('❌ Erreur: adresse wallet invalide', user.fullAddress || user.address);
         }
      } else {
        addChatMessage('❌ Échec du pari - veuillez réessayer', user.fullAddress || user.address);
      }
    } catch (error) {
      console.error('Erreur de pari:', error);
      addChatMessage('❌ Transaction échouée', user.fullAddress || user.address);
    }
    
    setBetting(false);
  };

  if (!battle) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-purple-900 p-8 rounded-2xl border border-purple-500/20">
        <div className="text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Initialisation du Combat Global</h2>
          <p className="text-purple-200">Connexion au système de combat en cours...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const getBattleStatus = () => {
    switch (battle.status) {
      case 'waiting':
        return { 
          text: 'Préparation du Combat', 
          color: 'text-yellow-400',
          description: 'Le combat va bientôt commencer!'
        };
      case 'active':
        return { 
          text: 'COMBAT EN COURS', 
          color: 'text-green-400 animate-pulse',
          description: 'Placez vos paris maintenant!'
        };
      case 'finished':
        const winner = battle.teams.find(t => t.id === battle.winner);
        return { 
          text: `${winner?.name} GAGNE!`, 
          color: 'text-blue-400',
          description: 'Prochain combat bientôt...'
        };
      default:
        return { 
          text: 'Statut Inconnu', 
          color: 'text-gray-400',
          description: ''
        };
    }
  };

  const status = getBattleStatus();
  const canBet = battle.status === 'active' && user && !betting && !loading;

  return (
    <div className="bg-black/90 p-3 rounded-xl border border-green-400/30 shadow-neon-green font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded flex items-center justify-center shadow-neon-green">
            <Zap className="w-4 h-4 text-green-200 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-green-300 drop-shadow-neon">Combat Global</h2>
            <p className={`text-xs ${status.color} font-semibold drop-shadow-neon`}>{status.text}</p>
            {status.description && (
              <p className="text-2xs text-green-200">{status.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 text-green-100">
          <div className="flex items-center space-x-1 bg-black/30 rounded px-2 py-1">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold text-xs">{battle.totalPool.toFixed(4)} SOL</span>
          </div>
          <div className="flex items-center space-x-1 bg-black/30 rounded px-2 py-1">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-xs">{battle.participants}</span>
          </div>
        </div>
      </div>
      {/* Minuterie du Combat */}
      <div className="mb-2">
        <BattleTimer battle={battle} />
      </div>
      {/* Avertissement pour solde insuffisant */}
      {user && user.balance < 0.02 && battle.status === 'active' && (
        <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-red-400 text-xs">Solde insuffisant. 0.02 SOL min.</p>
        </div>
      )}
      {/* Equipes */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {battle.teams.map((team, idx) => {
          const isWinner = battle.status === 'finished' && battle.winner === team.id;
          return (
            <div
              key={team.id}
              className={`relative bg-black/60 p-2 rounded-xl border border-green-400/20 transition-all duration-300 ${selectedTeam === team.id ? 'ring-2 ring-green-400' : ''} ${isWinner ? 'ring-2 ring-yellow-400' : ''}`}
            >
              {isWinner && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-neon-yellow">
                  <Trophy className="w-4 h-4 text-yellow-900" />
                </div>
              )}
              <div className="text-center mb-2">
                <div className="text-3xl mb-1">{team.avatar}</div>
                <h3 className="text-base font-bold text-green-200 mb-1 drop-shadow-neon">{team.name}</h3>
                <div className="bg-black/30 rounded p-1 mb-2">
                  <p className="text-green-100 text-xs">Paris: {team.bets}</p>
                  <p className="text-green-100 text-xs">Total: {team.totalAmount.toFixed(2)} SOL</p>
                </div>
              </div>
              {battle.status === 'active' && user && (
                <button
                  onClick={() => handleBet(team.id, team.name)}
                  disabled={betting || selectedTeam === team.id || user.balance < 0.02 || hasAlreadyBet}
                  className={`w-full py-2 rounded font-bold text-xs transition-all duration-300 ${selectedTeam === team.id ? 'bg-green-500 text-white shadow-neon-green' : user.balance < 0.02 || hasAlreadyBet ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed' : 'bg-black/30 hover:bg-green-500/20 text-green-200 hover:scale-105 shadow-neon-green'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {hasAlreadyBet ? 'Pari déjà placé' : selectedTeam === team.id ? '✓ Pari Placé!' : betting ? 'Traitement...' : user.balance < 0.02 ? 'Solde Insuffisant' : 'Parier 0.02 SOL'}
                </button>
              )}
              {!user && battle.status === 'active' && (
                <div className="w-full py-2 rounded bg-green-500/10 text-green-300 text-center font-bold text-xs">Connectez votre wallet</div>
              )}
              {battle.status === 'waiting' && (
                <div className="w-full py-2 rounded bg-yellow-500/10 text-yellow-300 text-center font-bold text-xs">Combat bientôt</div>
              )}
              {battle.status === 'finished' && (
                <div className={`w-full py-2 rounded text-center font-bold text-xs ${isWinner ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>{isWinner ? '🏆 VICTOIRE!' : '💀 Défaite'}</div>
              )}
            </div>
          );
        })}
      </div>
      {/* Statistiques du combat */}
      <div className="mt-2 grid grid-cols-3 gap-2">
        <div className="bg-black/30 rounded p-1 text-center">
          <Timer className="w-4 h-4 mx-auto mb-0.5 text-green-400" />
          <p className="text-green-200 text-2xs">Statut</p>
          <p className="text-green-100 font-bold text-xs">{battle.status === 'waiting' ? 'ATTENTE' : battle.status === 'active' ? 'ACTIF' : 'TERMINÉ'}</p>
        </div>
        <div className="bg-black/30 rounded p-1 text-center">
          <Zap className="w-4 h-4 mx-auto mb-0.5 text-yellow-400" />
          <p className="text-green-200 text-2xs">Total Paris</p>
          <p className="text-green-100 font-bold text-xs">{battle.teams[0].bets + battle.teams[1].bets}</p>
        </div>
        <div className="bg-black/30 rounded p-1 text-center">
          <Trophy className="w-4 h-4 mx-auto mb-0.5 text-green-400" />
          <p className="text-green-200 text-2xs">Participants</p>
          <p className="text-green-100 font-bold text-xs">{battle.participants}</p>
        </div>
      </div>
    </div>
  );
};
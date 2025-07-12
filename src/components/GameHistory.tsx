import React, { useEffect, useState, useRef } from 'react';
import { History, Trophy, Users, Coins, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { GameHistory as GameHistoryType } from '../types';
import { useSolanaWallet } from '../hooks/useSolanaWallet';

interface GameHistoryProps {
  history?: GameHistoryType[];
  initialTab?: 'profile' | 'history';
}

export const GameHistory: React.FC<GameHistoryProps> = ({ initialTab }) => {
  const { user } = useSolanaWallet();
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [globalHistory, setGlobalHistory] = useState<any[]>([]);
  const [showGlobal, setShowGlobal] = useState(false);
  const [showProfile, setShowProfile] = useState(initialTab === 'profile');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Si initialTab change, on met à jour l'onglet affiché
  useEffect(() => {
    if (initialTab === 'profile') {
      setShowProfile(true);
      setShowGlobal(false);
    } else if (initialTab === 'history') {
      setShowProfile(false);
      setShowGlobal(false);
    }
  }, [initialTab]);

  useEffect(() => {
    if (user && user.fullAddress) {
      const historyKey = `user_history_${user.fullAddress}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      setUserHistory(history);
    }
  }, [user]);

  // Rafraîchissement automatique de l'historique utilisateur chaque seconde
  useEffect(() => {
    if (!user || !user.fullAddress) return;
    const historyKey = `user_history_${user.fullAddress}`;
    const interval = setInterval(() => {
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      setUserHistory(history);
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => setGlobalHistory(data || []));
  }, []);

  // Rafraîchissement automatique de l'historique global chaque seconde
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/history')
        .then(res => res.json())
        .then(data => setGlobalHistory(data || []));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll automatique seulement quand de nouveaux éléments sont ajoutés, pas lors du changement d'onglet
  useEffect(() => {
    if (messagesEndRef.current && (userHistory.length > 0 || globalHistory.length > 0)) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [userHistory.length, globalHistory.length]); // Seulement la longueur, pas le contenu complet

  // Stats utilisateur
  const totalBets = userHistory.length;
  const totalGains = userHistory.reduce((acc, h) => acc + (h.gain || 0), 0);
  const totalLosses = userHistory.reduce((acc, h) => acc + (h.perte || 0), 0);
  const winCount = userHistory.filter(h => h.success).length;
  const loseCount = userHistory.filter(h => !h.success).length;

  // Stats globales
  const globalTotal = globalHistory.length;
  const globalPool = globalHistory.reduce((acc, h) => acc + (h.totalPool || 0), 0);
  const globalParticipants = globalHistory.reduce((acc, h) => acc + (h.participants || 0), 0);

  const handleExport = () => {
    window.open('/api/export', '_blank');
  };

  return (
    <div className="bg-black/90 p-3 rounded-xl border border-green-400/30 shadow-neon-green font-mono max-h-96 overflow-y-auto">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded flex items-center justify-center shadow-neon-green">
          <History className="w-4 h-4 text-green-200" />
        </div>
        <h3 className="text-base font-bold text-green-300 drop-shadow-neon">
          {showProfile ? 'Profil' : showGlobal ? 'Historique Global' : 'Mon Historique'}
        </h3>
      </div>
      <div className="flex gap-1 mb-2">
        <button
          className={`px-2 py-0.5 rounded font-semibold text-2xs ${showProfile ? 'bg-green-600 text-white' : 'bg-gray-800 text-green-200'} border border-green-400/20`}
          onClick={() => { setShowProfile(true); setShowGlobal(false); }}
        >Profil</button>
        <button
          className={`px-2 py-0.5 rounded font-semibold text-2xs ${!showGlobal && !showProfile ? 'bg-green-600 text-white' : 'bg-gray-800 text-green-200'} border border-green-400/20`}
          onClick={() => { setShowProfile(false); setShowGlobal(false); }}
        >Mon Historique</button>
        <button
          className={`px-2 py-0.5 rounded font-semibold text-2xs ${showGlobal ? 'bg-green-600 text-white' : 'bg-gray-800 text-green-200'} border border-green-400/20`}
          onClick={() => { setShowProfile(false); setShowGlobal(true); }}
        >Global</button>
        <button
          className="ml-auto px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-semibold text-2xs border border-yellow-500/30"
          onClick={handleExport}
        >Export</button>
      </div>

      {showProfile ? (
        user ? (
          <div className="bg-gradient-to-br from-purple-900 to-blue-900 p-4 rounded-xl border border-purple-500/20 mb-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">{user.address}</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-purple-200 text-sm">{user.balance?.toFixed(4) || '0.0000'} SOL</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-black/20 rounded-lg p-3 text-center">
                <p className="text-purple-200 text-sm">Total Bets</p>
                <p className="text-white font-bold text-lg">{user.totalBets}</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <p className="text-green-400 text-sm">Wins</p>
                </div>
                <p className="text-white font-bold text-lg">{user.totalWins}</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center space-x-1">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <p className="text-red-400 text-sm">Losses</p>
                </div>
                <p className="text-white font-bold text-lg">{user.totalLosses}</p>
              </div>
            </div>
            <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-green-400 text-sm text-center">
                ✅ Mainnet Mode - Real SOL transactions
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-green-300 py-8">Connectez votre wallet pour voir votre profil.</div>
        )
      ) : !showGlobal ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-purple-200">
            <div>Total Paris : <span className="font-bold text-white">{totalBets}</span></div>
            <div>Gagnés : <span className="font-bold text-green-400">{winCount}</span></div>
            <div>Perdus : <span className="font-bold text-red-400">{loseCount}</span></div>
            <div>Total Gagné : <span className="font-bold text-green-400">{totalGains.toFixed(3)} SOL</span></div>
            <div>Total Perdu : <span className="font-bold text-red-400">{totalLosses.toFixed(3)} SOL</span></div>
            <div>Ratio : <span className="font-bold">{totalBets ? ((winCount/totalBets)*100).toFixed(1) : 0}%</span></div>
          </div>
          <div className="space-y-4">
            {userHistory.length === 0 ? (
              <div className="text-center text-purple-300 text-sm py-8">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucun pari enregistré</p>
                <p className="text-xs mt-1">L'historique apparaîtra ici</p>
              </div>
            ) : (
              userHistory.map((entry, idx) => (
                <div key={idx} className="bg-black/20 rounded-lg p-4 border border-purple-500/10 flex items-start gap-3">
                  {/* Icône statut */}
                  <div className="mt-1">
                    {entry.success ? (
                      <Trophy className="w-6 h-6 text-green-400" />
                    ) : (
                      <span className="inline-block w-6 h-6 text-red-400 text-xl font-bold">✗</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-xs">{new Date(entry.date).toLocaleString()}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${entry.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {entry.success ? `+${(entry.gain || 0).toFixed(3)} SOL` : `-${(entry.perte || entry.amount || 0).toFixed(3)} SOL`}
                      </span>
                    </div>
                    <div className="text-xs mb-1">
                      <span className={entry.success ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                        {entry.success ? 'Gagné' : 'Perdu'}
                      </span>
                      {entry.tx && (
                        <span className="ml-2">Tx: <a href={`https://solscan.io/tx/${entry.tx}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">{entry.tx.slice(0,8)}...</a></span>
                      )}
                      {entry.error && (
                        <span className="ml-2 text-red-400">Erreur: {entry.error}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">Montant parié : {(entry.amount || 0).toFixed(3)} SOL</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-purple-200">
            <div>Total Combats : <span className="font-bold text-white">{globalTotal}</span></div>
            <div>Total Pool : <span className="font-bold text-yellow-400">{globalPool.toFixed(2)} SOL</span></div>
            <div>Total Participants : <span className="font-bold text-blue-400">{globalParticipants}</span></div>
          </div>
      <div className="space-y-4">
            {globalHistory.length === 0 ? (
              <div className="text-center text-purple-300 text-sm py-8">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucun combat terminé</p>
                <p className="text-xs mt-1">L'historique global apparaîtra ici</p>
              </div>
            ) : (
              globalHistory.map((game, idx) => (
                <div key={game.id || idx} className="bg-black/20 rounded-lg p-4 border border-purple-500/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">{game.winner}</span>
              </div>
              <span className="text-gray-400 text-sm">
                      {game.endTime ? new Date(game.endTime).toLocaleTimeString() : ''}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 text-sm">{game.participants}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Coins className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 text-sm">{game.totalPool?.toFixed(2)} SOL</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                      <span>{game.teams?.[0]?.avatar} {game.teams?.[0]?.name}</span>
                <span className="text-gray-400">vs</span>
                      <span>{game.teams?.[1]?.avatar} {game.teams?.[1]?.name}</span>
              </div>
            </div>
          </div>
              ))
            )}
            <div ref={messagesEndRef} />
      </div>
        </>
      )}
    </div>
  );
};
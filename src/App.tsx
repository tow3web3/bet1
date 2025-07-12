import React, { useEffect, useState } from 'react';
import { RealWalletConnection } from './components/RealWalletConnection';
import { RealBattleArena } from './components/RealBattleArena';
import { ChatPanel } from './components/ChatPanel';
import { GameStats } from './components/GameStats';
import { GameHistory } from './components/GameHistory';
import { useGlobalBattle } from './hooks/useGlobalBattle';
import { useSolanaWallet } from './hooks/useSolanaWallet';
import UserChatPanel from './components/UserChatPanel';
import { Leaderboard } from './components/Leaderboard';
import LuckyPoolInfo from './components/LuckyPoolInfo';
import FAQModal from './components/FAQModal';

function App() {
  const { currentBattle, chatMessages, connectedUsers, connected, addChatMessage } = useGlobalBattle();
  const { user } = useSolanaWallet();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'history'>('profile');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  useEffect(() => {
    const handler = () => {
      setProfileTab('profile');
      setShowProfileModal(true);
    };
    window.addEventListener('open-profile-modal', handler);
    return () => window.removeEventListener('open-profile-modal', handler);
  }, []);

  // Handler pour ouvrir l'historique
  const openHistoryModal = () => {
    setProfileTab('history');
    setShowProfileModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 font-mono overflow-x-hidden">
      {/* Header */}
      <header className="bg-black/80 border-b border-green-400/30 shadow-neon-green sticky top-0 z-50 py-2 px-0">
        <div className="max-w-full mx-auto flex items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <span className="text-xl md:text-2xl text-green-400 drop-shadow-neon font-bold tracking-widest animate-pulse">█▓▒⚡</span>
            <span className="text-lg md:text-xl font-bold text-green-300 drop-shadow-neon">Solana Battle Arena</span>
            <span className="ml-2 text-xs text-green-500/80 tracking-widest">[HACKER MODE]</span>
            </div>
              <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-green-200 text-xs">{connected ? `${connectedUsers} users` : 'Connecting...'}</span>
          </div>
        </div>
      </header>

      {/* Bouton Leaderboard en haut à droite */}
      <div className="fixed top-4 right-4 z-50 flex space-x-2">
        <button
          className="bg-gradient-to-br from-yellow-400 to-green-400 text-black font-bold px-4 py-2 rounded-xl shadow-neon-green border-2 border-green-400/40 hover:scale-105 transition-all"
          onClick={() => setShowLeaderboard(true)}
        >
          🏆 Leaderboard
        </button>
        <button
          className="bg-gradient-to-br from-yellow-300 to-yellow-500 text-black font-bold px-4 py-2 rounded-xl shadow-neon-yellow border-2 border-yellow-400/40 hover:scale-105 transition-all"
          onClick={() => setShowFAQ(true)}
        >
          ❓ FAQ
        </button>
      </div>
      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}
      {showFAQ && (
        <FAQModal onClose={() => setShowFAQ(false)} />
      )}

      {/* Layout 3 colonnes */}
      <div className="flex w-full min-h-[calc(100vh-48px)]">
        {/* Colonne gauche : Chat utilisateur */}
        <div className="hidden md:block w-72 min-w-72 max-w-80 h-[calc(100vh-48px)] border-r border-green-400/20 bg-black/80 shadow-neon-green relative z-40">
          <UserChatPanel />
        </div>

        {/* Colonne centrale : Arène, wallet, actions */}
        <main className="flex-1 flex flex-col items-center justify-start px-2 md:px-6 py-4 space-y-4 max-w-2xl mx-auto">
          <div className="w-full space-y-3">
            <RealWalletConnection />
            <LuckyPoolInfo />
            <RealBattleArena battle={currentBattle} />
            {/* Bouton Historique */}
            <div className="flex justify-center mt-2">
              <button
                className="px-4 py-2 rounded bg-green-700 text-white font-mono font-semibold shadow-neon-green hover:bg-green-800 transition-all border border-green-400/40"
                onClick={openHistoryModal}
              >
                Mon Historique
              </button>
            </div>
          </div>
        </main>

        {/* Colonne droite : Stats + chat combat (plus d'historique ici) */}
        <aside className="hidden lg:flex flex-col w-80 min-w-72 max-w-96 h-[calc(100vh-48px)] border-l border-green-400/20 bg-black/80 shadow-neon-green space-y-4 px-2 py-4 overflow-y-auto">
          <GameStats 
            battle={currentBattle} 
            connected={connected}
            connectedUsers={connectedUsers}
          />
          <div className="h-56">
              <ChatPanel messages={chatMessages} onSendMessage={addChatMessage} />
          </div>
        </aside>
            </div>
            
      {/* Modal Profil/Statut ou Historique */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-black/95 border border-green-400/40 rounded-2xl shadow-neon-green p-4 max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-green-400 hover:text-white text-xl font-bold"
              onClick={() => setShowProfileModal(false)}
              aria-label="Fermer"
            >×</button>
            <GameHistory key={profileTab} initialTab={profileTab} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-black/80 border-t border-green-400/30 shadow-neon-green mt-2 py-2 px-0">
        <div className="max-w-full mx-auto px-6 text-center text-green-400 text-xs tracking-widest font-mono">
          <span className="drop-shadow-neon">© 2024 Solana Battle Arena | Mode Hacker Casino | Mainnet</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
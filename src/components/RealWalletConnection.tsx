import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useSolanaWallet } from '../hooks/useSolanaWallet';

export const RealWalletConnection: React.FC = () => {
  const { connected } = useWallet();
  const { user, loading, refreshBalance } = useSolanaWallet();

  if (!connected || !user) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-black/90 p-2 rounded-xl border border-green-400/30 shadow-neon-green font-mono flex items-center space-x-2 cursor-pointer">
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded flex items-center justify-center shadow-neon-green">
          <Wallet className="w-5 h-5 text-green-200" />
        </div>
        <span className="text-green-200 text-xs font-mono">Non connecté</span>
        <div className="wallet-adapter-button-trigger ml-2">
          <WalletMultiButton className="!bg-gradient-to-r !from-green-500 !to-blue-500 hover:!from-green-600 hover:!to-blue-600 !text-white !px-3 !py-1 !rounded !font-semibold !transition-all !duration-300 !transform hover:!scale-105 !text-xs font-mono" />
        </div>
      </div>
    );
  }

  // Mini-widget compact
  const shortAddress = user.address.length > 10 ? `${user.address.slice(0,4)}...${user.address.slice(-4)}` : user.address;

  // TODO: ouvrir le modal GameHistory sur l'onglet Profil au clic (à brancher sur le parent)
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 p-2 rounded-xl border border-green-400/30 shadow-neon-green font-mono flex items-center space-x-2 cursor-pointer group hover:bg-black/95 transition-all" title="Voir mon profil">
      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded flex items-center justify-center shadow-neon-green">
        <Wallet className="w-5 h-5 text-green-200" />
      </div>
      <span className="text-green-200 text-xs font-mono">{shortAddress}</span>
      <span className="text-purple-200 text-xs font-mono ml-1">{user.balance?.toFixed(3) || '0.000'} SOL</span>
      <button
        onClick={() => {
          // Custom event pour ouvrir le modal GameHistory sur Profil
          window.dispatchEvent(new CustomEvent('open-profile-modal'));
        }}
        className="ml-2 px-2 py-0.5 rounded bg-green-600 text-white text-xs font-mono font-semibold shadow-neon-green hover:bg-green-700 transition-all"
      >Profil</button>
    </div>
  );
};
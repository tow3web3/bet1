import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export const WalletConnection: React.FC = () => {
  const { user, connecting, connectWallet, disconnectWallet } = useWallet();

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-purple-900 to-blue-900 p-6 rounded-2xl border border-purple-500/20">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-purple-200 mb-6">Connect your Solana wallet to start betting</p>
          <button
            onClick={connectWallet}
            disabled={connecting}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900 to-blue-900 p-6 rounded-2xl border border-purple-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold">{user.address}</p>
            <p className="text-purple-200 text-sm">{user.balance.toFixed(2)} SOL</p>
          </div>
        </div>
        <button
          onClick={disconnectWallet}
          className="text-purple-300 hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
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
    </div>
  );
};
import { useState, useEffect } from 'react';
import { User } from '../types';

export const useWallet = () => {
  const [user, setUser] = useState<User | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    setConnecting(true);
    
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockUser: User = {
      address: '7xKs...M9Qp',
      balance: 5.2,
      totalWins: 12,
      totalLosses: 8,
      totalBets: 20,
      connected: true
    };
    
    setUser(mockUser);
    setConnecting(false);
  };

  const disconnectWallet = () => {
    setUser(null);
  };

  const placeBet = async (teamId: string, amount: number) => {
    if (!user || user.balance < amount) return false;
    
    // Simulate bet placement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUser(prev => prev ? {
      ...prev,
      balance: prev.balance - amount,
      totalBets: prev.totalBets + 1
    } : null);
    
    return true;
  };

  return {
    user,
    connecting,
    connectWallet,
    disconnectWallet,
    placeBet
  };
};
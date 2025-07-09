import { useState, useEffect, useCallback } from 'react';
import { Battle, ChatMessage, GameHistory } from '../types';
import { useSolanaWallet } from './useSolanaWallet';

// Simulated WebSocket for real-time updates
class GameWebSocket {
  private callbacks: { [key: string]: Function[] } = {};
  private connected = false;

  connect() {
    this.connected = true;
    setTimeout(() => {
      this.emit('connected');
    }, 1000);
  }

  on(event: string, callback: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  emit(event: string, data?: any) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  disconnect() {
    this.connected = false;
  }
}

const gameSocket = new GameWebSocket();

export const useRealGameState = () => {
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [connected, setConnected] = useState(false);
  const [battlePool, setBattlePool] = useState(0);
  const { updateUserStats, user } = useSolanaWallet();

  // Battle teams configurations
  const teamConfigs = [
    [
      { name: 'Fire Dragons', color: 'from-red-500 to-orange-500', avatar: '🔥' },
      { name: 'Ice Wolves', color: 'from-blue-500 to-cyan-500', avatar: '❄️' }
    ],
    [
      { name: 'Lightning Hawks', color: 'from-yellow-500 to-orange-500', avatar: '⚡' },
      { name: 'Shadow Panthers', color: 'from-purple-500 to-pink-500', avatar: '🐾' }
    ],
    [
      { name: 'Storm Eagles', color: 'from-cyan-500 to-blue-500', avatar: '🦅' },
      { name: 'Earth Titans', color: 'from-green-500 to-emerald-500', avatar: '🗿' }
    ]
  ];

  const createNewBattle = useCallback(() => {
    const configIndex = Math.floor(Math.random() * teamConfigs.length);
    const teams = teamConfigs[configIndex];
    
    const battle: Battle = {
      id: Date.now().toString(),
      teams: [
        {
          id: 'team1',
          name: teams[0].name,
          color: teams[0].color,
          avatar: teams[0].avatar,
          bets: 0,
          totalAmount: 0
        },
        {
          id: 'team2',
          name: teams[1].name,
          color: teams[1].color,
          avatar: teams[1].avatar,
          bets: 0,
          totalAmount: 0
        }
      ],
      status: 'waiting',
      startTime: new Date(Date.now() + 10000), // Start in 10 seconds
      totalPool: 0,
      participants: 0
    };

    setCurrentBattle(battle);
    setBattlePool(0);

    // Add system message
    addSystemMessage(`New battle starting: ${teams[0].name} vs ${teams[1].name}!`);

    // Start battle after countdown
    setTimeout(() => {
      setCurrentBattle(prev => prev ? { ...prev, status: 'active', startTime: new Date() } : null);
      addSystemMessage('Battle is now active! Place your bets!');
    }, 10000);

    // End battle after 45 seconds of active time
    setTimeout(() => {
      endBattle();
    }, 55000);

  }, []);

  const endBattle = useCallback(() => {
    setCurrentBattle(prev => {
      if (!prev || prev.status === 'finished') return prev;

      const winnerIndex = Math.random() > 0.5 ? 0 : 1;
      const winner = prev.teams[winnerIndex];
      const loser = prev.teams[1 - winnerIndex];

      // Calculate payouts
      const winnerPayout = prev.totalPool > 0 ? prev.totalPool / winner.bets : 0;

      // Add to history
      const historyEntry: GameHistory = {
        id: prev.id,
        teams: prev.teams,
        winner: winner.name,
        totalPool: prev.totalPool,
        participants: prev.participants,
        endTime: new Date()
      };

      setGameHistory(prevHistory => [historyEntry, ...prevHistory.slice(0, 9)]);

      // Update user stats if they participated
      if (user) {
        // This would need to track user bets in a real implementation
        // For now, we'll simulate based on random chance
        const userParticipated = Math.random() > 0.7;
        if (userParticipated) {
          const userWon = Math.random() > 0.5;
          updateUserStats(userWon, userWon ? winnerPayout : undefined);
        }
      }

      addSystemMessage(`🏆 ${winner.name} wins! Payouts: ${winnerPayout.toFixed(3)} SOL per bet`);

      // Start new battle after 15 seconds
      setTimeout(() => {
        createNewBattle();
      }, 15000);

      return {
        ...prev,
        status: 'finished',
        winner: winner.id,
        endTime: new Date()
      };
    });
  }, [user, updateUserStats, createNewBattle]);

  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      user: 'System',
      message,
      timestamp: new Date(),
      type: 'system'
    };
    setChatMessages(prev => [...prev, systemMessage].slice(-50));
  };

  const addChatMessage = useCallback((message: string, type: 'message' | 'bet' = 'message') => {
    if (!user) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: user.address,
      message,
      timestamp: new Date(),
      type
    };
    
    setChatMessages(prev => [...prev, newMessage].slice(-50));
  }, [user]);

  const updateBattleStats = useCallback((teamId: string, betAmount: number) => {
    setCurrentBattle(prev => {
      if (!prev) return prev;

      const updatedTeams = prev.teams.map(team => 
        team.id === teamId 
          ? { ...team, bets: team.bets + 1, totalAmount: team.totalAmount + betAmount }
          : team
      );

      return {
        ...prev,
        teams: updatedTeams as [any, any],
        totalPool: prev.totalPool + betAmount,
        participants: prev.participants + 1
      };
    });

    setBattlePool(prev => prev + betAmount);
  }, []);

  // Initialize connection
  useEffect(() => {
    gameSocket.connect();
    
    gameSocket.on('connected', () => {
      setConnected(true);
      createNewBattle();
    });

    return () => {
      gameSocket.disconnect();
      setConnected(false);
    };
  }, [createNewBattle]);


  return {
    currentBattle,
    chatMessages,
    gameHistory,
    connected,
    battlePool,
    addChatMessage,
    updateBattleStats
  };
};
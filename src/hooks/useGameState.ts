import { useState, useEffect } from 'react';
import { Battle, ChatMessage, GameHistory } from '../types';

export const useGameState = () => {
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [connected, setConnected] = useState(false);

  // Simulate WebSocket connection
  useEffect(() => {
    const connect = () => {
      setConnected(true);
      
      // Initialize with a battle
      const battle: Battle = {
        id: '1',
        teams: [
          {
            id: 'team1',
            name: 'Fire Dragons',
            color: 'from-red-500 to-orange-500',
            avatar: '🔥',
            bets: 15,
            totalAmount: 1.5
          },
          {
            id: 'team2',
            name: 'Ice Wolves',
            color: 'from-blue-500 to-cyan-500',
            avatar: '❄️',
            bets: 12,
            totalAmount: 1.2
          }
        ],
        status: 'active',
        startTime: new Date(),
        totalPool: 2.7,
        participants: 27
      };
      
      setCurrentBattle(battle);
      
      // Add some initial chat messages
      const initialMessages: ChatMessage[] = [
        {
          id: '1',
          user: 'System',
          message: 'Battle started! Place your bets!',
          timestamp: new Date(),
          type: 'system'
        },
        {
          id: '2',
          user: '7xKs...M9Qp',
          message: 'Fire Dragons gonna win this! 🔥',
          timestamp: new Date(),
          type: 'message'
        }
      ];
      
      setChatMessages(initialMessages);
      
      // Simulate battle progression
      const battleTimer = setInterval(() => {
        setCurrentBattle(prev => {
          if (!prev) return prev;
          
          const newBets = Math.floor(Math.random() * 3);
          const teamIndex = Math.floor(Math.random() * 2);
          
          const updatedTeams = [...prev.teams];
          updatedTeams[teamIndex] = {
            ...updatedTeams[teamIndex],
            bets: updatedTeams[teamIndex].bets + newBets,
            totalAmount: updatedTeams[teamIndex].totalAmount + (newBets * 0.1)
          };
          
          return {
            ...prev,
            teams: updatedTeams as [any, any],
            totalPool: prev.totalPool + (newBets * 0.1),
            participants: prev.participants + newBets
          };
        });
      }, 3000);
      
      // End battle after 30 seconds
      setTimeout(() => {
        clearInterval(battleTimer);
        setCurrentBattle(prev => {
          if (!prev) return prev;
          
          const winner = Math.random() > 0.5 ? prev.teams[0] : prev.teams[1];
          
          return {
            ...prev,
            status: 'finished',
            winner: winner.id,
            endTime: new Date()
          };
        });
        
        // Start new battle after 10 seconds
        setTimeout(() => {
          const newBattle: Battle = {
            id: Date.now().toString(),
            teams: [
              {
                id: 'team1',
                name: 'Lightning Hawks',
                color: 'from-yellow-500 to-orange-500',
                avatar: '⚡',
                bets: 0,
                totalAmount: 0
              },
              {
                id: 'team2',
                name: 'Shadow Panthers',
                color: 'from-purple-500 to-pink-500',
                avatar: '🐾',
                bets: 0,
                totalAmount: 0
              }
            ],
            status: 'active',
            startTime: new Date(),
            totalPool: 0,
            participants: 0
          };
          
          setCurrentBattle(newBattle);
        }, 10000);
      }, 30000);
    };
    
    connect();
    
    return () => {
      setConnected(false);
    };
  }, []);

  const addChatMessage = (message: string, type: 'message' | 'bet' = 'message') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: '7xKs...M9Qp',
      message,
      timestamp: new Date(),
      type
    };
    
    setChatMessages(prev => [...prev, newMessage].slice(-50));
  };

  return {
    currentBattle,
    chatMessages,
    gameHistory,
    connected,
    addChatMessage
  };
};
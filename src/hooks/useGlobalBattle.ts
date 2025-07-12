import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Battle, ChatMessage } from '../types';
import { useSolanaWallet } from './useSolanaWallet';

const SOCKET_URL = import.meta.env.PROD ? 'https://bet1-oeah.onrender.com' : 'http://localhost:3001';

// Singleton Socket.IO pour éviter les connexions multiples
let globalSocket: Socket | null = null;
let socketListeners: Set<(data: any) => void> = new Set();

// Fonction pour obtenir ou créer le socket global
const getGlobalSocket = () => {
  if (!globalSocket) {
    console.log('[SOCKET] Création du socket global');
    globalSocket = SOCKET_URL ? io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      forceNew: true,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    }) : io({
      transports: ['polling', 'websocket'],
      forceNew: true,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    globalSocket.on('connect', () => {
      console.log('[SOCKET] ✅ Connecté au serveur (global)');
    });

    globalSocket.on('disconnect', () => {
      console.log('[SOCKET] ❌ Déconnecté du serveur (global)');
    });

    globalSocket.on('connect_error', (error) => {
      console.error('[SOCKET] ❌ Erreur de connexion (global):', error);
    });
  }
  return globalSocket;
};

// Ajoute une fonction utilitaire pour abréger les wallets
function shortWallet(addr: string) {
  if (!addr) return '';
  return addr.length > 8 ? `${addr.slice(0,4)}...${addr.slice(-4)}` : addr;
}

// Formate les messages système/bet/win en version courte
function formatCombatMessage(type: string, data: any) {
  switch (type) {
    case 'win':
      // ex: 💸 +0.20 SOL → 4Mp...ffrq (tx: 3TKb...SjDm)
      return `💸 +${data.amount?.toFixed(2)} SOL → ${shortWallet(data.user)}${data.tx ? ` (tx: ${data.tx.slice(0,5)}...${data.tx.slice(-4)})` : ''}`;
    case 'bet':
      // ex: 💎 4Mp...ffrq parie 0.02 SOL sur Aigles !
      return `💎 ${shortWallet(data.user)} parie ${data.amount?.toFixed(2)} SOL sur ${data.teamName || data.team || ''}`;
    case 'system':
      // ex: 🏆 Aigles gagnent !
      return data.messageShort || data.message;
    default:
      return data.message;
  }
}

export const useGlobalBattle = () => {
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [connected, setConnected] = useState(false);
  const { user } = useSolanaWallet();

  useEffect(() => {
    console.log('[DEBUG] useGlobalBattle useEffect déclenché');
    const socket = getGlobalSocket();
    
    // Mettre à jour l'état de connexion
    console.log('[DEBUG] Socket connecté:', socket.connected);
    setConnected(socket.connected);
    
    const handleConnect = () => {
      console.log('[DEBUG] Socket connecté dans handleConnect');
      setConnected(true);
    };
    const handleDisconnect = () => {
      console.log('[DEBUG] Socket déconnecté dans handleDisconnect');
      setConnected(false);
    };
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    socket.on('battle_update', (payload) => {
      console.log('[DEBUG] battle_update reçu:', payload);
      const previousBattle = currentBattle;
      const newBattle = payload ? {
        ...payload,
        startTime: payload.startTime ? new Date(payload.startTime) : undefined,
        endTime: payload.endTime ? new Date(payload.endTime) : undefined
      } : null;
      
      console.log('[DEBUG] Mise à jour currentBattle:', newBattle);
      setCurrentBattle(newBattle);
      setChatMessages(payload?.chatMessages || []);
      setConnectedUsers(payload?.participants || 0);

      // Déclenche le payout automatique UNIQUEMENT si le statut passe de 'active' à 'finished'
      if (previousBattle && previousBattle.status === 'active' && newBattle && newBattle.status === 'finished' && newBattle.winner) {
        console.log('[FRONT] Emission de battle_finished pour payout automatique');
        // Trouve l'équipe gagnante
        const winnerTeam = newBattle.teams.find((team: any) => team.id === newBattle.winner);
        const winnerName = winnerTeam?.name || 'Équipe gagnante';
        // Calcule le montant du payout (simulation)
        const payoutAmount = newBattle.totalPool > 0 ? newBattle.totalPool / Math.max(1, winnerTeam?.bets || 1) : 0.04;
        // Déclenche le payout automatique via Socket.IO
        socket.emit('battle_finished', {
          winnerAddress: user?.fullAddress || '4NcJkBEb7MLY7S5fSCpjppjdPEBnqk5Xt4ZoKSweMqV3', // Fallback si pas d'utilisateur
          amount: payoutAmount,
          battleId: newBattle.id,
          winnerName: winnerName
        });
      }
    });
    
    socket.on('participants', (count) => {
      console.log('[DEBUG] Participants reçu:', count);
      setConnectedUsers(count);
    });
    
    socket.on('chat_message', (message) => {
      console.log('[DEBUG] chat_message reçu:', message);
      // Ajouter le message à l'état local
      setChatMessages(prev => [...prev, message]);
    });

    // Ajout : écoute des paiements de gains
    socket.on('payout_result', (data) => {
      console.log('[SOCKET] 💰 Payout result:', data);
      if (!user || !user.fullAddress) return;
      if (data.user !== user.fullAddress) return;
      // Récupérer l'historique local
      const historyKey = `user_history_${user.fullAddress}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      // Ajoute l'entrée
      history.unshift({
        date: new Date().toISOString(),
        amount: data.amount,
        tx: data.tx,
        success: data.success,
        error: data.error,
        gain: data.success ? data.amount : 0,
        perte: data.success ? 0 : data.amount
      });
      localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
    });

    // Écoute des événements de payout automatique
    socket.on('payout_success', (data) => {
      console.log('✅ Payout automatique réussi:', data);
    });

    socket.on('payout_error', (data) => {
      console.error('❌ Erreur de payout automatique:', data);
    });

    return () => {
      console.log('[DEBUG] Cleanup useGlobalBattle');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('battle_update');
      socket.off('participants');
      socket.off('chat_message');
      socket.off('payout_result');
      socket.off('payout_success');
      socket.off('payout_error');
    };
  }, [user]); // Retiré currentBattle des dépendances pour éviter les reconnexions

  const placeBet = useCallback((teamId: string, amount: number, userAddress: string) => {
    if (!globalSocket) return;
    globalSocket.emit('place_bet', { teamId, amount, userAddress });
  }, []);

  // Remplace addChatMessage pour utiliser le format court
  const addChatMessage = useCallback((message: string, userAddress: string, type: string = 'system', extra?: any) => {
    if (!globalSocket) return;
    // Compose le message court si type connu
    let msg = message;
    if (['win','bet','system'].includes(type)) {
      msg = formatCombatMessage(type, { ...extra, user: userAddress, message });
    }
    globalSocket.emit('chat_message', { message: msg, userAddress, type });
  }, []);

  return {
    currentBattle,
    chatMessages,
    connectedUsers,
    connected,
    placeBet,
    addChatMessage
  };
};
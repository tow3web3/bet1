import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Battle, ChatMessage } from '../types';
import { useSolanaWallet } from './useSolanaWallet';

const SOCKET_URL = import.meta.env.PROD ? undefined : 'http://localhost:4000';

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
      // ex: 💎 4Mp...ffrq parie 0.1 SOL sur Aigles !
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
  const socketRef = useRef<Socket | null>(null);
  const { user } = useSolanaWallet();

  useEffect(() => {
    // Crée la connexion socket.io
    const socket = SOCKET_URL ? io(SOCKET_URL) : io();
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('battle_update', (payload) => {
      setCurrentBattle(payload ? {
        ...payload,
        startTime: payload.startTime ? new Date(payload.startTime) : undefined,
        endTime: payload.endTime ? new Date(payload.endTime) : undefined
      } : null);
      setChatMessages(payload?.chatMessages || []);
      setConnectedUsers(payload?.participants || 0);
    });
    socket.on('participants', (count) => setConnectedUsers(count));

    // Ajout : écoute des paiements de gains
    socket.on('payout_result', (data) => {
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

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const placeBet = useCallback((teamId: string, amount: number, userAddress: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('place_bet', { teamId, amount, userAddress });
  }, []);

  // Remplace addChatMessage pour utiliser le format court
  const addChatMessage = useCallback((message: string, userAddress: string, type: string = 'system', extra?: any) => {
    if (!socketRef.current) return;
    // Compose le message court si type connu
    let msg = message;
    if (['win','bet','system'].includes(type)) {
      msg = formatCombatMessage(type, { ...extra, user: userAddress, message });
    }
    socketRef.current.emit('chat_message', { message: msg, userAddress, type });
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
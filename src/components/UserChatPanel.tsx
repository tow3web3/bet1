import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useSolanaWallet } from '../hooks/useSolanaWallet';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.PROD ? 'https://bet1-oeah.onrender.com' : 'http://localhost:3001';

interface UserChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
}

const UserChatPanel: React.FC = () => {
  const { user } = useSolanaWallet();
  const [messages, setMessages] = useState<UserChatMessage[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('[USERCHAT] Tentative de connexion à:', SOCKET_URL);
    const socket = SOCKET_URL ? io(SOCKET_URL) : io();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[USERCHAT] ✅ Connecté au serveur');
    });
    socket.on('disconnect', () => {
      console.log('[USERCHAT] ❌ Déconnecté du serveur');
    });
    socket.on('connect_error', (error) => {
      console.error('[USERCHAT] ❌ Erreur de connexion:', error);
    });

    socket.on('user_chat_message', (msg: UserChatMessage) => {
      console.log('[USERCHAT] 💬 Message reçu:', msg);
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      console.log('[USERCHAT] 🔌 Déconnexion du socket');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !user || !user.fullAddress) return;
    const msg: UserChatMessage = {
      id: Date.now().toString(),
      user: user.fullAddress,
      message: input.trim(),
      timestamp: new Date().toISOString(),
    };
    socketRef.current.emit('user_chat_message', msg);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const getShortWallet = (address: string) => {
    return address && address.length > 8 ? `${address.slice(0,4)}...${address.slice(-4)}` : address;
  };

  return (
    <div className="fixed top-0 left-0 h-full w-72 bg-black/90 border-r border-green-400/40 shadow-neon-green z-40 flex flex-col font-mono">
      <div className="flex items-center space-x-2 p-2 border-b border-green-400/20 shadow-neon-green bg-black/80">
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded flex items-center justify-center shadow-neon-green">
          <MessageCircle className="w-4 h-4 text-green-200" />
        </div>
        <div>
          <h3 className="text-base font-bold text-green-300 drop-shadow-neon">Chat Utilisateurs</h3>
          <p className="text-green-500 text-xs">{messages.length} msg</p>
        </div>
      </div>
      <div className="h-0.5 bg-green-400/10" />
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-180px)]">
        {messages.length === 0 ? (
          <div className="text-center text-green-400/70 text-xs py-8">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p>Aucun message</p>
            <p className="text-xs mt-1">Discutez avec les autres joueurs !</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="p-2 rounded border border-green-400/20 bg-black/40">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-green-300 text-xs drop-shadow-neon">{getShortWallet(msg.user)}</span>
                <span className="text-2xs text-green-500/80">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-green-100 break-words font-mono">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="h-0.5 bg-green-400/10" />
      <div className="p-2 border-t border-green-400/20 bg-black/80">
        {user && user.fullAddress ? (
          <div className="flex space-x-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Votre message..."
              className="flex-1 bg-black/40 border border-green-400/30 rounded px-2 py-1 text-green-200 placeholder-green-500/60 focus:outline-none focus:ring-2 focus:ring-green-400 text-xs font-mono"
              maxLength={200}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-2 py-1 rounded shadow-neon-green transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-mono"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center text-green-400/70 text-xs">
            Connectez votre wallet pour discuter
          </div>
        )}
      </div>
    </div>
  );
};

export default UserChatPanel; 
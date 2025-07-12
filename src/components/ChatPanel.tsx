import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import { useSolanaWallet } from '../hooks/useSolanaWallet';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, userAddress: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage }) => {
  console.log('[DEBUG] ChatPanel render avec messages:', messages);
  
  const [inputMessage, setInputMessage] = useState('');
  const { user } = useSolanaWallet();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.closest('.overflow-y-auto');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (inputMessage.trim() && user) {
      onSendMessage(inputMessage.trim(), user.address);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'system':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-200';
      case 'bet':
        return 'bg-green-500/20 border-green-500/30 text-green-200';
      case 'win':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200';
      case 'message':
        return 'bg-purple-500/20 border-purple-500/30 text-purple-200';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-200';
    }
  };

  // Afficher tous les messages, pas seulement system/bet/win
  const displayMessages = messages.filter(m => ['system','bet','win','message'].includes(m.type));

  return (
    <div className="bg-black/90 rounded-xl border border-blue-400/30 shadow-neon-blue flex flex-col h-full font-mono">
      {/* Header */}
      <div className="flex items-center space-x-2 p-2 border-b border-blue-400/20 shadow-neon-blue bg-black/80">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded flex items-center justify-center shadow-neon-blue">
          <MessageCircle className="w-4 h-4 text-blue-200" />
        </div>
        <div>
          <h3 className="text-base font-bold text-blue-300 drop-shadow-neon">Journal du Combat</h3>
          <p className="text-blue-500 text-xs">{displayMessages.length} messages</p>
        </div>
      </div>
      <div className="h-0.5 bg-blue-400/10" />
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-48 chat-container">
        {displayMessages.length === 0 ? (
          <div className="text-center text-blue-300/70 text-xs py-8">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p>Aucun message</p>
            <p className="text-xs mt-1">Les messages s'afficheront ici</p>
          </div>
        ) : (
          <>
            {displayMessages.map((message) => (
          <div
            key={message.id}
                className={`p-2 rounded border ${getMessageStyle(message.type)} text-xs font-mono`}
          >
            <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-blue-300 drop-shadow-neon">{message.user && message.user.length > 8 ? `${message.user.slice(0,4)}...${message.user.slice(-4)}` : message.user}</span>
                  <span className="text-2xs text-blue-500/80">
                    {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
                <p className="text-xs">{message.message}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
};
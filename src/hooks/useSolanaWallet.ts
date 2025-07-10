import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  Keypair
} from '@solana/web3.js';
import bs58 from 'bs58';
import { User } from '../types';
import { securePayout } from '../services/securePayout';

// Adresse publique du pool (doit correspondre à celle du backend)
const POOL_WALLET = new PublicKey('4MpnddXrsYGzCv6GBe6y39DWLpixqiTjW5nEpbaXffrq');

export const useSolanaWallet = () => {
  const { publicKey, connected, disconnect, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger les données utilisateur quand le wallet se connecte
  useEffect(() => {
    if (connected && publicKey) {
      loadUserData();
    } else {
      setUser(null);
    }
  }, [connected, publicKey]);

  const loadUserData = async () => {
    if (!publicKey) return;

    try {
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;

      // Charger les stats utilisateur depuis localStorage
      const userStats = localStorage.getItem(`user_${publicKey.toString()}`);
      const stats = userStats ? JSON.parse(userStats) : {
        totalWins: 0,
        totalLosses: 0,
        totalBets: 0,
        totalWinnings: 0
      };

      setUser({
        address: `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
        fullAddress: publicKey.toString(),
        balance: solBalance,
        connected: true,
        ...stats
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    }
  };

  const placeBet = async (teamId: string, amount: number): Promise<boolean> => {
    if (!publicKey || !signTransaction || !user) {
      console.error('Wallet non connecté');
      return false;
    }

    if (user.balance < amount) {
      console.error('Solde insuffisant');
      return false;
    }

    setLoading(true);

    try {
      // Créer la transaction pour envoyer SOL au pool
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: POOL_WALLET,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      // Obtenir le blockhash récent
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Signer et envoyer la transaction
      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Attendre la confirmation
      await connection.confirmTransaction(signature);

      // Mettre à jour le solde et les stats utilisateur
      const newStats = {
        ...user,
        balance: user.balance - amount,
        totalBets: user.totalBets + 1
      };

      setUser(newStats);
      
      // Sauvegarder dans localStorage
      localStorage.setItem(`user_${publicKey.toString()}`, JSON.stringify({
        totalWins: newStats.totalWins,
        totalLosses: newStats.totalLosses,
        totalBets: newStats.totalBets,
        totalWinnings: newStats.totalWinnings || 0
      }));

      console.log('Pari placé avec succès:', signature);
      return true;

    } catch (error) {
      console.error('Erreur lors du placement du pari:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendWinnings = async (winnerAddress: string, amount: number): Promise<boolean> => {
    try {
      // Utilise le service sécurisé pour envoyer les gains
      await securePayout(winnerAddress, amount);
      console.log('Gains envoyés avec succès via securePayout');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi des gains:', error);
      return false;
    }
  };

  const updateUserStats = useCallback((won: boolean, payout?: number) => {
    if (!user || !publicKey) return;

    const newStats = {
      ...user,
      totalWins: won ? user.totalWins + 1 : user.totalWins,
      totalLosses: won ? user.totalLosses : user.totalLosses + 1,
      balance: won && payout ? user.balance + payout : user.balance,
      totalWinnings: (user.totalWinnings || 0) + (won && payout ? payout : 0)
    };

    setUser(newStats);
    
    localStorage.setItem(`user_${publicKey.toString()}`, JSON.stringify({
      totalWins: newStats.totalWins,
      totalLosses: newStats.totalLosses,
      totalBets: newStats.totalBets,
      totalWinnings: newStats.totalWinnings
    }));
  }, [user, publicKey]);

  const disconnectWallet = () => {
    disconnect();
    setUser(null);
  };

  return {
    user,
    loading,
    connected,
    publicKey,
    placeBet,
    sendWinnings,
    disconnectWallet,
    updateUserStats,
    refreshBalance: loadUserData
  };
};
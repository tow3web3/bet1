console.log("=== [BOOT] server.cjs: démarrage du backend ===");
try {
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const payoutApi = require('./src/services/payoutApi');

const app = express();
const httpServer = createServer(app);

// État global de la bataille
let currentBattle = {
  id: 'battle_1',
  status: 'waiting',
  startTime: new Date(Date.now() + 30000), // Commence dans 30 secondes
  endTime: new Date(Date.now() + 90000), // Dure 1 minute
  teams: [
    { id: 'team1', name: 'Aigles', avatar: '🦅', bets: 0, totalAmount: 0 },
    { id: 'team2', name: 'Lions', avatar: '🦁', bets: 0, totalAmount: 0 }
  ],
  totalPool: 0,
  participants: 0,
  winner: null,
  chatMessages: [],
  bets: [] // Ajout : liste des paris
};

// Historique global des batailles (en mémoire)
let globalBattleHistory = [];

// Leaderboard global des gains (en mémoire)
let leaderboard = {};

// Lucky Pool, Luck Scores, Referrals
let luckyPool = 0;
let luckScores = {};
let referrals = {}; // { filleul: parrain }
const DEAD_WALLET = '11111111111111111111111111111111'; // Burn address
const RAKE_WALLET = '2CmsC5trSZD6sEhgVwc5Z66scUp2GQfgsvmVZcDqz4sM';

// Stockage du dernier gagnant Lucky Pool
let lastLuckyWinner = null;
let lastLuckyAmount = 0;

// Ajout d'un suivi du nombre de parties jouées par chaque wallet (pour la sécurité du parrainage)
let userGamesPlayed = {};

// Fonction pour démarrer une nouvelle bataille
function startNewBattle() {
  // Conserver les 30 derniers messages du chat précédent
  const previousMessages = currentBattle.chatMessages ? currentBattle.chatMessages.slice(-30) : [];
  currentBattle = {
    id: `battle_${Date.now()}`,
    status: 'waiting',
    startTime: new Date(Date.now() + 30000),
    endTime: new Date(Date.now() + 90000),
    teams: [
      { id: 'team1', name: 'Aigles', avatar: '🦅', bets: 0, totalAmount: 0 },
      { id: 'team2', name: 'Lions', avatar: '🦁', bets: 0, totalAmount: 0 }
    ],
    totalPool: 0,
    participants: 0,
    winner: null,
    chatMessages: previousMessages, // On garde les derniers messages
    bets: [] // Reset des paris pour le nouveau combat
  };
  
  // Broadcast la nouvelle bataille
  io.emit('battle_update', currentBattle);
  
  // Démarrer la bataille après 30 secondes
  setTimeout(() => {
    currentBattle.status = 'active';
    
    // Ajouter un message système
    const startMessage = {
      id: Date.now().toString(),
      user: 'System',
      message: '🏆 COMBAT COMMENCE ! Placez vos paris !',
      timestamp: new Date(),
      type: 'system'
    };
    currentBattle.chatMessages.push(startMessage);
    
    io.emit('battle_update', currentBattle);
    io.emit('chat_message', startMessage);
    
    // Terminer la bataille après 1 minute
    setTimeout(() => {
      currentBattle.status = 'finished';
      currentBattle.winner = Math.random() > 0.5 ? 'team1' : 'team2';
      
      // Trouver l'équipe gagnante
      const winnerTeam = currentBattle.teams.find(t => t.id === currentBattle.winner);
      
      // Ajouter un message de victoire
      const winMessage = {
        id: Date.now().toString(),
        user: 'System',
        message: `🏆 ${winnerTeam?.name} GAGNE ! Payout automatique en cours...`,
        timestamp: new Date(),
        type: 'win'
      };
      currentBattle.chatMessages.push(winMessage);
      
      io.emit('battle_update', currentBattle);
      io.emit('chat_message', winMessage);

      // Payout équitable à tous les gagnants (version async/await + logs)
      const feePercent = 0.05;
      const feeAmount = currentBattle.totalPool * feePercent;
      const distributablePool = currentBattle.totalPool - feeAmount;
      const feeWallet = '2CmsC5trSZD6sEhgVwc5Z66scUp2GQfgsvmVZcDqz4sM';
      console.log(`[PAYOUT] Frais prélevés : ${feeAmount.toFixed(4)} SOL (5%)`);
      const feeMsg = {
        id: Date.now().toString(),
        user: 'System',
        message: `💰 Frais prélevés sur le pool : ${feeAmount.toFixed(4)} SOL (5%)`,
        timestamp: new Date(),
        type: 'system'
      };
      currentBattle.chatMessages.push(feeMsg);
      io.emit('chat_message', feeMsg);
      // Envoi des frais au wallet propriétaire
      (async () => {
        try {
          console.log(`[PAYOUT] Envoi des frais à ${feeWallet} pour ${feeAmount} SOL`);
          const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/payout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.PAYOUT_API_KEY || '28082306Ab.'
            },
            body: JSON.stringify({
              to: feeWallet,
              amount: feeAmount
            })
          });
          const result = await response.json();
          if (result.success) {
            const msg = {
              id: Date.now().toString(),
              user: 'System',
              message: `✅ Frais envoyés au propriétaire : ${feeAmount.toFixed(4)} SOL (tx: ${result.signature.slice(0,5)}...${result.signature.slice(-4)})`,
              timestamp: new Date(),
              type: 'system'
            };
            currentBattle.chatMessages.push(msg);
            io.emit('chat_message', msg);
            console.log(`[PAYOUT] Frais envoyés avec succès à ${feeWallet}`);
          } else {
            const msg = {
              id: Date.now().toString(),
              user: 'System',
              message: `❌ Erreur lors de l'envoi des frais : ${result.error}`,
              timestamp: new Date(),
              type: 'system'
            };
            currentBattle.chatMessages.push(msg);
            io.emit('chat_message', msg);
            console.error(`[PAYOUT] Erreur lors de l'envoi des frais : ${result.error}`);
          }
        } catch (error) {
          const msg = {
            id: Date.now().toString(),
            user: 'System',
            message: `❌ Erreur réseau lors de l'envoi des frais : ${error.message}`,
            timestamp: new Date(),
            type: 'system'
          };
          currentBattle.chatMessages.push(msg);
          io.emit('chat_message', msg);
          console.error(`[PAYOUT] Erreur réseau lors de l'envoi des frais :`, error);
        }
      })();

      // PAYOUT DES GAGNANTS - Distribuer les gains aux utilisateurs qui ont parié sur l'équipe gagnante
      console.log(`[PAYOUT] Début du payout des gagnants. Pool distributable: ${distributablePool.toFixed(4)} SOL`);
      
      // Trouver tous les paris sur l'équipe gagnante
      const winningBets = currentBattle.bets.filter(bet => bet.teamId === currentBattle.winner);
      console.log(`[PAYOUT] ${winningBets.length} paris gagnants trouvés:`, winningBets);
      
      if (winningBets.length > 0 && distributablePool > 0) {
        // Calculer le montant par gagnant (distribution équitable)
        const amountPerWinner = distributablePool / winningBets.length;
        console.log(`[PAYOUT] Montant par gagnant: ${amountPerWinner.toFixed(4)} SOL`);

        // Débiter la Lucky Pool du montant total payé aux gagnants
        const totalPayout = amountPerWinner * winningBets.length;
        luckyPool = Math.max(0, luckyPool - totalPayout);

        // Envoyer les gains à chaque gagnant
        winningBets.forEach(async (bet, index) => {
          try {
            console.log(`[PAYOUT] Envoi ${amountPerWinner.toFixed(4)} SOL à ${bet.userAddress}`);
            const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/payout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.PAYOUT_API_KEY || '28082306Ab.'
              },
              body: JSON.stringify({
                to: bet.userAddress,
                amount: amountPerWinner
              })
            });
            const result = await response.json();
            
            if (result.success) {
              // Mettre à jour le leaderboard
              if (!leaderboard[bet.userAddress]) {
                leaderboard[bet.userAddress] = 0;
              }
              leaderboard[bet.userAddress] += amountPerWinner;
              
              const msg = {
                id: Date.now().toString(),
                user: 'System',
                message: `🎉 ${bet.userAddress.slice(0,4)}...${bet.userAddress.slice(-4)} gagne ${amountPerWinner.toFixed(4)} SOL ! (tx: ${result.signature.slice(0,5)}...${result.signature.slice(-4)})`,
                timestamp: new Date(),
                type: 'win'
              };
              currentBattle.chatMessages.push(msg);
              io.emit('chat_message', msg);
              console.log(`[PAYOUT] Gain envoyé avec succès à ${bet.userAddress}`);
            } else {
              const msg = {
                id: Date.now().toString(),
                user: 'System',
                message: `❌ Erreur payout ${bet.userAddress.slice(0,4)}...${bet.userAddress.slice(-4)}: ${result.error}`,
                timestamp: new Date(),
                type: 'system'
              };
              currentBattle.chatMessages.push(msg);
              io.emit('chat_message', msg);
              console.error(`[PAYOUT] Erreur lors de l'envoi du gain à ${bet.userAddress}:`, result.error);
            }
          } catch (error) {
            const msg = {
              id: Date.now().toString(),
              user: 'System',
              message: `❌ Erreur réseau payout ${bet.userAddress.slice(0,4)}...${bet.userAddress.slice(-4)}: ${error.message}`,
              timestamp: new Date(),
              type: 'system'
            };
            currentBattle.chatMessages.push(msg);
            io.emit('chat_message', msg);
            console.error(`[PAYOUT] Erreur réseau lors de l'envoi du gain à ${bet.userAddress}:`, error);
          }
        });
      } else {
        const msg = {
          id: Date.now().toString(),
          user: 'System',
          message: `💤 Aucun gagnant ou pool vide (${distributablePool.toFixed(4)} SOL)`,
          timestamp: new Date(),
          type: 'system'
        };
        currentBattle.chatMessages.push(msg);
        io.emit('chat_message', msg);
        console.log(`[PAYOUT] Aucun gagnant ou pool vide`);
      }

      // Sauvegarder une copie de la bataille terminée dans l'historique
      globalBattleHistory.unshift({ ...currentBattle });
      if (globalBattleHistory.length > 20) globalBattleHistory = globalBattleHistory.slice(0, 20);

      // Lucky Pool : tirage tous les 10 combats
      if (globalBattleHistory.length > 0 && globalBattleHistory.length % 10 === 0 && luckyPool > 0) {
        // Calculer les luck scores pondérés
        const playerLuck = {};
        globalBattleHistory.slice(0, 10).forEach(battle => {
          (battle.bets || []).forEach(bet => {
            const addr = bet.userAddress;
            // +1 par combat joué (déjà fait), +2 par défaite récente
            if (!playerLuck[addr]) playerLuck[addr] = 0;
            playerLuck[addr] += 1;
            if (bet.teamId !== battle.winner) playerLuck[addr] += 2;
          });
        });
        // Ajouter les bonus referral
        Object.entries(luckScores).forEach(([addr, score]) => {
          playerLuck[addr] = (playerLuck[addr] || 0) + score;
        });
        // Weighted random
        const entries = Object.entries(playerLuck).filter(([addr, score]) => score > 0);
        const totalLuck = entries.reduce((sum, [_, score]) => sum + score, 0);
        let r = Math.random() * totalLuck;
        let winner = null;
        for (const [addr, score] of entries) {
          if (r < score) { winner = addr; break; }
          r -= score;
        }
        if (winner) {
          // Payout Lucky Pool
          (async () => {
            try {
              const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/payout`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': process.env.PAYOUT_API_KEY || '28082306Ab.'
                },
                body: JSON.stringify({
                  to: winner,
                  amount: luckyPool
                })
              });
              const result = await response.json();
              if (result.success) {
                const msg = {
                  id: Date.now().toString(),
                  user: 'System',
                  message: `🎉 Wallet ${winner.slice(0,4)}...${winner.slice(-4)} just won the Lucky Pool of ${luckyPool.toFixed(2)} SOL! Keep playing to win the next one.`,
                  timestamp: new Date(),
                  type: 'system'
                };
                currentBattle.chatMessages.push(msg);
                io.emit('chat_message', msg);
                console.log(`[LUCKY POOL] ${winner} gagne ${luckyPool} SOL !`);
                lastLuckyWinner = winner;
                lastLuckyAmount = luckyPool;
                luckyPool = 0;
              } else {
                console.error('[LUCKY POOL] Erreur payout:', result.error);
              }
            } catch (e) {
              console.error('[LUCKY POOL] Erreur réseau:', e);
            }
          })();
        }
      }

      // Démarrer une nouvelle bataille après 10 secondes
      setTimeout(startNewBattle, 10000);
    }, 60000);
  }, 30000);
}

// Configuration Socket.IO avec CORS et polling forcé pour Render
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "https://bet1-oeah.onrender.com"],
    methods: ["GET", "POST"]
  },
  transports: ['polling', 'websocket'], // Forcer le polling en premier
  allowEIO3: true // Compatibilité avec les anciennes versions
});

// Middleware CORS pour permettre les appels depuis le front-end
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
  credentials: true
}));

app.use(express.json());

// Utilise l'API payout sécurisée
app.use(payoutApi);

// Endpoint de santé pour tester le déploiement
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend API running',
    timestamp: new Date().toISOString(),
    socket: 'Socket.IO ready'
  });
});

// Endpoint pour récupérer l'état de la bataille
app.get('/api/battle', (req, res) => {
  res.json(currentBattle);
});

// Endpoint pour l'historique global (retourne les 20 dernières batailles)
app.get('/api/history', (req, res) => {
  res.json(globalBattleHistory);
});

// Endpoint pour l'historique utilisateur (par wallet)
app.get('/api/user-history/:wallet', (req, res) => {
  const { wallet } = req.params;
  if (!wallet) return res.status(400).json({ error: 'Wallet manquant' });
  // On cherche dans l'historique global tous les paris de ce wallet
  const userHistory = globalBattleHistory.flatMap(battle => {
    // On cherche les bets de ce wallet pour cette bataille
    const bets = (battle.bets || []).filter(bet => bet.userAddress === wallet);
    if (bets.length === 0) return [];
    // Pour chaque bet, on construit une entrée d'historique
    return bets.map(bet => ({
      battleId: battle.id,
      date: battle.endTime || battle.startTime,
      team: bet.teamId,
      amount: bet.amount,
      winner: battle.winner,
      success: bet.teamId === battle.winner,
      gain: bet.teamId === battle.winner ? (battle.totalPool * 0.95) / (battle.bets.filter(b => b.teamId === battle.winner).length) : 0,
      perte: bet.teamId !== battle.winner ? bet.amount : 0,
      totalPool: battle.totalPool,
      participants: battle.participants,
      teams: battle.teams,
      tx: bet.tx || null // Si on a la tx dans le bet
    }));
  });
  res.json(userHistory);
});

// Endpoint pour le leaderboard global
app.get('/api/leaderboard', (req, res) => {
  // Transforme l'objet en tableau trié
  const sorted = Object.entries(leaderboard)
    .map(([wallet, totalGains]) => ({ wallet, totalGains }))
    .sort((a, b) => b.totalGains - a.totalGains);
  res.json(sorted);
});

// Endpoint pour placer un pari
app.post('/api/bet', async (req, res) => {
  const { teamId, amount, userAddress, ref } = req.body;
  console.log('[API/BET] Pari reçu :', { teamId, amount, userAddress, ref });
  
  if (!teamId || !amount || !userAddress) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  // --- Referral ---
  userGamesPlayed[userAddress] = (userGamesPlayed[userAddress] || 0) + 1;
  if (ref && ref !== userAddress && !referrals[userAddress]) {
    referrals[userAddress] = ref;
    // Filleul : +20 luck dès la première partie
    luckScores[userAddress] = (luckScores[userAddress] || 0) + 20;
    console.log(`[REFERRAL] ${ref} parraine ${userAddress} (+20 luck filleul)`);
  }
  // Parrain : +50 luck UNIQUEMENT si le filleul a joué 5 parties (et pas déjà crédité)
  if (referrals[userAddress]) {
    const parrain = referrals[userAddress];
    if (userGamesPlayed[userAddress] === 5 && !(userAddress + '_done' in referrals)) {
      luckScores[parrain] = (luckScores[parrain] || 0) + 50;
      referrals[userAddress + '_done'] = true; // Marque comme crédité
      console.log(`[REFERRAL] ${parrain} reçoit +50 luck car ${userAddress} a joué 5 parties !`);
    }
  }

  // --- Taxe 15% ---
  const burnAmount = amount * 0.05;
  const rakeAmount = amount * 0.05;
  const luckyAmount = amount * 0.05;
  const betAmount = amount * 0.85;

  // Les 5% burn vont dans la Lucky Pool (plus de burn vers le dead wallet)
  luckyPool += burnAmount + luckyAmount;
  // Envoyer le rake (simulé)
  setTimeout(() => {
    console.log(`[RAKE] ${rakeAmount.toFixed(4)} SOL envoyés à ${RAKE_WALLET}`);
  }, 0);

  // Mettre à jour les stats de l'équipe
  const team = currentBattle.teams.find(t => t.id === teamId);
  if (team) {
    team.bets += 1;
    team.totalAmount += betAmount;
    currentBattle.totalPool += betAmount;
    currentBattle.participants = io.engine.clientsCount;
    
    // Ajouter le pari à la liste des bets
    currentBattle.bets.push({ teamId, amount: betAmount, userAddress });
    console.log('[API/BET] Paris enregistrés après ajout :', JSON.stringify(currentBattle.bets, null, 2));

    // Luck score : +1 combat joué
    luckScores[userAddress] = (luckScores[userAddress] || 0) + 1;

    // Ajouter un message de chat pour le pari
    const betMessage = {
      id: Date.now().toString(),
      user: userAddress ? `${userAddress.slice(0,4)}...${userAddress.slice(-4)}` : 'Anonyme',
      message: `💎 Pari ${betAmount} SOL sur ${team.name} (15% taxe: 5% burn, 5% rake, 5% Lucky Pool)` ,
      timestamp: new Date(),
      type: 'bet'
    };
    currentBattle.chatMessages.push(betMessage);
    
    // Broadcast la mise à jour
    io.emit('battle_update', currentBattle);
    io.emit('chat_message', betMessage);
    
    res.json({ success: true, message: 'Pari placé avec succès' });
  } else {
    res.status(400).json({ error: 'Équipe non trouvée' });
  }
});

// Nouvelle route API Lucky Pool
app.get('/api/lucky-pool', (req, res) => {
  res.json({ pool: luckyPool, lastWinner: lastLuckyWinner, lastAmount: lastLuckyAmount });
});

// Serve static files from the dist directory (frontend) - APRÈS les routes API
app.use(express.static('dist'));

// Serve the frontend for all non-API routes (doit être en dernier)
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'dist' });
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);

  // Envoyer l'état actuel de la bataille au nouveau client
  socket.emit('battle_update', currentBattle);
  
  // Mettre à jour le nombre de participants
  currentBattle.participants = io.engine.clientsCount;
  io.emit('participants', currentBattle.participants);
  
  // Envoyer les messages de chat existants
  if (currentBattle.chatMessages.length > 0) {
    socket.emit('chat_messages', currentBattle.chatMessages);
  }

  // Envoyer les messages de chat utilisateur existants
  const userMessages = currentBattle.chatMessages.filter(msg => msg.type === 'user');
  if (userMessages.length > 0) {
    socket.emit('user_chat_messages', userMessages);
  }

  // Gestion des batailles globales
  socket.on('place_bet', (data) => {
    console.log('[SOCKET/BET] Pari reçu via socket.io :', data);
    currentBattle.bets.push({ teamId: data.teamId, amount: data.amount, userAddress: data.userAddress });
    console.log('[SOCKET/BET] Paris enregistrés après ajout (socket.io) :', JSON.stringify(currentBattle.bets, null, 2));
    
    // Mettre à jour les stats de l'équipe
    const team = currentBattle.teams.find(t => t.id === data.teamId);
    if (team) {
      team.bets += 1;
      team.totalAmount += data.amount;
      currentBattle.totalPool += data.amount;
      currentBattle.participants = io.engine.clientsCount;
      
      // Ajouter un message de chat pour le pari
      const betMessage = {
        id: Date.now().toString(),
        user: data.userAddress ? `${data.userAddress.slice(0,4)}...${data.userAddress.slice(-4)}` : 'Anonyme',
        message: `💎 Pari ${data.amount} SOL sur ${team.name}`,
        timestamp: new Date(),
        type: 'bet'
      };
      currentBattle.chatMessages.push(betMessage);
      
      // Broadcast la mise à jour
      io.emit('battle_update', currentBattle);
      io.emit('chat_message', betMessage);
    }
  });

  // Gestion des messages de chat utilisateur
  socket.on('user_chat_message', (msg) => {
    console.log('[SOCKET/USERCHAT] Message utilisateur reçu :', msg);
    
    // Valider le message
    if (!msg.user || !msg.message || !msg.message.trim()) {
      console.log('[SOCKET/USERCHAT] Message invalide ignoré');
      return;
    }
    
    // Créer le message formaté
    const userMessage = {
      id: Date.now().toString(),
      user: msg.user,
      message: msg.message.trim(),
      timestamp: new Date().toISOString(),
      type: 'user'
    };
    
    // Ajouter au chat global (optionnel)
    currentBattle.chatMessages.push(userMessage);
    
    // Diffuser à tous les clients
    io.emit('user_chat_message', userMessage);
    console.log('[SOCKET/USERCHAT] Message diffusé à tous les clients');
  });
});

console.log("=== [BOOT] Lancement du serveur HTTP sur le port", process.env.PORT || 3001);
httpServer.listen(process.env.PORT || 3001, () => {
  console.log(`Serveur HTTP démarré sur le port ${process.env.PORT || 3001}`);
  // Démarrer le premier combat
  console.log("=== [BOOT] Démarrage du premier combat");
  startNewBattle();
});

} catch (err) {
  console.error("=== [CRASH] Erreur critique au démarrage du backend ===");
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
}
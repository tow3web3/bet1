// Log de démarrage explicite
console.log('=== Démarrage du serveur Node.js (server.js) ===');

require('dotenv').config();
console.log('dotenv OK');
const express = require('express');
console.log('express OK');
const cors = require('cors');
console.log('cors OK');
const { createServer } = require('http');
console.log('http OK');
const { Server } = require('socket.io');
console.log('socket.io OK');
const payoutApi = require('./src/services/payoutApi');
console.log('payoutApi OK');

// Vérification explicite de la clé privée pool
try {
  const POOL_PRIVATE_KEY_STRING = process.env.POOL_PRIVATE_KEY;
  if (!POOL_PRIVATE_KEY_STRING) {
    throw new Error('POOL_PRIVATE_KEY non définie dans les variables d\'environnement');
  }
  // Test de parsing
  const POOL_PRIVATE_KEY = Uint8Array.from(JSON.parse(POOL_PRIVATE_KEY_STRING));
  if (!POOL_PRIVATE_KEY || POOL_PRIVATE_KEY.length < 32) {
    throw new Error('POOL_PRIVATE_KEY mal formatée ou trop courte');
  }
  console.log('POOL_PRIVATE_KEY chargée et formatée correctement.');
} catch (err) {
  console.error('ERREUR INIT WALLET POOL:', err);
  process.exit(1);
}

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

      // Sauvegarder une copie de la bataille terminée dans l'historique
      globalBattleHistory.unshift({ ...currentBattle });
      if (globalBattleHistory.length > 20) globalBattleHistory = globalBattleHistory.slice(0, 20);

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

// Endpoint pour le leaderboard global
app.get('/api/leaderboard', (req, res) => {
  // Transforme l'objet en tableau trié
  const sorted = Object.entries(leaderboard)
    .map(([wallet, totalGains]) => ({ wallet, totalGains }))
    .sort((a, b) => b.totalGains - a.totalGains);
  res.json(sorted);
});

// Endpoint pour placer un pari
app.post('/api/bet', (req, res) => {
  const { teamId, amount, userAddress } = req.body;
  console.log('[API/BET] Pari reçu :', { teamId, amount, userAddress });
  
  if (!teamId || !amount || !userAddress) {
    return res.status(400).json({ error: 'Données manquantes' });
  }
  
  // Mettre à jour les stats de l'équipe
  const team = currentBattle.teams.find(t => t.id === teamId);
  if (team) {
    team.bets += 1;
    team.totalAmount += amount;
    currentBattle.totalPool += amount;
    currentBattle.participants = io.engine.clientsCount;
    
    // Ajouter le pari à la liste des bets
    currentBattle.bets.push({ teamId, amount, userAddress });
    console.log('[API/BET] Paris enregistrés après ajout :', JSON.stringify(currentBattle.bets, null, 2));

    // Ajouter un message de chat pour le pari
    const betMessage = {
      id: Date.now().toString(),
      user: userAddress ? `${userAddress.slice(0,4)}...${userAddress.slice(-4)}` : 'Anonyme',
      message: `💎 Pari ${amount} SOL sur ${team.name}`,
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
});
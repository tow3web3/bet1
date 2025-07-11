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
  chatMessages: []
};

// Fonction pour démarrer une nouvelle bataille
function startNewBattle() {
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
    chatMessages: []
  };
  
  // Broadcast la nouvelle bataille
  io.emit('battle_update', currentBattle);
  
  // Démarrer la bataille après 30 secondes
  setTimeout(() => {
    currentBattle.status = 'active';
    io.emit('battle_update', currentBattle);
    
    // Terminer la bataille après 1 minute
    setTimeout(() => {
      currentBattle.status = 'finished';
      currentBattle.winner = Math.random() > 0.5 ? 'team1' : 'team2';
      io.emit('battle_update', currentBattle);
      
      // Démarrer une nouvelle bataille après 10 secondes
      setTimeout(startNewBattle, 10000);
    }, 60000);
  }, 30000);
}

// Configuration Socket.IO avec CORS
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "https://bet1-oeah.onrender.com"],
    methods: ["GET", "POST"]
  }
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

// Serve static files from the dist directory (frontend)
app.use(express.static('dist'));

// Serve the frontend for all non-API routes
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

  // Gestion des batailles globales
  socket.on('place_bet', (data) => {
    console.log('Pari placé:', data);
    
    // Mettre à jour les stats de l'équipe
    const team = currentBattle.teams.find(t => t.id === data.teamId);
    if (team) {
      team.bets += 1;
      team.totalAmount += data.amount;
      currentBattle.totalPool += data.amount;
      currentBattle.participants = io.engine.clientsCount;
      
      // Broadcast la mise à jour
      io.emit('battle_update', currentBattle);
    }
    
    // Broadcast à tous les clients
    io.emit('bet_placed', data);
  });

  // Gestion des messages de chat
  socket.on('chat_message', (data) => {
    console.log('Message chat:', data);
    // Broadcast à tous les clients
    io.emit('chat_message', {
      id: Date.now().toString(),
      user: data.userAddress ? `${data.userAddress.slice(0,4)}...${data.userAddress.slice(-4)}` : 'Anonyme',
      message: data.message,
      timestamp: new Date(),
      type: data.type || 'system'
    });
  });

  // Event pour déclencher un payout automatique
  socket.on('trigger_payout', async (data) => {
    try {
      const { winnerAddress, amount } = data;
      
      // Appelle l'API payout
      const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '28082306Ab.'
        },
        body: JSON.stringify({
          to: winnerAddress,
          amount: amount
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Payout automatique réussi:', result.signature);
        // Notifie le front-end du succès
        socket.emit('payout_success', {
          winnerAddress,
          amount,
          signature: result.signature
        });
      } else {
        console.error('Erreur payout automatique:', result.error);
        socket.emit('payout_error', result.error);
      }
    } catch (error) {
      console.error('Erreur payout automatique:', error);
      socket.emit('payout_error', error.message);
    }
  });

  // Event pour déclencher un payout automatique quand une bataille se termine
  socket.on('battle_ended', async (data) => {
    try {
      const { winnerAddress, amount, battleId } = data;
      console.log(`🏆 Bataille ${battleId} terminée, payout automatique pour ${winnerAddress}: ${amount} SOL`);
      
      // Appelle l'API payout
      const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '28082306Ab.'
        },
        body: JSON.stringify({
          to: winnerAddress,
          amount: amount
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Payout automatique réussi:', result.signature);
        // Notifie TOUS les clients du succès
        io.emit('payout_success', {
          winnerAddress,
          amount,
          signature: result.signature,
          battleId
        });
      } else {
        console.error('❌ Erreur payout automatique:', result.error);
        io.emit('payout_error', result.error);
      }
    } catch (error) {
      console.error('❌ Erreur payout automatique:', error);
      io.emit('payout_error', error.message);
    }
  });

  // Event pour déclencher un payout automatique quand une bataille se termine (version alternative)
  socket.on('battle_finished', async (data) => {
    try {
      const { winnerAddress, amount, battleId, winnerName } = data;
      console.log(`🏆 Bataille ${battleId} terminée, ${winnerName} gagne ${amount} SOL!`);
      
      // Appelle l'API payout automatiquement
      const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '28082306Ab.'
        },
        body: JSON.stringify({
          to: winnerAddress,
          amount: amount
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Payout automatique réussi:', result.signature);
        // Notifie TOUS les clients du succès avec un message formaté
        const successMessage = `🏆 ${winnerName} a gagné ${amount.toFixed(4)} SOL! (Payout automatique: ${result.signature.slice(0,5)}...${result.signature.slice(-4)})`;
        io.emit('payout_success', {
          winnerAddress,
          amount,
          signature: result.signature,
          battleId,
          message: successMessage
        });
      } else {
        console.error('❌ Erreur payout automatique:', result.error);
        const errorMessage = `❌ Erreur payout automatique: ${result.error}`;
        io.emit('payout_error', errorMessage);
      }
    } catch (error) {
      console.error('❌ Erreur payout automatique:', error);
      const errorMessage = `❌ Erreur payout automatique: ${error.message}`;
      io.emit('payout_error', errorMessage);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Gestion d'erreur globale
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Erreur serveur inattendue' });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Backend payout API running on port ${PORT}`);
  
  // Démarrer la première bataille
  startNewBattle();
}); 
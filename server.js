require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const payoutApi = require('./src/services/payoutApi');

const app = express();
const httpServer = createServer(app);

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

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);

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
}); 
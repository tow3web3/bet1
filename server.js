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
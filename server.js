require('dotenv').config();
const express = require('express');
const cors = require('cors');
const payoutApi = require('./src/services/payoutApi');

const app = express();

// Middleware CORS pour permettre les appels depuis le front-end
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
  credentials: true
}));

app.use(express.json());

// Utilise l'API payout sécurisée
app.use(payoutApi);

// Gestion d'erreur globale
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Erreur serveur inattendue' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend payout API running on port ${PORT}`);
}); 
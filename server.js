require('dotenv').config();
const express = require('express');
const payoutApi = require('./src/services/payoutApi');

const app = express();
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
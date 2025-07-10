const express = require('express');
const { securePayout } = require('./securePayout');

const router = express.Router();

// Middleware simple d'authentification (à améliorer en prod)
function checkApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.PAYOUT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Endpoint sécurisé pour effectuer un payout
router.post('/payout', checkApiKey, async (req, res) => {
  const { to, amount } = req.body;
  if (!to || !amount || typeof to !== 'string' || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Paramètres invalides' });
  }
  try {
    const signature = await securePayout(to, amount);
    res.json({ success: true, signature });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
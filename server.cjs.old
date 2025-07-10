// Backend Node.js pour combat global synchronisé
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = require('@solana/web3.js');
require('dotenv').config();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// --- Solana Pool Wallet ---
// Sécurité: La clé privée est maintenant dans les variables d'environnement
const POOL_PRIVATE_KEY_STRING = process.env.POOL_PRIVATE_KEY;

let POOL_KEYPAIR;

// Par défaut, créer un nouveau wallet propre pour éviter les problèmes de données
if (!POOL_PRIVATE_KEY_STRING || process.env.USE_CLEAN_POOL_WALLET === 'true') {
  console.log('🔄 Création d\'un nouveau wallet de pool propre...');
  POOL_KEYPAIR = Keypair.generate();
  console.log('📝 Nouvelle clé privée du pool (à sauvegarder dans .env):', JSON.stringify(Array.from(POOL_KEYPAIR.secretKey)));
  console.log('🔑 Adresse publique du pool:', POOL_KEYPAIR.publicKey.toString());
  console.log('⚠️  IMPORTANT: Sauvegardez cette clé privée et ajoutez du SOL à ce wallet!');
} else {
  try {
    // Convertir la clé privée depuis base58
    const privateKeyArray = JSON.parse(POOL_PRIVATE_KEY_STRING);
    POOL_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
  } catch (error) {
    console.error('❌ ERREUR: Format de clé privée invalide');
    console.error('La clé privée doit être un tableau JSON de 64 entiers');
    process.exit(1);
  }
}

const POOL_WALLET = POOL_KEYPAIR.publicKey;

// Wallet de secours temporaire pour les paiements
let BACKUP_KEYPAIR = null;
const BACKUP_PRIVATE_KEY_STRING = process.env.BACKUP_PRIVATE_KEY;
if (BACKUP_PRIVATE_KEY_STRING) {
  try {
    const backupKeyArray = JSON.parse(BACKUP_PRIVATE_KEY_STRING);
    BACKUP_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(backupKeyArray));
    console.log('🔄 Wallet de secours configuré:', BACKUP_KEYPAIR.publicKey.toString());
  } catch (error) {
    console.error('❌ Erreur: Format de clé privée de secours invalide');
  }
}

const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC, 'confirmed');

console.log('🔐 Pool wallet sécurisé configuré:', POOL_WALLET.toString());
console.log('🌐 Connexion Solana:', SOLANA_RPC);
console.log('⚠️  NOTE: Les payouts se font manuellement pour éviter de corrompre le wallet');

// --- Etat du combat global ---
let battleState = null;
let chatMessages = [];
let participants = 0;
let battleHistory = [];
let userChatMessages = [];

const teamConfigs = [
  [
    { name: 'Dragons de Feu', color: 'from-red-500 to-orange-500', avatar: '🔥' },
    { name: 'Loups de Glace', color: 'from-blue-500 to-cyan-500', avatar: '❄️' }
  ],
  [
    { name: 'Faucons Électriques', color: 'from-yellow-500 to-orange-500', avatar: '⚡' },
    { name: 'Panthères Sombres', color: 'from-purple-500 to-pink-500', avatar: '🐾' }
  ],
  [
    { name: 'Aigles de Tempête', color: 'from-cyan-500 to-blue-500', avatar: '🦅' },
    { name: 'Titans de Terre', color: 'from-green-500 to-emerald-500', avatar: '🗿' }
  ],
  [
    { name: 'Serpents du Vide', color: 'from-purple-600 to-indigo-600', avatar: '🐍' },
    { name: 'Phénix Solaire', color: 'from-orange-500 to-red-500', avatar: '🔆' }
  ],
  [
    { name: 'Requins Cosmiques', color: 'from-indigo-500 to-purple-500', avatar: '🦈' },
    { name: 'Lions Dorés', color: 'from-yellow-400 to-orange-400', avatar: '🦁' }
  ]
];
let battleSequence = 0;

function createNewBattle() {
  const configIndex = battleSequence % teamConfigs.length;
  const teams = teamConfigs[configIndex];
  battleSequence++;
  return {
    id: `battle_${Date.now()}`,
    teams: [
      { ...teams[0], id: 'team1', bets: 0, totalAmount: 0, bettors: [] },
      { ...teams[1], id: 'team2', bets: 0, totalAmount: 0, bettors: [] }
    ],
    status: 'waiting',
    startTime: Date.now() + 15000, // commence dans 15s
    totalPool: 0,
    participants: 0
  };
}

function startBattle() {
  if (!battleState) return;
  battleState.status = 'active';
  battleState.startTime = Date.now();
  io.emit('battle_update', getBattlePayload());
}

async function endBattle() {
  if (!battleState) return;
  // Gagnant aléatoire avec pondération
  const t1 = Math.max(1, battleState.teams[0].bets);
  const t2 = Math.max(1, battleState.teams[1].bets);
  const total = t1 + t2;
  const winnerIndex = Math.random() * total < t1 ? 0 : 1;
  battleState.status = 'finished';
  battleState.winner = battleState.teams[winnerIndex].id;
  battleState.endTime = Date.now();
  io.emit('battle_update', getBattlePayload());

  // Distribution des gains (SANS payout automatique pour éviter de corrompre le wallet)
  const winnerTeam = battleState.teams[winnerIndex];
  const payout = winnerTeam.bets > 0 ? battleState.totalPool / winnerTeam.bets : 0;
  console.log(`🏆 Équipe gagnante: ${winnerTeam.name} avec ${winnerTeam.bets} paris`);
  console.log(`💰 Pool total: ${battleState.totalPool} SOL, Paiement par gagnant: ${payout.toFixed(4)} SOL`);
  console.log(`�� Gagnants: ${winnerTeam.bettors.join(', ')}`);
  
  // Au lieu de faire des payouts automatiques, on enregistre juste les gains
  if (payout > 0 && winnerTeam.bettors.length > 0) {
    for (const bettor of winnerTeam.bettors) {
      const msg = `🏆 ${bettor} a gagné ${payout.toFixed(4)} SOL! (Paiement manuel requis)`;
      console.log(msg);
      chatMessages.push({
        id: Date.now().toString(),
        user: 'System',
        message: msg,
        timestamp: new Date(),
        type: 'win'
      });
      // Notifier le frontend sans faire de transaction
      io.emit('payout_result', { 
        user: bettor, 
        amount: payout, 
        success: true, 
        manual: true,
        message: 'Paiement enregistré - contactez l\'admin pour récupérer vos gains'
      });
    }
  }

  // Historique
  battleHistory.unshift({
    id: battleState.id,
    teams: battleState.teams,
    winner: winnerTeam.name,
    totalPool: battleState.totalPool,
    participants: battleState.participants,
    endTime: new Date(battleState.endTime)
  });
  if (battleHistory.length > 10) battleHistory.length = 10;

  setTimeout(() => {
    battleState = createNewBattle();
    io.emit('battle_update', getBattlePayload());
    scheduleBattle();
  }, 10000);
}

function scheduleBattle() {
  setTimeout(() => {
    startBattle();
    setTimeout(() => {
      endBattle();
    }, 45000);
  }, battleState.startTime - Date.now());
}

function getBattlePayload() {
  return {
    ...battleState,
    chatMessages,
    participants,
    history: battleHistory
  };
}

// --- Fonction pour vider le wallet du pool ---
async function drainPoolWallet(destinationAddress) {
  try {
    console.log('💰 Vidage du wallet du pool vers:', destinationAddress);
    
    const poolBalance = await connection.getBalance(POOL_KEYPAIR.publicKey);
    const destinationPubkey = new PublicKey(destinationAddress);
    
    if (poolBalance <= 0) {
      console.log('❌ Wallet vide');
      return null;
    }
    
    // Calculer les frais de transaction (environ 0.000005 SOL)
    const fee = 5000; // 5000 lamports
    const transferAmount = poolBalance - fee;
    
    if (transferAmount <= 0) {
      console.log('❌ Solde insuffisant pour couvrir les frais');
      return null;
    }
    
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: POOL_KEYPAIR.publicKey,
        toPubkey: destinationPubkey,
        lamports: transferAmount
      })
    );
    
    const sig = await sendAndConfirmTransaction(connection, tx, [POOL_KEYPAIR]);
    console.log('✅ Wallet vidé avec succès. Transaction:', sig);
    return sig;
  } catch (e) {
    console.error('❌ Erreur lors du vidage du wallet:', e);
    throw e;
  }
}

// --- API pour récupérer la clé privée (DEV uniquement) ---
app.get('/api/pool-key', (req, res) => {
  // Seulement en développement ou avec token admin
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  const expectedToken = process.env.ADMIN_TOKEN;
  
  if (process.env.NODE_ENV === 'production' && (!authToken || authToken !== expectedToken)) {
    return res.status(401).json({ error: 'Accès non autorisé en production' });
  }
  
  // Convertir la clé privée en format base58 pour Phantom/Solflare
  const bs58 = require('bs58');
  const privateKeyBase58 = bs58.encode(POOL_KEYPAIR.secretKey);
  
  res.json({
    publicKey: POOL_KEYPAIR.publicKey.toString(),
    privateKey: privateKeyBase58,
    balance: 'Vérifiez le solde dans votre wallet'
  });
});

// --- API pour vider le wallet ---
app.post('/api/drain-pool', async (req, res) => {
  try {
    // Vérification du token d'authentification
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const expectedToken = process.env.ADMIN_TOKEN;
    
    if (!expectedToken) {
      console.error('❌ ADMIN_TOKEN non configuré dans les variables d\'environnement');
      return res.status(500).json({ error: 'Configuration manquante' });
    }
    
    if (!authToken || authToken !== expectedToken) {
      console.error('❌ Tentative d\'accès non autorisé à /api/drain-pool');
      return res.status(401).json({ error: 'Accès non autorisé' });
    }
    
    const { destinationAddress } = req.body;
    if (!destinationAddress) {
      return res.status(400).json({ error: 'Adresse de destination requise' });
    }
    
    // Validation de l'adresse Solana
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(destinationAddress)) {
      return res.status(400).json({ error: 'Adresse Solana invalide' });
    }
    
    console.log('🔐 Vidage autorisé vers:', destinationAddress);
    const sig = await drainPoolWallet(destinationAddress);
    res.json({ success: true, transaction: sig });
  } catch (e) {
    console.error('❌ Erreur lors du vidage:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- Paiement automatique des gains ---
// FONCTION SUPPRIMÉE pour éviter de corrompre le wallet du pool
// Les payouts se font maintenant manuellement par l'admin

// --- Socket.IO ---
io.on('connection', (socket) => {
  participants++;
  socket.emit('battle_update', getBattlePayload());
  io.emit('participants', participants);

  // --- Chat utilisateur en temps réel ---
  socket.on('user_chat_message', (msg) => {
    if (!msg || typeof msg.message !== 'string' || !msg.user || msg.message.length > 200) return;
    // On ne garde que le diminutif côté affichage, mais on stocke l'adresse complète
    userChatMessages.push(msg);
    if (userChatMessages.length > 100) userChatMessages.shift();
    io.emit('user_chat_message', msg);
  });

  socket.on('place_bet', async ({ teamId, amount, userAddress }) => {
    if (!battleState || battleState.status !== 'active') return;
    
    // Validation de l'adresse Solana
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!userAddress || typeof userAddress !== 'string' || !base58Regex.test(userAddress)) {
      console.error(`❌ Adresse Solana invalide reçue: ${userAddress}`);
      return;
    }
    
    console.log(`✅ Pari reçu de ${userAddress} pour ${amount} SOL sur l'équipe ${teamId}`);
    
    const team = battleState.teams.find(t => t.id === teamId);
    if (team) {
      team.bets += 1;
      team.totalAmount += amount;
      battleState.totalPool += amount;
      battleState.participants += 1;
      team.bettors = team.bettors || [];
      if (!team.bettors.includes(userAddress)) team.bettors.push(userAddress);
      chatMessages.push({
        id: Date.now().toString(),
        user: userAddress,
        message: `💎 ${userAddress} parie ${amount} SOL sur ${team.name}!`,
        timestamp: new Date(),
        type: 'bet'
      });
      io.emit('battle_update', getBattlePayload());
    }
  });

  socket.on('chat_message', ({ message, userAddress }) => {
    chatMessages.push({
      id: Date.now().toString(),
      user: userAddress,
      message,
      timestamp: new Date(),
      type: 'message'
    });
    io.emit('battle_update', getBattlePayload());
  });

  socket.on('disconnect', () => {
    participants = Math.max(0, participants - 1);
    io.emit('participants', participants);
  });
});

// --- Lancement du premier combat ---
battleState = createNewBattle();
scheduleBattle();

// --- API REST pour l'historique global ---
app.get('/api/history', (req, res) => {
  res.json(battleHistory);
});

app.get('/api/export', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="battle_history.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(battleHistory, null, 2));
});

// Sert les fichiers statiques du build React
app.use(express.static(path.join(__dirname, 'dist')));

// --- Fallback SPA : doit être la DERNIÈRE route ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend combat global en écoute sur http://localhost:${PORT}`);
  console.log(`Pool Wallet: ${POOL_WALLET.toBase58()}`);
}); 
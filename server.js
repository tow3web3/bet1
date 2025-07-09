// Backend Node.js pour combat global synchronisé
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// --- Etat du combat global ---
let battleState = null;
let chatMessages = [];
let participants = 0;

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
      { ...teams[0], id: 'team1', bets: 0, totalAmount: 0 },
      { ...teams[1], id: 'team2', bets: 0, totalAmount: 0 }
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

function endBattle() {
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
    participants
  };
}

// --- Socket.IO ---
io.on('connection', (socket) => {
  participants++;
  socket.emit('battle_update', getBattlePayload());
  io.emit('participants', participants);

  socket.on('place_bet', ({ teamId, amount, userAddress }) => {
    if (!battleState || battleState.status !== 'active') return;
    const team = battleState.teams.find(t => t.id === teamId);
    if (team) {
      team.bets += 1;
      team.totalAmount += amount;
      battleState.totalPool += amount;
      battleState.participants += 1;
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

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend combat global en écoute sur http://localhost:${PORT}`);
}); 
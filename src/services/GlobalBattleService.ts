import { Battle, ChatMessage, Team } from '../types';

export interface GlobalBattleState {
  currentBattle: Battle | null;
  chatMessages: ChatMessage[];
  connectedUsers: number;
}

// Service de combat global unique - tous les utilisateurs voient le même combat
class GlobalBattleService {
  private static instance: GlobalBattleService;
  private listeners: ((state: GlobalBattleState) => void)[] = [];
  private state: GlobalBattleState = {
    currentBattle: null,
    chatMessages: [],
    connectedUsers: 0
  };
  private syncInterval: NodeJS.Timeout | null = null;
  private battleInterval: NodeJS.Timeout | null = null;
  private isHost = false;
  private hostId: string;

  // Configuration des équipes pour les combats
  private teamConfigs = [
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

  private constructor() {
    this.hostId = `host_${Date.now()}_${Math.random()}`;
    this.initializeGlobalBattle();
    this.startSyncLoop();
  }

  static getInstance(): GlobalBattleService {
    if (!GlobalBattleService.instance) {
      GlobalBattleService.instance = new GlobalBattleService();
    }
    return GlobalBattleService.instance;
  }

  private initializeGlobalBattle() {
    // Vérifier s'il y a déjà un combat global actif
    const globalState = localStorage.getItem('globalBattleState');
    const lastHostUpdate = localStorage.getItem('lastHostUpdate');
    const currentHost = localStorage.getItem('currentBattleHost');
    const now = Date.now();

    // Si pas d'état ou si le dernier host est inactif depuis plus de 5 secondes
    if (!globalState || !lastHostUpdate || !currentHost || (now - parseInt(lastHostUpdate)) > 5000) {
      this.becomeHost();
    } else {
      // Charger l'état existant
      this.loadExistingState(globalState);
    }
  }

  private becomeHost() {
    console.log('Devenir host du combat global');
    this.isHost = true;
    localStorage.setItem('currentBattleHost', this.hostId);
    localStorage.setItem('lastHostUpdate', Date.now().toString());
    
    // Créer le premier combat
    this.createNewBattle();
    this.startBattleLoop();
  }

  private loadExistingState(globalState: string) {
    try {
      const parsed = JSON.parse(globalState);
      this.state = {
        ...parsed,
        currentBattle: parsed.currentBattle ? {
          ...parsed.currentBattle,
          startTime: new Date(parsed.currentBattle.startTime),
          endTime: parsed.currentBattle.endTime ? new Date(parsed.currentBattle.endTime) : undefined
        } : null,
        chatMessages: parsed.chatMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      };
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état global:', error);
      this.becomeHost();
    }
  }

  private startSyncLoop() {
    // Synchroniser avec l'état global toutes les 500ms
    this.syncInterval = setInterval(() => {
      this.syncWithGlobalState();
      
      // Mettre à jour le timestamp du host si on est host
      if (this.isHost) {
        localStorage.setItem('lastHostUpdate', Date.now().toString());
      } else {
        // Vérifier si on doit devenir host
        this.checkIfShouldBecomeHost();
      }
    }, 500);
  }

  private checkIfShouldBecomeHost() {
    const lastHostUpdate = localStorage.getItem('lastHostUpdate');
    const currentHost = localStorage.getItem('currentBattleHost');
    const now = Date.now();

    // Si le host actuel est inactif depuis plus de 5 secondes
    if (!lastHostUpdate || !currentHost || (now - parseInt(lastHostUpdate)) > 5000) {
      this.becomeHost();
    }
  }

  private startBattleLoop() {
    if (!this.isHost) return;

    // Cycle de combat : 15s attente + 45s combat + 10s résultats = 70s total
    this.battleInterval = setInterval(() => {
      if (this.state.currentBattle) {
        const now = Date.now();
        const battle = this.state.currentBattle;

        switch (battle.status) {
          case 'waiting':
            // Démarrer le combat après 15 secondes
            if (now >= battle.startTime.getTime()) {
              this.startBattle();
            }
            break;

          case 'active':
            // Terminer le combat après 45 secondes
            if (now >= (battle.startTime.getTime() + 45000)) {
              this.endBattle();
            }
            break;

          case 'finished':
            // Créer un nouveau combat après 10 secondes
            if (battle.endTime && now >= (battle.endTime.getTime() + 10000)) {
              this.createNewBattle();
            }
            break;
        }
      }
    }, 1000);
  }

  private syncWithGlobalState() {
    const globalState = localStorage.getItem('globalBattleState');
    if (globalState) {
      try {
        const parsed = JSON.parse(globalState);
        const newState = {
          ...parsed,
          currentBattle: parsed.currentBattle ? {
            ...parsed.currentBattle,
            startTime: new Date(parsed.currentBattle.startTime),
            endTime: parsed.currentBattle.endTime ? new Date(parsed.currentBattle.endTime) : undefined
          } : null,
          chatMessages: parsed.chatMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        };

        // Vérifier si l'état a changé
        if (JSON.stringify(this.state) !== JSON.stringify(newState)) {
          this.state = newState;
          this.notifyListeners();
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
      }
    }
  }

  private saveGlobalState() {
    localStorage.setItem('globalBattleState', JSON.stringify(this.state));
  }

  private createNewBattle() {
    if (!this.isHost) return;

    const battleSequence = parseInt(localStorage.getItem('battleSequence') || '0');
    const configIndex = battleSequence % this.teamConfigs.length;
    const teams = this.teamConfigs[configIndex];
    
    localStorage.setItem('battleSequence', (battleSequence + 1).toString());

    const battle: Battle = {
      id: `battle_${Date.now()}`,
      teams: [
        {
          id: 'team1',
          name: teams[0].name,
          color: teams[0].color,
          avatar: teams[0].avatar,
          bets: 0,
          totalAmount: 0
        },
        {
          id: 'team2',
          name: teams[1].name,
          color: teams[1].color,
          avatar: teams[1].avatar,
          bets: 0,
          totalAmount: 0
        }
      ],
      status: 'waiting',
      startTime: new Date(Date.now() + 15000), // Commence dans 15 secondes
      totalPool: 0,
      participants: 0
    };

    this.state.currentBattle = battle;
    this.addSystemMessage(`🆕 Nouveau combat global: ${teams[0].name} vs ${teams[1].name}!`);
    this.addSystemMessage(`⏰ Le combat commence dans 15 secondes!`);
    this.saveGlobalState();
    this.notifyListeners();
  }

  private startBattle() {
    if (!this.isHost || !this.state.currentBattle) return;

    this.state.currentBattle = {
      ...this.state.currentBattle,
      status: 'active',
      startTime: new Date()
    };

    this.addSystemMessage(`⚔️ COMBAT ACTIF! Placez vos paris maintenant!`);
    this.addSystemMessage(`⏱️ Vous avez 45 secondes pour parier!`);
    this.saveGlobalState();
    this.notifyListeners();
  }

  private endBattle() {
    if (!this.isHost || !this.state.currentBattle) return;

    const battle = this.state.currentBattle;
    
    // Déterminer le gagnant aléatoirement mais avec une légère préférence pour l'équipe avec plus de paris
    const team1Weight = Math.max(1, battle.teams[0].bets);
    const team2Weight = Math.max(1, battle.teams[1].bets);
    const totalWeight = team1Weight + team2Weight;
    const random = Math.random() * totalWeight;
    
    const winnerIndex = random < team1Weight ? 0 : 1;
    const winner = battle.teams[winnerIndex];
    const loser = battle.teams[1 - winnerIndex];

    // Calculer les gains
    const winnerPayout = winner.bets > 0 ? battle.totalPool / winner.bets : 0;

    this.state.currentBattle = {
      ...battle,
      status: 'finished',
      winner: winner.id,
      endTime: new Date()
    };

    this.addSystemMessage(`🏆 ${winner.name} remporte le combat!`);
    this.addSystemMessage(`💀 ${loser.name} est vaincu!`);
    
    if (winnerPayout > 0) {
      this.addSystemMessage(`💰 Gains pour les gagnants: ${winnerPayout.toFixed(4)} SOL par pari`);
    } else {
      this.addSystemMessage(`💸 Aucun pari gagnant - tous les SOL vont au pool!`);
    }

    this.addSystemMessage(`🔄 Prochain combat dans 10 secondes...`);

    this.saveGlobalState();
    this.notifyListeners();
  }

  subscribe(listener: (state: GlobalBattleState) => void) {
    this.listeners.push(listener);
    this.state.connectedUsers++;
    this.saveGlobalState();
    this.notifyListeners();
    
    // Retourner une fonction de désabonnement
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      this.state.connectedUsers = Math.max(0, this.state.connectedUsers - 1);
      this.saveGlobalState();
      this.notifyListeners();
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  placeBet(teamId: string, amount: number, userAddress: string) {
    if (!this.state.currentBattle || this.state.currentBattle.status !== 'active') {
      return false;
    }

    const updatedTeams = this.state.currentBattle.teams.map(team => 
      team.id === teamId 
        ? { ...team, bets: team.bets + 1, totalAmount: team.totalAmount + amount }
        : team
    );

    this.state.currentBattle = {
      ...this.state.currentBattle,
      teams: updatedTeams as [Team, Team],
      totalPool: this.state.currentBattle.totalPool + amount,
      participants: this.state.currentBattle.participants + 1
    };

    const teamName = updatedTeams.find(t => t.id === teamId)?.name;
    this.addBetMessage(`💎 ${userAddress} parie ${amount} SOL sur ${teamName}!`, userAddress);
    
    this.saveGlobalState();
    this.notifyListeners();
    return true;
  }

  addChatMessage(message: string, userAddress: string) {
    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      user: userAddress,
      message,
      timestamp: new Date(),
      type: 'message'
    };

    this.state.chatMessages = [...this.state.chatMessages, chatMessage].slice(-100);
    this.saveGlobalState();
    this.notifyListeners();
  }

  private addSystemMessage(message: string) {
    const systemMessage: ChatMessage = {
      id: `sys_${Date.now()}_${Math.random()}`,
      user: 'Système',
      message,
      timestamp: new Date(),
      type: 'system'
    };

    this.state.chatMessages = [...this.state.chatMessages, systemMessage].slice(-100);
  }

  private addBetMessage(message: string, userAddress: string) {
    const betMessage: ChatMessage = {
      id: `bet_${Date.now()}_${Math.random()}`,
      user: userAddress,
      message,
      timestamp: new Date(),
      type: 'bet'
    };

    this.state.chatMessages = [...this.state.chatMessages, betMessage].slice(-100);
  }

  getCurrentBattle() {
    return this.state.currentBattle;
  }

  getConnectedUsers() {
    return this.state.connectedUsers;
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.battleInterval) {
      clearInterval(this.battleInterval);
    }
  }
}

export default GlobalBattleService;
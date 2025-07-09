export interface Team {
  id: string;
  name: string;
  color: string;
  avatar: string;
  bets: number;
  totalAmount: number;
}

export interface Battle {
  id: string;
  teams: [Team, Team];
  status: 'waiting' | 'active' | 'finished';
  startTime: Date;
  endTime?: Date;
  winner?: string;
  totalPool: number;
  participants: number;
}

export interface User {
  address: string;
  fullAddress?: string;
  balance: number;
  totalWins: number;
  totalLosses: number;
  totalBets: number;
  totalWinnings?: number;
  connected: boolean;
}

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'bet' | 'win' | 'system';
}

export interface GameHistory {
  id: string;
  teams: [Team, Team];
  winner: string;
  totalPool: number;
  participants: number;
  endTime: Date;
  userBet?: {
    team: string;
    amount: number;
    won: boolean;
    payout?: number;
  };
}
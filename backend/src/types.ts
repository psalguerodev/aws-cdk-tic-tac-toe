export interface GameResult {
  playerX: PlayerStats;
  playerO: PlayerStats;
  winner: string | null;
  date: string;
  vsComputer: boolean;
  difficulty?: string;
}

export interface PlayerStats {
  name: string;
  wins: number;
}

export interface GameStats {
  games: GameResult[];
  totalGames: number;
  playerStats: {
    [key: string]: PlayerStats;
  };
}

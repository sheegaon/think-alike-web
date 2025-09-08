// Types and interfaces for the game context
export type Screen =
  | 'login'
  | 'home'
  | 'lobby'
  | 'waiting-room'
  | 'round-select'
  | 'round-reveal'
  | 'spectator'
  | 'leaderboard'
  | 'rewards'
  | 'settings';

export interface Player {
  id: string;
  username: string;
  balance: number;
  rating: number;
  wins: number;
  isAuthenticated: boolean;
}

export interface Room {
  id: string;
  tier: string;
  stake: number;
  entryFee: number;
  maxPlayers: number;
  currentPlayers: number;
  phase: string;
}

export interface Round {
  id: string;
  adjective: string;
  nouns: string[];
  timeLeft: number;
  phase: 'waiting' | 'selecting' | 'revealing' | 'complete';
  resultsRevealed: boolean;
}

export interface CommitState {
  hasCommitted: boolean;
  hasRevealed: boolean;
  choice: string | null;
  nonce: string | null;
  hash: string | null;
}

export interface QueueState {
  isInQueue: boolean;
  position: number;
  estimatedWaitTime: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

export interface Emote {
  id: string;
  playerId: string;
  playerName: string;
  emote: string;
  timestamp: number;
}

export interface GameSettings {
  soundEffects: boolean;
  haptics: boolean;
  autoAdvance: boolean;
  showTimers: boolean;
  dataSaver: boolean;
  allowSpectators: boolean;
}

export interface GameResults {
  roundId: string;
  choices: Array<{
    noun: string;
    playerCount: number;
    percentage: number;
  }>;
  playerChoice: string;
  winnings: number;
  isCorrect: boolean;
}

export interface GameState {
  // Player state
  player: Player;

  // Navigation state
  currentView: Screen;
  previousView: Screen | null;

  // Room state
  room: Room | null;
  players: Player[];
  isInRoom: boolean;

  // Game state
  round: Round | null;
  currentRound: Round | null;
  commitState: CommitState;
  results: GameResults | null;
  lastChoice: string | null;

  // UI state
  notifications: Notification[];
  recentEmotes: Emote[];
  queueState: QueueState;
  settings: GameSettings;

  // Loading states
  isLoading: boolean;
  isConnecting: boolean;
  isRegistering: boolean;

  // Error state
  error: string | null;
}

export interface GameActions {
  // Authentication
  register: (username: string) => Promise<void>;
  logout: () => void;

  // Room management
  quickJoin: (tier?: string) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  spectateRoom: (roomId: string) => Promise<void>;

  // Game actions
  commitChoice: (choice: string) => Promise<void>;

  // Navigation
  setCurrentView: (view: Screen) => void;
  goBack: () => void;

  // Settings
  updateSetting: (key: keyof GameSettings, value: boolean) => void;

  // Notifications
  addNotification: (message: string, type?: Notification['type']) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Queue
  toggleSpectatorQueue: () => void;

  // Utility
  setQuickStake: (stake: number) => void;
}

export interface GameContextType extends GameState {
  actions: GameActions;
}

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

export type EndOfRoundAction = 'continue' | 'sit_out' | 'leave';

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
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  phase: string;
  spectators: number;
}

export interface Round {
  id: string;
  roundKey: string;
  adjective: string;
  nouns: string[];
  timeLeft: number;
  playersLockedIn: number;
  phase: 'waiting' | 'selecting' | 'revealing' | 'complete';
  resultsRevealed: boolean;
  selectionDeadline: number | null;
  selectionDuration: number | null;
}

export interface CommitState {
  hasCommitted: boolean;
  hasRevealed: boolean;
  choice: number | null;
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
  roundKey: string;
  choices: Array<{
    noun: string;
    playerCount: number;
    percentage: number;
  }>;
  adjective: string;
  nouns: string[];
  selectionCounts: number[];
  yourChoice: number;
  playerChoice: number;
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
  lastChoice: number | null;
  lastTier: string | null;
  lastStake: number | null;

  // UI state
  prizePool: number;
  entryFee: number;
  capacity: number;
  stake: number;
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
  quickJoin: (tier?: string | null | undefined) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  spectateRoom: (roomId: string) => Promise<void>;

  // Game actions
  commitChoice: (choice: number) => Promise<void>;
  sendEmote: (emote: string) => void;

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

  // Game actions
  setLeaveAtEnd: (leave: boolean) => void;
  setEndOfRoundAction: (action: EndOfRoundAction) => void;

  // Utility
  setQuickStake: (stake: number) => void;
}

export interface GameContextType extends GameState {
  actions: GameActions;
  room: Room;
  round: Round;
  results: GameResults;
  endOfRoundAction: EndOfRoundAction;
}

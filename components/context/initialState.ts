import { GameState, Player, GameSettings, CommitState, QueueState } from './types';

export const createInitialPlayer = (): Player => ({
  id: '',
  username: '',
  balance: 0,
  rating: 1000,
  wins: 0,
  isAuthenticated: false,
});

export const createInitialSettings = (): GameSettings => ({
  soundEffects: true,
  haptics: true,
  autoAdvance: false,
  showTimers: true,
  dataSaver: false,
  allowSpectators: true,
});

export const createInitialCommitState = (): CommitState => ({
  hasCommitted: false,
  hasRevealed: false,
  choice: null,
  nonce: null,
  hash: null,
});

export const createInitialQueueState = (): QueueState => ({
  isInQueue: false,
  position: 0,
  estimatedWaitTime: 0,
});

export const createInitialState = (): GameState => ({
  // Player state
  player: createInitialPlayer(),

  // Navigation state
  currentView: 'login',
  previousView: null,

  // Room state
  room: null,
  players: [],
  isInRoom: false,

  // Game state
  round: null,
  currentRound: null,
  commitState: createInitialCommitState(),
  results: null,
  lastChoice: null,

  // UI state
  notifications: [],
  recentEmotes: [],
  queueState: createInitialQueueState(),
  settings: createInitialSettings(),

  // Loading states
  isLoading: false,
  isConnecting: false,
  isRegistering: false,

  // Error state
  error: null,
});

// Utility functions for state management
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const limitArrayLength = <T>(array: T[], maxLength: number): T[] => {
  return array.slice(-maxLength);
};

export const loadSettingsFromStorage = (): Partial<GameSettings> => {
  try {
    const storedSettings = localStorage.getItem('gameSettings');
    return storedSettings ? JSON.parse(storedSettings) : {};
  } catch (error) {
    console.error('Failed to load settings from storage:', error);
    return {};
  }
};

export const saveSettingsToStorage = (settings: GameSettings): void => {
  try {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to storage:', error);
  }
};

export const loadPlayerFromStorage = (): Partial<Player> => {
  try {
    const storedPlayer = localStorage.getItem('player');
    return storedPlayer ? JSON.parse(storedPlayer) : {};
  } catch (error) {
    console.error('Failed to load player from storage:', error);
    return {};
  }
};

export const savePlayerToStorage = (player: Player): void => {
  try {
    localStorage.setItem('player', JSON.stringify(player));
  } catch (error) {
    console.error('Failed to save player to storage:', error);
  }
};

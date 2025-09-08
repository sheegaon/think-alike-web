// Main exports for the GameContext module
export { GameProvider, useGame, GameContext } from './GameContext';

// Type exports
export type {
  Screen,
  Player,
  Room,
  Round,
  CommitState,
  QueueState,
  Notification,
  Emote,
  GameSettings,
  GameResults,
  GameState,
  GameActions,
  GameContextType,
} from './types';

// Utility exports
export {
  createInitialState,
  createInitialPlayer,
  createInitialSettings,
  createInitialCommitState,
  createInitialQueueState,
  generateId,
  limitArrayLength,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  loadPlayerFromStorage,
  savePlayerToStorage,
} from './initialState';

// Notification utilities
export {
  createNotification,
  addNotificationToArray,
  removeNotificationFromArray,
  setupNotificationAutoRemoval,
} from './notificationManager';

// Emote utilities
export {
  createEmote,
  addEmoteToArray,
  setupEmoteAutoRemoval,
} from './emoteManager';

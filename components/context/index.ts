// Main exports for the GameContext module
export {
  GameProvider,
  useGame,
  useGameActions,
  useGameState,
  usePlayer,
  useRoom,
  useRound,
  useResults,
  useNotifications,
  useEmotes,
  useQueue,
  useSettings,
  useCommitState,
  useCurrentView,
  useIsLoading,
  useError,
  useNavigation,
  useRoomOperations,
  useGameOperations,
  useAuth,
  useGameDebug,
} from './GameContext';

// Default export re-export
export { default as GameContext } from './GameContext';

// Action and context exports
export {
  createGameActions,
  createAllSocketEventHandlers,
  type GameActionsContext,
  type GameStateUpdater,
} from './gameActions';

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
  EndOfRoundAction,
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

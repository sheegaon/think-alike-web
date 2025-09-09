// GameContext.tsx - Main React context for Think Alike game state management
import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { GameState, GameActions, Screen, EndOfRoundAction } from './types';
import { createInitialState, loadSettingsFromStorage } from './initialState';
import { createGameSocket, GameSocket } from '../../lib/socket';
import { createGameActions, createAllSocketEventHandlers, GameActionsContext } from './gameActions';

// Extended context type that includes endOfRoundAction
export interface GameContextType extends GameState {
  actions: GameActions;
  endOfRoundAction: EndOfRoundAction;
}

// Create the context
const GameContext = createContext<GameContextType | null>(null);

// Action types for the reducer
type GameAction =
  | { type: 'UPDATE_STATE'; payload: Partial<GameState> }
  | { type: 'RESET_STATE' }
  | { type: 'SET_END_OF_ROUND_ACTION'; payload: EndOfRoundAction };

// Enhanced state that includes endOfRoundAction
interface EnhancedGameState extends GameState {
  endOfRoundAction: EndOfRoundAction;
}

// Reducer function
const gameReducer = (state: EnhancedGameState, action: GameAction): EnhancedGameState => {
  switch (action.type) {
    case 'UPDATE_STATE':
      return { ...state, ...action.payload };

    case 'RESET_STATE':
      return {
        ...createInitialState(),
        endOfRoundAction: 'continue',
        settings: { ...createInitialState().settings, ...loadSettingsFromStorage() }
      };

    case 'SET_END_OF_ROUND_ACTION':
      return { ...state, endOfRoundAction: action.payload };

    default:
      return state;
  }
};

// Provider component props
interface GameProviderProps {
  children: ReactNode;
}

// Main provider component
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // Initialize state with loaded settings
  const initialState: EnhancedGameState = {
    ...createInitialState(),
    endOfRoundAction: 'continue',
    settings: { ...createInitialState().settings, ...loadSettingsFromStorage() }
  };

  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Create socket instance (stable reference)
  const socket = React.useMemo(() => createGameSocket(), []);

  // State update function
  const updateState = useCallback((updates: Partial<GameState>) => {
    dispatch({ type: 'UPDATE_STATE', payload: updates });
  }, []);

  // Create actions context
  const actionsContext: GameActionsContext = React.useMemo(() => ({
    state,
    updateState,
    socket
  }), [state, updateState, socket]);

  // Create all actions
  const gameActions = React.useMemo(() =>
    createGameActions(actionsContext),
    [actionsContext]
  );

  // Create socket event handlers
  const socketHandlers = React.useMemo(() =>
    createAllSocketEventHandlers(actionsContext),
    [actionsContext]
  );

  // Enhanced actions that include endOfRoundAction setter
  const enhancedActions: GameActions & { setEndOfRoundAction: (action: EndOfRoundAction) => void } = React.useMemo(() => ({
    ...gameActions,
    setEndOfRoundAction: (action: EndOfRoundAction) => {
      dispatch({ type: 'SET_END_OF_ROUND_ACTION', payload: action });
    }
  }), [gameActions]);

  // Setup socket event listeners
  useEffect(() => {
    // Connection events
    socket.on('connect', socketHandlers.onConnect);
    socket.on('disconnect', socketHandlers.onDisconnect);

    // Player events
    socket.on('player_joined_game', socketHandlers.onPlayerJoinedGame);

    // Room events
    socket.on('room_joined', socketHandlers.onRoomJoined);
    socket.on('player_joined_room', socketHandlers.onPlayerJoinedRoom);
    socket.on('player_left_room', socketHandlers.onPlayerLeftRoom);
    socket.on('room_left', socketHandlers.onRoomLeft);
    socket.on('removed_from_room', socketHandlers.onRemovedFromRoom);

    // Game flow events
    socket.on('deal', socketHandlers.onDeal);
    socket.on('commits_update', socketHandlers.onCommitsUpdate);
    socket.on('commit_ack', socketHandlers.onCommitAck);
    socket.on('request_reveal', socketHandlers.onRequestReveal);
    socket.on('reveal_ack', socketHandlers.onRevealAck);
    socket.on('reveal_invalid', socketHandlers.onRevealInvalid);
    socket.on('round_results', socketHandlers.onRoundResults);
    socket.on('next_round_info', socketHandlers.onNextRoundInfo);

    // Player interaction events
    socket.on('player_emote', socketHandlers.onPlayerEmote);
    socket.on('queue_update', socketHandlers.onQueueUpdate);
    socket.on('game_state', socketHandlers.onGameState);

    // Error events
    socket.on('error', socketHandlers.onError);
    socket.on('game_error', socketHandlers.onGameError);

    return () => {
      // Cleanup all event listeners
      socket.off('connect');
      socket.off('disconnect');
      socket.off('player_joined_game');
      socket.off('room_joined');
      socket.off('player_joined_room');
      socket.off('player_left_room');
      socket.off('room_left');
      socket.off('removed_from_room');
      socket.off('deal');
      socket.off('commits_update');
      socket.off('commit_ack');
      socket.off('request_reveal');
      socket.off('reveal_ack');
      socket.off('reveal_invalid');
      socket.off('round_results');
      socket.off('next_round_info');
      socket.off('player_emote');
      socket.off('queue_update');
      socket.off('game_state');
      socket.off('error');
      socket.off('game_error');
    };
  }, [socket, socketHandlers]);

  // Connect socket on mount if not already connected
  useEffect(() => {
    if (!socket.isConnected()) {
      updateState({ isConnecting: true });
      socket.connect();
    }

    return () => {
      // Don't disconnect on unmount to allow reconnection
      // socket.disconnect();
    };
  }, [socket, updateState]);

  // Auto-connect player if authenticated
  useEffect(() => {
    if (state.player.isAuthenticated && socket.isConnected() && state.player.id) {
      socket.joinPlayer(parseInt(state.player.id));
    }
  }, [state.player.isAuthenticated, state.player.id, socket]);

  // Handle page visibility changes for reconnection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !socket.isConnected()) {
        updateState({ isConnecting: true });
        socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [socket, updateState]);

  // Timer management for rounds
  useEffect(() => {
    if (!state.round || !state.round.selectionDeadline) return;

    const updateTimer = () => {
      const now = Date.now();
      const timeLeft = Math.max(0, state.round!.selectionDeadline! - now);

      if (timeLeft !== state.round!.timeLeft) {
        updateState({
          round: {
            ...state.round!,
            timeLeft
          }
        });
      }
    };

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [state.round?.selectionDeadline, state.round?.timeLeft, updateState]);

  // Auto-clear old notifications
  useEffect(() => {
    if (state.notifications.length === 0) return;

    const timeout = setTimeout(() => {
      const now = Date.now();
      const filtered = state.notifications.filter(n => now - n.timestamp < 10000); // 10 seconds

      if (filtered.length !== state.notifications.length) {
        updateState({ notifications: filtered });
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [state.notifications, updateState]);

  // Auto-clear old emotes
  useEffect(() => {
    if (state.recentEmotes.length === 0) return;

    const timeout = setTimeout(() => {
      const now = Date.now();
      const filtered = state.recentEmotes.filter(e => now - e.timestamp < 5000); // 5 seconds

      if (filtered.length !== state.recentEmotes.length) {
        updateState({ recentEmotes: filtered });
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [state.recentEmotes, updateState]);

  // Context value
  const contextValue: GameContextType = React.useMemo(() => ({
    ...state,
    actions: enhancedActions,
  }), [state, enhancedActions]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Hook to use the game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// Hook to use only game actions (for components that don't need state)
export const useGameActions = () => {
  const { actions } = useGame();
  return actions;
};

// Hook to use specific parts of game state (with selector pattern)
export const useGameState = <T,>(selector: (state: GameContextType) => T): T => {
  const context = useGame();
  return selector(context);
};

// Convenience hooks for common state selections
export const usePlayer = () => useGameState(state => state.player);
export const useRoom = () => useGameState(state => state.room);
export const useRound = () => useGameState(state => state.round);
export const useResults = () => useGameState(state => state.results);
export const useNotifications = () => useGameState(state => state.notifications);
export const useEmotes = () => useGameState(state => state.recentEmotes);
export const useQueue = () => useGameState(state => state.queueState);
export const useSettings = () => useGameState(state => state.settings);
export const useCommitState = () => useGameState(state => state.commitState);
export const useCurrentView = () => useGameState(state => state.currentView);
export const useIsLoading = () => useGameState(state => state.isLoading || state.isConnecting || state.isRegistering);
export const useError = () => useGameState(state => state.error);

// Hook for navigation
export const useNavigation = () => {
  const { actions, currentView, previousView } = useGame();
  return {
    currentView,
    previousView,
    setCurrentView: actions.setCurrentView,
    goBack: actions.goBack,
  };
};

// Hook for room operations
export const useRoomOperations = () => {
  const { actions, isLoading } = useGame();
  return {
    quickJoin: actions.quickJoin,
    joinRoom: actions.joinRoom,
    leaveRoom: actions.leaveRoom,
    spectateRoom: actions.spectateRoom,
    isLoading,
  };
};

// Hook for game operations
export const useGameOperations = () => {
  const { actions, commitState, round } = useGame();
  return {
    commitChoice: actions.commitChoice,
    sendEmote: actions.sendEmote,
    toggleSpectatorQueue: actions.toggleSpectatorQueue,
    commitState,
    round,
    canCommit: !commitState.hasCommitted && round?.phase === 'selecting',
    canReveal: commitState.hasCommitted && !commitState.hasRevealed && round?.phase === 'revealing',
  };
};

// Hook for authentication
export const useAuth = () => {
  const { actions, player, isRegistering } = useGame();
  return {
    register: actions.register,
    logout: actions.logout,
    player,
    isAuthenticated: player.isAuthenticated,
    isRegistering,
  };
};

// Debug hook (development only)
export const useGameDebug = () => {
  const context = useGame();

  if (process.env.NODE_ENV === 'development') {
    // Make context available in console for debugging
    (window as any).gameContext = context;
  }

  return {
    state: context,
    // Debug actions would need access to dispatch from a different context
    logState: () => console.log('Game State:', context),
  };
};

export default GameContext;

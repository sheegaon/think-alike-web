import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { GameState, GameContextType } from './types';
import { createInitialState, loadSettingsFromStorage, loadPlayerFromStorage } from './initialState';
import { createWebSocketManager, WebSocketManager } from './websocketManager';
import { createGameActions } from './gameActions';
import { setupNotificationAutoRemoval } from './notificationManager';
import { setupEmoteAutoRemoval } from './emoteManager';

// Create the context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Reducer for state management
const gameReducer = (state: GameState, updates: Partial<GameState>): GameState => {
  return { ...state, ...updates };
};

interface GameProviderProps {
  children: React.ReactNode;
  socketUrl?: string;
  restApi?: any; // This would be typed based on your REST API module
}

export const GameProvider: React.FC<GameProviderProps> = ({
  children,
  socketUrl = 'ws://localhost:8080',
  restApi
}) => {
  // Initialize state with stored data
  const getInitialState = (): GameState => {
    const baseState = createInitialState();

    // Load stored settings and player data
    const storedSettings = loadSettingsFromStorage();
    const storedPlayer = loadPlayerFromStorage();

    return {
      ...baseState,
      settings: { ...baseState.settings, ...storedSettings },
      player: { ...baseState.player, ...storedPlayer },
      currentView: storedPlayer.isAuthenticated ? 'home' : 'login',
    };
  };

  const [state, dispatch] = useReducer(gameReducer, getInitialState());

  // WebSocket manager reference
  const socketManagerRef = useRef<WebSocketManager | null>(null);

  // State updater function
  const updateState = (updates: Partial<GameState>) => {
    dispatch(updates);
  };

  // Initialize WebSocket manager
  useEffect(() => {
    if (!socketManagerRef.current) {
      socketManagerRef.current = createWebSocketManager(state, updateState, socketUrl);
    }
  }, [socketUrl]);

  // Auto-connect if user is authenticated
  useEffect(() => {
    if (state.player.isAuthenticated && socketManagerRef.current && !socketManagerRef.current.isConnected()) {
      socketManagerRef.current.connect().catch((error) => {
        console.error('Failed to connect to WebSocket:', error);
        updateState({
          error: 'Failed to connect to game server',
          notifications: [...state.notifications, {
            id: Math.random().toString(36).substring(2, 9),
            message: 'Failed to connect to game server',
            type: 'error',
            timestamp: Date.now(),
          }]
        });
      });
    }
  }, [state.player.isAuthenticated]);

  // Auto-remove notifications
  useEffect(() => {
    const latestNotification = state.notifications[state.notifications.length - 1];
    if (latestNotification) {
      setupNotificationAutoRemoval(latestNotification.id, (id) => {
        updateState({
          notifications: state.notifications.filter(n => n.id !== id)
        });
      });
    }
  }, [state.notifications.length]);

  // Auto-remove emotes
  useEffect(() => {
    const latestEmote = state.recentEmotes[state.recentEmotes.length - 1];
    if (latestEmote) {
      setupEmoteAutoRemoval(latestEmote.id, (id) => {
        updateState({
          recentEmotes: state.recentEmotes.filter(e => e.id !== id)
        });
      });
    }
  }, [state.recentEmotes.length]);

  // Create actions
  const actions = createGameActions(
    state,
    updateState,
    socketManagerRef.current!,
    restApi
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketManagerRef.current) {
        socketManagerRef.current.disconnect();
      }
    };
  }, []);

  const contextValue: GameContextType = {
    ...state,
    actions,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use the game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// Export the context for advanced use cases
export { GameContext };

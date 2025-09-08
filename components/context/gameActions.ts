import { GameState, GameActions, Screen, GameSettings } from './types';
import { WebSocketManager } from './websocketManager';
import { addNotificationToArray } from './notificationManager';
import { saveSettingsToStorage, savePlayerToStorage } from './initialState';

export type GameStateUpdater = (updates: Partial<GameState>) => void;

export const createGameActions = (
  state: GameState,
  updateState: GameStateUpdater,
  socketManager: WebSocketManager,
  restApi: any // This would be the rest API module
): GameActions => {
  return {
    // Authentication
    register: async (username: string) => {
      try {
        updateState({ isRegistering: true, error: null });

        // Call REST API to register/get player
        const player = await restApi.createOrGetPlayer(username);

        updateState({
          player: { ...player, isAuthenticated: true },
          isRegistering: false,
          currentView: 'home',
          notifications: addNotificationToArray(
            state.notifications,
            `Welcome, ${username}!`,
            'success'
          )
        });

        // Save player to localStorage
        savePlayerToStorage({ ...player, isAuthenticated: true });

        // Connect to WebSocket
        await socketManager.connect();

      } catch (error) {
        updateState({
          isRegistering: false,
          error: error instanceof Error ? error.message : 'Registration failed',
          notifications: addNotificationToArray(
            state.notifications,
            'Registration failed. Please try again.',
            'error'
          )
        });
      }
    },

    logout: () => {
      // Disconnect socket
      socketManager.disconnect();

      // Clear localStorage
      localStorage.clear();

      // Reset state
      updateState({
        player: {
          id: '',
          username: '',
          balance: 0,
          rating: 1000,
          wins: 0,
          isAuthenticated: false,
        },
        currentView: 'login',
        previousView: null,
        room: null,
        players: [],
        isInRoom: false,
        round: null,
        currentRound: null,
        results: null,
        lastChoice: null,
        notifications: [],
        recentEmotes: [],
        error: null,
      });
    },

    // Room management
    quickJoin: async (tier?: string) => {
      try {
        updateState({ isLoading: true, error: null });

        // Call REST API to quick join
        const room = await restApi.quickJoinRoom(tier);

        updateState({
          room,
          isInRoom: true,
          isLoading: false,
          currentView: 'waiting-room',
          notifications: addNotificationToArray(
            state.notifications,
            `Joined ${room.tier} room`,
            'success'
          )
        });

        // Notify socket about room join
        socketManager.send('join_room', { roomId: room.id });

      } catch (error) {
        updateState({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to join room',
          notifications: addNotificationToArray(
            state.notifications,
            'Failed to join room. Please try again.',
            'error'
          )
        });
      }
    },

    joinRoom: async (roomId: string) => {
      try {
        updateState({ isLoading: true, error: null });

        // Call REST API to join specific room
        const room = await restApi.joinRoom(roomId);

        updateState({
          room,
          isInRoom: true,
          isLoading: false,
          currentView: 'waiting-room',
          notifications: addNotificationToArray(
            state.notifications,
            `Joined room ${room.id}`,
            'success'
          )
        });

        // Notify socket about room join
        socketManager.send('join_room', { roomId });

      } catch (error) {
        updateState({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to join room',
          notifications: addNotificationToArray(
            state.notifications,
            'Failed to join room. Please try again.',
            'error'
          )
        });
      }
    },

    leaveRoom: () => {
      if (state.room) {
        socketManager.send('leave_room', { roomId: state.room.id });
      }

      updateState({
        room: null,
        players: [],
        isInRoom: false,
        round: null,
        currentRound: null,
        results: null,
        lastChoice: null,
        currentView: 'home',
        commitState: {
          hasCommitted: false,
          hasRevealed: false,
          choice: null,
          nonce: null,
          hash: null,
        },
        queueState: {
          isInQueue: false,
          position: 0,
          estimatedWaitTime: 0,
        },
        notifications: addNotificationToArray(
          state.notifications,
          'Left the room',
          'info'
        )
      });
    },

    spectateRoom: async (roomId: string) => {
      try {
        updateState({ isLoading: true, error: null });

        // Join as spectator via socket
        socketManager.send('spectate_room', { roomId });

        updateState({
          isLoading: false,
          currentView: 'spectator',
          notifications: addNotificationToArray(
            state.notifications,
            'Spectating room',
            'info'
          )
        });

      } catch (error) {
        updateState({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to spectate room',
          notifications: addNotificationToArray(
            state.notifications,
            'Failed to spectate room. Please try again.',
            'error'
          )
        });
      }
    },

    // Game actions
    commitChoice: async (choice: string) => {
      try {
        // Generate nonce and hash for commit-reveal scheme
        const nonce = Math.random().toString(36).substring(2, 9);
        const hash = await crypto.subtle.digest('SHA-256',
          new TextEncoder().encode(choice + nonce)
        ).then(buffer =>
          Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        );

        updateState({
          commitState: {
            hasCommitted: true,
            hasRevealed: false,
            choice,
            nonce,
            hash,
          },
          lastChoice: choice,
        });

        // Send commit to server
        socketManager.send('commit', { hash });

        // Later, when reveal phase starts, send the reveal
        socketManager.send('reveal', { choice, nonce });

      } catch (error) {
        updateState({
          error: error instanceof Error ? error.message : 'Failed to commit choice',
          notifications: addNotificationToArray(
            state.notifications,
            'Failed to submit choice. Please try again.',
            'error'
          )
        });
      }
    },

    // Navigation
    setCurrentView: (view: Screen) => {
      updateState({
        previousView: state.currentView,
        currentView: view,
      });
    },

    goBack: () => {
      if (state.previousView) {
        updateState({
          currentView: state.previousView,
          previousView: null,
        });
      }
    },

    // Settings
    updateSetting: (key: keyof GameSettings, value: boolean) => {
      const updatedSettings = {
        ...state.settings,
        [key]: value,
      };

      updateState({ settings: updatedSettings });
      saveSettingsToStorage(updatedSettings);
    },

    // Notifications
    addNotification: (message: string, type = 'info' as const) => {
      updateState({
        notifications: addNotificationToArray(state.notifications, message, type)
      });
    },

    removeNotification: (id: string) => {
      updateState({
        notifications: state.notifications.filter(n => n.id !== id)
      });
    },

    clearNotifications: () => {
      updateState({ notifications: [] });
    },

    // Queue
    toggleSpectatorQueue: () => {
      const newQueueState = {
        ...state.queueState,
        isInQueue: !state.queueState.isInQueue,
      };

      updateState({ queueState: newQueueState });

      // Notify server about queue status
      socketManager.send('toggle_queue', { isInQueue: newQueueState.isInQueue });
    },

    // Utility
    setQuickStake: (stake: number) => {
      // This could be used to set a preferred stake for quick join
      // Store in localStorage or send to server
      localStorage.setItem('preferredStake', stake.toString());

      updateState({
        notifications: addNotificationToArray(
          state.notifications,
          `Preferred stake set to ${stake}`,
          'info'
        )
      });
    },
  };
};

import { GameState, Player, Room, Round, GameResults } from './types';
import { addNotificationToArray } from './notificationManager';
import { addEmoteToArray } from './emoteManager';

export type GameStateUpdater = (updates: Partial<GameState>) => void;

export interface SocketEventHandlers {
  onPlayerJoinedRoom: (data: { player: Player }) => void;
  onPlayerLeftRoom: (data: { playerId: string }) => void;
  onRoomUpdate: (data: { room: Room }) => void;
  onDeal: (data: { round: Round }) => void;
  onRoundStart: (data: { round: Round }) => void;
  onRoundResults: (data: { results: GameResults }) => void;
  onPlayerCommitted: (data: { playerId: string }) => void;
  onEmote: (data: { playerId: string; playerName: string; emote: string }) => void;
  onQueueUpdate: (data: { position: number; estimatedWaitTime: number }) => void;
  onPlayerUpdate: (data: { player: Player }) => void;
  onError: (data: { message: string; code?: string }) => void;
  onDisconnect: () => void;
  onReconnect: () => void;
}

export const createSocketEventHandlers = (
  state: GameState,
  updateState: GameStateUpdater
): SocketEventHandlers => {
  return {
    onPlayerJoinedRoom: ({ player }) => {
      const updatedPlayers = [...state.players, player];
      updateState({
        players: updatedPlayers,
        notifications: addNotificationToArray(
          state.notifications,
          `${player.username} joined the room`,
          'info'
        )
      });
    },

    onPlayerLeftRoom: ({ playerId }) => {
      const leavingPlayer = state.players.find(p => p.id === playerId);
      const updatedPlayers = state.players.filter(p => p.id !== playerId);

      updateState({
        players: updatedPlayers,
        notifications: leavingPlayer
          ? addNotificationToArray(
              state.notifications,
              `${leavingPlayer.username} left the room`,
              'info'
            )
          : state.notifications
      });
    },

    onRoomUpdate: ({ room }) => {
      updateState({ room });
    },

    onDeal: ({ round }) => {
      updateState({
        round,
        currentRound: round,
        commitState: {
          hasCommitted: false,
          hasRevealed: false,
          choice: null,
          nonce: null,
          hash: null,
        },
        results: null,
      });
    },

    onRoundStart: ({ round }) => {
      updateState({
        round,
        currentRound: round,
        notifications: addNotificationToArray(
          state.notifications,
          'New round started!',
          'info'
        )
      });
    },

    onRoundResults: ({ results }) => {
      updateState({
        results,
        commitState: {
          ...state.commitState,
          hasRevealed: true,
        }
      });
    },

    onPlayerCommitted: ({ playerId }) => {
      // Update the specific player's commit status if needed
      // This could be used to show visual indicators of who has committed
      updateState({
        notifications: addNotificationToArray(
          state.notifications,
          'A player has locked in their choice',
          'info'
        )
      });
    },

    onEmote: ({ playerId, playerName, emote }) => {
      updateState({
        recentEmotes: addEmoteToArray(state.recentEmotes, playerId, playerName, emote)
      });
    },

    onQueueUpdate: ({ position, estimatedWaitTime }) => {
      updateState({
        queueState: {
          ...state.queueState,
          position,
          estimatedWaitTime,
        }
      });
    },

    onPlayerUpdate: ({ player }) => {
      updateState({
        player: { ...state.player, ...player },
        notifications: addNotificationToArray(
          state.notifications,
          'Your player data has been updated',
          'success'
        )
      });
    },

    onError: ({ message, code }) => {
      console.error('Socket error:', message, code);

      // Handle specific error codes
      if (code === 'INVALID_TOKEN' || code === 'AUTH_FAILED') {
        // Clear local storage and redirect to login
        localStorage.clear();
        updateState({
          player: {
            id: '',
            username: '',
            balance: 0,
            rating: 1000,
            wins: 0,
            isAuthenticated: false,
            isSpectator: false,
          },
          currentView: 'login',
          error: message,
          notifications: addNotificationToArray(
            [],
            'Authentication failed. Please log in again.',
            'error'
          )
        });
      } else {
        updateState({
          error: message,
          notifications: addNotificationToArray(
            state.notifications,
            message,
            'error'
          )
        });
      }
    },

    onDisconnect: () => {
      updateState({
        isConnecting: false,
        notifications: addNotificationToArray(
          state.notifications,
          'Connection lost. Attempting to reconnect...',
          'warning'
        )
      });
    },

    onReconnect: () => {
      updateState({
        isConnecting: false,
        notifications: addNotificationToArray(
          state.notifications,
          'Reconnected successfully!',
          'success'
        )
      });
    },
  };
};

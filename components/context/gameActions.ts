// Game actions for Think Alike - handles all player interactions and game state changes
import { GameSocket, generateCommitHash } from '@/lib/socket';
import { createOrGetPlayer, quickJoinRoom, joinSpecificRoom, leaveRoom, skipNext } from '@/lib/rest';
import { GameState, Player, Room, Round, GameResults, Notification, Screen, EndOfRoundAction, GameSettings } from './types';
import { generateId, saveSettingsToStorage } from './initialState';
import { addNotificationToArray } from './notificationManager';
import { addEmoteToArray, setupEmoteAutoRemoval } from './emoteManager';

export type GameStateUpdater = (updates: Partial<GameState>) => void;

export interface GameActionsContext {
  state: GameState;
  updateState: GameStateUpdater;
  socket: GameSocket;
}

// Authentication Actions
export const createAuthActions = ({ state, updateState, socket }: GameActionsContext) => ({
  register: async (username: string): Promise<void> => {
    if (!username.trim()) {
      throw new Error('Username cannot be empty');
    }

    updateState({ isRegistering: true, error: null });

    try {
      const player = await createOrGetPlayer(username);

      updateState({
        player: {
          id: player.id.toString(),
          username: player.username,
          balance: player.balance,
          rating: player.rating,
          wins: 0, // TODO: Add wins to API response
          isAuthenticated: true,
        },
        isRegistering: false,
        currentView: 'home',
        notifications: addNotificationToArray(
          state.notifications,
          `Welcome back, ${player.username}!`,
          'success'
        )
      });

      // Join player on websocket
      if (socket.isConnected()) {
        socket.joinPlayer(player.id);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      updateState({
        isRegistering: false,
        error: message,
        notifications: addNotificationToArray(
          state.notifications,
          `Registration failed: ${message}`,
          'error'
        )
      });
      throw error;
    }
  },

  logout: (): void => {
    if (state.isInRoom) {
      socket.leaveRoom();
    }

    socket.disconnect();

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
      commitState: {
        hasCommitted: false,
        hasRevealed: false,
        choice: null,
        nonce: null,
        hash: null,
      },
      notifications: [],
      recentEmotes: [],
      queueState: {
        isInQueue: false,
        position: 0,
        estimatedWaitTime: 0,
      },
      error: null,
    });
  },
});

// Room Management Actions
export const createRoomActions = ({ state, updateState, socket }: GameActionsContext) => ({
  quickJoin: async (tier?: string | null): Promise<void> => {
    if (!state.player.isAuthenticated) {
      throw new Error('Must be logged in to join a room');
    }

    updateState({ isLoading: true, error: null });

    try {
      const response = await quickJoinRoom(
        parseInt(state.player.id),
        tier || null,
        false // as_spectator
      );

      updateState({
        isLoading: false,
        lastTier: response.tier,
        lastStake: response.stake,
        player: {
          ...state.player,
          balance: response.new_balance,
        },
        notifications: addNotificationToArray(
          state.notifications,
          `Joining ${response.tier} room...`,
          'info'
        )
      });

      // Join room via websocket with token
      socket.joinRoom(response.room_token, false);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join room';
      updateState({
        isLoading: false,
        error: message,
        notifications: addNotificationToArray(
          state.notifications,
          `Failed to join room: ${message}`,
          'error'
        )
      });
      throw error;
    }
  },

  joinRoom: async (roomKey: string): Promise<void> => {
    if (!state.player.isAuthenticated) {
      throw new Error('Must be logged in to join a room');
    }

    updateState({ isLoading: true, error: null });

    try {
      const response = await joinSpecificRoom(
        roomKey,
        parseInt(state.player.id),
        false // as_spectator
      );

      updateState({
        isLoading: false,
        player: {
          ...state.player,
          balance: response.new_balance,
        },
        notifications: addNotificationToArray(
          state.notifications,
          `Joining room...`,
          'info'
        )
      });

      // Join room via websocket with token
      socket.joinRoom(response.room_token, false);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join room';
      updateState({
        isLoading: false,
        error: message,
        notifications: addNotificationToArray(
          state.notifications,
          `Failed to join room: ${message}`,
          'error'
        )
      });
      throw error;
    }
  },

  spectateRoom: async (roomKey: string): Promise<void> => {
    if (!state.player.isAuthenticated) {
      throw new Error('Must be logged in to spectate a room');
    }

    updateState({ isLoading: true, error: null });

    try {
      const response = await joinSpecificRoom(
        roomKey,
        parseInt(state.player.id),
        true // as_spectator
      );

      updateState({
        isLoading: false,
        notifications: addNotificationToArray(
          state.notifications,
          `Joining room as spectator...`,
          'info'
        )
      });

      // Join room via websocket with spectator token
      socket.joinRoom(response.room_token, true);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to spectate room';
      updateState({
        isLoading: false,
        error: message,
        notifications: addNotificationToArray(
          state.notifications,
          `Failed to spectate room: ${message}`,
          'error'
        )
      });
      throw error;
    }
  },

  leaveRoom: async (): Promise<void> => {
    if (!state.room) {
      return;
    }

    try {
      await leaveRoom(
        state.room.id,
        parseInt(state.player.id),
        true // at_round_end
      );

      // Leave room via websocket
      socket.leaveRoom();

      updateState({
        notifications: addNotificationToArray(
          state.notifications,
          'Left the room',
          'info'
        )
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to leave room';
      updateState({
        notifications: addNotificationToArray(
          state.notifications,
          `Failed to leave room: ${message}`,
          'error'
        )
      });
    }
  },

  skipNext: async (): Promise<void> => {
    if (!state.room) {
      throw new Error('Not in a room');
    }

    try {
      await skipNext(state.room.id, parseInt(state.player.id));

      updateState({
        notifications: addNotificationToArray(
          state.notifications,
          'Will skip the next round',
          'info'
        )
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to skip round';
      updateState({
        notifications: addNotificationToArray(
          state.notifications,
          `Failed to skip round: ${message}`,
          'error'
        )
      });
      throw error;
    }
  },
});

// Game Actions
export const createGameplayActions = ({ state, updateState, socket }: GameActionsContext) => ({
  commitChoice: async (choice: number): Promise<void> => {
    if (!state.round || !state.round.roundKey) {
      throw new Error('No active round');
    }

    if (state.commitState.hasCommitted) {
      throw new Error('Already committed for this round');
    }

    if (choice < 0 || choice >= (state.round.nouns?.length || 0)) {
      throw new Error('Invalid choice');
    }

    try {
      // Generate nonce and hash for commit-reveal protocol
      const nonce = Math.random().toString(36).substring(2, 15);
      const hash = await generateCommitHash(
        parseInt(state.player.id),
        state.round.roundKey,
        choice,
        nonce
      );

      // Submit commit via websocket
      socket.commit(hash);

      // Update local state
      updateState({
        commitState: {
          hasCommitted: true,
          hasRevealed: false,
          choice,
          nonce,
          hash,
        },
        lastChoice: choice,
        notifications: addNotificationToArray(
          state.notifications,
          `Choice submitted: ${state.round.nouns?.[choice] || 'Unknown'}`,
          'success'
        )
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to commit choice';
      updateState({
        notifications: addNotificationToArray(
          state.notifications,
          `Failed to commit choice: ${message}`,
          'error'
        )
      });
      throw error;
    }
  },

  sendEmote: (emote: string): void => {
    if (!state.isInRoom) {
      updateState({
        notifications: addNotificationToArray(
          state.notifications,
          'Must be in a room to send emotes',
          'warning'
        )
      });
      return;
    }

    socket.sendEmote(emote);
  },

  toggleSpectatorQueue: (): void => {
    const wantsToJoin = !state.queueState.isInQueue;
    socket.toggleQueue(wantsToJoin);
  },
});

// Navigation Actions
export const createNavigationActions = ({ state, updateState }: GameActionsContext) => ({
  setCurrentView: (view: Screen): void => {
    updateState({
      previousView: state.currentView,
      currentView: view,
    });
  },

  goBack: (): void => {
    if (state.previousView) {
      updateState({
        currentView: state.previousView,
        previousView: null,
      });
    }
  },
});

// Settings Actions
export const createSettingsActions = ({ state, updateState }: GameActionsContext) => ({
  updateSetting: (key: keyof GameSettings, value: boolean): void => {
    const newSettings = {
      ...state.settings,
      [key]: value,
    };

    updateState({
      settings: newSettings,
    });

    saveSettingsToStorage(newSettings);
  },
});

// Notification Actions
export const createNotificationActions = ({ state, updateState }: GameActionsContext) => ({
  addNotification: (message: string, type: Notification['type'] = 'info'): void => {
    updateState({
      notifications: addNotificationToArray(state.notifications, message, type)
    });
  },

  removeNotification: (id: string): void => {
    updateState({
      notifications: state.notifications.filter(n => n.id !== id)
    });
  },

  clearNotifications: (): void => {
    updateState({
      notifications: []
    });
  },
});

// Socket Event Handlers - These handle incoming websocket events
export const createSocketEventHandlers = ({ state, updateState }: GameActionsContext) => ({
  // Connection events
  onConnect: (): void => {
    updateState({
      isConnecting: false,
      notifications: addNotificationToArray(
        state.notifications,
        'Connected to game server',
        'success'
      )
    });

    // Rejoin player if authenticated
    if (state.player.isAuthenticated) {
      socket.joinPlayer(parseInt(state.player.id));
    }
  },

  onDisconnect: (): void => {
    updateState({
      isConnecting: false,
      notifications: addNotificationToArray(
        state.notifications,
        'Disconnected from game server',
        'warning'
      )
    });
  },

  // Player events
  onPlayerJoinedGame: (data: { player_id: number; username: string; balance: number }): void => {
    // Confirm player authentication
    updateState({
      player: {
        ...state.player,
        id: data.player_id.toString(),
        username: data.username,
        balance: data.balance,
        isAuthenticated: true,
      }
    });
  },

  // Room events
  onRoomJoined: (data: any): void => {
    updateState({
      isInRoom: true,
      currentView: data.spectators !== undefined && data.spectators > 0 ? 'spectator' : 'waiting-room',
      room: {
        id: data.room_key_last_5 || 'unknown',
        tier: data.tier || 'casual',
        stake: data.stake || 0,
        entryFee: data.entry_fee || 0,
        minPlayers: 2,
        maxPlayers: data.capacity || 12,
        currentPlayers: data.player_count || 0,
        phase: data.state || 'waiting',
        spectators: data.spectators || 0,
      },
      prizePool: data.pot || 0,
      capacity: data.capacity || 12,
      notifications: addNotificationToArray(
        state.notifications,
        'Joined room successfully',
        'success'
      )
    });
  },

  onPlayerJoinedRoom: (data: { username: string; is_spectator: boolean; player_count: number }): void => {
    updateState({
      room: state.room ? {
        ...state.room,
        currentPlayers: data.player_count,
      } : null,
      notifications: addNotificationToArray(
        state.notifications,
        `${data.username} ${data.is_spectator ? 'is spectating' : 'joined the game'}`,
        'info'
      )
    });
  },

  onPlayerLeftRoom: (data: { username: string; player_count: number }): void => {
    updateState({
      room: state.room ? {
        ...state.room,
        currentPlayers: data.player_count,
      } : null,
      notifications: addNotificationToArray(
        state.notifications,
        `${data.username} left the room`,
        'info'
      )
    });
  },

  onRoomLeft: (): void => {
    updateState({
      isInRoom: false,
      currentView: 'home',
      room: null,
      round: null,
      currentRound: null,
      results: null,
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
      prizePool: 0,
      notifications: addNotificationToArray(
        state.notifications,
        'Left the room',
        'info'
      )
    });
  },

  onRemovedFromRoom: (data: { message: string }): void => {
    updateState({
      isInRoom: false,
      currentView: 'home',
      room: null,
      round: null,
      currentRound: null,
      results: null,
      commitState: {
        hasCommitted: false,
        hasRevealed: false,
        choice: null,
        nonce: null,
        hash: null,
      },
      notifications: addNotificationToArray(
        state.notifications,
        data.message || 'Removed from room',
        'warning'
      )
    });
  },

  // Game flow events
  onDeal: (data: {
    round_key: string;
    adjective: string;
    nouns: string[];
    selection_deadline: string;
    selection_duration: number;
    pot: number;
  }): void => {
    const deadline = new Date(data.selection_deadline).getTime();
    const now = Date.now();
    const timeLeft = Math.max(0, deadline - now);

    updateState({
      currentView: 'round-select',
      round: {
        id: generateId(),
        roundKey: data.round_key,
        adjective: data.adjective,
        nouns: data.nouns,
        timeLeft: timeLeft,
        playersLockedIn: 0,
        phase: 'selecting',
        resultsRevealed: false,
        selectionDeadline: deadline,
        selectionDuration: data.selection_duration,
      },
      currentRound: {
        id: generateId(),
        roundKey: data.round_key,
        adjective: data.adjective,
        nouns: data.nouns,
        timeLeft: timeLeft,
        playersLockedIn: 0,
        phase: 'selecting',
        resultsRevealed: false,
        selectionDeadline: deadline,
        selectionDuration: data.selection_duration,
      },
      prizePool: data.pot,
      commitState: {
        hasCommitted: false,
        hasRevealed: false,
        choice: null,
        nonce: null,
        hash: null,
      },
    });
  },

  onCommitsUpdate: (data: { commits_count: number; total_players: number }): void => {
    updateState({
      round: state.round ? {
        ...state.round,
        playersLockedIn: data.commits_count,
      } : null,
    });
  },

  onCommitAck: (data: { round_key: string }): void => {
    // Commit acknowledged by server
    updateState({
      notifications: addNotificationToArray(
        state.notifications,
        'Choice locked in',
        'success'
      )
    });
  },

  onRequestReveal: (data: { round_key: string; reveal_deadline: string }): void => {
    updateState({
      currentView: 'round-reveal',
      round: state.round ? {
        ...state.round,
        phase: 'revealing',
      } : null,
    });

    // Auto-reveal if we have a valid commit
    if (state.commitState.hasCommitted && state.commitState.choice !== null && state.commitState.nonce) {
      socket.reveal(
        state.commitState.choice,
        state.commitState.nonce,
        data.round_key
      );

      updateState({
        commitState: {
          ...state.commitState,
          hasRevealed: true,
        }
      });
    }
  },

  onRevealAck: (data: { round_key: string }): void => {
    updateState({
      commitState: {
        ...state.commitState,
        hasRevealed: true,
      }
    });
  },

  onRevealInvalid: (data: { round_key: string }): void => {
    updateState({
      notifications: addNotificationToArray(
        state.notifications,
        'Invalid reveal - random choice assigned',
        'warning'
      ),
      commitState: {
        ...state.commitState,
        hasRevealed: true,
      }
    });
  },

  onRoundResults: (data: {
    round_key: string;
    adjective: string;
    nouns: string[];
    selection_counts: number[];
    your_choice: number;
    pot: number;
    payout: number;
    new_balance: number;
  }): void => {
    const totalSelections = data.selection_counts.reduce((sum, count) => sum + count, 0);
    const choices = data.nouns.map((noun, index) => ({
      noun,
      playerCount: data.selection_counts[index],
      percentage: totalSelections > 0 ? (data.selection_counts[index] / totalSelections) * 100 : 0,
    }));

    updateState({
      currentView: 'waiting-room',
      results: {
        roundId: generateId(),
        roundKey: data.round_key,
        choices,
        adjective: data.adjective,
        nouns: data.nouns,
        selectionCounts: data.selection_counts,
        yourChoice: data.your_choice,
        playerChoice: data.your_choice,
        winnings: data.payout,
        isCorrect: data.payout > 0,
      },
      player: {
        ...state.player,
        balance: data.new_balance,
      },
      round: state.round ? {
        ...state.round,
        phase: 'complete',
        resultsRevealed: true,
      } : null,
      notifications: addNotificationToArray(
        state.notifications,
        data.payout > 0 ? `You won ${data.payout} coins!` : 'Better luck next round',
        data.payout > 0 ? 'success' : 'info'
      )
    });
  },

  onNextRoundInfo: (data: {
    start_time: string;
    player_count: number;
    spectators: number;
    pot: number;
  }): void => {
    updateState({
      room: state.room ? {
        ...state.room,
        currentPlayers: data.player_count,
        spectators: data.spectators,
      } : null,
      prizePool: data.pot,
    });
  },

  // Player interaction events
  onPlayerEmote: (data: { emote: string; username: string; timestamp: number }): void => {
    const emoteId = generateId();
    updateState({
      recentEmotes: addEmoteToArray(
        state.recentEmotes,
        generateId(),
        data.username,
        data.emote
      )
    });

    // Auto-remove emote after 5 seconds
    setupEmoteAutoRemoval(emoteId, (id) => {
      updateState({
        recentEmotes: state.recentEmotes.filter(e => e.id !== id)
      });
    });
  },

  // Queue events
  onQueueUpdate: (data: { position: number; total_waiting: number }): void => {
    updateState({
      queueState: {
        isInQueue: true,
        position: data.position,
        estimatedWaitTime: data.position * 30, // Estimate 30 seconds per position
      }
    });
  },

  // Game state for spectators
  onGameState: (data: {
    adjective: string;
    nouns: string[];
    selection_deadline: string;
    commits_count: number;
  }): void => {
    // Update spectator with current round state
    const deadline = new Date(data.selection_deadline).getTime();
    const now = Date.now();
    const timeLeft = Math.max(0, deadline - now);
// Game actions for Think Alike - handles all player interactions and game state changes
    updateState({
      currentView: 'spectator',
      round: {
        id: generateId(),
        roundKey: 'spectator',
        adjective: data.adjective,
        nouns: data.nouns,
        timeLeft: timeLeft,
        playersLockedIn: data.commits_count,
        phase: 'selecting',
        resultsRevealed: false,
        selectionDeadline: deadline,
        selectionDuration: null,
      },
    });
  },

  // Error handling
  onError: (data: { message: string; method?: string }): void => {
    updateState({
      error: data.message,
      notifications: addNotificationToArray(
        state.notifications,
        data.message,
        'error'
      )
    });
  },

  onGameError: (data: { message: string }): void => {
    updateState({
      error: data.message,
      notifications: addNotificationToArray(
        state.notifications,
        data.message,
        'error'
      )
    });
  },
});

// Utility actions
export const createUtilityActions = ({ state, updateState }: GameActionsContext) => ({
  setQuickStake: (stake: number): void => {
    updateState({ stake });
  },

  setEndOfRoundAction: (action: EndOfRoundAction): void => {
    // This would be stored in state if we add it to the GameState interface
    // For now, we can handle it in the component level
  },

  setLeaveAtEnd: (leave: boolean): void => {
    // This would trigger a scheduled leave via the API
    if (leave && state.room) {
      // The leaveRoom action already handles at_round_end=true by default
    }
  },
});

// Combined actions factory
export const createGameActions = (context: GameActionsContext) => ({
  ...createAuthActions(context),
  ...createRoomActions(context),
  ...createGameplayActions(context),
  ...createNavigationActions(context),
  ...createSettingsActions(context),
  ...createNotificationActions(context),
  ...createUtilityActions(context),
});

// Export socket event handlers factory
export const createAllSocketEventHandlers = (context: GameActionsContext) =>
  createSocketEventHandlers(context);

import { GameState } from './types';
import { createSocketEventHandlers, GameStateUpdater, SocketEventHandlers } from './socketHandlers';

export interface WebSocketManager {
  socket: WebSocket | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: () => boolean;
  send: (event: string, data?: any) => void;
}

export const createWebSocketManager = (
  state: GameState,
  updateState: GameStateUpdater,
  socketUrl: string
): WebSocketManager => {
  let socket: WebSocket | null = null;
  let eventHandlers: SocketEventHandlers | null = null;

  const connect = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        updateState({ isConnecting: true });

        socket = new WebSocket(socketUrl);
        eventHandlers = createSocketEventHandlers(state, updateState);

        socket.onopen = () => {
          updateState({ isConnecting: false });
          resolve();
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { type, data } = message;

            // Route the message to the appropriate handler
            switch (type) {
              case 'player_joined_room':
                eventHandlers?.onPlayerJoinedRoom(data);
                break;
              case 'player_left_room':
                eventHandlers?.onPlayerLeftRoom(data);
                break;
              case 'room_update':
                eventHandlers?.onRoomUpdate(data);
                break;
              case 'deal':
                eventHandlers?.onDeal(data);
                break;
              case 'round_start':
                eventHandlers?.onRoundStart(data);
                break;
              case 'round_results':
                eventHandlers?.onRoundResults(data);
                break;
              case 'player_committed':
                eventHandlers?.onPlayerCommitted(data);
                break;
              case 'emote':
                eventHandlers?.onEmote(data);
                break;
              case 'queue_update':
                eventHandlers?.onQueueUpdate(data);
                break;
              case 'player_update':
                eventHandlers?.onPlayerUpdate(data);
                break;
              case 'error':
                eventHandlers?.onError(data);
                break;
              default:
                console.warn('Unknown socket message type:', type);
            }
          } catch (error) {
            console.error('Failed to parse socket message:', error);
          }
        };

        socket.onclose = () => {
          eventHandlers?.onDisconnect();
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (state.player.isAuthenticated) {
              connect().then(() => {
                eventHandlers?.onReconnect();
              }).catch((error) => {
                console.error('Reconnection failed:', error);
              });
            }
          }, 3000);
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          updateState({ isConnecting: false });
          reject(error);
        };

      } catch (error) {
        updateState({ isConnecting: false });
        reject(error);
      }
    });
  };

  const disconnect = () => {
    if (socket) {
      socket.close();
      socket = null;
      eventHandlers = null;
    }
  };

  const isConnected = (): boolean => {
    return socket?.readyState === WebSocket.OPEN;
  };

  const send = (event: string, data?: any) => {
    if (isConnected()) {
      const message = JSON.stringify({ type: event, data });
      socket?.send(message);
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  };

  return {
    socket,
    connect,
    disconnect,
    isConnected,
    send,
  };
};

// Socket.IO client for Think Alike web frontend
// Provides WebSocket connection management and game event handling

import io from "socket.io-client"
import { CONFIG } from "./config"

// --- Event Payload Interfaces ---

export interface DealEvent {
  round_key: string
  adjective: string
  nouns: string[]
  selection_deadline: string
  selection_duration: number
  pot: number
}

export interface RoundResultsEvent {
  round_key: string
  adjective: string
  nouns: string[]
  selection_counts: number[]
  your_choice: number
  pot: number
  payout: number
  new_balance: number
}

// --- GameSocket Abstraction ---

export interface GameSocket {
  connect: () => void
  disconnect: () => void
  isConnected: () => boolean
  on: (event: string, handler: (...args: any[]) => void) => void
  off: (event: string, handler?: (...args: any[]) => void) => void
  joinPlayer: (playerId: number) => void
  joinRoom: (roomToken: string, asSpectator?: boolean) => void
  leaveRoom: () => void
  commit: (hash: string) => void
  reveal: (choice: number, nonce: string, roundKey: string) => void
  sendEmote: (emote: string) => void
  toggleQueue: (wantsToJoin: boolean) => void
}

/**
 * Creates and configures a Socket.IO client for the game.
 */
export function createGameSocket(): GameSocket {
  let socket: ReturnType<typeof io> | null = null
  let isConnecting = false

  // Queue for event handlers registered before connection is established
  const handlerQueue = new Map<string, ((...args: any[]) => void)[]>()
  // Track registered handlers for cleanup
  const registeredHandlers = new Map<string, ((...args: any[]) => void)[]>()

  const on = (event: string, handler: (...args: any[]) => void) => {
    // Always queue handlers to ensure they survive reconnections
    if (!handlerQueue.has(event)) {
      handlerQueue.set(event, [])
    }
    handlerQueue.get(event)!.push(handler)

    // If socket is connected, also register immediately
    if (socket?.connected) {
      socket.on(event, handler)

      // Track for cleanup
      if (!registeredHandlers.has(event)) {
        registeredHandlers.set(event, [])
      }
      registeredHandlers.get(event)!.push(handler)
    }
  }

  const off = (event: string, handler?: (...args: any[]) => void) => {
    // Remove from queue
    if (handler && handlerQueue.has(event)) {
      const handlers = handlerQueue.get(event)!
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    } else if (!handler) {
      handlerQueue.delete(event)
    }

    // Remove from socket if connected
    if (socket) {
      if (handler) {
        socket.off(event, handler)
      } else {
        socket.off(event)
      }
    }

    // Clean up tracking
    if (handler && registeredHandlers.has(event)) {
      const handlers = registeredHandlers.get(event)!
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    } else if (!handler) {
      registeredHandlers.delete(event)
    }
  }

  const registerQueuedHandlers = () => {
    if (!socket) return

    // Clear existing tracked handlers
    registeredHandlers.forEach((handlers, event) => {
      handlers.forEach(handler => socket!.off(event, handler))
    })
    registeredHandlers.clear()

    // Register all queued handlers
    handlerQueue.forEach((handlers, event) => {
      handlers.forEach(handler => {
        socket!.on(event, handler)

        // Track for cleanup
        if (!registeredHandlers.has(event)) {
          registeredHandlers.set(event, [])
        }
        registeredHandlers.get(event)!.push(handler)
      })
    })
  }

  const connect = () => {
    if (socket?.connected || isConnecting) return

    isConnecting = true

    try {
      const url = new URL(CONFIG.WS_NAMESPACE, CONFIG.WS_URL).toString()
      socket = io(url, {
        reconnection: true,
        transports: ["websocket"],
      })

      socket.on("connect", () => {
        isConnecting = false
        registerQueuedHandlers()

        if (process.env.NODE_ENV === "development") {
          console.log("[WS] << connect: WebSocket connected.")
        }
      })

      socket.on("disconnect", (reason: string) => {
        isConnecting = false
        if (process.env.NODE_ENV === "development") {
          console.log("[WS] << disconnect: WebSocket disconnected:", reason)
        }
      })

      socket.on("connect_error", (err: Error) => {
        isConnecting = false
        if (process.env.NODE_ENV === "development") {
          console.error("[WS] << connect_error: WebSocket connection error:", err)
        }
      })

      // Development logging for specific events
      if (process.env.NODE_ENV === "development") {
        const eventsToLog = [
          'player_joined_game', 'room_joined', 'player_joined_room', 'player_left_room',
          'deal', 'commits_update', 'request_reveal', 'round_results', 'next_round_info',
          'commit_ack', 'reveal_ack', 'reveal_invalid', 'player_emote', 'queue_update',
          'game_state', 'removed_from_room', 'error', 'game_error'
        ]

        const loggedHandlers: Array<() => void> = []

        eventsToLog.forEach(eventName => {
          const handler = (data: any) => {
            console.log(`[WS] << ${eventName}`, data || "No Data")
          }
          socket!.on(eventName, handler)
          loggedHandlers.push(() => socket?.off(eventName, handler))
        })

        // Clean up debug handlers on disconnect
        socket.on("disconnect", () => {
          loggedHandlers.forEach(cleanup => cleanup())
        })
      }

    } catch (error) {
      isConnecting = false
      throw error
    }
  }

  const disconnect = () => {
    if (socket) {
      // Clean up all tracked handlers
      registeredHandlers.forEach((handlers, event) => {
        handlers.forEach(handler => socket!.off(event, handler))
      })
      registeredHandlers.clear()

      socket.disconnect()
      socket = null
    }
    isConnecting = false
  }

  const isConnected = () => socket?.connected ?? false

  const emit = (event: string, data?: object): boolean => {
    if (!socket?.connected) {
      if (process.env.NODE_ENV === "development") {
        console.error(`Socket not connected. Cannot emit event: ${event}`)
      }
      return false
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[WS] >> ${event}`, data || "No Data")
    }

    socket.emit(event, data)
    return true
  }

  return {
    connect,
    disconnect,
    isConnected,
    on,
    off,
    joinPlayer: (playerId) => emit("join_player", { player_id: playerId }),
    joinRoom: (roomToken, asSpectator = false) =>
      emit("join_room", { room_token: roomToken, as_spectator: asSpectator }),
    leaveRoom: () => emit("leave_room", {}),
    commit: (hash) => emit("commit", { hash }),
    reveal: (choice, nonce, roundKey) => emit("reveal", { choice, nonce, round_key: roundKey }),
    sendEmote: (emote) => emit("send_emote", { emote }),
    toggleQueue: (wantsToJoin) => emit("spectator_queue", { want_to_join: wantsToJoin }),
  }
}

// --- Cryptographic Utilities ---

/**
 * Generates a SHA256 hash for the commit-reveal protocol.
 */
export async function generateCommitHash(
  playerId: number,
  roundKey: string,
  choice: number,
  nonce: string
): Promise<string> {
  const payload = `${playerId}${roundKey}${choice}${nonce}`
  const encoder = new TextEncoder()
  const data = encoder.encode(payload)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
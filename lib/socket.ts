// Socket.IO client for Think Alike web frontend
// Provides WebSocket connection management and game event handling

import { io, Socket } from "socket.io-client"
import { CONFIG } from "./config"

export interface GameSocket {
  socket: Socket | null
  connect: () => void
  disconnect: () => void
  isConnected: () => boolean
  joinPlayer: (playerId: number) => void
  joinRoom: (roomToken: string, asSpectator?: boolean) => void
  leaveRoom: () => void
  commit: (hash: string) => void
  reveal: (choice: number, nonce: string, roundKey: string) => void
  sendEmote: (emote: string) => void
  spectatorQueue: (wantToJoin: boolean) => void
  on: (event: string, handler: (...args: any[]) => void) => void
  off: (event: string, handler?: (...args: any[]) => void) => void
}

// Game event interfaces based on WebSocket API docs
export interface DealEvent {
  event: "deal"
  round_key: string
  adjective: string
  nouns: string[]
  selection_deadline: string
  pot: number
}

export interface RequestRevealEvent {
  round_key: string
  reveal_deadline: string
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

export interface NextRoundInfoEvent {
  start_time: string
  player_count: number
  spectators: number
  pot: number
}

export interface PlayerJoinedGameEvent {
  player_id: number
  username: string
  balance: number
}

export interface RoomJoinedEvent {
  room_key_last_5: string
  err_code: number
  tier: string
  player_count: number
  spectators: number
  state: string
  pot: number
  capacity: number
}

export interface PlayerJoinedRoomEvent {
  username: string
  is_spectator: boolean
  player_count: number
}

export interface PlayerLeftRoomEvent {
  username: string
  player_count: number
}

export interface CommitsUpdateEvent {
  commits_count: number
  total_players: number
}

export interface PlayerEmoteEvent {
  emote: string
  username: string
  timestamp: number
}

export interface QueueUpdateEvent {
  position: number
  total_waiting: number
}

export interface ErrorEvent {
  message: string
  method?: string
}

/**
 * Create a new game socket instance
 * @returns GameSocket instance
 */
export function createGameSocket(): GameSocket {
  let socket: Socket | null = null

  const connect = () => {
    if (socket?.connected) return

    socket = io(CONFIG.WS_URL, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    })

    // Connection event logging
    socket.on("connect", () => {
      console.log("WebSocket connected to", CONFIG.WS_URL)
    })

    socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason)
    })

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error)
    })
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }

  const isConnected = () => {
    return socket?.connected ?? false
  }

  const joinPlayer = (playerId: number) => {
    if (!socket?.connected) {
      throw new Error("Socket not connected")
    }
    socket.emit("join_player", { player_id: playerId })
  }

  const joinRoom = (roomToken: string, asSpectator: boolean = false) => {
    if (!socket?.connected) {
      throw new Error("Socket not connected")
    }
    socket.emit("join_room", { room_token: roomToken, as_spectator: asSpectator })
  }

  const leaveRoom = () => {
    if (!socket?.connected) {
      throw new Error("Socket not connected")
    }
    socket.emit("leave_room", {})
  }

  const commit = (hash: string) => {
    if (!socket?.connected) {
      throw new Error("Socket not connected")
    }
    socket.emit("commit", { hash })
  }

  const reveal = (choice: number, nonce: string, roundKey: string) => {
    if (!socket?.connected) {
      throw new Error("Socket not connected")
    }
    socket.emit("reveal", { choice, nonce, round_key: roundKey })
  }

  const sendEmote = (emote: string) => {
    if (!socket?.connected) {
      throw new Error("Socket not connected")
    }
    socket.emit("send_emote", { emote })
  }

  const spectatorQueue = (wantToJoin: boolean) => {
    if (!socket?.connected) {
      throw new Error("Socket not connected")
    }
    socket.emit("spectator_queue", { want_to_join: wantToJoin })
  }

  const on = (event: string, handler: (...args: any[]) => void) => {
    if (!socket) {
      throw new Error("Socket not initialized")
    }
    socket.on(event, handler)
  }

  const off = (event: string, handler?: (...args: any[]) => void) => {
    if (!socket) {
      throw new Error("Socket not initialized")
    }
    if (handler) {
      socket.off(event, handler)
    } else {
      socket.off(event)
    }
  }

  return {
    socket,
    connect,
    disconnect,
    isConnected,
    joinPlayer,
    joinRoom,
    leaveRoom,
    commit,
    reveal,
    sendEmote,
    spectatorQueue,
    on,
    off,
  }
}

// Utility function to generate commit hash (SHA256)
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
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

// Utility function to generate random nonce
export function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("")
}

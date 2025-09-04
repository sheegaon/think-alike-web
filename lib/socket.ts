// Socket.IO client for Think Alike web frontend
// Provides WebSocket connection management and game event handling

import { io, type Socket } from "socket.io-client"
import { CONFIG } from "./config"

// --- Event Payload Interfaces ---

export interface DealEvent {
  round_key: string
  adjective: string
  nouns: string[]
  selection_deadline: string
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

// Defines the shape of the public interface for our socket wrapper
export interface GameSocket {
  connect: () => void
  disconnect: () => void
  isConnected: () => boolean
  on: (event: string, handler: (...args: any[]) => void) => void
  joinPlayer: (playerId: number) => void
  joinRoom: (roomToken: string, asSpectator?: boolean) => void
  leaveRoom: () => void
  commit: (hash: string) => void
  reveal: (choice: number, nonce: string, roundKey: string) => void
  sendEmote: (emote: string) => void
}

/**
 * Creates and configures a Socket.IO client for the game.
 * This function encapsulates the socket instance and exposes a clean API.
 */
export function createGameSocket(): GameSocket {
  let socket: Socket | null = null

  const connect = () => {
    if (socket?.connected) return

    // Use the URL from the centralized config
    socket = io(CONFIG.WS_URL, {
      reconnection: true,
      transports: ["websocket"],
    })

    socket.on("connect", () => console.log("WebSocket connected."))
    socket.on("disconnect", (reason: string) => console.log("WebSocket disconnected:", reason))
    socket.on("connect_error", (err: Error) => console.error("WebSocket connection error:", err))
  }

  const disconnect = () => {
    socket?.disconnect()
    socket = null
  }

  const isConnected = () => socket?.connected ?? false

  const on = (event: string, handler: (...args: any[]) => void) => {
    socket?.on(event, handler)
  }

  const emit = (event: string, data?: object) => {
    if (!isConnected()) {
      console.error(`Socket not connected. Cannot emit event: ${event}`)
      return
    }
    socket?.emit(event, data)
  }

  return {
    connect,
    disconnect,
    isConnected,
    on,
    joinPlayer: (playerId) => emit("join_player", { player_id: playerId }),
    joinRoom: (roomToken, asSpectator = false) => emit("join_room", { room_token: roomToken, as_spectator: asSpectator }),
    leaveRoom: () => emit("leave_room", {}),
    commit: (hash) => emit("commit", { hash }),
    reveal: (choice, nonce, roundKey) => emit("reveal", { choice, nonce, round_key: roundKey }),
    sendEmote: (emote) => emit("send_emote", { emote }),
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

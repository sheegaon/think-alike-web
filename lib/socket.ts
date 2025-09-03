import { io, type Socket } from "socket.io-client"
import { CONFIG } from "./config"

// Define event types for type safety
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

export interface NextRoundInfoEvent {
  start_time: string
  player_count: number
  spectators: number
  pot: number
}

// Define the interface for our game socket
export interface GameSocket {
  connect: () => void
  disconnect: () => void
  isConnected: () => boolean
  on: (event: string, callback: (...args: any[]) => void) => void
  joinPlayer: (playerId: number) => void
  joinRoom: (token: string, asSpectator: boolean) => void
  leaveRoom: () => void
  commit: (hash: string) => void
  reveal: (choice: number, nonce: string, roundKey: string) => void
  sendEmote: (emote: string) => void
}

/**
 * Creates and configures a Socket.IO client for the game
 */
export function createGameSocket(): GameSocket {
  const socket: Socket = io(CONFIG.WS_URL, {
    autoConnect: false,
    reconnection: true,
    transports: ["websocket"],
  })

  return {
    connect: () => socket.connect(),
    disconnect: () => socket.disconnect(),
    isConnected: () => socket.connected,
    on: (event, callback) => socket.on(event, callback),
    joinPlayer: (playerId) => socket.emit("join_player", { player_id: playerId }),
    joinRoom: (token, asSpectator) => socket.emit("join_room", { room_token: token, as_spectator: asSpectator }),
    leaveRoom: () => socket.emit("leave_room"),
    commit: (hash) => socket.emit("commit", { hash }),
    reveal: (choice, nonce, roundKey) => socket.emit("reveal", { choice, nonce, "round_key": roundKey }),
    sendEmote: (emote) => socket.emit("send_emote", { emote }),
  }
}

/**
 * Generates a SHA256 hash for the commit-reveal protocol
 * @param playerId - The player's ID
 * @param roundKey - The key for the current round
 * @param choice - The index of the player's chosen noun
 * @param nonce - A unique random string
 * @returns The SHA256 hash of the payload
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

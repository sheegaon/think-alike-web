// REST client for Think Alike web frontend
// Mirrors the CLI's REST.call() method with path placeholder replacement and error handling

import { CONFIG, type EndpointName } from "./config"

type Method = "GET" | "POST"

interface CallOptions {
  path?: Record<string, string | number>
  params?: Record<string, string | number>
  body?: any
  headers?: HeadersInit
}

/**
 * Make a REST API call using endpoint configuration
 * @param name - Endpoint name from CONFIG.ENDPOINTS
 * @param options - Request options (path params, query params, body, headers)
 * @returns Promise with JSON response
 */
export async function call<T = any>(
  name: EndpointName,
  options: CallOptions = {}
): Promise<T> {
  const { path = {}, params, body, headers } = options
  const endpoint = CONFIG.ENDPOINTS[name]
  
  // Replace path placeholders like {player_id} with actual values
  let url = CONFIG.API_BASE + endpoint.path.replace(/\{(\w+)\}/g, (_, key) => String(path[key]))
  
  // Add query parameters if provided
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })
    url += "?" + searchParams.toString()
  }

  const response = await fetch(url, {
    method: endpoint.method as Method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.detail) {
        throw new Error(errorJson.detail)
      }
    } catch (e) {
      // Not a JSON response or no "detail" field
    }
    throw new Error(`${response.status}: ${errorText}`)
  }

  return response.json()
}

// Convenience functions for common endpoints

export interface PlayerResponse {
  id: number
  username: string
  balance: number
  rating: number
  achievements: string[]
  created_at: string
}

export interface RoomResponse {
    room_key: string;
    tier: string;
    stake: number;
    player_count: number;
    max_players: number;
    spectators: number;
    state: string;
    pot: number;
    entry_fee: number;
}

export interface RoomListResponse {
    rooms: RoomResponse[];
    total: number;
}

export interface RoomQuickJoinResponse {
  failure_code: number
  room_key: string
  room_token: string
  tier: string
  stake: number
  player_count: number
  entry_fee: number
}

export interface RoomLeaveResponse {
  success: boolean
  scheduled: boolean
  room_key: string
  player_count: number
  spectators: number
  state: string
}

export interface RoomSkipResponse {
  success: boolean
  room_key: string
}

export interface LeaderboardEntry {
  id: number
  username: string
  rating: number
  balance: number
  wins: number
  games_played: number
  win_rate: number
  achievements: string[]
  rank: number
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  total_players: number
  current_player_rank: number | null
}

/**
 * Health check endpoint
 */
export async function health() {
  return call("health")
}

/**
 * Create a new player
 * @param username - Player username
 */
export async function createPlayer(username: string): Promise<PlayerResponse> {
  return call("players_create", { body: { username } })
}

/**
 * Get player by username
 * @param username - Player username
 */
export async function getPlayerByUsername(username: string): Promise<PlayerResponse> {
  return call("players_by_username", { path: { username } })
}

/**
 * Create or get existing player by username
 * @param username - Player username
 */
export async function createOrGetPlayer(username: string): Promise<PlayerResponse> {
  try {
    return await getPlayerByUsername(username)
  } catch (error: any) {
    // If player is not found (404), create a new one
    if (error.message.includes("Not Found")) {
      return await createPlayer(username)
    }
    // Re-throw other errors
    throw error
  }
}

/**
 * Get list of available rooms
 * @param tier - Optional tier to filter by
 */
export async function getRooms(tier?: string): Promise<RoomListResponse> {
  const params = tier ? { tier } : {}
  return call("rooms_list", { params })
}

/**
 * Quick join a room
 * @param player_id - Player ID
 * @param tier - Room tier (optional)
 * @param as_spectator - Join as spectator (default: false)
 */
export async function quickJoinRoom(
  player_id: number,
  tier?: string,
  as_spectator: boolean = false
): Promise<RoomQuickJoinResponse> {
  return call("rooms_quick_join", {
    body: { player_id, tier, as_spectator }
  })
}

/**
 * Leave a room
 * @param room_key - Room key
 * @param player_id - Player ID
 * @param at_round_end - Leave at round end (default: true)
 */
export async function leaveRoom(
  room_key: string,
  player_id: number,
  at_round_end: boolean = true
): Promise<RoomLeaveResponse> {
  return call("rooms_leave", {
    body: { room_key, player_id, at_round_end }
  })
}

/**
 * Skip next round
 * @param room_key - Room key
 * @param player_id - Player ID
 */
export async function skipNext(
  room_key: string,
  player_id: number
): Promise<RoomSkipResponse> {
  return call("rooms_skip", {
    body: { room_key, player_id }
  })
}

/**
 * Get leaderboard
 * @param limit - Number of entries (default: 50)
 * @param offset - Offset for pagination (default: 0)
 * @param current_player_id - Current player ID for rank (optional)
 */
export async function getLeaderboard(
  limit: number = 50,
  offset: number = 0,
  current_player_id?: number
): Promise<LeaderboardResponse> {
  const params: Record<string, string | number> = { limit, offset }
  if (current_player_id) {
    params.current_player_id = current_player_id
  }
  return call("leaderboard", { params })
}

// REST client for Think Alike web frontend

import { CONFIG, type EndpointName } from "./config"

type Method = "GET" | "POST"

interface CallOptions {
  path?: Record<string, string | number>
  params?: Record<string, string | number>
  body?: any
  headers?: HeadersInit
}

export async function call<T = any>(
  name: EndpointName,
  options: CallOptions = {}
): Promise<T> {
  const { path = {}, params, body, headers } = options
  const endpoint = CONFIG.ENDPOINTS[name]

  let url = CONFIG.API_BASE + endpoint.path.replace(/{(\w+)}/g, (_, key) => String(path[key]))

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
    let errorMessage = `${response.status}: ${errorText}`
    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.detail) {
        errorMessage = errorJson.detail
      }
    } catch (e) {
      // Not a JSON response, use the default error message
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

// --- API Response Interfaces ---

export interface PlayerResponse {
  id: number
  username: string
  balance: number
  rating: number
  achievements: string[]
  created_at: string
}

export interface RoomResponse {
  room_key: string
  tier: string
  stake: number
  player_count: number
  max_players: number
  spectators: number
  state: string
  pot: number
  entry_fee: number
}

export interface RoomListResponse {
  rooms: RoomResponse[]
  total: number
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

// --- API Convenience Functions ---

export async function createPlayer(username: string): Promise<PlayerResponse> {
  return call("players_create", { body: { username } })
}

export async function getPlayerByUsername(username: string): Promise<PlayerResponse> {
  return call("players_by_username", { path: { username } })
}

export async function createOrGetPlayer(username: string): Promise<PlayerResponse> {
  try {
    return await getPlayerByUsername(username)
  } catch (error: any) {
    if (error.message.includes("Not Found")) {
      return await createPlayer(username)
    }
    throw error
  }
}

export async function getRooms(tier?: string): Promise<RoomListResponse> {
  const params = tier ? { tier } : undefined
  return call("rooms_list", { params })
}

export async function quickJoinRoom(
  player_id: number,
  tier?: string,
  as_spectator: boolean = false
): Promise<RoomQuickJoinResponse> {
  return call("rooms_quick_join", {
    body: { player_id, tier, as_spectator },
  })
}

export async function leaveRoom(
  room_key: string,
  player_id: number,
  at_round_end: boolean = true
): Promise<RoomLeaveResponse> {
  return call("rooms_leave", {
    body: { room_key, player_id, at_round_end },
  })
}

export async function skipNext(
  room_key: string,
  player_id: number
): Promise<RoomSkipResponse> {
  return call("rooms_skip", {
    body: { room_key, player_id },
  })
}

/*
// Unused functions - can be re-enabled when needed

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

export async function health() {
  return call("health")
}

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
*/

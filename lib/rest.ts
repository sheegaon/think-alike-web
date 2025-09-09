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

  if (process.env.NODE_ENV === "development") {
    console.log(`[REST] >> ${endpoint.method} ${url}`, { body: body || "No Body" })
  }

  const response = await fetch(url, {
    method: endpoint.method as Method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (process.env.NODE_ENV === "development") {
    const clonedResponse = response.clone()
    try {
      const responseData = await clonedResponse.json()
      console.log(`[REST] << ${response.status} ${url}`, responseData)
    } catch {
      const responseText = await clonedResponse.text()
      console.log(`[REST] << ${response.status} ${url}`, responseText)
    }
  }

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

export interface RoomSummaryItem {
  tier: string;
  player_count: number;
  stake: number;
  entry_fee: number;
}

export interface RoomSummaryResponse {
  summary: RoomSummaryItem[];
}

export interface RoomJoinResponse {
  err_code: number
  room_token: string
  room_key: string
  tier: string
  stake: number
  entry_fee: number
  player_count: number
  spectators: number
  capacity: number
  allow_spectators: boolean
  state: string
  new_balance: number
}

export interface RoomQuickJoinResponse {
  err_code: number
  room_key: string
  room_token: string
  tier: string
  stake: number
  player_count: number
  entry_fee: number
  new_balance: number
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

export interface Quest {
  quest_id: string
  name: string
  description: string
  reward: number
  quest_type: string
  progress: number
  required: number
  completed: boolean
  claimable: boolean
}

export interface QuestsResponse {
  quests: Quest[]
  claimable_count: number
  total_claimable_coins: number
}

export interface QuestClaimResponse {
  success: boolean
  reward_amount: number
  new_balance: number
  message: string
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
    if (error.message.toLowerCase().includes("not found")) {
      return await createPlayer(username)
    }
    throw error
  }
}

export function getRooms(tier: string): Promise<RoomListResponse>;
export function getRooms(): Promise<RoomSummaryResponse>;
export async function getRooms(tier?: string): Promise<RoomListResponse | RoomSummaryResponse> {
  if (tier) {
    const params = { tier };
    return call("rooms_list", { params });
  } else {
    return call("rooms_summary", {});
  }
}

export async function quickJoinRoom(
    player_id: number,
    tier?: null | string,
    as_spectator: boolean = false
): Promise<RoomQuickJoinResponse> {
  return call("rooms_quick_join", {
    body: { player_id, tier, as_spectator },
  })
}

export async function joinSpecificRoom(
  room_key: string,
  player_id: number,
  as_spectator: boolean
): Promise<RoomJoinResponse> {
  return call("rooms_join", {
    body: { room_key, player_id, as_spectator },
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

export async function getPlayerQuests(player_id: number): Promise<QuestsResponse> {
  return call("players_quests", { path: { player_id } })
}

export async function claimQuestReward(
  player_id: number,
  quest_id: string
): Promise<QuestClaimResponse> {
  return call("players_claim_reward", {
    path: { player_id },
    body: { quest_id, player_id },
  })
}

/*
// Unused functions - can be re-enabled when needed

export async function health() {
  return call("health")
}

*/

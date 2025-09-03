const localConfig = {
  API_BASE: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1",
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8000",
  ENDPOINTS: {
    health: { method: "GET", path: "/health" },
    players_create: { method: "POST", path: "/players" },
    players_get: { method: "GET", path: "/players/{player_id}" },
    players_by_username: { method: "GET", path: "/players/username/{username}" },
    players_stats: { method: "GET", path: "/players/{player_id}/stats" },
    players_quests: { method: "GET", path: "/players/{player_id}/quests" },
    players_claim_reward: { method: "POST", path: "/players/{player_id}/claim-reward" },
    rooms_list: { method: "GET", path: "/rooms" },
    rooms_details: { method: "GET", path: "/rooms/{room_key}" },
    rooms_join: { method: "POST", path: "/rooms/join" },
    rooms_quick_join: { method: "POST", path: "/rooms/quick-join" },
    rooms_leave: { method: "POST", path: "/rooms/leave" },
    rooms_skip: { method: "POST", path: "/rooms/skip" },
    rooms_events: { method: "GET", path: "/rooms/{room_key}/events" },
    leaderboard: { method: "GET", path: "/leaderboard" },
    game_stats: { method: "GET", path: "/game/stats" },
  },
}

export const CONFIG = localConfig
export type EndpointName = keyof typeof CONFIG.ENDPOINTS
export type ConfigType = typeof CONFIG

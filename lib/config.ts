// Config loader for Think Alike web frontend
// Imports config JSON at build time and allows NEXT_PUBLIC_* env overrides

import herokuConfig from "../app/heroku_config.json"
import localConfig from "../app/local_config.json"

// Use local config in development, heroku config in production
const isDevelopment = false // Force production config to use heroku_config.json
const rawConfig = isDevelopment ? localConfig : herokuConfig

export const CONFIG = {
  // WebSocket configuration
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || rawConfig.WS_URL || "http://localhost:8000",
  WS_NAMESPACE: process.env.NEXT_PUBLIC_WS_NAMESPACE || rawConfig.WS_NAMESPACE || "/",
  ENDPOINTS: rawConfig.ENDPOINTS,

  // API configuration
  API_BASE: process.env.NEXT_PUBLIC_API_BASE || rawConfig.API_BASE,
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",

  // Game configuration
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
} as const

export type EndpointName = keyof typeof CONFIG.ENDPOINTS
export type ConfigType = typeof CONFIG

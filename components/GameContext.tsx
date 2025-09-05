"use client"

import { createContext, useContext, useState, useRef, useEffect, type ReactNode, useCallback } from "react"
import * as rest from "@/lib/rest"
import { createGameSocket, type GameSocket, type DealEvent, type RoundResultsEvent, generateCommitHash } from "@/lib/socket"

// --- TYPE DEFINITIONS ---

interface Player {
  username: string
  isSpectator: boolean
}

interface GameSettings {
  sound: boolean
  haptics: boolean
  quickAdvance: boolean
}

export type GamePhase = "WAITING" | "SELECT" | "REVEAL" | "RESULTS" | null
export type EndOfRoundAction = "continue" | "sit_out" | "leave"

interface GameState {
  // Player State
  playerId: number | null
  username: string
  balance: number
  isPlayerJoined: boolean

  // Room & Game State
  inRoom: boolean
  roomKey: string | null
  gamePhase: GamePhase
  players: Player[]
  spectators: number
  tier: string | null
  stake: number
  lastStake: number | null
  lastTier: string | null

  // Round-specific State
  round: DealEvent | null
  results: RoundResultsEvent | null
  lastChoice: { choice: number; nonce: string } | null
  commitsCount: number
  endOfRoundAction: EndOfRoundAction

  // UI & System State
  settings: GameSettings
  isConnected: boolean
  isLoading: boolean
  error: string | null
}

interface GameContextType extends GameState {
  // Actions
  register: (username: string) => Promise<void>
  quickJoin: (tier: string) => Promise<void>
  leaveRoom: () => Promise<void>
  commitChoice: (choice: number) => Promise<void>
  setEndOfRoundAction: (action: EndOfRoundAction) => void
  skipRound: () => Promise<void>
  sendEmote: (emote: string) => void
  logout: () => void
  clearError: () => void
}

// --- INITIAL STATE ---

const initialState: GameState = {
  playerId: null,
  username: "",
  balance: 0,
  isPlayerJoined: false,
  inRoom: false,
  roomKey: null,
  gamePhase: null,
  players: [],
  spectators: 0,
  tier: null,
  stake: 0,
  lastStake: null,
  lastTier: null,
  round: null,
  results: null,
  lastChoice: null,
  commitsCount: 0,
  endOfRoundAction: "continue",
  settings: {
    sound: true,
    haptics: true,
    quickAdvance: false,
  },
  isConnected: false,
  isLoading: false,
  error: null,
}

// --- CONTEXT ---

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(initialState)
  const socketRef = useRef<GameSocket | null>(null)
  const pendingRoomJoin = useRef<{ token: string; asSpectator: boolean } | null>(null)

  const updateState = (updates: Partial<GameState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  const leaveRoom = useCallback(async () => {
    if (!socketRef.current || !state.roomKey || !state.playerId) return
    await rest.leaveRoom(state.roomKey, state.playerId)
    socketRef.current.leaveRoom()
    updateState({ inRoom: false, roomKey: null, gamePhase: null, round: null, results: null })
  }, [state.roomKey, state.playerId])

  // --- WEBSOCKET EVENT HANDLERS ---

  const onConnect = useCallback(() => {
    console.log("Socket connected")
    updateState({ isConnected: true })
    if (state.playerId) {
      socketRef.current?.joinPlayer(state.playerId)
    }
  }, [state.playerId])

  const onDisconnect = useCallback(() => {
    console.log("Socket disconnected")
    updateState({ isConnected: false, inRoom: false, gamePhase: null, roomKey: null, isPlayerJoined: false })
  }, [])

  const onPlayerJoinedGame = useCallback((data: any) => {
    console.log("Player joined game:", data)
    updateState({ isPlayerJoined: true, balance: data.balance })
  }, [])

  const onRoomJoined = useCallback((data: any) => {
    console.log("Room joined:", data)
    updateState({ 
      inRoom: true, 
      tier: data.tier, 
      players: data.players || [], 
      spectators: data.spectators || 0, 
      gamePhase: data.state.toUpperCase() as GamePhase 
    })
  }, [])

  const onPlayerJoinedRoom = useCallback((data: { username: string, is_spectator: boolean, player_count: number }) => {
    console.log("Player joined room:", data)
    setState((s) => ({ ...s, players: [...s.players, { username: data.username, isSpectator: data.is_spectator }] }))
  }, [])

  const onPlayerLeftRoom = useCallback((data: { username: string, player_count: number }) => {
    console.log("Player left room:", data)
    setState((s) => ({
      ...s,
      players: s.players.filter(p => p.username !== data.username),
      gamePhase: data.player_count < 4 ? "WAITING" : s.gamePhase // Go to waiting room if not enough players
    }))
  }, [])

  const onDeal = useCallback((data: DealEvent) => {
    console.log("Deal received:", data)
    updateState({ round: data, gamePhase: "SELECT", results: null, commitsCount: 0, lastChoice: null })
  }, [])

  const onCommitsUpdate = useCallback((data: { commits_count: number }) => {
    console.log("Commits update:", data)
    updateState({ commitsCount: data.commits_count })
  }, [])

  const onRequestReveal = useCallback(() => {
    console.log("Reveal requested")
    updateState({ gamePhase: "REVEAL" })
    if (state.lastChoice && state.round) {
      socketRef.current?.reveal(state.lastChoice.choice, state.lastChoice.nonce, state.round.round_key)
    }
  }, [state.lastChoice, state.round])

  const onRoundResults = useCallback((data: RoundResultsEvent) => {
    console.log("Round results:", data)
    updateState({ results: data, balance: data.new_balance, gamePhase: "RESULTS" })
  }, [])

  const onNextRoundInfo = useCallback((data: any) => {
    console.log("Next round info:", data)
    if (state.endOfRoundAction === "leave") {
      void leaveRoom()
    } else {
      // For "continue" and "sit_out", the server handles the state.
      // The frontend just transitions to the waiting phase.
      updateState({ gamePhase: "WAITING", round: null, results: null })
    }
  }, [state.endOfRoundAction, leaveRoom])

  const onError = useCallback((data: any) => {
    console.error("WebSocket error:", data)
    updateState({ error: data.message || "An unknown WebSocket error occurred" })
  }, [])

  // Effect to join room once player is authenticated on WS
  useEffect(() => {
    if (state.isPlayerJoined && pendingRoomJoin.current && socketRef.current) {
      console.log("Player is joined, now joining room...")
      socketRef.current.joinRoom(pendingRoomJoin.current.token, pendingRoomJoin.current.asSpectator)
      pendingRoomJoin.current = null // Clear the pending join
    }
  }, [state.isPlayerJoined])

  // --- CORE ACTIONS ---

  const register = async (username: string) => {
    updateState({ isLoading: true, error: null })
    try {
      const player = await rest.createOrGetPlayer(username)
      updateState({ playerId: player.id, username: player.username, balance: player.balance })
    } catch (err: any) {
      updateState({ error: err.message })
      throw err
    } finally {
      updateState({ isLoading: false })
    }
  }

  const quickJoin = async (tier: string) => {
    if (!state.playerId) return updateState({ error: "Player not registered." })
    updateState({ isLoading: true, error: null })

    try {
      const res = await rest.quickJoinRoom(state.playerId, tier)
      updateState({ roomKey: res.room_key, stake: res.stake, lastStake: res.stake, lastTier: res.tier })
      
      pendingRoomJoin.current = { token: res.room_token, asSpectator: false }

      if (!socketRef.current) {
        console.log("Creating new socket...")
        socketRef.current = createGameSocket()
        socketRef.current.on("connect", onConnect)
        socketRef.current.on("disconnect", onDisconnect)
        socketRef.current.on("player_joined_game", onPlayerJoinedGame)
        socketRef.current.on("room_joined", onRoomJoined)
        socketRef.current.on("player_joined_room", onPlayerJoinedRoom)
        socketRef.current.on("player_left_room", onPlayerLeftRoom)
        socketRef.current.on("deal", onDeal)
        socketRef.current.on("commits_update", onCommitsUpdate)
        socketRef.current.on("request_reveal", onRequestReveal)
        socketRef.current.on("round_results", onRoundResults)
        socketRef.current.on("next_round_info", onNextRoundInfo)
        socketRef.current.on("error", onError)
        socketRef.current.on("game_error", onError)
      }
      
      if (socketRef.current.isConnected()) {
        console.log("Socket already connected. Emitting join_player...")
        socketRef.current.joinPlayer(state.playerId)
      } else {
        console.log("Connecting socket...")
        socketRef.current.connect()
      }

    } catch (err: any) {
      updateState({ error: err.message })
    } finally {
      updateState({ isLoading: false })
    }
  }

  const skipRound = async () => {
    if (!state.roomKey || !state.playerId) return
    try {
      await rest.skipNext(state.roomKey, state.playerId)
    } catch (err: any) {
      updateState({ error: err.message })
    }
  }

  const commitChoice = async (choice: number) => {
    if (!socketRef.current || !state.playerId || !state.round) return
    const nonce = Math.random().toString(36).substring(7)
    updateState({ lastChoice: { choice, nonce } })
    const hash = await generateCommitHash(state.playerId, state.round.round_key, choice, nonce)
    socketRef.current.commit(hash)
  }

  const setEndOfRoundAction = (action: EndOfRoundAction) => {
    updateState({ endOfRoundAction: action })
    if (action === "sit_out") {
      void skipRound()
    }
  }

  const sendEmote = (emote: string) => {
    socketRef.current?.sendEmote(emote)
  }

  const logout = () => {
    socketRef.current?.disconnect()
    socketRef.current = null
    setState(initialState)
  }

  const clearError = () => updateState({ error: null })

  return (
    <GameContext.Provider
      value={{
        ...state,
        register,
        quickJoin,
        leaveRoom,
        commitChoice,
        setEndOfRoundAction,
        skipRound,
        sendEmote,
        logout,
        clearError,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}

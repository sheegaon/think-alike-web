"use client"

import { createContext, useContext, useState, useRef, useEffect, type ReactNode, useCallback } from "react"
import * as rest from "@/lib/rest"
import { createGameSocket, type GameSocket, type DealEvent, type RoundResultsEvent, generateCommitHash } from "@/lib/socket"

// --- TYPE DEFINITIONS ---

interface Player {
  username: string
  isSpectator: boolean
}

export interface GameSettings {
  sound: boolean
  haptics: boolean
  quickAdvance: boolean
}

export type GamePhase = "WAITING" | "SELECT" | "REVEAL" | "RESULTS" | null
export type EndOfRoundAction = "continue" | "sit_out" | "leave"
export type AppView = "Home" | "Lobby" | "Leaderboard" | "Rewards" | "Settings"

interface GameState {
  // Player State
  playerId: number | null
  username: string
  balance: number
  isPlayerJoined: boolean

  // Navigation State
  currentView: AppView

  // Room & Game State
  inRoom: boolean
  isSpectator: boolean
  roomKey: string | null
  gamePhase: GamePhase
  players: Player[]
  spectators: number
  tier: string | null
  stake: number
  entryFee: number
  minPlayers: number // The minimum number of players to start a game
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
  queuePosition: number | null
}

interface GameContextType extends GameState {
  // Actions
  setCurrentView: (view: AppView) => void
  register: (username: string) => Promise<void>
  quickJoin: (tier: string) => Promise<void>
  joinRoom: (roomKey: string, asSpectator: boolean) => Promise<void>
  leaveRoom: (atRoundEnd?: boolean) => Promise<void>
  commitChoice: (choice: number) => Promise<void>
  revealChoice: () => void
  setEndOfRoundAction: (action: EndOfRoundAction) => void
  skipRound: () => Promise<void>
  sendEmote: (emote: string) => void
  toggleQueue: (wantsToJoin: boolean) => void
  updateBalance: (newBalance: number) => void
  updateSettings: (newSettings: Partial<GameSettings>) => void
  logout: () => Promise<void>
  clearError: () => void
}

// --- INITIAL STATE ---

const initialState: GameState = {
  playerId: null,
  username: "",
  balance: 0,
  isPlayerJoined: false,
  currentView: "Home",
  inRoom: false,
  isSpectator: false,
  roomKey: null,
  gamePhase: null,
  players: [],
  spectators: 0,
  tier: null,
  stake: 0,
  entryFee: 0,
  minPlayers: 4, // Default value, should ideally come from backend room config
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
  queuePosition: null,
}

// --- CONTEXT ---

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(initialState)
  const socketRef = useRef<GameSocket | null>(null)
  const pendingRoomJoin = useRef<{ token: string; asSpectator: boolean } | null>(null)

  // Use a ref to hold the latest state for use in callbacks without dependencies
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const updateState = (updates: Partial<GameState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  const revealChoice = useCallback(() => {
    const { lastChoice, round } = stateRef.current
    if (lastChoice && round) {
      console.log("Auto-revealing choice.")
      socketRef.current?.reveal(lastChoice.choice, lastChoice.nonce, round.round_key)
    } else {
      console.warn("Cannot reveal, lastChoice or round is missing.")
    }
  }, [])

  const leaveRoom = useCallback(async (atRoundEnd: boolean = true) => {
    const { roomKey, playerId } = stateRef.current
    if (!socketRef.current || !roomKey || !playerId) return
    try {
        await rest.leaveRoom(roomKey, playerId, atRoundEnd)
        socketRef.current.leaveRoom()
        updateState({ inRoom: false, roomKey: null, gamePhase: null, round: null, results: null, currentView: "Home", isSpectator: false })
    } catch (error) {
        console.error("Failed to leave room:", error)
        updateState({ inRoom: false, roomKey: null, gamePhase: null, round: null, results: null, currentView: "Home", isSpectator: false, error: "Failed to leave the room on the server." })
    }
  }, [])

  // Effect to manage the socket connection lifecycle. Runs only once.
  useEffect(() => {
    console.log("GameProvider effect running to establish socket connection. This should run only once.")
    const socket = createGameSocket()
    socketRef.current = socket

    socket.on("connect", () => {
      console.log("Socket connected.")
      updateState({ isConnected: true })
    })

    socket.on("disconnect", () => {
      console.log("Socket disconnected.")
      setState(prev => {
        const updates: Partial<GameState> = { isConnected: false }
        if (prev.inRoom) {
          updates.error = "Connection to the server was lost."
          updates.inRoom = false
          updates.gamePhase = null
          updates.roomKey = null
          updates.isPlayerJoined = false
        }
        return { ...prev, ...updates }
      })
    })

    socket.on("player_joined_game", (data) => {
      console.log("Player joined game:", data)
      updateState({ isPlayerJoined: true, balance: data.balance })
      if (pendingRoomJoin.current) {
        socket.joinRoom(pendingRoomJoin.current.token, pendingRoomJoin.current.asSpectator)
      }
    })

    socket.on("room_joined", (data) => {
      console.log("Room joined:", data)
      updateState({
        inRoom: true,
        isSpectator: pendingRoomJoin.current?.asSpectator ?? false,
        tier: data.tier,
        players: data.players || [],
        spectators: data.spectators || 0,
        gamePhase: data.state.toUpperCase() as GamePhase,
        isLoading: false,
      })
      pendingRoomJoin.current = null
    })

    socket.on("player_joined_room", (data) => {
      console.log("Player joined room:", data)
      setState((s) => ({ ...s, players: [...s.players, { username: data.username, isSpectator: data.is_spectator }] }))
    })

    socket.on("player_left_room", (data) => {
      console.log("Player left room:", data)
      setState((s) => ({
        ...s,
        players: s.players.filter((p) => p.username !== data.username),
        gamePhase: data.player_count < s.minPlayers ? "WAITING" : s.gamePhase,
      }))
    })

    socket.on("deal", (data) => {
      console.log("Deal received:", data)
      updateState({ round: data, gamePhase: "SELECT", results: null, commitsCount: 0, lastChoice: null })
    })

    socket.on("commits_update", (data) => {
      console.log("Commits update:", data)
      updateState({ commitsCount: data.commits_count })
    })

    socket.on("request_reveal", () => {
      console.log("Reveal requested, triggering auto-reveal.")
      updateState({ gamePhase: "REVEAL" })
      revealChoice()
    })

    socket.on("round_results", (data) => {
      console.log("Round results:", data)
      updateState({ results: data, balance: data.new_balance, gamePhase: "RESULTS" })
    })

    socket.on("next_round_info", (data) => {
      console.log("Next round info:", data)
      if (stateRef.current.endOfRoundAction === "leave") {
        void leaveRoom()
      } else {
        updateState({ gamePhase: "WAITING", round: null, results: null })
      }
    })

    socket.on("queue_update", (data) => {
      console.log("Queue update:", data)
      updateState({ queuePosition: data.position })
    })

    socket.on("error", (data) => {
      console.error("WebSocket error:", data)
      updateState({ error: data.message || "An unknown WebSocket error occurred", isLoading: false })
    })

    socket.on("game_error", (data) => {
      console.error("Game error:", data)
      updateState({ error: data.message || "An unknown game error occurred", isLoading: false })
    })

    socket.connect()

    return () => {
      console.log("GameProvider effect cleanup. This should only happen on app unmount.")
      socket.disconnect()
      socketRef.current = null
    }
  }, [leaveRoom, revealChoice])

  // Effect to join the player once playerId is available and socket is connected
  useEffect(() => {
    if (state.playerId && state.isConnected && socketRef.current && !state.isPlayerJoined) {
      console.log(`PlayerId ${state.playerId} and connection ready. Emitting join_player.`)
      socketRef.current.joinPlayer(state.playerId)
    }
  }, [state.playerId, state.isConnected, state.isPlayerJoined])


  // --- CORE ACTIONS ---

  const setCurrentView = (view: AppView) => {
    updateState({ currentView: view })
  }

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

  const joinRoom = async (roomKey: string, asSpectator: boolean) => {
    if (state.isLoading) return
    if (!state.playerId) return updateState({ error: "Player not registered." })
    
    updateState({ isLoading: true, error: null, inRoom: true, gamePhase: "WAITING", isSpectator: asSpectator })

    try {
      const res = await rest.joinSpecificRoom(roomKey, state.playerId, asSpectator)
      updateState({ 
        roomKey: res.room_key, 
        stake: res.stake, 
        entryFee: res.entry_fee, 
        lastStake: res.stake, 
        lastTier: res.tier,
        balance: res.new_balance,
        isLoading: false,
      })
      
      pendingRoomJoin.current = { token: res.room_token, asSpectator }

      if (socketRef.current && state.isConnected && state.isPlayerJoined) {
        socketRef.current.joinRoom(res.room_token, asSpectator)
      }

    } catch (err: any) {
      updateState({ error: err.message, isLoading: false, inRoom: false, gamePhase: null })
    }
  }

  const quickJoin = async (tier: string) => {
    if (state.isLoading) return
    if (!state.playerId) return updateState({ error: "Player not registered." })
    
    updateState({ isLoading: true, error: null, inRoom: true, gamePhase: "WAITING", isSpectator: false })

    try {
      const tierToSend = tier === "ANY" ? null : tier
      const res = await rest.quickJoinRoom(state.playerId, tierToSend)
      updateState({ 
        roomKey: res.room_key, 
        stake: res.stake, 
        entryFee: res.entry_fee, 
        lastStake: res.stake, 
        lastTier: res.tier,
        balance: res.new_balance,
        isLoading: false,
      })
      
      pendingRoomJoin.current = { token: res.room_token, asSpectator: false }

      if (socketRef.current && state.isConnected && state.isPlayerJoined) {
        socketRef.current.joinRoom(res.room_token, false)
      }

    } catch (err: any) {
      updateState({ error: err.message, isLoading: false, inRoom: false, gamePhase: null })
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

  const toggleQueue = (wantsToJoin: boolean) => {
    socketRef.current?.toggleQueue(wantsToJoin)
  }

  const updateBalance = (newBalance: number) => {
    updateState({ balance: newBalance })
  }

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    updateState({ settings: { ...state.settings, ...newSettings } })
  }

  const logout = useCallback(async () => {
    const { inRoom } = stateRef.current
    if (inRoom) {
      try {
        await leaveRoom(false)
      } catch (error) {
        console.error("Error leaving room on logout:", error)
      }
    }
    setState(initialState)
  }, [leaveRoom])

  const clearError = () => updateState({ error: null })

  return (
    <GameContext.Provider
      value={{
        ...state,
        setCurrentView,
        register,
        quickJoin,
        joinRoom,
        leaveRoom,
        commitChoice,
        revealChoice,
        setEndOfRoundAction,
        skipRound,
        sendEmote,
        toggleQueue,
        updateBalance,
        updateSettings,
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

"use client"

import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react"
import * as rest from "../lib/rest"
import { createGameSocket, type GameSocket, type DealEvent, type RoundResultsEvent, type NextRoundInfoEvent } from "../lib/socket"

interface GameSettings {
  showTimers: boolean
  sound: boolean
  haptics: boolean
  quickAdvance: boolean
  dataSaver: boolean
  allowSpectators: boolean
}

interface GameState {
  // Existing UI state (preserved for compatibility)
  stake: number
  capacity: number
  players: number
  spectators: number
  lastChoice: string | null
  lastStake: number | null
  settings: GameSettings
  skipNext: boolean
  leaveAtEnd: boolean
  prizePool: number
  entryFee: number
  username: string
  userTokens: number
  inRoom: boolean
  collectedRewards: string[]
  
  // Backend-specific state
  playerId: number | null
  balance: number
  roomToken: string | null
  roomKey: string | null
  tier: string | null
  gameState: string | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
}

interface GameContextType extends GameState {
  // Existing UI actions (preserved for compatibility)
  setStake: (stake: number) => void
  setPlayers: (players: number) => void
  setLastChoice: (choice: string) => void
  setLastStake: (stake: number) => void
  updateSettings: (settings: Partial<GameSettings>) => void
  setSkipNext: (skip: boolean) => void
  setLeaveAtEnd: (leave: boolean) => void
  setUsername: (username: string) => void
  setUserTokens: (tokens: number) => void
  setInRoom: (inRoom: boolean) => void
  collectReward: (rewardId: string, tokenAmount: number) => void
  logout: () => void
  
  // Backend actions
  register: (username: string) => Promise<void>
  healthCheck: () => Promise<void>
  quickJoin: (tier?: string, asSpectator?: boolean) => Promise<void>
  leaveRoom: (atRoundEnd?: boolean) => Promise<void>
  skipRound: () => Promise<void>
  connectWS: () => void
  disconnectWS: () => void
  commit: (choice: number, nonce: string, roundKey: string) => Promise<void>
  reveal: (choice: number, nonce: string, roundKey: string) => void
  sendEmote: (emote: string) => void
  getLeaderboard: () => Promise<rest.LeaderboardResponse>
  clearError: () => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  // Existing UI state (preserved for compatibility)
  const [stake, setStakeState] = useState(50)
  const [capacity] = useState(12)
  const [players, setPlayersState] = useState(1)
  const [spectators, setSpectatorsState] = useState(0)
  const [lastChoice, setLastChoiceState] = useState<string | null>(null)
  const [lastStake, setLastStakeState] = useState<number | null>(null)
  const [skipNext, setSkipNextState] = useState(false)
  const [leaveAtEnd, setLeaveAtEndState] = useState(false)
  const [username, setUsernameState] = useState("Player")
  const [userTokens, setUserTokensState] = useState(1000)
  const [inRoom, setInRoomState] = useState(false)
  const [collectedRewards, setCollectedRewards] = useState<string[]>([])

  const [settings, setSettingsState] = useState<GameSettings>({
    showTimers: true,
    sound: true,
    haptics: true,
    quickAdvance: false,
    dataSaver: false,
    allowSpectators: true,
  })

  // Backend-specific state
  const [playerId, setPlayerId] = useState<number | null>(null)
  const [balance, setBalance] = useState(1000) // Start with default, sync from backend
  const [roomToken, setRoomToken] = useState<string | null>(null)
  const [roomKey, setRoomKey] = useState<string | null>(null)
  const [tier, setTier] = useState<string | null>(null)
  const [gameState, setGameState] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // WebSocket instance (stable reference)
  const gameSocket = useRef<GameSocket | null>(null)

  // Initialize WebSocket on mount
  useEffect(() => {
    if (!gameSocket.current) {
      gameSocket.current = createGameSocket()
    }
    
    return () => {
      if (gameSocket.current) {
        gameSocket.current.disconnect()
      }
    }
  }, [])

  // Computed values (enhanced with backend data when available)
  const prizePool = tier && gameState ? (balance * players) : (players * stake) // Use real data when in room
  const entryFee = tier ? Math.round(stake * 0.02) : Math.round(stake * 0.02) // Can enhance with real entry fee from backend

  // Existing UI actions (preserved for compatibility)
  const setStake = (newStake: number) => {
    setStakeState(newStake)
    setLastStakeState(newStake)
  }

  const setPlayers = (newPlayers: number) => {
    setPlayersState(newPlayers)
  }

  const setLastChoice = (choice: string) => {
    setLastChoiceState(choice)
  }

  const setLastStake = (stake: number) => {
    setLastStakeState(stake)
  }

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...newSettings }))
  }

  const setSkipNext = (skip: boolean) => {
    setSkipNextState(skip)
  }

  const setLeaveAtEnd = (leave: boolean) => {
    setLeaveAtEndState(leave)
  }

  const setUsername = (newUsername: string) => {
    setUsernameState(newUsername)
  }

  const setUserTokens = (tokens: number) => {
    setUserTokensState(tokens)
    setBalance(tokens) // Sync backend balance
  }

  const setInRoom = (roomStatus: boolean) => {
    setInRoomState(roomStatus)
  }

  const collectReward = (rewardId: string, tokenAmount: number) => {
    setCollectedRewards((prev) => [...prev, rewardId])
    setUserTokensState((prev) => prev + tokenAmount)
    setBalance((prev) => prev + tokenAmount)
  }

  // Backend actions
  const register = async (username: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const player = await rest.createOrGetPlayer(username)
      setPlayerId(player.id)
      setUsernameState(player.username)
      setBalance(player.balance)
      setUserTokensState(player.balance) // Sync UI state
    } catch (err: any) {
      setError(err.message || "Failed to register player")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const healthCheck = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await rest.health()
    } catch (err: any) {
      setError(err.message || "Health check failed")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const connectWS = () => {
    if (gameSocket.current && !gameSocket.current.isConnected()) {
      gameSocket.current.connect()
      
      // Set up event handlers
      gameSocket.current.on("connect", () => {
        setIsConnected(true)
        setError(null)
      })

      gameSocket.current.on("disconnect", () => {
        setIsConnected(false)
      })

      gameSocket.current.on("player_joined_game", (data: any) => {
        console.log("Player joined game:", data)
        setBalance(data.balance)
        setUserTokensState(data.balance)
      })

      gameSocket.current.on("room_joined", (data: any) => {
        console.log("Room joined:", data)
        setInRoomState(true)
        setTier(data.tier)
        setPlayersState(data.player_count)
        setSpectatorsState(data.spectators)
        setGameState(data.state)
      })

      gameSocket.current.on("deal", (data: DealEvent) => {
        console.log("Deal received:", data)
        // Game screens will handle this event
      })

      gameSocket.current.on("round_results", (data: RoundResultsEvent) => {
        console.log("Round results:", data)
        setBalance(data.new_balance)
        setUserTokensState(data.new_balance)
      })

      gameSocket.current.on("next_round_info", (data: NextRoundInfoEvent) => {
        console.log("Next round info:", data)
        setPlayersState(data.player_count)
        setSpectatorsState(data.spectators)
      })

      gameSocket.current.on("error", (data: any) => {
        console.error("WebSocket error:", data)
        setError(data.message || "WebSocket error")
      })

      gameSocket.current.on("game_error", (data: any) => {
        console.error("Game error:", data)
        setError(data.message || "Game error")
      })
    }
  }

  const disconnectWS = () => {
    if (gameSocket.current) {
      gameSocket.current.disconnect()
      setIsConnected(false)
    }
  }

  const quickJoin = async (tier?: string, asSpectator: boolean = false) => {
    if (!playerId) {
      throw new Error("Must be registered to join room")
    }
    
    setIsLoading(true)
    setError(null)
    try {
      // Join room via REST API
      const joinResponse = await rest.quickJoinRoom(playerId, tier, asSpectator)
      setRoomToken(joinResponse.room_token)
      setRoomKey(joinResponse.room_key)
      setTier(joinResponse.tier)
      setStakeState(joinResponse.stake)

      // Connect WebSocket if not connected
      if (!gameSocket.current?.isConnected()) {
        connectWS()
      }

      // Wait for connection then authenticate
      if (gameSocket.current?.isConnected()) {
        gameSocket.current.joinPlayer(playerId)
        gameSocket.current.joinRoom(joinResponse.room_token, asSpectator)
      }
    } catch (err: any) {
      setError(err.message || "Failed to join room")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const leaveRoom = async (atRoundEnd: boolean = true) => {
    if (!playerId || !roomKey) {
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await rest.leaveRoom(roomKey, playerId, atRoundEnd)
      
      // Leave via WebSocket
      if (gameSocket.current?.isConnected()) {
        gameSocket.current.leaveRoom()
      }

      // Reset room state
      setRoomToken(null)
      setRoomKey(null)
      setTier(null)
      setGameState(null)
      setInRoomState(false)
    } catch (err: any) {
      setError(err.message || "Failed to leave room")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const skipRound = async () => {
    if (!playerId || !roomKey) {
      throw new Error("Must be in room to skip round")
    }

    setIsLoading(true)
    setError(null)
    try {
      await rest.skipNext(roomKey, playerId)
      setSkipNextState(true)
    } catch (err: any) {
      setError(err.message || "Failed to skip round")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const commit = async (choice: number, nonce: string, roundKey: string) => {
    if (!gameSocket.current?.isConnected() || !playerId) {
      throw new Error("Not connected to game")
    }

    try {
      const { generateCommitHash } = await import("../lib/socket")
      const hash = await generateCommitHash(playerId, roundKey, choice, nonce)
      gameSocket.current.commit(hash)
    } catch (err: any) {
      setError(err.message || "Failed to commit choice")
      throw err
    }
  }

  const reveal = (choice: number, nonce: string, roundKey: string) => {
    if (!gameSocket.current?.isConnected()) {
      throw new Error("Not connected to game")
    }
    gameSocket.current.reveal(choice, nonce, roundKey)
  }

  const sendEmote = (emote: string) => {
    if (!gameSocket.current?.isConnected()) {
      throw new Error("Not connected to game")
    }
    gameSocket.current.sendEmote(emote)
  }

  const getLeaderboard = async () => {
    setIsLoading(true)
    setError(null)
    try {
      return await rest.getLeaderboard(50, 0, playerId || undefined)
    } catch (err: any) {
      setError(err.message || "Failed to get leaderboard")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const logout = () => {
    // Disconnect WebSocket
    disconnectWS()
    
    // Reset all state
    setPlayerId(null)
    setBalance(1000)
    setRoomToken(null)
    setRoomKey(null)
    setTier(null)
    setGameState(null)
    setIsConnected(false)
    setError(null)
    setUsernameState("Player")
    setUserTokensState(1000)
    setInRoomState(false)
    setLastChoiceState(null)
    setLastStakeState(null)
    setCollectedRewards([])
    setStakeState(50)
    setPlayersState(1)
    setSkipNextState(false)
    setLeaveAtEndState(false)
  }

  return (
    <GameContext.Provider
      value={{
        // Existing UI state (preserved for compatibility)
        stake,
        capacity,
        players,
        spectators,
        lastChoice,
        lastStake,
        settings,
        skipNext,
        leaveAtEnd,
        prizePool,
        entryFee,
        username,
        userTokens,
        inRoom,
        collectedRewards,
        
        // Backend-specific state
        playerId,
        balance,
        roomToken,
        roomKey,
        tier,
        gameState,
        isConnected,
        isLoading,
        error,
        
        // Existing UI actions (preserved for compatibility)
        setStake,
        setPlayers,
        setLastChoice,
        setLastStake,
        updateSettings,
        setSkipNext,
        setLeaveAtEnd,
        setUsername,
        setUserTokens,
        setInRoom,
        collectReward,
        logout,
        
        // Backend actions
        register,
        healthCheck,
        quickJoin,
        leaveRoom,
        skipRound,
        connectWS,
        disconnectWS,
        commit,
        reveal,
        sendEmote,
        getLeaderboard,
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

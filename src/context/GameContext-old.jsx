"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { createGameSocket, generateCommitHash } from "../../lib/socket"

const GameContextOld = createContext()

export const useGame = () => {
  const context = useContext(GameContextOld)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}

export const GameProvider = ({ children }) => {
  // WebSocket instance
  const socketRef = useRef(null)

  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [playerId, setPlayerId] = useState(null)
  const [roomToken, setRoomToken] = useState(null)
  const [inRoom, setInRoom] = useState(false)

  // Game state
  const [stake, setStake] = useState(50)
  const [capacity] = useState(12)
  const [players, setPlayers] = useState([])
  const [spectators, setSpectators] = useState([])
  const [lastChoice, setLastChoice] = useState(null)
  const [lastStake, setLastStake] = useState(null)

  // Settings
  const [settings, setSettings] = useState({
    showTimers: true,
    sound: true,
    haptics: true,
    quickAdvance: false,
    dataSaver: false,
    allowSpectators: true,
  })

  // Round options
  const [skipNext, setSkipNext] = useState(false)
  const [leaveAtEnd, setLeaveAtEnd] = useState(false)

  // Current round data
  const [currentRound, setCurrentRound] = useState({
    adjective: null,
    nouns: [],
    timeLeft: 0,
    phase: "waiting", // 'waiting', 'selecting', 'revealing', 'results'
    playersLockedIn: 0,
    results: [],
    roundKey: null,
    pot: 0,
    selectionDeadline: null,
    selectionDuration: 0,
  })

  // User data
  const [userTokens, setUserTokens] = useState(1000)
  const [userStats, setUserStats] = useState({
    rating: 1200,
    wins: 0,
    gamesPlayed: 0,
  })

  // Commit-reveal state
  const [commitState, setCommitState] = useState({
    hasCommitted: false,
    hasRevealed: false,
    choice: null,
    nonce: null,
    hash: null,
    roundKey: null, // Cache the round_key from commit_ack
  })

  // Queue state for spectators
  const [queueState, setQueueState] = useState({
    position: 0,
    totalWaiting: 0,
    wantsToJoin: false,
  })

  // Recent emotes for display
  const [recentEmotes, setRecentEmotes] = useState([])

  // Connection errors and notifications
  const [connectionErrors, setConnectionErrors] = useState([])
  const [gameNotifications, setGameNotifications] = useState([])

  // Computed values
  const prizePool = players.length * stake
  const entryFee = Math.round(stake * 0.02)

  // Generate random nonce for commit-reveal
  const generateNonce = useCallback(() => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }, [])

  // Utility function to normalize ISO timestamps to milliseconds
  const normalizeTimestamp = useCallback((isoString) => {
    if (!isoString) return null
    try {
      return new Date(isoString).getTime()
    } catch (error) {
      console.error("Failed to parse timestamp:", isoString, error)
      return null
    }
  }, [])

  // Add notification helper
  const addNotification = useCallback((message, type = 'info') => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: Date.now(),
    }
    setGameNotifications(prev => [...prev.slice(-9), notification]) // Keep last 10

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setGameNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }, [])

  // Initialize WebSocket connection and register all required event handlers
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = createGameSocket()

      // Connection events
      socketRef.current.on("connect", () => {
        console.log("WebSocket connected")
        setIsConnected(true)
        setConnectionErrors([]) // Clear connection errors

        // Auto-join as player if we have a playerId stored
        const storedPlayerId = localStorage.getItem('think_alike_player_id')
        if (storedPlayerId && !playerId) {
          console.log("Auto-joining as player:", storedPlayerId)
          socketRef.current.joinPlayer(parseInt(storedPlayerId))
        }
      })

      socketRef.current.on("disconnect", (reason) => {
        console.log("WebSocket disconnected:", reason)
        setIsConnected(false)
        setInRoom(false)
        addNotification(`Disconnected: ${reason}`, 'warning')
      })

      // MISSING: connect_error handler
      socketRef.current.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error)
        setIsConnected(false)
        const errorMsg = error.message || "Connection failed"
        setConnectionErrors(prev => [...prev.slice(-4), { message: errorMsg, timestamp: Date.now() }])
        addNotification(`Connection error: ${errorMsg}`, 'error')
      })

      // Player authentication events
      socketRef.current.on("player_joined_game", (data) => {
        console.log("Player joined game:", data)
        setPlayerId(data.player_id)
        setUserTokens(data.balance)

        // Store player ID for reconnection
        localStorage.setItem('think_alike_player_id', data.player_id.toString())

        // Auto-rejoin room if we have a stored room token
        const storedRoomToken = localStorage.getItem('think_alike_room_token')
        if (storedRoomToken && !inRoom) {
          console.log("Auto-rejoining room after player authentication")
          socketRef.current.joinRoom(storedRoomToken, false)
        }
      })

      // REQUIRED: room_joined event handler
      socketRef.current.on("room_joined", (data) => {
        console.log("Room joined:", data)
        setInRoom(true)
        setPlayers(Array(data.player_count).fill(null).map((_, i) => ({ id: i, username: `Player ${i + 1}` })))
        setSpectators(Array(data.spectators).fill(null).map((_, i) => ({ id: i, username: `Spectator ${i + 1}` })))
        setCurrentRound(prev => ({ ...prev, pot: data.pot }))
        addNotification(`Joined room (${data.tier} tier)`, 'success')
      })

      socketRef.current.on("player_joined_room", (data) => {
        console.log("Player joined room:", data)
        // Update player count without exposing real usernames
        setPlayers(Array(data.player_count).fill(null).map((_, i) => ({ id: i, username: `Player ${i + 1}` })))
        addNotification(`${data.username} joined the room`, 'info')
      })

      socketRef.current.on("player_left_room", (data) => {
        console.log("Player left room:", data)
        setPlayers(Array(data.player_count).fill(null).map((_, i) => ({ id: i, username: `Player ${i + 1}` })))
        addNotification(`${data.username} left the room`, 'info')
      })

      // REQUIRED: room_left event handler
      socketRef.current.on("room_left", () => {
        console.log("Left room")
        setInRoom(false)
        setCurrentRound({
          adjective: null,
          nouns: [],
          timeLeft: 0,
          phase: "waiting",
          playersLockedIn: 0,
          results: [],
          roundKey: null,
          pot: 0,
          selectionDeadline: null,
          selectionDuration: 0,
        })
        setCommitState({
          hasCommitted: false,
          hasRevealed: false,
          choice: null,
          nonce: null,
          hash: null,
          roundKey: null,
        })
        // Clear stored room token when leaving
        localStorage.removeItem('think_alike_room_token')
        setRoomToken(null)
        addNotification("Left the room", 'info')
      })

      // REQUIRED: deal event handler - starts new round
      socketRef.current.on("deal", (data) => {
        console.log("New round deal:", data)
        const selectionDeadlineMs = normalizeTimestamp(data.selection_deadline)
        const currentTime = Date.now()
        const timeLeft = selectionDeadlineMs ? Math.max(0, Math.floor((selectionDeadlineMs - currentTime) / 1000)) : data.selection_duration

        setCurrentRound({
          adjective: data.adjective,
          nouns: data.nouns,
          timeLeft: timeLeft,
          phase: "selecting",
          playersLockedIn: 0,
          results: [],
          roundKey: data.round_key,
          pot: data.pot,
          selectionDeadline: selectionDeadlineMs,
          selectionDuration: data.selection_duration,
        })
        setCommitState({
          hasCommitted: false,
          hasRevealed: false,
          choice: null,
          nonce: null,
          hash: null,
          roundKey: null,
        })
        addNotification(`New round: ${data.adjective}`, 'success')
      })

      // REQUIRED: commits_update event handler - tracks commit progress
      socketRef.current.on("commits_update", (data) => {
        console.log("Commits update:", data)
        setCurrentRound(prev => ({
          ...prev,
          playersLockedIn: data.commits_count
        }))
      })

      // REQUIRED: request_reveal event handler - transition to reveal phase
      socketRef.current.on("request_reveal", (data) => {
        console.log("Reveal requested:", data)
        const revealDeadlineMs = normalizeTimestamp(data.reveal_deadline)
        const currentTime = Date.now()
        const timeLeft = revealDeadlineMs ? Math.max(0, Math.floor((revealDeadlineMs - currentTime) / 1000)) : 10

        setCurrentRound(prev => ({
          ...prev,
          phase: "revealing",
          timeLeft: timeLeft,
          selectionDeadline: revealDeadlineMs,
        }))
        addNotification("Time to reveal your choice!", 'warning')
      })

      // REQUIRED: round_results event handler - displays round outcomes
      socketRef.current.on("round_results", (data) => {
        console.log("Round results:", data)
        setCurrentRound(prev => ({
          ...prev,
          phase: "results",
          results: data.selection_counts,
          timeLeft: 30 // Default results display time
        }))
        setLastChoice(data.your_choice)
        setUserTokens(data.new_balance)

        if (data.payout > 0) {
          addNotification(`You won ${data.payout} tokens!`, 'success')
        }
      })

      socketRef.current.on("next_round_info", (data) => {
        console.log("Next round info:", data)
        const startTimeMs = normalizeTimestamp(data.start_time)
        const currentTime = Date.now()
        const timeLeft = startTimeMs ? Math.max(0, Math.floor((startTimeMs - currentTime) / 1000)) : 30

        setCurrentRound(prev => ({
          ...prev,
          phase: "waiting",
          pot: data.pot,
          timeLeft: timeLeft,
          selectionDeadline: startTimeMs,
        }))
        setPlayers(Array(data.player_count).fill(null).map((_, i) => ({ id: i, username: `Player ${i + 1}` })))
        setSpectators(Array(data.spectators).fill(null).map((_, i) => ({ id: i, username: `Spectator ${i + 1}` })))
      })

      // REQUIRED: commit_ack event handler - confirms commit was received
      socketRef.current.on("commit_ack", (data) => {
        console.log("Commit acknowledged:", data)
        setCommitState(prev => ({ ...prev, hasCommitted: true, roundKey: data.round_key }))
        addNotification("Choice submitted successfully", 'success')
      })

      socketRef.current.on("reveal_ack", (data) => {
        console.log("Reveal acknowledged:", data)
        setCommitState(prev => ({ ...prev, hasRevealed: true }))
        addNotification("Choice revealed successfully", 'success')
      })

      socketRef.current.on("reveal_invalid", (data) => {
        console.log("Reveal invalid:", data)
        // Reset commit state on invalid reveal
        setCommitState(prev => ({ ...prev, hasRevealed: true }))
        addNotification("Invalid reveal - random choice applied", 'warning')
      })

      // Spectator queue events
      socketRef.current.on("queue_update", (data) => {
        console.log("Queue update:", data)
        setQueueState(prev => ({
          ...prev,
          position: data.position,
          totalWaiting: data.total_waiting
        }))

        if (data.position === 1) {
          addNotification("You're next in line to join!", 'info')
        }
      })

      // REQUIRED: game_state event handler - for spectators joining mid-game
      socketRef.current.on("game_state", (data) => {
        console.log("Game state for spectator:", data)
        const selectionDeadlineMs = normalizeTimestamp(data.selection_deadline)
        const currentTime = Date.now()
        const timeLeft = selectionDeadlineMs ? Math.max(0, Math.floor((selectionDeadlineMs - currentTime) / 1000)) : 0

        setCurrentRound(prev => ({
          ...prev,
          adjective: data.adjective,
          nouns: data.nouns,
          phase: "selecting",
          playersLockedIn: data.commits_count,
          selectionDeadline: selectionDeadlineMs,
          timeLeft: timeLeft,
        }))
        addNotification("Joined ongoing round as spectator", 'info')
      })

      // REQUIRED: player_emote event handler - displays emotes from other players
      socketRef.current.on("player_emote", (data) => {
        console.log("Player emote:", data)
        const emoteData = {
          id: Date.now() + Math.random(), // Unique ID for React keys
          emote: data.emote,
          username: data.username,
          timestamp: data.timestamp,
        }

        setRecentEmotes(prev => {
          const newEmotes = [...prev, emoteData]
          // Keep only last 10 emotes to prevent memory buildup
          return newEmotes.slice(-10)
        })

        // Auto-remove emote after 5 seconds
        setTimeout(() => {
          setRecentEmotes(prev => prev.filter(e => e.id !== emoteData.id))
        }, 5000)
      })

      // MISSING: Generic error handler
      socketRef.current.on("error", (error) => {
        console.error("WebSocket error:", error)
        const errorMsg = typeof error === 'string' ? error : error.message || 'Unknown error'
        addNotification(`Error: ${errorMsg}`, 'error')

        // Handle specific error types
        if (errorMsg.includes('Invalid or expired room token')) {
          localStorage.removeItem('think_alike_room_token')
          setRoomToken(null)
          setInRoom(false)
        }
      })

      // MISSING: Game-specific error handler
      socketRef.current.on("game_error", (error) => {
        console.error("Game error:", error)
        const errorMsg = typeof error === 'string' ? error : error.message || 'Unknown game error'
        addNotification(`Game Error: ${errorMsg}`, 'error')

        // Handle authentication errors by clearing stored data
        if (errorMsg.includes('Player ID')) {
          localStorage.removeItem('think_alike_player_id')
          setPlayerId(null)
        }
      })

      // MISSING: removed_from_room handler
      socketRef.current.on("removed_from_room", (data) => {
        console.log("Removed from room:", data)
        setInRoom(false)
        // Clear room token when removed
        localStorage.removeItem('think_alike_room_token')
        setRoomToken(null)

        const reason = data.message || "You have been removed from the room"
        addNotification(reason, 'warning')
      })
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [normalizeTimestamp, addNotification])

  // WebSocket connection methods
  const connectToGame = useCallback(() => {
    if (socketRef.current && !isConnected) {
      socketRef.current.connect()
    }
  }, [isConnected])

  const joinAsPlayer = useCallback((playerIdToJoin) => {
    if (socketRef.current && isConnected) {
      socketRef.current.joinPlayer(playerIdToJoin)
    }
  }, [isConnected])

  const joinRoom = useCallback((token, asSpectator = false) => {
    if (socketRef.current && isConnected && playerId) {
      setRoomToken(token)
      // Store room token for reconnection
      localStorage.setItem('think_alike_room_token', token)
      socketRef.current.joinRoom(token, asSpectator)
    } else {
      console.warn("Cannot join room: not connected or not authenticated as player")
      // If not connected, we'll auto-join when connection is established
      if (token) {
        localStorage.setItem('think_alike_room_token', token)
      }
    }
  }, [isConnected, playerId])

  const leaveRoom = useCallback(() => {
    if (socketRef.current && isConnected && inRoom) {
      socketRef.current.leaveRoom()
    }
  }, [isConnected, inRoom])

  // Game action methods
  const makeChoice = useCallback(async (choiceIndex) => {
    if (!socketRef.current || !isConnected || !inRoom || !currentRound.roundKey || !playerId) {
      console.error("Cannot make choice: not ready")
      return false
    }

    if (currentRound.phase !== "selecting" || commitState.hasCommitted) {
      console.error("Cannot make choice: wrong phase or already committed")
      return false
    }

    try {
      const nonce = generateNonce()
      const hash = await generateCommitHash(playerId, currentRound.roundKey, choiceIndex, nonce)

      setCommitState({
        hasCommitted: false, // Will be set to true when ack received
        hasRevealed: false,
        choice: choiceIndex,
        nonce: nonce,
        hash: hash,
        roundKey: null, // Will be set when commit_ack received
      })

      socketRef.current.commit(hash)
      return true
    } catch (error) {
      console.error("Error making choice:", error)
      addNotification("Failed to submit choice", 'error')
      return false
    }
  }, [isConnected, inRoom, currentRound.roundKey, currentRound.phase, commitState.hasCommitted, playerId, generateNonce, addNotification])

  const revealChoice = useCallback(() => {
    if (!socketRef.current || !isConnected || !inRoom) {
      console.error("Cannot reveal: not ready")
      return false
    }

    if (currentRound.phase !== "revealing" || !commitState.hasCommitted || commitState.hasRevealed) {
      console.error("Cannot reveal: wrong phase or not committed or already revealed")
      return false
    }

    if (commitState.choice === null || !commitState.nonce || !commitState.roundKey) {
      console.error("Cannot reveal: missing choice, nonce, or round key from commit_ack")
      return false
    }

    // Use the round key from commit_ack, not currentRound.roundKey
    socketRef.current.reveal(commitState.choice, commitState.nonce, commitState.roundKey)
    return true
  }, [isConnected, inRoom, currentRound.phase, commitState])

  const sendEmote = useCallback((emote) => {
    if (socketRef.current && isConnected && inRoom) {
      socketRef.current.sendEmote(emote)
    }
  }, [isConnected, inRoom])

  const toggleSpectatorQueue = useCallback((wantsToJoin) => {
    if (socketRef.current && isConnected && inRoom) {
      setQueueState(prev => ({ ...prev, wantsToJoin }))
      socketRef.current.toggleQueue(wantsToJoin)
    }
  }, [isConnected, inRoom])

  // Clear notification manually
  const clearNotification = useCallback((id) => {
    setGameNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setGameNotifications([])
  }, [])

  // Quick stake setters
  const setQuickStake = useCallback((newStake) => {
    setStake(newStake)
    setLastStake(newStake)
  }, [])

  // Settings updaters
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const value = {
    // Connection state
    isConnected,
    playerId,
    inRoom,

    // State
    stake,
    setStake,
    capacity,
    players,
    setPlayers,
    spectators,
    setSpectators,
    lastChoice,
    setLastChoice,
    lastStake,
    setLastStake,

    // Settings
    settings,
    updateSetting,

    // Round options
    skipNext,
    setSkipNext,
    leaveAtEnd,
    setLeaveAtEnd,

    // Round data
    currentRound,
    setCurrentRound,

    // User data
    userTokens,
    setUserTokens,
    userStats,
    setUserStats,

    // Commit-reveal state
    commitState,

    // Queue state
    queueState,

    // Emote state
    recentEmotes,

    // Error and notification state
    connectionErrors,
    gameNotifications,

    // Computed
    prizePool,
    entryFee,

    // Connection methods
    connectToGame,
    joinAsPlayer,
    joinRoom,
    leaveRoom,

    // Game actions
    makeChoice,
    revealChoice,
    sendEmote,
    toggleSpectatorQueue,

    // Notification management
    clearNotification,
    clearAllNotifications,

    // Legacy methods
    setQuickStake,
  }

  return <GameContextOld.Provider value={value}>{children}</GameContextOld.Provider>
}

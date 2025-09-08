"use client"

import { createContext, useContext, useState, useEffect } from "react"

const GameContext = createContext()

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}

export const GameProvider = ({ children }) => {
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
  })

  // User data
  const [userTokens, setUserTokens] = useState(1000)
  const [userStats, setUserStats] = useState({
    rating: 1200,
    wins: 0,
    gamesPlayed: 0,
  })

  // Computed values
  const prizePool = players.length * stake
  const entryFee = Math.round(stake * 0.02)

  // Quick stake setters
  const setQuickStake = (newStake) => {
    setStake(newStake)
    setLastStake(newStake)
  }

  // Settings updaters
  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const value = {
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

    // Computed
    prizePool,
    entryFee,

    // Actions
    setQuickStake,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

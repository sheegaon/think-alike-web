"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface GameSettings {
  showTimers: boolean
  sound: boolean
  haptics: boolean
  quickAdvance: boolean
  dataSaver: boolean
  allowSpectators: boolean
}

interface GameState {
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
}

interface GameContextType extends GameState {
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
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [stake, setStakeState] = useState(50)
  const [capacity] = useState(12)
  const [players, setPlayersState] = useState(1)
  const [spectators] = useState(0)
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

  const prizePool = players * stake
  const entryFee = Math.round(stake * 0.02)

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
  }

  const setInRoom = (roomStatus: boolean) => {
    setInRoomState(roomStatus)
  }

  const collectReward = (rewardId: string, tokenAmount: number) => {
    setCollectedRewards((prev) => [...prev, rewardId])
    setUserTokensState((prev) => prev + tokenAmount)
  }

  const logout = () => {
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

"use client"

import { useState } from "react"
import { GameProvider } from "./GameContext"
import Login from "./Login"
import Home from "./Home"
import Lobby from "./Lobby"
import Room from "./Room"
import RoundSelect from "./RoundSelect"
import RoundReveal from "./RoundReveal"
import Spectator from "./Spectator"
import Leaderboard from "./Leaderboard"
import Rewards from "./Rewards"
import Settings from "./Settings"

type Screen =
  | "Login"
  | "Home"
  | "Lobby"
  | "Room"
  | "RoundSelect"
  | "RoundReveal"
  | "Spectator"
  | "Leaderboard"
  | "Rewards"
  | "Settings"

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("Login")

  const go = (screen: Screen) => {
    setCurrentScreen(screen)
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "Login":
        return <Login onContinue={() => go("Home")} />
      case "Home":
        return <Home onNavigate={go} />
      case "Lobby":
        return <Lobby onNavigate={go} />
      case "Room":
        return <Room onNavigate={go} />
      case "RoundSelect":
        return <RoundSelect onNavigate={go} />
      case "RoundReveal":
        return <RoundReveal onNavigate={go} />
      case "Spectator":
        return <Spectator onNavigate={go} />
      case "Leaderboard":
        return <Leaderboard onNavigate={go} />
      case "Rewards":
        return <Rewards onNavigate={go} />
      case "Settings":
        return <Settings onNavigate={go} />
      default:
        return <Login onContinue={() => go("Home")} />
    }
  }

  return (
    <GameProvider>
      <div className="min-h-screen bg-background">{renderScreen()}</div>
    </GameProvider>
  )
}

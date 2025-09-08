"use client"

import { useState } from "react"
import { GameProvider } from "../components/GameContext"
import "./App.css"

// Import all screens
import Login from "@/components/Login"
import Home from "@/components/Home"
import Lobby from "@/components/Lobby"
import WaitingRoom from "@/components/WaitingRoom"
import RoundSelect from "@/components/RoundSelect"
import RoundReveal from "@/components/RoundReveal"
import Spectator from "@/components/Spectator"
import Leaderboard from "@/components/Leaderboard"
import Rewards from "@/components/Rewards"
import Settings from "@/components/Settings"

function App() {
  const [currentScreen, setCurrentScreen] = useState("Login")
  const [user, setUser] = useState(null)

  const navigate = (screen) => {
    setCurrentScreen(screen)
  }

  const renderScreen = () => {
    const screenProps = { navigate, user, setUser }

    switch (currentScreen) {
      case "Login":
        return <Login {...screenProps} />
      case "Home":
        return <Home {...screenProps} />
      case "Lobby":
        return <Lobby {...screenProps} />
      case "WaitingRoom":
        return <WaitingRoom {...screenProps} />
      case "RoundSelect":
        return <RoundSelect {...screenProps} />
      case "RoundReveal":
        return <RoundReveal {...screenProps} />
      case "Spectator":
        return <Spectator {...screenProps} />
      case "Leaderboard":
        return <Leaderboard {...screenProps} />
      case "Rewards":
        return <Rewards {...screenProps} />
      case "Settings":
        return <Settings {...screenProps} />
      default:
        return <Login {...screenProps} />
    }
  }

  return (
    <GameProvider>
      <div className="min-h-screen bg-background text-foreground">{renderScreen()}</div>
    </GameProvider>
  )
}

export default App

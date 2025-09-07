"use client"

import { useGame } from "./GameContext"
import Login from "./Login"
import Home from "./Home"
import Lobby from "./Lobby"
import WaitingRoom from "./WaitingRoom"
import RoundSelect from "./RoundSelect"
import RoundReveal from "./RoundReveal"
import Spectator from "./Spectator"
import Leaderboard from "./Leaderboard"
import Rewards from "./Rewards"
import Settings from "./Settings"

/**
 * A component that determines which screen to render based on the game state.
 * This new version handles both in-game and out-of-game navigation.
 */
const RenderScreen = () => {
  const game = useGame()

  // If the player is not logged in, always show the Login screen.
  if (!game.playerId) {
    return <Login onContinueAction={() => {}} />
  }

  // If the player is in a room, the game phase dictates the screen.
  if (game.inRoom) {
    switch (game.gamePhase) {
      case "WAITING":
        return <WaitingRoom />
      case "SELECT":
        return <RoundSelect />
      case "REVEAL":
      case "RESULTS":
        return <RoundReveal />
      // As a fallback, show the waiting room if the phase is null or unexpected.
      default:
        return <WaitingRoom />
    }
  }

  // If the player is not in a room, the current view determines the screen.
  switch (game.currentView) {
    case "Home":
      return <Home />
    case "Lobby":
      return <Lobby />
    case "Leaderboard":
      return <Leaderboard />
    case "Rewards":
      return <Rewards />
    case "Settings":
      return <Settings />
    default:
      return <Home />
  }
}

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <RenderScreen />
    </div>
  )
}

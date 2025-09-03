"use client"

import { useGame } from "./GameContext"
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

/**
 * A component that determines which screen to render based on the game state.
 * This replaces the local `currentScreen` state and `onNavigate` props.
 */
const RenderScreen = () => {
  const game = useGame()

  if (!game.playerId) {
    return <Login />
  }

  if (!game.inRoom) {
    // When not in a room, we can assume we are on the Home screen.
    // The Home screen itself can handle navigation to Lobby, Leaderboard, etc.
    return <Home />
  }

  // When in a room, the game phase determines the screen.
  switch (game.gamePhase) {
    case "WAITING":
      return <Room />
    case "SELECT":
      return <RoundSelect />
    case "REVEAL":
    case "RESULTS":
      return <RoundReveal />
    default:
      // Fallback to the Room view if the state is unexpected.
      return <Room />
  }
}

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <RenderScreen />
    </div>
  )
}

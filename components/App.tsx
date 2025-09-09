"use client"

import { useGame } from "@/components/context"
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
  if (!game.player.isAuthenticated) {
    return <Login onContinueAction={() => {}} />
  }

  // If the player is in a room, the game phase dictates the screen.
  if (game.isInRoom) {
    // If player is a spectator, show the Spectator screen.
    if (game.room?.spectators && game.room.spectators > 0) {
      return <Spectator />
    }

    // Determine game phase from round state
    if (game.round) {
      switch (game.round.phase) {
        case "waiting":
          return <WaitingRoom />
        case "selecting":
          return <RoundSelect />
        case "revealing":
        case "complete":
          return <RoundReveal />
        default:
          return <WaitingRoom />
      }
    } else {
      // No active round, show waiting room
      return <WaitingRoom />
    }
  }

  // If the player is not in a room, the current view determines the screen.
  switch (game.currentView) {
    case "home":
      return <Home />
    case "lobby":
      return <Lobby />
    case "leaderboard":
      return <Leaderboard />
    case "rewards":
      return <Rewards />
    case "settings":
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

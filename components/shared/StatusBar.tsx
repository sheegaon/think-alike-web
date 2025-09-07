"use client"

import { useGame } from "../GameContext"
import { Icons } from "./icons"

export default function StatusBar() {
  const game = useGame()

  // Don't render the status bar if the player is not fully logged in.
  if (!game.playerId) {
    return null
  }

  return (
    <div className="bg-card border-b px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Icons.Username />
          <span className="font-medium">{game.username}</span>
        </div>

        <div className="flex items-center gap-1">
          <Icons.SyncCoins />
          {/* Render balance only when it's a valid number to prevent crashes */}
          <span className="font-medium">
            {typeof game.balance === 'number' ? game.balance.toLocaleString() : '...'}
          </span>
        </div>
      </div>

      {game.inRoom && (
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Icons.Players />
            <span>
              {game.players.length}/{game.spectators + game.players.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Icons.SyncCoins />
            <span>Pool {game.stake * game.players.length}</span>
          </div>
        </div>
      )}
    </div>
  )
}

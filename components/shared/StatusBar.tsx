"use client"

import { useGame } from "../GameContext"
import { Icons } from "./icons"

export default function StatusBar() {
  const game = useGame()

  // Don't render the status bar if the player is not logged in.
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
          {/* Use a default of 0 to prevent crashes if balance is temporarily undefined */}
          <span className="font-medium">{(game.balance || 0).toLocaleString()}</span>
        </div>
      </div>

      {game.inRoom && (
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Icons.Players />
            <span>
              {game.players.length}/{game.spectators + game.players.length} {/* This might need adjustment based on max_players */}
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

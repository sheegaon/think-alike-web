"use client"

import { Icons } from "@/lib/icons"
import { useGame } from "@/components/context"

interface StatusBarProps {
  className?: string
}

export default function StatusBar({ className }: StatusBarProps) {
  const game = useGame()

  if (!game.player.isAuthenticated) {
    return null
  }

  return (
    <div className={`bg-card border-b px-4 py-2 flex items-center justify-between text-sm ${className || ''}`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Icons.Username />
          <span className="font-medium">{game.player.username}</span>
        </div>

        <div className="flex items-center gap-1">
          <Icons.SyncCoins />
          <span className="font-medium">
            {game.player.balance.toLocaleString()}
          </span>
        </div>
      </div>

      {game.isInRoom && game.room && (
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Icons.Players />
            <span>
              {game.room.currentPlayers}/{game.room.maxPlayers}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Icons.SyncCoins />
            <span>Pool {game.prizePool}</span>
          </div>
        </div>
      )}
    </div>
  )
}
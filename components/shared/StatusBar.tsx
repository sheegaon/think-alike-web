"use client"

import { useGame } from "../GameContext"
import { Icons } from "./icons"

export default function StatusBar() {
  const { username, userTokens, players, capacity, inRoom, prizePool } = useGame()

  return (
    <div className="bg-card border-b px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Icons.Username />
          <span className="font-medium">{username}</span>
        </div>

        <div className="flex items-center gap-1">
          <Icons.SyncCoins />
          <span className="font-medium">{userTokens.toLocaleString()}</span>
        </div>
      </div>

      {inRoom && (
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Icons.Players />
            <span>
              {players}/{capacity}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Icons.SyncCoins />
            <span>Pool {prizePool}</span>
          </div>
        </div>
      )}
    </div>
  )
}

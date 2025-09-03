"use client"

import { Button } from "@/components/ui/button"
import { useGame } from "./GameContext"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import StatusBar from "./shared/StatusBar"
import { Icons } from "./shared/icons"

export default function Room() {
  const game = useGame()

  const handleLeaveRoom = () => {
    game.leaveRoom()
    // Navigation is now handled automatically by App.tsx when inRoom becomes false
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6 max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Waiting Room</h1>
          <p className="text-muted-foreground">Tier: {game.tier} - Stake: {game.stake} coins</p>
        </div>

        <div className="text-center text-muted-foreground">The game will start automatically when enough players join.</div>

        <Frame>
          <SectionHeader title={`Players (${game.players.length} / 12)`} />
          <div className="space-y-2">
            {game.players.map((player, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                <Icons.Username />
                <span>{player.username}</span>
                {player.isSpectator && <span className="text-xs text-muted-foreground">(Spectator)</span>}
              </div>
            ))}
          </div>
        </Frame>

        <div className="flex items-center justify-center pt-4">
          <Button variant="outline" onClick={handleLeaveRoom}>
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  )
}

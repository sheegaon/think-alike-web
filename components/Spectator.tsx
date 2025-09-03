"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import WireCard from "./shared/WireCard"
import ProgressBar from "./shared/ProgressBar"
import StatusBar from "./shared/StatusBar"
import { useGame } from "./GameContext"
import { Icons } from "./shared/icons"
import type { Screen } from "./screens"

interface SpectatorProps {
  onNavigate: (screen: Screen) => void
}

export default function Spectator({ onNavigate }: SpectatorProps) {
  const { setInRoom } = useGame()

  useEffect(() => {
    setInRoom(true)
  }, [setInRoom])

  const [queueToPlay, setQueueToPlay] = useState(false)
  const [timeLeft] = useState(25)
  const [playersLockedIn] = useState(6)
  const totalPlayers = 8

  const adjective = "Mysterious"
  const nouns = ["Castle", "Ocean", "Cat", "Phone", "Book", "Mountain", "Clock"]

  const progress = ((30 - timeLeft) / 30) * 100

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Spectating</h1>
          <Button variant="outline" onClick={() => onNavigate("Home")}>
            <Icons.Home />
          </Button>
        </div>

        {/* Timer and progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Time: {timeLeft}s</span>
            <span>
              Players Locked In: {playersLockedIn} / {totalPlayers}
            </span>
          </div>
          <ProgressBar progress={progress} />
        </div>

        {/* Sticky adjective card */}
        <div className="bg-primary text-primary-foreground p-4 rounded-lg text-center">
          <h2 className="text-xl font-bold">{adjective}</h2>
        </div>

        {/* Noun cards (read-only, responsive grid) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {nouns.map((noun) => (
            <WireCard key={noun} text={noun} className="cursor-default opacity-75" />
          ))}
        </div>

        {/* Spectator options */}
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="queue-play" checked={queueToPlay} onCheckedChange={(checked) => setQueueToPlay(!!checked)} />
            <label htmlFor="queue-play" className="text-sm">
              Queue to play when a slot opens
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            You'll automatically join the game when someone leaves. Players are selected first-in-first-out from the
            spectator queue.
          </p>
        </div>
      </div>
    </div>
  )
}

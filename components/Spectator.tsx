"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import WireCard from "./shared/WireCard"
import ProgressBar from "./shared/ProgressBar"
import StatusBar from "./shared/StatusBar"
import { useGame } from "./GameContext"
import { Icons } from "./shared/icons"

export default function Spectator() {
  const game = useGame()
  const [queueToPlay, setQueueToPlay] = useState(false) // This will be moved to GameContext later
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (game.round?.selection_deadline) {
      const deadline = new Date(game.round.selection_deadline).getTime()
      const updateTimer = () => {
        const now = new Date().getTime()
        const remaining = Math.max(0, Math.round((deadline - now) / 1000))
        setTimeLeft(remaining)
      }

      updateTimer()
      const timerInterval = setInterval(updateTimer, 1000)
      return () => clearInterval(timerInterval)
    }
  }, [game.round?.selection_deadline])

  const handleLeave = () => {
    void game.leaveRoom()
  }

  if (!game.round) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Waiting for the round to start...</p>
      </div>
    )
  }

  const totalTime = game.stake === 50 ? 45 : 30 // This should ideally come from the backend
  const progress = ((totalTime - timeLeft) / totalTime) * 100

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Spectating</h1>
          <Button variant="outline" onClick={handleLeave}>
            <Icons.Home />
          </Button>
        </div>

        {/* Timer and progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Time: {timeLeft}s</span>
            <span>
              Players: {game.players.length}
            </span>
          </div>
          <ProgressBar progress={progress} />
        </div>

        {/* Sticky adjective card */}
        <div className="bg-primary text-primary-foreground p-4 rounded-lg text-center">
          <h2 className="text-xl font-bold">{game.round.adjective}</h2>
        </div>

        {/* Noun cards (read-only, responsive grid) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {game.round.nouns.map((noun) => (
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

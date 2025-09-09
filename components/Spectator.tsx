"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import WireCard from "./shared/WireCard"
import ProgressBar from "./shared/ProgressBar"
import StatusBar from "./shared/StatusBar"
import { useGame } from "@/components/context"
import { Icons } from "@/lib/icons"
import Frame from "./shared/Frame"

export default function Spectator() {
  const game = useGame()
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (game.round?.selectionDeadline) {
      const deadline = game.round.selectionDeadline
      const updateTimer = () => {
        const now = Date.now()
        const remaining = Math.max(0, Math.round((deadline - now) / 1000))
        setTimeLeft(remaining)
      }

      updateTimer()
      const timerInterval = setInterval(updateTimer, 1000)
      return () => clearInterval(timerInterval)
    }
  }, [game.round?.selectionDeadline])

  const handleQueueToggle = (wantsToJoin: boolean) => {
    game.actions.toggleSpectatorQueue()
  }

  const totalTime = game.stake === 50 ? 45 : 30 // This should ideally come from the backend
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0

  const renderGameView = () => {
    if (!game.round || !game.round.adjective) {
      return (
        <div className="text-center text-muted-foreground py-10">
          <p>Waiting for the next round to begin...</p>
        </div>
      )
    }

    return (
      <>
        {/* Timer and progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Time: {timeLeft}s</span>
            <span>
              Players Locked In: {game.round.playersLockedIn} / {game.room?.currentPlayers || 0}
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
          {game.round.nouns.map((noun: string, index: number) => (
            <WireCard key={`${noun}-${index}`} text={noun} className="cursor-default opacity-75" />
          ))}
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Spectating</h1>
          <Button variant="outline" onClick={() => game.actions.leaveRoom()}>
            <Icons.Logout />
            Leave
          </Button>
        </div>

        {renderGameView()}

        {/* Spectator options */}
        <Frame>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="queue-play"
              checked={game.queueState.isInQueue}
              onCheckedChange={(checked) => handleQueueToggle(!!checked)}
            />
            <label htmlFor="queue-play" className="text-sm font-medium leading-none">
              Queue to play when a slot opens
            </label>
          </div>
          {game.queueState.position > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              You are position <span className="font-bold">{game.queueState.position}</span> in the queue.
            </p>
          )}
        </Frame>
      </div>
    </div>
  )
}

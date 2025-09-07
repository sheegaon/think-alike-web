"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import WireCard from "./shared/WireCard"
import ProgressBar from "./shared/ProgressBar"
import StatusBar from "./shared/StatusBar"
import { useGame } from "./GameContext"
import { Icons } from "./shared/icons"
import Frame from "./shared/Frame"

export default function Spectator() {
  const game = useGame()
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

  const handleQueueToggle = (wantsToJoin: boolean) => {
    game.toggleQueue(wantsToJoin)
  }

  const totalTime = game.stake === 50 ? 45 : 30 // This should ideally come from the backend
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0

  const renderGameView = () => {
    if (!game.round) {
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
              Players Locked In: {game.commitsCount} / {game.players.length}
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
      </>
    )
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Spectating: {game.tier}</h1>
          <Button variant="outline" onClick={() => game.leaveRoom()}>
            <Icons.Logout className="mr-2" />
            Leave
          </Button>
        </div>

        {renderGameView()}

        {/* Spectator options */}
        <Frame>
          <div className="flex items-center space-x-2">
            <Checkbox id="queue-play" onCheckedChange={(checked) => handleQueueToggle(!!checked)} />
            <label htmlFor="queue-play" className="text-sm font-medium leading-none">
              Queue to play when a slot opens
            </label>
          </div>
          {game.queuePosition !== null && (
            <p className="text-sm text-muted-foreground mt-2">
              You are position <span className="font-bold">{game.queuePosition}</span> in the queue.
            </p>
          )}
        </Frame>
      </div>
    </div>
  )
}

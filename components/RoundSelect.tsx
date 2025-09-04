"use client"

import { useState, useEffect } from "react"
import { useGame, type EndOfRoundAction } from "./GameContext"
import WireCard from "./shared/WireCard"
import ProgressBar from "./shared/ProgressBar"
import StatusBar from "./shared/StatusBar"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RoundSelect() {
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

  const handleCardSelect = (index: number) => {
    if (game.lastChoice === null) {
      void game.commitChoice(index)
    }
  }

  if (!game.round) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Waiting for the next round...</p>
      </div>
    )
  }

  const { adjective, nouns } = game.round
  const totalTime = game.stake === 50 ? 45 : 30 // This should ideally come from the backend
  const progress = ((totalTime - timeLeft) / totalTime) * 100

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-4">
        <div className="sticky top-0 z-10 bg-primary text-primary-foreground p-4 rounded-lg text-center shadow-lg">
          <h1 className="text-2xl font-bold">{adjective}</h1>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Time Left: {timeLeft}s</span>
            <span>
              Locked In: {game.commitsCount} / {game.players.length}
            </span>
          </div>
          <ProgressBar progress={progress} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {nouns.map((noun, index) => (
            <WireCard 
              key={noun} 
              text={noun} 
              selected={game.lastChoice?.choice === index} 
              onClick={() => handleCardSelect(index)} 
              disabled={game.lastChoice !== null}
            />
          ))}
        </div>

        <Frame>
          <SectionHeader title="Options" />
          <div className="space-y-2">
            <label htmlFor="end-of-round-action" className="text-sm font-medium">When this round ends:</label>
            <Select 
              value={game.endOfRoundAction} 
              onValueChange={(value) => game.setEndOfRoundAction(value as EndOfRoundAction)}
            >
              <SelectTrigger id="end-of-round-action">
                <SelectValue placeholder="Choose action..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continue">Continue to next round</SelectItem>
                <SelectItem value="sit_out">Sit out next round</SelectItem>
                <SelectItem value="leave">Leave after this round</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Frame>
      </div>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { useGame } from "./GameContext"
import Frame from "./shared/Frame"
import StatusBar from "./shared/StatusBar"

export default function RoundReveal() {
  const game = useGame()

  if (!game.results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Waiting for round results...</p>
      </div>
    )
  }

  const { nouns, selection_counts, your_choice, payout } = game.results
  const totalPicks = selection_counts.reduce((sum, count) => sum + count, 0)

  const handleLeave = () => {
    game.leaveRoom()
    // Navigation is now handled automatically by App.tsx
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center">Round Results</h1>

        <div className="space-y-3">
          {nouns.map((noun, index) => {
            const count = selection_counts[index]
            const percentage = totalPicks > 0 ? (count / totalPicks) * 100 : 0
            const isYourChoice = index === your_choice

            return (
              <div key={noun} className={`p-4 border rounded-lg ${isYourChoice ? 'border-primary ring-2 ring-primary' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{noun}</span>
                  <span className="text-sm text-muted-foreground">
                    {count} {count === 1 ? 'player' : 'players'} • {percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <Frame>
          <div className="text-center space-y-2">
            <h3 className="font-semibold">Your Round Summary</h3>
            <div className="text-sm space-y-1">
              <div>
                Your pick: <span className="font-medium">{nouns[your_choice]}</span>
              </div>
              <div>
                Your prize share: <span className="font-medium">{payout.toFixed(2)} coins</span>
              </div>
            </div>
            <div className="flex justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={handleLeave}>
                Leave Room
              </Button>
              <Button size="sm" disabled>
                Waiting for next round...
              </Button>
            </div>
          </div>
        </Frame>
      </div>
    </div>
  )
}

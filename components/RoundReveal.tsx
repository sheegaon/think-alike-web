"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useGame } from "@/components/context"
import Frame from "./shared/Frame"
import StatusBar from "./shared/StatusBar"

interface ResultItem {
  choice: string
  count: number
  percentage: number
  isYourChoice: boolean
}

export default function RoundReveal() {
  const game = useGame()
  const [sortedResults, setSortedResults] = useState<ResultItem[]>([])
  const [revealIndex, setRevealIndex] = useState(0)

  useEffect(() => {
    // This effect only runs when results are available (RESULTS phase)
    if (game.results) {
      const { nouns, selection_counts, your_choice } = game.results
      const totalPicks = selection_counts.reduce((sum: any, count: any) => sum + count, 0)

      const combinedResults = nouns.map((noun: any, index: string | number) => ({
        choice: noun,
        count: selection_counts[index],
        percentage: totalPicks > 0 ? (selection_counts[index] / totalPicks) * 100 : 0,
        isYourChoice: index === your_choice,
      }))

      // Sort by count (popularity) in ascending order for the reveal
      combinedResults.sort((a: { count: number }, b: { count: number }) => a.count - b.count)

      setSortedResults(combinedResults)
      setRevealIndex(0) // Reset for staggered reveal

      // Set up the staggered reveal
      const revealTimer = setInterval(() => {
        setRevealIndex((prev) => {
          if (prev < combinedResults.length - 1) {
            return prev + 1
          } else {
            clearInterval(revealTimer)
            return prev
          }
        })
      }, 1200) // 1.2-second delay between each reveal

      return () => clearInterval(revealTimer)
    }
  }, [game.results])

  const handleLeave = () => {
    void game.leaveRoom()
  }

  const handleReveal = () => {
    game.revealChoice()
  }

  // --- Conditional Rendering based on Game Phase ---

  // 1. REVEAL Phase: Before results are in
  if (game.gamePhase === 'REVEAL' && !game.results) {
    return (
      <div className="min-h-screen flex flex-col">
        <StatusBar />
        <div className="flex-grow flex items-center justify-center p-4">
          <Frame className="w-full max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold">Reveal Phase</h1>
            <p className="text-muted-foreground">
              The selection period is over. It's time to reveal your choice to the group.
            </p>
            <Button onClick={handleReveal} size="lg">
              Reveal Your Choice
            </Button>
          </Frame>
        </div>
      </div>
    )
  }

  // 2. RESULTS Phase: Results are available
  if (game.gamePhase === 'RESULTS' && game.results) {
    const { payout } = game.results

    const getButtonText = () => {
      switch (game.endOfRoundAction) {
        case "leave":
          return "Leave Room"
        case "sit_out":
          return "Sitting Out Next Round"
        default:
          return "Waiting for Next Round..."
      }
    }

    return (
      <div className="min-h-screen">
        <StatusBar />
        <div className="p-4 space-y-6 max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center">Round Results</h1>
          <div className="space-y-3">
            {sortedResults.slice(0, revealIndex + 1).map((result) => (
              <div key={result.choice} className={`p-4 border rounded-lg ${result.isYourChoice ? 'border-primary ring-2 ring-primary' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{result.choice}</span>
                  <span className="text-sm text-muted-foreground">
                    {result.count} {result.count === 1 ? 'player' : 'players'} • {result.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {revealIndex >= sortedResults.length - 1 && (
            <Frame>
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Your Round Summary</h3>
                <div className="text-sm space-y-1">
                  <div>
                    Your prize share: <span className="font-medium">{payout.toFixed(2)} coins</span>
                  </div>
                </div>
                <div className="flex justify-center gap-2 pt-4">
                  <Button
                    size="sm"
                    onClick={game.endOfRoundAction === 'leave' ? handleLeave : undefined}
                    disabled={game.endOfRoundAction !== 'leave'}
                  >
                    {getButtonText()}
                  </Button>
                </div>
              </div>
            </Frame>
          )}
        </div>
      </div>
    )
  }

  // 3. Fallback / Waiting state
  return (
    <div className="min-h-screen flex flex-col">
      <StatusBar />
      <div className="flex-grow flex items-center justify-center">
        <p>Waiting for the next phase...</p>
      </div>
    </div>
  )
}

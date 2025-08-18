"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useGame } from "./GameContext"
import ProgressBar from "./shared/ProgressBar"
import Frame from "./shared/Frame"
import StatusBar from "./shared/StatusBar"

interface RoundRevealProps {
  onNavigate: (screen: string) => void
}

export default function RoundReveal({ onNavigate }: RoundRevealProps) {
  const { stake, lastChoice, prizePool, players, setInRoom } = useGame()
  const [revealIndex, setRevealIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(stake === 50 ? 30 : 15)
  const [showSummary, setShowSummary] = useState(false)

  // Mock results data (in reverse popularity order)
  const results = [
    { choice: "Book", count: 1, percentage: 12.5 },
    { choice: "Cat", count: 1, percentage: 12.5 },
    { choice: "Ocean", count: 2, percentage: 25 },
    { choice: "Castle", count: 4, percentage: 50 },
  ]

  const emotes = ["😊", "😢", "😮", "😡", "😍", "🤔"]
  const [selectedEmote, setSelectedEmote] = useState<string | null>(null)
  const [floatingEmotes, setFloatingEmotes] = useState<Array<{ id: number; emote: string }>>([])
  const [emoteCounts, setEmoteCounts] = useState<Record<string, number>>({
    "😊": 3,
    "😢": 1,
    "😮": 5,
    "😡": 0,
    "😍": 2,
    "🤔": 4,
  })

  useEffect(() => {
    setInRoom(true)
  }, [setInRoom])

  useEffect(() => {
    // Reveal results one by one
    const revealTimer = setInterval(() => {
      setRevealIndex((prev) => {
        if (prev < results.length - 1) {
          return prev + 1
        } else {
          // All revealed, start countdown
          setTimeout(() => setShowSummary(true), 600)
          return prev
        }
      })
    }, 1000)

    return () => clearInterval(revealTimer)
  }, [results.length])

  useEffect(() => {
    if (showSummary) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            onNavigate("RoundSelect")
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showSummary, onNavigate])

  const handleEmoteClick = (emote: string) => {
    if (!selectedEmote) {
      setSelectedEmote(emote)
      setEmoteCounts((prev) => ({ ...prev, [emote]: prev[emote] + 1 }))
      const newEmote = { id: Date.now(), emote }
      setFloatingEmotes((prev) => [...prev, newEmote])

      // Remove floating emote after animation
      setTimeout(() => {
        setFloatingEmotes((prev) => prev.filter((e) => e.id !== newEmote.id))
      }, 2000)
    }
  }

  const getPointsForChoice = (count: number) => 10 * (count - 1)

  const myResult = results.find((r) => r.choice === lastChoice)
  const myPoints = myResult ? getPointsForChoice(myResult.count) : 0
  const totalPoints = results.reduce((sum, r) => sum + getPointsForChoice(r.count) * r.count, 0)
  const myShare = totalPoints > 0 ? Math.round((myPoints / totalPoints) * prizePool) : 0

  const progress = showSummary ? (((stake === 50 ? 30 : 15) - timeLeft) / (stake === 50 ? 30 : 15)) * 100 : 0

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold text-center">Round Results</h1>

        {/* Results reveal */}
        <div className="space-y-3 relative">
          {results.slice(0, revealIndex + 1).map((result, index) => (
            <div key={result.choice} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{result.choice}</span>
                <span className="text-sm text-muted-foreground">
                  picked {result.count} • {result.percentage}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${result.percentage}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground">Points per picker: {getPointsForChoice(result.count)}</div>
            </div>
          ))}

          {/* Floating emotes */}
          {floatingEmotes.map((emote) => (
            <div
              key={emote.id}
              className="absolute right-4 text-2xl animate-bounce"
              style={{
                top: `${Math.random() * 200}px`,
                animationDuration: "2s",
              }}
            >
              {emote.emote}
            </div>
          ))}
        </div>

        {/* Emotes */}
        {revealIndex >= results.length - 1 && (
          <div className="flex justify-center gap-2">
            {emotes.map((emote) => (
              <div key={emote} className="flex flex-col items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEmoteClick(emote)}
                  disabled={!!selectedEmote}
                  className="text-lg"
                >
                  {emote}
                </Button>
                <span className="text-xs text-muted-foreground">{emoteCounts[emote]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timer and summary */}
        {showSummary && (
          <>
            <div className="space-y-2">
              <div className="text-center text-sm">Time to next round: {timeLeft}s</div>
              <ProgressBar progress={progress} />
            </div>

            <Frame>
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Your Round Summary</h3>
                <div className="text-sm space-y-1">
                  <div>
                    Your pick: <span className="font-medium">{lastChoice}</span>
                  </div>
                  <div>
                    Your points: <span className="font-medium">{myPoints}</span>
                  </div>
                  <div>
                    Your prize share: <span className="font-medium">{myShare} coins</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => onNavigate("Home")}>
                    Leave Now
                  </Button>
                  <Button variant="outline" size="sm">
                    Sit Out Next Round
                  </Button>
                  <Button size="sm" onClick={() => onNavigate("RoundSelect")}>
                    Continue
                  </Button>
                </div>
              </div>
            </Frame>
          </>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useGame } from "./GameContext"
import WireCard from "./shared/WireCard"
import ProgressBar from "./shared/ProgressBar"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import StatusBar from "./shared/StatusBar"
import { Icons } from "./shared/icons"

interface RoundSelectProps {
  onNavigate: (screen: string) => void
}

export default function RoundSelect({ onNavigate }: RoundSelectProps) {
  const { stake, setLastChoice, skipNext, setSkipNext, leaveAtEnd, setLeaveAtEnd, players, setInRoom } = useGame()

  useEffect(() => {
    setInRoom(true)
  }, [setInRoom])

  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(stake === 50 ? 45 : 30)
  const [playersLockedIn, setPlayersLockedIn] = useState(1)

  const adjective = "Mysterious"
  const nouns = ["Castle", "Ocean", "Cat", "Phone", "Book", "Mountain", "Clock"]

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-select random card if none selected
          if (!selectedCard) {
            const randomCard = nouns[Math.floor(Math.random() * nouns.length)]
            setSelectedCard(randomCard)
            setLastChoice(randomCard)
          }
          onNavigate("RoundReveal")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Simulate other players locking in
    const lockInTimer = setInterval(() => {
      setPlayersLockedIn((prev) => Math.min(prev + Math.random() > 0.7 ? 1 : 0, players))
    }, 2000)

    return () => {
      clearInterval(timer)
      clearInterval(lockInTimer)
    }
  }, [selectedCard, nouns, setLastChoice, onNavigate, players])

  const handleCardSelect = (card: string) => {
    setSelectedCard(card)
    setLastChoice(card)
  }

  const progress = (((stake === 50 ? 45 : 30) - timeLeft) / (stake === 50 ? 45 : 30)) * 100

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-4">
        {/* Sticky adjective card */}
        <div className="sticky top-0 z-10 bg-primary text-primary-foreground p-4 rounded-lg text-center">
          <h1 className="text-2xl font-bold">{adjective}</h1>
        </div>

        {/* Timer and progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Time: {timeLeft}s</span>
            <span>
              Players Locked In: {playersLockedIn} / {players}
            </span>
          </div>
          <ProgressBar progress={progress} />
        </div>

        {/* Noun cards in 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          {nouns.map((noun) => (
            <WireCard key={noun} text={noun} selected={selectedCard === noun} onClick={() => handleCardSelect(noun)} />
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">Auto-selects randomly when the timer expires.</div>

        {/* Options sidebar */}
        <Frame>
          <SectionHeader title="Options" />
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="leave-end" checked={leaveAtEnd} onCheckedChange={(checked) => setLeaveAtEnd(!!checked)} />
              <label htmlFor="leave-end" className="text-sm">
                Leave Room at End of Round
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="skip-next" checked={skipNext} onCheckedChange={(checked) => setSkipNext(!!checked)} />
              <label htmlFor="skip-next" className="text-sm">
                Sit Out Next Round
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onNavigate("Settings")}>
                <Icons.Gear />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate("RoundReveal")}>
                Reveal Early (demo)
              </Button>
            </div>
          </div>
        </Frame>
      </div>
    </div>
  )
}

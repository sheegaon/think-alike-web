"use client"

import { Button } from "@/components/ui/button"
import { useGame } from "./GameContext"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import StatusBar from "./shared/StatusBar"
import { useEffect } from "react"

interface RoomProps {
  onNavigate: (screen: string) => void
}

export default function Room({ onNavigate }: RoomProps) {
  const { players, capacity, prizePool, entryFee, setStake, setInRoom } = useGame()

  useEffect(() => {
    setInRoom(true)
  }, [setInRoom])

  const quickJoinOptions = [
    { name: "Any", stake: 0 },
    { name: "Casual", stake: 50 },
    { name: "Competitive", stake: 200 },
  ]

  const rules = [
    "7 Nouns + 1 Adjective",
    "Pick privately. No chat.",
    "Auto-pick if timer expires.",
    "Scoring: 10 × (n - 1)",
    "Prize pool splits by points.",
  ]

  const handleQuickJoin = (stake: number) => {
    if (stake > 0) {
      setStake(stake)
    }
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-4">Waiting Room</h1>
        </div>

        <div className="text-center text-muted-foreground">Auto-start when 4+ players have joined.</div>

        <div className="space-y-4">
          <SectionHeader title="Quick Join (switch room)" />
          <div className="flex gap-2">
            {quickJoinOptions.map((option) => (
              <Button key={option.name} variant="outline" size="sm" onClick={() => handleQuickJoin(option.stake)}>
                {option.name} {option.stake > 0 && option.stake}
              </Button>
            ))}
          </div>
        </div>

        <Frame>
          <SectionHeader title="Rules (MVP)" />
          <ul className="space-y-2">
            {rules.map((rule, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span className="text-sm">{rule}</span>
              </li>
            ))}
          </ul>
        </Frame>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">Entry fee: {entryFee}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onNavigate("Lobby")}>
              Lobby
            </Button>
            <Button onClick={() => onNavigate("RoundSelect")}>Start Round</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

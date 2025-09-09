"use client"

import { Button } from "@/components/ui/button"
import { useGame } from "@/components/context"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import StatusBar from "./shared/StatusBar"

const ALL_TIERS = [
  { name: "Casual", tier: "CASUAL" },
  { name: "Competitive", tier: "COMPETITIVE" },
  { name: "High Stakes", tier: "HIGH_STAKES" },
]

export default function WaitingRoom() {
  const game = useGame()

  // Filter out the current tier to show other options
  const otherTiers = ALL_TIERS.filter(
    (option) => option.tier.toLowerCase() !== game.room?.tier?.toLowerCase()
  )

  const quickJoinOptions = [{ name: "Any", tier: "ANY" }, ...otherTiers]

  const rules = [
    "Everyone is dealt the same random set of an adjective and 7 nouns.",
    "Pick the match you think will be most popular. No chats or collusion allowed.",
    "System will auto-pick a noun for you if the timer expires.",
    "Scoring: 10 × (n - 1), where n is the number of players who picked the same noun.",
    "Your share of the prize pool equals your share of points for the round.",
  ]

  const handleQuickJoin = (tier: string) => {
    void game.actions.quickJoin(tier)
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-4">Waiting Room</h1>
        </div>

        <div className="text-center text-muted-foreground">
          Game starts once {game.players.length} / {game.room?.minPlayers} players have joined.
        </div>

        <div className="space-y-4">
          <SectionHeader title="Switch Rooms" />
          <div className="flex gap-2">
            {quickJoinOptions.map((option) => (
              <Button key={option.name} variant="outline" size="sm" onClick={() => handleQuickJoin(option.tier)}>
                {option.name}
              </Button>
            ))}
          </div>
        </div>

        <Frame>
          <SectionHeader title="Rules" />
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
          <div className="text-sm text-muted-foreground">Entry fee: {game.entryFee}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => game.actions.leaveRoom()}>
              Leave Room
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

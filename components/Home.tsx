"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import StatusBar from "./shared/StatusBar"
import { Icons } from "@/lib/icons"
import { getRooms, RoomSummaryItem } from "@/lib/rest"
import { useGame } from "./GameContext"


interface QuickJoinOption {
  name: string
  stake: number
  players: number
  tier: string
}

// Helper function to format tier names
const formatTierName = (tier: string) => {
  if (!tier) return ""
  return tier
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default function Home() {
  const game = useGame()
  const [quickJoinOptions, setQuickJoinOptions] = useState<QuickJoinOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuickJoinData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getRooms()
      const options = response.summary.map((item: RoomSummaryItem) => ({
        name: formatTierName(item.tier),
        stake: item.stake,
        players: item.player_count,
        tier: item.tier,
      }));

      setQuickJoinOptions(options)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchQuickJoinData()
  }, [fetchQuickJoinData])

  const handleQuickJoin = (tier: string) => {
    void game.quickJoin(tier)
  }

  const handleLogout = () => {
    void game.logout()
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Think Alike</h1>
          <p className="text-muted-foreground">Are you in sync?</p>
        </div>

        <div className="grid gap-4 max-w-md mx-auto">
          <Button size="lg" onClick={() => game.setCurrentView("Lobby")}>
            Show All Available Rooms
          </Button>

          {!game.isLoading && game.lastStake && game.lastTier && (
            <Button size="lg" variant="outline" onClick={() => handleQuickJoin(game.lastTier!)}>
              Quick Rejoin ({game.lastStake} coins)
            </Button>
          )}

          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" className="bg-transparent" onClick={() => game.setCurrentView("Leaderboard")}>
              <Icons.Leaderboard />
            </Button>
            <Button variant="outline" className="bg-transparent" onClick={() => game.setCurrentView("Rewards")}>
              <Icons.Rewards />
            </Button>
            <Button variant="outline" className="bg-transparent" onClick={() => game.setCurrentView("Settings")}>
              <Icons.Gear />
            </Button>
            <Button variant="outline" className="bg-transparent" onClick={handleLogout}>
              <Icons.Logout />
            </Button>
          </div>
        </div>

        <Frame className="max-w-md mx-auto">
          <SectionHeader title="Join a Room">
            <Button variant="ghost" size="sm" onClick={fetchQuickJoinData} disabled={isLoading}>
              <Icons.Refresh />
            </Button>
          </SectionHeader>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : error ? (
              <div className="text-center text-red-500">Error: {error}</div>
            ) : (
              quickJoinOptions.map((option) => (
                <div
                  key={option.name}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleQuickJoin(option.tier)}
                >
                  <div>
                    <div className="font-medium">{option.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {option.players} players • Stake {option.stake} • Entry fee {Math.round(option.stake * 0.02)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Frame>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import StatusBar from "./shared/StatusBar"
import { Icons } from "@/lib/icons"
import { useGame } from "@/components/context"
import { getLeaderboard, type LeaderboardEntry } from "@/lib/rest"

export default function Leaderboard() {
  const game = useGame()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true)
        setError(null)
        // Fetch leaderboard data, passing the current player's ID to highlight them if needed
        const response = await getLeaderboard(50, 0, game.playerId ?? undefined)
        setLeaderboard(response.leaderboard)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchLeaderboard()
  }, [game.playerId]) // Dependency array ensures this runs when the component mounts or playerID changes

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center py-8 text-muted-foreground">Loading leaderboard...</div>
    }

    if (error) {
      return <div className="text-center py-8 text-red-500">Error: {error}</div>
    }

    if (leaderboard.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">The leaderboard is empty.</div>
    }

    return leaderboard.map((player) => (
      <div key={player.rank} className="grid grid-cols-5 gap-4 p-4 border-t text-sm">
        <div className="font-medium">#{player.rank}</div>
        <div>{player.username}</div>
        <div>{player.rating}</div>
        {/* Note: The API provides 'balance', which is used as 'tokens' here */}
        <div>{player.balance.toLocaleString()}</div>
        <div>{player.wins}</div>
      </div>
    ))
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <Button variant="outline" onClick={() => game.setCurrentView("Home")}>
            <Icons.Home />
          </Button>
        </div>

        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="grid grid-cols-5 gap-4 p-4 bg-muted text-sm font-medium">
            <div>Rank</div>
            <div>Player</div>
            <div>Rating</div>
            <div>Tokens</div>
            <div>Wins</div>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

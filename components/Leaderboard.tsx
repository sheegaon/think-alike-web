"use client"

import { Button } from "@/components/ui/button"
import StatusBar from "./shared/StatusBar"
import { useGame } from "./GameContext"
import { useEffect } from "react"
import { Icons } from "./shared/icons"
import type { Screen } from "./screens"

interface LeaderboardProps {
  onNavigate: (screen: Screen) => void
}

export default function Leaderboard({ onNavigate }: LeaderboardProps) {
  const { setInRoom } = useGame()
  const players = [
    { rank: 1, name: "SyncMaster", rating: 2450, tokens: 15420, wins: 89 },
    { rank: 2, name: "CrowdReader", rating: 2380, tokens: 12890, wins: 76 },
    { rank: 3, name: "ThinkTank", rating: 2290, tokens: 11250, wins: 68 },
    { rank: 4, name: "MindMeld", rating: 2180, tokens: 9870, wins: 54 },
    { rank: 5, name: "GroupThink", rating: 2120, tokens: 8940, wins: 47 },
    { rank: 6, name: "Consensus", rating: 2050, tokens: 7650, wins: 41 },
    { rank: 7, name: "Hivemind", rating: 1980, tokens: 6890, wins: 38 },
    { rank: 8, name: "Predictor", rating: 1920, tokens: 6120, wins: 33 },
  ]

  useEffect(() => {
    setInRoom(false)
  }, [setInRoom])

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <Button variant="outline" onClick={() => onNavigate("Home")}>
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

          {players.map((player) => (
            <div key={player.rank} className="grid grid-cols-5 gap-4 p-4 border-t text-sm">
              <div className="font-medium">#{player.rank}</div>
              <div>{player.name}</div>
              <div>{player.rating}</div>
              <div>{player.tokens.toLocaleString()}</div>
              <div>{player.wins}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useGame } from "./GameContext"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import StatusBar from "./shared/StatusBar"
import { Icons } from "./shared/icons"

interface HomeProps {
  onNavigate: (screen: string) => void
}

export default function Home({ onNavigate }: HomeProps) {
  const { setStake, lastStake, setInRoom, logout } = useGame()

  useEffect(() => {
    setInRoom(false)
  }, [setInRoom])

  const quickJoinOptions = [
    { name: "Casual", stake: 50, players: 3 },
    { name: "Competitive", stake: 200, players: 7 },
    { name: "High Stakes", stake: 500, players: 2 },
  ]

  const handleQuickJoin = (stake: number) => {
    setStake(stake)
    setInRoom(false)
    onNavigate("Room")
  }

  const handleLogout = () => {
    logout()
    onNavigate("Login")
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Think Alike</h1>
          <p className="text-muted-foreground">Ready to sync with the crowd?</p>
        </div>

        <div className="grid gap-4 max-w-md mx-auto">
          <Button size="lg" onClick={() => onNavigate("Lobby")}>
            Show All Available Rooms
          </Button>

          {lastStake && (
            <Button size="lg" variant="outline" onClick={() => handleQuickJoin(lastStake)}>
              Quick Rejoin ({lastStake} coins)
            </Button>
          )}

          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" className="bg-transparent" onClick={() => onNavigate("Leaderboard")}>
              <Icons.Leaderboard />
            </Button>
            <Button variant="outline" className="bg-transparent" onClick={() => onNavigate("Rewards")}>
              <Icons.Rewards />
            </Button>
            <Button variant="outline" className="bg-transparent" onClick={() => onNavigate("Settings")}>
              <Icons.Gear />
            </Button>
            <Button variant="outline" className="bg-transparent" onClick={handleLogout}>
              <Icons.Logout />
            </Button>
          </div>
        </div>

        <Frame className="max-w-md mx-auto">
          <SectionHeader title="Join a Room" />
          <div className="space-y-3">
            {quickJoinOptions.map((option) => (
              <div
                key={option.name}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleQuickJoin(option.stake)}
              >
                <div>
                  <div className="font-medium">{option.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {option.players} players • Stake {option.stake} • Entry fee {Math.round(option.stake * 0.02)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Frame>
      </div>
    </div>
  )
}

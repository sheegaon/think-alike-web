"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGame } from "./GameContext"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import StatusBar from "./shared/StatusBar"
import { Icons } from "./shared/icons"
import type { Screen } from "./screens"

interface LobbyProps {
  onNavigate: (screen: Screen) => void
}

export default function Lobby({ onNavigate }: LobbyProps) {
  const { setStake, setInRoom } = useGame()
  const [filter, setFilter] = useState<string>("All")

  useEffect(() => {
    setInRoom(false)
  }, [setInRoom])

  const allRooms = [
    { stake: 50, players: 3, capacity: 12, tier: "Casual" },
    { stake: 50, players: 8, capacity: 12, tier: "Casual" },
    { stake: 200, players: 12, capacity: 12, tier: "Competitive" },
    { stake: 200, players: 5, capacity: 12, tier: "Competitive" },
    { stake: 500, players: 2, capacity: 12, tier: "High Stakes" },
  ]

  const filteredRooms =
    filter === "All"
      ? allRooms
      : allRooms.filter((room) => {
          if (filter === "Casual") return room.tier === "Casual"
          if (filter === "Competitive") return room.tier === "Competitive"
          if (filter === "High Stakes") return room.tier === "High Stakes"
          return true
        })

  const handleJoinRoom = (stake: number) => {
    setStake(stake)
    setInRoom(false)
    onNavigate("Room")
  }

  const handleSpectateRoom = () => {
    onNavigate("Spectator")
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Show All Available Rooms</h1>
          <Button variant="outline" onClick={() => onNavigate("Home")}>
            <Icons.Home />
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <Button variant={filter === "All" ? "default" : "outline"} size="sm" onClick={() => setFilter("All")}>
            All
          </Button>
          <Select value={filter === "All" ? "" : filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Casual">Casual</SelectItem>
              <SelectItem value="Competitive">Competitive</SelectItem>
              <SelectItem value="High Stakes">High Stakes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Frame>
          <SectionHeader title="Available Rooms" />
          <div className="space-y-3">
            {filteredRooms.map((room, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{room.tier}</div>
                  <div className="text-sm text-muted-foreground">
                    Stake: {room.stake} • Players: {room.players}/{room.capacity} • Entry fee:{" "}
                    {Math.round(room.stake * 0.02)}
                  </div>
                </div>
                <div className="flex gap-2">
                  {room.players >= room.capacity ? (
                    <Button size="sm" variant="outline" onClick={handleSpectateRoom}>
                      <Icons.Eye />
                      Spectate
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleJoinRoom(room.stake)}>
                      Join
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Frame>
      </div>
    </div>
  )
}

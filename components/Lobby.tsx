"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGame } from "./GameContext"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import StatusBar from "./shared/StatusBar"
import { Icons } from "./shared/icons"
import type { Screen } from "./screens"
import { getRooms, type RoomResponse } from "@/lib/rest"

interface LobbyProps {
  onNavigate: (screen: Screen) => void
}

// Helper function to format tier names
const formatTierName = (tier: string) => {
  return tier
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default function Lobby({ onNavigate }: LobbyProps) {
  const { setStake, setInRoom } = useGame()
  const [allRooms, setAllRooms] = useState<RoomResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("All")

  const fetchRooms = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Convert UI-friendly filter name to API-friendly tier name
      const tier = filter === "All" ? undefined : filter.toLowerCase().replace(/ /g, "_")
      const response = await getRooms(tier)
      setAllRooms(response.rooms)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    setInRoom(false)
    fetchRooms()
  }, [fetchRooms, setInRoom])

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
          <Button variant="outline" size="sm" onClick={fetchRooms} disabled={isLoading}>
            <Icons.Refresh />
          </Button>
        </div>

        <Frame>
          <SectionHeader title="Available Rooms" />
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading rooms...</div>
            ) : error ? (
              <div className="text-center text-red-500">Error: {error}</div>
            ) : allRooms.length === 0 ? (
              <div className="text-center text-muted-foreground">No rooms available.</div>
            ) : (
              allRooms.map((room, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{formatTierName(room.tier)}</div>
                    <div className="text-sm text-muted-foreground">
                      Stake: {room.stake} • Players: {room.player_count}/{room.max_players} • Entry fee:{" "}
                      {Math.round(room.stake * 0.02)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {room.player_count >= room.max_players ? (
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
              ))
            )}
          </div>
        </Frame>
      </div>
    </div>
  )
}

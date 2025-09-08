"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGame } from "@/components/context"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import StatusBar from "./shared/StatusBar"
import { Icons } from "@/lib/icons"
import { getRooms, type RoomResponse } from "@/lib/rest"

// Helper function to format tier names for display
const formatTierName = (tier: string) => {
  return tier
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default function Lobby() {
  const game = useGame()
  const [allRooms, setAllRooms] = useState<RoomResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("All")

  const fetchRooms = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (filter === "All") {
        const summary = await getRooms();
        const roomPromises = summary.summary.map((tierSummary) => getRooms(tierSummary.tier));
        const roomLists = await Promise.all(roomPromises);
        const allRooms = roomLists.flatMap((list) => list.rooms);
        setAllRooms(allRooms);
      } else {
        const tier = filter.toLowerCase().replace(/ /g, "_");
        const response = await getRooms(tier);
        setAllRooms(response.rooms);
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    void fetchRooms()
  }, [fetchRooms])

  const handleJoin = (roomKey: string, asSpectator: boolean) => {
    void game.joinRoom(roomKey, asSpectator)
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Available Rooms</h1>
          <Button variant="outline" onClick={() => game.setCurrentView("Home")}>
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
              allRooms.map((room) => (
                <div key={room.room_key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{formatTierName(room.tier)}</div>
                    <div className="text-sm text-muted-foreground">
                      Stake: {room.stake} • Players: {room.player_count}/{room.max_players} • Entry fee:{" "}
                      {room.entry_fee}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {room.player_count >= room.max_players ? (
                      <Button size="sm" variant="outline" onClick={() => handleJoin(room.room_key, true)}>
                        <Icons.Eye />
                        Spectate
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleJoin(room.room_key, false)}>
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

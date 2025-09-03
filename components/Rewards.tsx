"use client"

import { Button } from "@/components/ui/button"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import ProgressBar from "./shared/ProgressBar"
import Pill from "./shared/Pill"
import StatusBar from "./shared/StatusBar"
import { useState } from "react"
import { Icons } from "./shared/icons"

// Note: This component still uses mock data.
// A future step will be to fetch this data from the backend and implement reward collection.

export default function Rewards() {
  const [collectingReward, setCollectingReward] = useState<string | null>(null)

  // Mock data - will be replaced with API data
  const dailyQuests = [
    { id: "daily-play-3", title: "Play 3 rounds", reward: 150, progress: 3, goal: 3 },
    { id: "daily-win-1", title: "Win a round", reward: 200, progress: 0, goal: 1 },
    { id: "daily-match-5", title: "Match majority 5 times", reward: 300, progress: 3, goal: 5 },
  ]

  const seasonalQuests = [
    { id: "season-play-50", title: "Play 50 rounds this season", reward: 1000, progress: 23, goal: 50 },
    { id: "season-streak-10", title: "Reach 10 win streak", reward: 2000, progress: 4, goal: 10 },
    { id: "season-tokens-5000", title: "Earn 5000 tokens", reward: 1500, progress: 2890, goal: 5000 },
  ]

  // Mock collected rewards state
  const [collectedRewards, setCollectedRewards] = useState<string[]>([])

  const handleCollectReward = async (quest: any) => {
    setCollectingReward(quest.id)
    // Simulate collection animation delay
    setTimeout(() => {
      alert(`Collecting reward for ${quest.title}`)
      setCollectedRewards((prev) => [...prev, quest.id])
      setCollectingReward(null)
    }, 1000)
  }

  const isCompletable = (quest: any) => {
    return quest.progress >= quest.goal && !collectedRewards.includes(quest.id)
  }

  const isCollected = (quest: any) => {
    return collectedRewards.includes(quest.id)
  }

  const visibleDailyQuests = dailyQuests.filter((quest) => !isCollected(quest))
  const visibleSeasonalQuests = seasonalQuests.filter((quest) => !isCollected(quest))

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rewards</h1>
          <Button variant="outline" onClick={() => alert("Navigation to be implemented")}>
            <Icons.Home />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Daily Quests */}
          <Frame>
            <SectionHeader title="Daily Quests">
              <Pill label="Resets in" value="12h" />
            </SectionHeader>

            <div className="space-y-4">
              {visibleDailyQuests.map((quest) => (
                <div key={quest.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{quest.title}</span>
                    <div className="flex items-center gap-1">
                      <Icons.Rewards />
                      <span className="text-sm font-medium">{quest.reward}</span>
                    </div>
                  </div>
                  <ProgressBar progress={(quest.progress / quest.goal) * 100} />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {quest.progress}/{quest.goal}
                    </div>
                    {isCompletable(quest) && (
                      <Button
                        size="sm"
                        onClick={() => handleCollectReward(quest)}
                        disabled={collectingReward === quest.id}
                        className="h-6 px-2 text-xs"
                      >
                        {collectingReward === quest.id ? (
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Collecting...
                          </div>
                        ) : (
                          "Collect"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {visibleDailyQuests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Icons.Rewards className="mx-auto mb-2 w-8 h-8 opacity-50" />
                  <p className="text-sm">All daily rewards collected!</p>
                  <p className="text-xs">New quests reset in 12h</p>
                </div>
              )}
            </div>
          </Frame>

          {/* Seasonal Quests */}
          <Frame>
            <SectionHeader title="Seasonal Quests">
              <Pill label="Ends in" value="21d" />
            </SectionHeader>

            <div className="space-y-4">
              {visibleSeasonalQuests.map((quest) => (
                <div key={quest.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{quest.title}</span>
                    <div className="flex items-center gap-1">
                      <Icons.Rewards />
                      <span className="text-sm font-medium">{quest.reward}</span>
                    </div>
                  </div>
                  <ProgressBar progress={(quest.progress / quest.goal) * 100} />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {quest.progress}/{quest.goal}
                    </div>
                    {isCompletable(quest) && (
                      <Button
                        size="sm"
                        onClick={() => handleCollectReward(quest)}
                        disabled={collectingReward === quest.id}
                        className="h-6 px-2 text-xs"
                      >
                        {collectingReward === quest.id ? (
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Collecting...
                          </div>
                        ) : (
                          "Collect"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {visibleSeasonalQuests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Icons.Coins className="mx-auto mb-2 w-8 h-8 opacity-50" />
                  <p className="text-sm">All seasonal rewards collected!</p>
                  <p className="text-xs">New season starts in 21d</p>
                </div>
              )}
            </div>
          </Frame>
        </div>
      </div>
    </div>
  )
}

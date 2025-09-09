"use client"

import { Button } from "@/components/ui/button"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import ProgressBar from "./shared/ProgressBar"
import Pill from "./shared/Pill"
import StatusBar from "./shared/StatusBar"
import { useState, useEffect, useCallback } from "react"
import { Icons } from "@/lib/icons"
import { useGame } from "@/components/context"
import { getPlayerQuests, claimQuestReward, type Quest } from "@/lib/rest"

export default function Rewards() {
  const game = useGame()
  const [quests, setQuests] = useState<Quest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collectingReward, setCollectingReward] = useState<string | null>(null)

  const fetchQuests = useCallback(async () => {
    if (!game.player.id) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await getPlayerQuests(parseInt(game.player.id))
      setQuests(response.quests)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [game.player.id])

  useEffect(() => {
    void fetchQuests()
  }, [fetchQuests])

  const handleCollectReward = async (quest: Quest) => {
    if (!game.player.id) return
    setCollectingReward(quest.quest_id)
    try {
      const response = await claimQuestReward(parseInt(game.player.id), quest.quest_id)
      if (response.success) {
        // Update player balance in game state
        game.actions.addNotification(`Claimed ${response.reward_amount} coins!`, 'success')
        // Re-fetch quests to update the view
        await fetchQuests()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCollectingReward(null)
    }
  }

  const dailyQuests = quests.filter((q) => q.quest_type === "daily")
  const seasonalQuests = quests.filter((q) => q.quest_type === "seasonal")

  const renderQuestList = (questList: Quest[]) => {
    if (isLoading) {
      return <div className="text-center py-8 text-muted-foreground">Loading quests...</div>
    }
    if (error) {
      return <div className="text-center py-8 text-red-500">Error: {error}</div>
    }
    if (questList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Icons.Rewards />
          <p className="text-sm">No quests available right now.</p>
        </div>
      )
    }

    return questList.map((quest) => (
      <div key={quest.quest_id} className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{quest.name}</span>
          <div className="flex items-center gap-1">
            <Icons.Rewards />
            <span className="text-sm font-medium">{quest.reward}</span>
          </div>
        </div>
        <ProgressBar progress={(quest.progress / quest.required) * 100} />
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {quest.progress}/{quest.required}
          </div>
          {quest.claimable && (
            <Button
              size="sm"
              onClick={() => handleCollectReward(quest)}
              disabled={collectingReward === quest.quest_id}
              className="h-6 px-2 text-xs"
            >
              {collectingReward === quest.quest_id ? (
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
    ))
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rewards</h1>
          <Button variant="outline" onClick={() => game.actions.setCurrentView("home")}>
            <Icons.Home />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Daily Quests */}
          <Frame>
            <SectionHeader title="Daily Quests">
              <Pill label="Resets in" value="12h" />
            </SectionHeader>
            <div className="space-y-4">{renderQuestList(dailyQuests)}</div>
          </Frame>

          {/* Seasonal Quests */}
          <Frame>
            <SectionHeader title="Seasonal Quests">
              <Pill label="Ends in" value="21d" />
            </SectionHeader>
            <div className="space-y-4">{renderQuestList(seasonalQuests)}</div>
          </Frame>
        </div>
      </div>
    </div>
  )
}

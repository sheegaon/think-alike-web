"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useGame, type GameSettings } from "@/components/context"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import StatusBar from "./shared/StatusBar"

export default function Settings() {
  const game = useGame()

  const settingsOptions: { key: keyof GameSettings; label: string; description: string }[] = [
    { key: "soundEffects", label: "Sound effects", description: "Play audio feedback and notifications" },
    { key: "haptics", label: "Haptics (mobile)", description: "Vibration feedback on mobile devices" },
    { key: "autoAdvance", label: "Auto-advance", description: "Automatically proceed to next screen when ready" },
  ]

  const handleSettingChange = (key: keyof GameSettings, value: boolean) => {
    game.updateSettings({ [key]: value })
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button variant="outline" onClick={() => game.setCurrentView("Home")}>
            Back
          </Button>
        </div>

        <Frame>
          <SectionHeader title="Game Settings" />

          <div className="space-y-6">
            {settingsOptions.map((option) => (
              <div key={option.key} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
                <Switch
                  checked={game.settings[option.key]}
                  onCheckedChange={(checked) => handleSettingChange(option.key, checked)}
                />
              </div>
            ))}
          </div>
        </Frame>
      </div>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useGame } from "./GameContext"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import StatusBar from "./shared/StatusBar"

// Note: This component is partially connected.
// The settings state is read from the context, but updating settings is not yet implemented.

export default function Settings() {
  const game = useGame()

  const settingsOptions = [
    { key: "sound", label: "Sound effects", description: "Play audio feedback and notifications" },
    { key: "haptics", label: "Haptics (mobile)", description: "Vibration feedback on mobile devices" },
    { key: "quickAdvance", label: "Auto-advance", description: "Automatically proceed to next screen when ready" },
  ]

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
                  checked={game.settings[option.key as keyof typeof game.settings]}
                  disabled // Re-enable when updateSettings is implemented
                />
              </div>
            ))}
          </div>
        </Frame>
      </div>
    </div>
  )
}

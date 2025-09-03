"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useGame } from "./GameContext"
import Frame from "./shared/Frame"
import SectionHeader from "./shared/SectionHeader"
import StatusBar from "./shared/StatusBar"
import { useEffect } from "react"
import type { Screen } from "./screens"

interface SettingsProps {
  onNavigate: (screen: Screen) => void
}

export default function Settings({ onNavigate }: SettingsProps) {
  const { settings, updateSettings, setInRoom } = useGame()

  useEffect(() => {
    setInRoom(false)
  }, [setInRoom])

  const settingsOptions = [
    { key: "showTimers", label: "Show timers", description: "Display countdown timers during rounds" },
    { key: "sound", label: "Sound effects", description: "Play audio feedback and notifications" },
    { key: "haptics", label: "Haptics (mobile)", description: "Vibration feedback on mobile devices" },
    { key: "quickAdvance", label: "Auto-advance", description: "Automatically proceed to next screen when ready" },
    { key: "dataSaver", label: "Data saver", description: "Reduce data usage and animations" },
    { key: "allowSpectators", label: "Allow spectators", description: "Let others watch your games" },
  ]

  const handleToggle = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] })
  }

  return (
    <div className="min-h-screen">
      <StatusBar />

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button variant="outline" onClick={() => onNavigate("Home")}>
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
                  checked={settings[option.key as keyof typeof settings]}
                  onCheckedChange={() => handleToggle(option.key as keyof typeof settings)}
                />
              </div>
            ))}
          </div>
        </Frame>
      </div>
    </div>
  )
}

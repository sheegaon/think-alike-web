"use client"

import { GameProvider } from "@/components/GameContext"
import App from "@/components/App"

export default function Page() {
  return (
    <GameProvider>
      <App />
    </GameProvider>
  )
}

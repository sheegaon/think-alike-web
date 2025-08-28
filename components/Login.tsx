"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Frame from "./shared/Frame"
import { useGame } from "./GameContext"

interface LoginProps {
  onContinue: () => void
}

export default function Login({ onContinue }: LoginProps) {
  const [username, setUsername] = useState("")
  const game = useGame()

  const handleContinueAsGuest = async () => {
    if (!username.trim()) return
    
    try {
      await game.register(username.trim())
      onContinue()
    } catch (error) {
      // Error is handled by GameContext and shown via game.error
      console.error("Failed to register:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Frame className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Think Alike</h1>
          <p className="text-muted-foreground">Are you in sync?</p>
        </div>

        <div className="space-y-4">
          <Button className="w-full bg-transparent" variant="outline" disabled={game.isLoading}>
            Continue with Apple
          </Button>
          <Button className="w-full bg-transparent" variant="outline" disabled={game.isLoading}>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <div className="space-y-2">
            <Input 
              placeholder="Enter username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              disabled={game.isLoading}
              onKeyPress={(e) => e.key === 'Enter' && handleContinueAsGuest()}
            />
            {game.error && (
              <div className="text-sm text-red-500 text-center">
                {game.error}
              </div>
            )}
            <Button 
              className="w-full" 
              onClick={handleContinueAsGuest} 
              disabled={!username.trim() || game.isLoading}
            >
              {game.isLoading ? "Creating Player..." : "Continue as Guest"}
            </Button>
          </div>
        </div>
      </Frame>
    </div>
  )
}

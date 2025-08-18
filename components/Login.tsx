"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Frame from "./shared/Frame"

interface LoginProps {
  onContinue: () => void
}

export default function Login({ onContinue }: LoginProps) {
  const [username, setUsername] = useState("")

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Frame className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Think Alike</h1>
          <p className="text-muted-foreground">Are you in sync?</p>
        </div>

        <div className="space-y-4">
          <Button className="w-full bg-transparent" variant="outline">
            Continue with Apple
          </Button>
          <Button className="w-full bg-transparent" variant="outline">
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
            <Input placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Button className="w-full" onClick={onContinue} disabled={!username.trim()}>
              Continue as Guest
            </Button>
          </div>
        </div>
      </Frame>
    </div>
  )
}

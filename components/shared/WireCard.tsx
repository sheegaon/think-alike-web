"use client"

import { cn } from "@/lib/utils"

interface WireCardProps {
  text: string
  selected?: boolean
  onClick?: () => void
  className?: string
}

export default function WireCard({ text, selected = false, onClick, className }: WireCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border-2 transition-all duration-200 text-center font-medium",
        "hover:border-primary/50 hover:bg-accent/50",
        selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-card-foreground",
        className,
      )}
    >
      {text}
    </button>
  )
}

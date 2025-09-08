"use client"

import { cn } from "@/lib/utils"

interface WireCardProps {
  text: string
  selected?: boolean
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export default function WireCard({ text, selected = false, onClick, className, disabled = false }: WireCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      className={cn(
        "p-4 rounded-lg border-2 transition-all duration-200 text-center font-medium",
        "hover:border-primary/50 hover:bg-accent/50",
        selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-card-foreground",
        disabled || !onClick ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      {text}
    </button>
  )
}

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FrameProps {
  children: ReactNode
  className?: string
}

export default function Frame({ children, className }: FrameProps) {
  return <div className={cn("bg-card border rounded-lg p-4", className)}>{children}</div>
}

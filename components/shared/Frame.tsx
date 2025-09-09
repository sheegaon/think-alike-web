"use client"

import { ReactNode } from "react"

interface FrameProps {
  children: ReactNode
  className?: string
}

export default function Frame({ children, className }: FrameProps) {
  return (
    <div className={`bg-card border rounded-lg p-4 ${className || ''}`}>
      {children}
    </div>
  )
}

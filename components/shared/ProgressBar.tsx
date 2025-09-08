"use client"

interface ProgressBarProps {
  progress: number
  className?: string
}

export default function ProgressBar({ progress, className }: ProgressBarProps) {
  return (
    <div className={`w-full bg-secondary rounded-full h-2 ${className || ''}`}>
      <div
        className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  )
}

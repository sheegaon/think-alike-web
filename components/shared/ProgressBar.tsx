interface ProgressBarProps {
  progress: number // 0-100
  className?: string
}

export default function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  return (
    <div className={`w-full bg-muted rounded-full h-2 ${className}`}>
      <div
        className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  )
}

"use client"

interface StatusBarProps {
  className?: string
}

export default function StatusBar({ className }: StatusBarProps) {
  return (
    <div className={`bg-background border-b px-4 py-2 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-muted-foreground">Connected</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Think Alike
        </div>
      </div>
    </div>
  )
}

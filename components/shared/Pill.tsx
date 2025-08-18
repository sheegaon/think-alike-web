interface PillProps {
  label: string
  value: string
  className?: string
}

export default function Pill({ label, value, className = "" }: PillProps) {
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs ${className}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

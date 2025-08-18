import type { ReactNode } from "react"

interface SectionHeaderProps {
  title: string
  children?: ReactNode
  className?: string
}

export default function SectionHeader({ title, children, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <div>{children}</div>}
    </div>
  )
}

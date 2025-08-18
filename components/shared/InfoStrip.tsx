import { Icons } from "./icons"

interface InfoStripProps {
  players: number
  capacity: number
  pool: number
}

export default function InfoStrip({ players, capacity, pool }: InfoStripProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-lg text-sm">
      <div className="flex items-center gap-2">
        <Icons.Users />
        <span>
          {players}/{capacity}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Icons.Coins />
        <span>Pool {pool}</span>
      </div>
    </div>
  )
}

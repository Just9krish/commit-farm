import { VISIBLE_LOG_ENTRIES } from '@/game/definitions'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game-store'

export function CommitLog() {
  const log = useGameStore((s) => s.log)

  return (
    <div className="h-[150px] overflow-hidden font-mono text-xs leading-[1.9] text-ink-dim">
      {log.slice(0, VISIBLE_LOG_ENTRIES).map((entry, index) => (
        <div key={entry.id} className={cn('truncate', index === 0 && 'animate-rise-in text-ink')}>
          <span className="mr-1.5 text-blue">{entry.hash}</span>
          {entry.line}
        </div>
      ))}
    </div>
  )
}

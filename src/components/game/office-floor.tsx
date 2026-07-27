import { Fragment } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { GENERATOR_DEFS, OFFICE_MAX_DESKS } from '@/game/definitions'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game-store'

export function OfficeFloor() {
  const ownedCounts = useGameStore(
    useShallow((s) => GENERATOR_DEFS.map((g) => s.generators[g.id].owned)),
  )
  const isEmpty = ownedCounts.every((count) => count === 0)

  return (
    <div className="flex min-h-[110px] flex-wrap content-start gap-1 rounded-md border border-dashed bg-panel-alt p-2.5">
      {isEmpty ? (
        <span className="font-mono text-xs text-ink-dim">
          {'// no one hired yet — the office is empty'}
        </span>
      ) : (
        GENERATOR_DEFS.map((def, index) => {
          const owned = ownedCounts[index]
          if (owned === 0) return null
          const visibleDesks = Math.min(owned, OFFICE_MAX_DESKS)
          return (
            <Fragment key={def.id}>
              {Array.from({ length: visibleDesks }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex size-5 animate-desk-in items-center justify-center rounded-[3px] bg-white/[0.03] font-mono text-sm',
                    def.colorClass,
                  )}
                >
                  {def.glyph}
                </div>
              ))}
              {owned > OFFICE_MAX_DESKS && (
                <div
                  className={cn(
                    'flex h-5 items-center rounded-[3px] bg-white/[0.03] px-1.5 font-mono text-sm tabular-nums',
                    def.colorClass,
                  )}
                >
                  +{owned - OFFICE_MAX_DESKS}
                </div>
              )}
            </Fragment>
          )
        })
      )}
    </div>
  )
}

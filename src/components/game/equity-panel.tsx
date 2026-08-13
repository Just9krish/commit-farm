import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { GamePanel } from './game-panel'
import { META_PERK_DEFS } from '@/game/definitions'
import type { MetaPerkDef } from '@/game/types'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game-store'

/**
 * Meta-Perks are bought by spending Equity after an IPO.
 */
export function EquityPanel() {
  const isVisible = useGameStore(
    (s) => s.equity > 0 || s.ipoCount > 0 || Object.values(s.metaPerks).some(Boolean),
  )
  const ownedIds = useGameStore(
    useShallow((s) => META_PERK_DEFS.filter((p) => s.metaPerks[p.id]).map((p) => p.id)),
  )

  if (!isVisible) return null

  return (
    <div className="animate-rise-in">
      <GamePanel title={`Meta-Perks · ${ownedIds.length}/${META_PERK_DEFS.length}`}>
        <p className="mb-3 font-mono text-[11px] text-ink-dim">
          {'// spend equity on permanent meta-perks — they survive IPOs'}
        </p>
        {META_PERK_DEFS.map((def) => (
          <MetaPerkRow key={def.id} def={def} isOwned={ownedIds.includes(def.id)} />
        ))}
      </GamePanel>
    </div>
  )
}

interface MetaPerkRowProps {
  def: MetaPerkDef
  isOwned: boolean
}

const MetaPerkRow = memo(function MetaPerkRow({ def, isOwned }: MetaPerkRowProps) {
  const buyMetaPerk = useGameStore((s) => s.buyMetaPerk)
  const canAfford = useGameStore((s) => s.equity >= def.equityCost)

  return (
    <div
      className={cn(
        'mb-2 flex items-center justify-between gap-2.5 rounded-md border bg-panel-alt px-2 py-2.5 last:mb-0',
        isOwned && 'border-indigo-500/60',
        !isOwned && canAfford && 'border-indigo-500/50',
      )}
    >
      <div className="min-w-0">
        <div className={cn('text-[13px] font-semibold text-ink', isOwned && 'text-indigo-500')}>
          {isOwned && '✓ '}
          {def.name}
        </div>
        <div className="truncate font-mono text-[11px] text-ink-dim">{def.description}</div>
      </div>
      {!isOwned && (
        <button
          type="button"
          disabled={!canAfford}
          onClick={() => buyMetaPerk(def.id)}
          className="min-w-[78px] flex-none rounded-[5px] border bg-panel px-2.5 py-1.5 text-right font-mono text-xs text-ink transition-[color,border-color,transform] duration-150 ease-snappy enabled:hover:border-indigo-500 enabled:hover:text-indigo-500 enabled:active:scale-[0.97] disabled:opacity-40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="block font-bold text-indigo-500 tabular-nums">EQ {def.equityCost}</span>
          <span className="block text-[10px] text-ink-dim">unlock</span>
        </button>
      )}
    </div>
  )
})

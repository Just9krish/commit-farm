import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  achievementMultiplier,
  bulkCost,
  costMultiplier,
  formatNumber,
  maxAffordable,
  milestoneMultiplier,
  nextMilestone,
  starMultiplier,
  upgradeMultiplier,
} from '@/game/logic'
import type { GeneratorDef } from '@/game/types'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game-store'

interface GeneratorRowProps {
  def: GeneratorDef
}

export const GeneratorRow = memo(function GeneratorRow({ def }: GeneratorRowProps) {
  const buyGenerator = useGameStore((s) => s.buyGenerator)
  const { owned, quantity, cost, canAfford, prodLabel, milestoneAt, progress } = useGameStore(
    useShallow((s) => {
      const ownedCount = s.generators[def.id].owned
      const costMult = costMultiplier(s)
      const wanted =
        s.buyQuantity === 'max'
          ? maxAffordable({ def, owned: ownedCount, budget: s.loc, costMult })
          : Number(s.buyQuantity)
      // in max mode with nothing affordable, show the price of one
      const effectiveQty = Math.max(wanted, 1)
      const totalCost = bulkCost({ def, owned: ownedCount, qty: effectiveQty, costMult })
      const prodEach =
        def.baseProd *
        milestoneMultiplier(ownedCount) *
        starMultiplier(s) *
        achievementMultiplier(s) *
        upgradeMultiplier({ save: s, target: def.id }) *
        upgradeMultiplier({ save: s, target: 'all' })
      return {
        owned: ownedCount,
        quantity: effectiveQty,
        cost: totalCost,
        canAfford: wanted >= 1 && s.loc >= totalCost,
        prodLabel: prodEach.toFixed(def.baseProd < 1 ? 2 : 1),
        milestoneAt: ownedCount > 0 ? nextMilestone(ownedCount) : null,
        // quantized to 2% steps so ticking LOC doesn't re-render the row constantly
        progress: Math.min(Math.floor((s.loc / totalCost) * 50) / 50, 1),
      }
    }),
  )

  return (
    <div
      className={cn(
        'relative mb-2 flex items-center justify-between gap-2.5 overflow-hidden rounded-md border bg-panel-alt px-2 py-2.5 transition-colors duration-200 last:mb-0',
        canAfford && 'border-green/30',
      )}
    >
      {!canAfford && (
        <div
          aria-hidden
          style={{ transform: `scaleX(${progress})` }}
          className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-green/40 transition-transform duration-300 ease-linear"
        />
      )}
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={cn(
            'flex size-[30px] flex-none items-center justify-center rounded-md bg-white/[0.04] font-mono text-base',
            def.colorClass,
          )}
        >
          {def.glyph}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink">{def.name}</div>
          <div className="truncate font-mono text-[11px] text-ink-dim tabular-nums">
            {prodLabel} LOC/s each · owned {owned}
            {milestoneAt !== null && <span className="text-green/70"> · ×2 at {milestoneAt}</span>}
          </div>
        </div>
      </div>
      <button
        type="button"
        disabled={!canAfford}
        onClick={() => buyGenerator(def.id)}
        className="min-w-[78px] flex-none rounded-[5px] border bg-panel px-2.5 py-1.5 text-right font-mono text-xs text-ink transition-all duration-150 ease-snappy enabled:hover:border-green enabled:hover:text-green enabled:hover:shadow-[0_0_12px_rgba(0,255,65,0.15)] enabled:active:scale-[0.97] disabled:opacity-40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="block font-bold tabular-nums">{formatNumber(cost)}</span>
        <span className="block text-[10px] text-ink-dim">buy {quantity}</span>
      </button>
    </div>
  )
})

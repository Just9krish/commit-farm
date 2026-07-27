import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { GamePanel } from './game-panel'
import { PERK_DEFS } from '@/game/definitions'
import type { PerkDef } from '@/game/types'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game-store'

/**
 * Perks are bought by spending investor stars — trading away passive +2%
 * boosts for permanent special effects that survive funding rounds.
 */
export function StarPerksPanel() {
  const isVisible = useGameStore(
    (s) => s.stars > 0 || s.prestigeCount > 0 || Object.values(s.perks).some(Boolean),
  )
  const ownedIds = useGameStore(
    useShallow((s) => PERK_DEFS.filter((p) => s.perks[p.id]).map((p) => p.id)),
  )

  if (!isVisible) return null

  return (
    <div className="animate-rise-in">
      <GamePanel title={`Star perks · ${ownedIds.length}/${PERK_DEFS.length}`}>
        <p className="mb-3 font-mono text-[11px] text-ink-dim">
          {'// spend stars on permanent perks — they survive funding rounds'}
        </p>
        {PERK_DEFS.map((def) => (
          <PerkRow key={def.id} def={def} isOwned={ownedIds.includes(def.id)} />
        ))}
      </GamePanel>
    </div>
  )
}

interface PerkRowProps {
  def: PerkDef
  isOwned: boolean
}

const PerkRow = memo(function PerkRow({ def, isOwned }: PerkRowProps) {
  const buyPerk = useGameStore((s) => s.buyPerk)
  const canAfford = useGameStore((s) => s.stars >= def.starCost)

  return (
    <div
      className={cn(
        'mb-2 flex items-center justify-between gap-2.5 rounded-md border bg-panel-alt px-2 py-2.5 last:mb-0',
        isOwned && 'border-green/60',
        !isOwned && canAfford && 'border-amber-dim',
      )}
    >
      <div className="min-w-0">
        <div className={cn('text-[13px] font-semibold text-ink', isOwned && 'text-green')}>
          {isOwned && '✓ '}
          {def.name}
        </div>
        <div className="truncate font-mono text-[11px] text-ink-dim">{def.description}</div>
      </div>
      {!isOwned && (
        <button
          type="button"
          disabled={!canAfford}
          onClick={() => buyPerk(def.id)}
          className="min-w-[78px] flex-none rounded-[5px] border bg-panel px-2.5 py-1.5 text-right font-mono text-xs text-ink transition-[color,border-color,transform] duration-150 ease-snappy enabled:hover:border-amber enabled:hover:text-amber enabled:active:scale-[0.97] disabled:opacity-40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="block font-bold text-amber tabular-nums">★ {def.starCost}</span>
          <span className="block text-[10px] text-ink-dim">unlock</span>
        </button>
      )}
    </div>
  )
})

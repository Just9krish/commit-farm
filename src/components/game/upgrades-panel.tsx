import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { GamePanel } from './game-panel'
import { UPGRADE_DEFS } from '@/game/definitions'
import { formatNumber, isUpgradeUnlocked } from '@/game/logic'
import type { UpgradeDef } from '@/game/types'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game-store'

export function UpgradesPanel() {
  const visibleIds = useGameStore(
    useShallow((s) =>
      UPGRADE_DEFS.filter((def) => !s.upgrades[def.id] && isUpgradeUnlocked({ save: s, def })).map(
        (def) => def.id,
      ),
    ),
  )
  const purchasedCount = useGameStore(
    (s) => UPGRADE_DEFS.filter((def) => s.upgrades[def.id]).length,
  )

  // stay hidden until the player has something to see
  if (visibleIds.length === 0 && purchasedCount === 0) return null

  return (
    <div className="animate-rise-in">
      <GamePanel title={`Upgrades · ${purchasedCount}/${UPGRADE_DEFS.length}`}>
        {visibleIds.length === 0 ? (
          <p className="font-mono text-xs text-ink-dim">
            {'// all current upgrades installed — keep hiring to unlock more'}
          </p>
        ) : (
          UPGRADE_DEFS.filter((def) => visibleIds.includes(def.id)).map((def) => (
            <UpgradeRow key={def.id} def={def} />
          ))
        )}
      </GamePanel>
    </div>
  )
}

interface UpgradeRowProps {
  def: UpgradeDef
}

const UpgradeRow = memo(function UpgradeRow({ def }: UpgradeRowProps) {
  const buyUpgrade = useGameStore((s) => s.buyUpgrade)
  const canAfford = useGameStore((s) => s.loc >= def.cost)

  return (
    <div
      className={cn(
        'mb-2 flex animate-rise-in items-center justify-between gap-2.5 rounded-md border bg-panel-alt px-2 py-2.5 last:mb-0',
        canAfford && 'border-blue/30',
      )}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink">{def.name}</div>
        <div className="truncate font-mono text-[11px] text-ink-dim">{def.description}</div>
      </div>
      <button
        type="button"
        disabled={!canAfford}
        onClick={() => buyUpgrade(def.id)}
        className="min-w-19.5 flex-none rounded-[5px] border bg-panel px-2.5 py-1.5 text-right font-mono text-xs text-ink transition-all duration-150 ease-snappy enabled:hover:border-blue enabled:hover:text-blue enabled:hover:shadow-[0_0_12px_rgba(0,209,255,0.15)] enabled:active:scale-[0.97] disabled:opacity-40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="block font-bold tabular-nums">{formatNumber(def.cost)}</span>
        <span className="block text-[10px] text-ink-dim">install</span>
      </button>
    </div>
  )
})

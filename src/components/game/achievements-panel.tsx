import { useShallow } from 'zustand/react/shallow'
import { GamePanel } from './game-panel'
import { ACHIEVEMENT_DEFS } from '@/game/definitions'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game-store'

export function AchievementsPanel() {
  const achievements = useGameStore(useShallow((s) => s.achievements))
  const unlockedCount = ACHIEVEMENT_DEFS.filter((def) => achievements[def.id]).length

  return (
    <GamePanel title={`Achievements · ${unlockedCount}/${ACHIEVEMENT_DEFS.length}`}>
      <p className="mb-3 font-mono text-[11px] text-ink-dim">
        {'// each unlock grants +1% production, forever'}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ACHIEVEMENT_DEFS.map((def) => {
          const isUnlocked = Boolean(achievements[def.id])
          return (
            <span
              key={def.id}
              className={cn(
                'rounded-full border px-2 py-1 font-mono text-[10.5px] text-ink-dim transition-colors duration-200',
                isUnlocked && 'border-green bg-green/10 text-green',
              )}
            >
              {isUnlocked ? '✓ ' : '· '}
              {def.label}
            </span>
          )
        })}
      </div>
    </GamePanel>
  )
}

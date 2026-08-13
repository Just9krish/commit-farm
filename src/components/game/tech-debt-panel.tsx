import { AlertTriangle, Wrench } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { techDebtMultiplier } from '@/game/logic'
import { useGameStore } from '@/stores/game-store'
import { formatNumber } from '@/game/logic'

export function TechDebtPanel() {
  const techDebt = useGameStore((s) => s.techDebt)
  const isRefactoring = useGameStore((s) => s.isRefactoring)
  const toggleRefactoring = useGameStore((s) => s.toggleRefactoring)

  // Calculate the actual percentage penalty
  const penalty = useGameStore((s) => {
    const mult = techDebtMultiplier(s)
    return (1 - mult) * 100
  })

  // Only show the panel once they've accumulated a meaningful amount of tech debt in this run
  if (techDebt < 10) return null

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-lg border p-4 overflow-hidden transition-colors duration-300 ${isRefactoring ? 'border-amber-500/40 bg-amber-500/10' : 'border-orange-500/20 bg-orange-500/5'}`}
    >
      {/* Background pulsing effect when active */}
      {isRefactoring && (
        <div className="pointer-events-none absolute inset-0 animate-pulse bg-amber-500/5" />
      )}

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={`h-4 w-4 ${isRefactoring ? 'text-amber-500' : 'text-orange-500'}`}
          />
          <h2
            className={`font-mono text-sm font-bold ${isRefactoring ? 'text-amber-500' : 'text-orange-500'}`}
          >
            Tech Debt
          </h2>
        </div>
        <Toggle
          pressed={isRefactoring}
          onPressedChange={toggleRefactoring}
          variant="outline"
          size="sm"
          className="h-7 font-mono text-[11px] border-orange-500/30 text-orange-600 data-[state=on]:bg-amber-500 data-[state=on]:text-black hover:bg-orange-500/10 data-[state=on]:hover:bg-amber-400"
        >
          <Wrench className="mr-1.5 h-3 w-3" />
          {isRefactoring ? 'Refactoring...' : 'Refactor Sprint'}
        </Toggle>
      </div>

      <div className="relative space-y-1.5">
        <div className="flex justify-between font-mono text-[11px] text-ink-dim">
          <span>Debt: {formatNumber(Math.floor(techDebt))}</span>
          <span
            className={
              penalty > 0
                ? isRefactoring
                  ? 'text-amber-600 font-bold'
                  : 'text-orange-600 font-bold'
                : ''
            }
          >
            -{penalty.toFixed(1)}% Efficiency
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-orange-500/20 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${isRefactoring ? 'bg-amber-500' : 'bg-orange-500'}`}
            style={{ width: `${Math.min(100, penalty * 3)}%` }} // Visual scaling so it looks scary faster
          />
        </div>
        <p className="text-[10px] text-ink-dim leading-relaxed">
          {isRefactoring
            ? 'Production is halted. All output is dedicated to cleaning up code.'
            : 'Tech debt accumulates as you produce LOC, gradually slowing you down.'}
        </p>
      </div>
    </div>
  )
}

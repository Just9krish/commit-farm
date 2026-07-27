import { useGameStore } from '@/stores/game-store'

/**
 * A rare clickable that floats over the page for a few seconds and grants
 * a burst of LOC (a minute of production) when caught.
 */
export function GoldenCommit() {
  const golden = useGameStore((s) => s.golden)
  const clickGoldenCommit = useGameStore((s) => s.clickGoldenCommit)

  if (!golden) return null

  return (
    <button
      type="button"
      aria-label="Golden commit — click for a bonus"
      onClick={clickGoldenCommit}
      style={{ left: `${golden.xPct}%`, top: `${golden.yPct}%` }}
      className="fixed z-50 animate-golden cursor-pointer rounded-full border border-amber bg-panel px-3.5 py-2 font-mono text-sm font-bold text-amber select-none hover:bg-panel-alt focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      ✦ {golden.hash}
    </button>
  )
}

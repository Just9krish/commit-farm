import { Link } from '@tanstack/react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useGameStore } from '@/stores/game-store'

export function TopBar() {
  const stars = useGameStore((s) => s.stars)

  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-2.5 border-b pb-3.5">
      <div>
        <Link to="/" className="font-mono text-[22px] font-extrabold tracking-[0.02em] text-ink">
          COMMIT<span className="text-amber">_</span>FARM
        </Link>
        <p className="mt-0.5 text-xs text-ink-dim">grow a codebase from garage repo to IPO</p>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            key={stars}
            className="animate-star-pop cursor-default rounded-[5px] border border-amber-dim bg-amber/5 px-2.5 py-1.5 font-mono text-[13px] text-amber tabular-nums"
          >
            ★ {stars} investor stars · +{Math.round(stars * 2)}% boost
          </div>
        </TooltipTrigger>
        <TooltipContent>Each investor star permanently boosts production by 2%.</TooltipContent>
      </Tooltip>
    </header>
  )
}

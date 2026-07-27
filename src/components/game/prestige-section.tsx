import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PRESTIGE_THRESHOLD } from '@/game/definitions'
import { formatNumber, prestigeGain } from '@/game/logic'
import { useGameStore } from '@/stores/game-store'

export function PrestigeSection() {
  const totalLoc = useGameStore((s) => s.totalLoc)
  const prestige = useGameStore((s) => s.prestige)

  if (totalLoc < PRESTIGE_THRESHOLD * 0.5) return null

  const gain = prestigeGain(totalLoc)
  const isReady = gain >= 1

  return (
    <div className="animate-rise-in">
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            disabled={!isReady}
            className="mt-3 w-full rounded-md border border-destructive bg-destructive/10 p-3 font-mono text-[13px] font-bold text-destructive transition-transform duration-150 ease-snappy enabled:hover:bg-destructive/15 enabled:active:scale-[0.98] disabled:opacity-45 focus-visible:ring-[3px] focus-visible:ring-destructive/40 focus-visible:outline-none"
          >
            raise a funding round →
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">Raise a funding round?</DialogTitle>
            <DialogDescription>
              This resets your current LOC and your whole team. In exchange you get{' '}
              <span className="font-mono font-bold text-amber">
                +{gain} investor {gain === 1 ? 'star' : 'stars'}
              </span>{' '}
              — each star boosts production by 2%, forever.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">keep grinding</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="destructive" onClick={prestige} className="font-mono">
                close the round →
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p className="mt-1.5 text-[11px] leading-relaxed text-ink-dim">
        {isReady
          ? `Reset current progress for +${gain} investor ${gain === 1 ? 'star' : 'stars'} (each star = +2% production, forever).`
          : `Reach ${formatNumber(PRESTIGE_THRESHOLD)} lifetime LOC to unlock your first funding round. Currently ${formatNumber(totalLoc)}.`}
      </p>
    </div>
  )
}

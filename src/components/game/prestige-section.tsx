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
  const stars = useGameStore((s) => s.stars)
  const lifetimeStars = useGameStore((s) => s.lifetimeStars)
  const ipo = useGameStore((s) => s.ipo)
  const prestige = useGameStore((s) => s.prestige)

  if (totalLoc < PRESTIGE_THRESHOLD * 0.5) return null

  const gain = prestigeGain(totalLoc, lifetimeStars)
  const isReady = gain >= 1
  const nextTargetLoc = PRESTIGE_THRESHOLD * Math.pow(lifetimeStars + 1, 2)

  const canIpo = stars >= 50
  const equityGain = Math.floor(stars / 25)

  return (
    <div className="animate-rise-in flex flex-col gap-4 mt-3">
      <div>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              disabled={!isReady}
              className="w-full rounded-md border border-purple/50 bg-purple/10 p-3 font-mono text-[13px] font-bold text-purple transition-all duration-150 ease-snappy enabled:hover:bg-purple/20 enabled:hover:shadow-[0_0_15px_rgba(191,0,255,0.25)] enabled:active:scale-[0.98] disabled:opacity-45 focus-visible:ring-[3px] focus-visible:ring-purple/40 focus-visible:outline-none"
            >
              raise a funding round →
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-mono">Raise a funding round?</DialogTitle>
              <DialogDescription>
                This resets your current LOC and your whole team. In exchange you get{' '}
                <span className="font-mono font-bold text-purple">
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
                <Button
                  variant="outline"
                  onClick={prestige}
                  className="font-mono border-purple text-purple hover:bg-purple/10"
                >
                  close the round →
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-dim">
          {isReady
            ? `Reset current progress for +${gain} investor ${gain === 1 ? 'star' : 'stars'} (each star = +2% production, forever).`
            : `Reach ${formatNumber(nextTargetLoc)} lifetime LOC to unlock your ${lifetimeStars > 0 ? 'next' : 'first'} funding round. Currently ${formatNumber(totalLoc)}.`}
        </p>
      </div>

      {stars >= 25 && (
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                disabled={!canIpo}
                className="w-full rounded-md border border-indigo-500 bg-indigo-500/10 p-3 font-mono text-[13px] font-bold text-indigo-500 transition-transform duration-150 ease-snappy enabled:hover:bg-indigo-500/15 enabled:active:scale-[0.98] disabled:opacity-45 focus-visible:ring-[3px] focus-visible:ring-indigo-500/40 focus-visible:outline-none"
              >
                IPO (go public) →
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-mono text-indigo-500">
                  Take the company public?
                </DialogTitle>
                <DialogDescription>
                  This is a true reset. It resets EVERYTHING including your Stars and Perks. In
                  exchange you get{' '}
                  <span className="font-mono font-bold text-indigo-500">+{equityGain} Equity</span>{' '}
                  to spend on permanent Meta-Perks.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">keep holding</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    onClick={ipo}
                    className="font-mono border-indigo-500 text-indigo-500 hover:bg-indigo-500/10"
                  >
                    ring the bell →
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-dim">
            {canIpo
              ? `Reset everything for +${equityGain} Equity.`
              : `Reach 50 Stars to IPO. Currently ${stars}.`}
          </p>
        </div>
      )}
    </div>
  )
}

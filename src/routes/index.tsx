import { Link, createFileRoute } from '@tanstack/react-router'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/game/logic'
import { useGameHydration } from '@/hooks/use-game-hydration.hook'
import { useGameStore } from '@/stores/game-store'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  const hasHydrated = useGameHydration()
  const { totalLoc, stars, prestigeCount } = useGameStore(
    useShallow((s) => ({
      totalLoc: s.totalLoc,
      stars: s.stars,
      prestigeCount: s.prestigeCount,
    })),
  )
  const hasSave = hasHydrated && totalLoc > 0

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        {heroItems.map((item, index) => (
          <div
            key={item.key}
            className="animate-rise-in"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {item.render()}
          </div>
        ))}

        <div className="animate-rise-in" style={{ animationDelay: '240ms' }}>
          <Button
            asChild
            size="lg"
            className="mt-9 px-8 font-mono text-[15px] font-bold transition-transform duration-150 ease-snappy active:scale-[0.97]"
          >
            <Link to="/game">{hasSave ? 'continue farming →' : 'start farming →'}</Link>
          </Button>
        </div>

        <div
          className="mt-4 flex min-h-5 items-center justify-center font-mono text-xs text-ink-dim tabular-nums"
          aria-live="polite"
        >
          {hasSave && (
            <span className="animate-rise-in">
              ★ {stars} stars · {formatNumber(totalLoc)} lifetime LOC · {prestigeCount}{' '}
              {prestigeCount === 1 ? 'round' : 'rounds'} raised
            </span>
          )}
        </div>

        <p
          className="mt-10 animate-rise-in text-[11px] text-ink-dim"
          style={{ animationDelay: '320ms' }}
        >
          free to play · saves locally in your browser · no login
        </p>
      </div>
    </main>
  )
}

interface FeatureItem {
  glyph: string
  colorClass: string
  label: string
}

const FEATURES: Array<FeatureItem> = [
  { glyph: '◆', colorClass: 'text-amber', label: 'hire a dev team' },
  { glyph: '▲', colorClass: 'text-green', label: 'survive on-call' },
  { glyph: '★', colorClass: 'text-blue', label: 'raise funding rounds' },
]

const heroItems = [
  {
    key: 'badge',
    render: () => (
      <span className="rounded-full border border-amber-dim bg-amber/5 px-3 py-1 font-mono text-[11px] text-amber">
        an idle game for people who ship
      </span>
    ),
  },
  {
    key: 'wordmark',
    render: () => (
      <h1 className="mt-6 font-mono text-4xl font-extrabold tracking-[0.02em] text-ink sm:text-5xl">
        COMMIT<span className="text-amber">_</span>FARM
        <span className="ml-1 inline-block animate-blink text-amber">▌</span>
      </h1>
    ),
  },
  {
    key: 'tagline',
    render: () => (
      <p className="mt-4 text-base text-ink-dim sm:text-lg">
        grow a codebase from garage repo to IPO — one{' '}
        <span className="font-mono text-ink">write_code()</span> at a time
      </p>
    ),
  },
  {
    key: 'features',
    render: () => (
      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {FEATURES.map((feature) => (
          <li
            key={feature.label}
            className="flex items-center gap-2 font-mono text-[13px] text-ink-dim"
          >
            <span className={feature.colorClass}>{feature.glyph}</span>
            {feature.label}
          </li>
        ))}
      </ul>
    ),
  },
]

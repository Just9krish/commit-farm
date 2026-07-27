import { GamePanel, PanelHeading } from './game-panel'
import { OfficeFloor } from './office-floor'
import { PrestigeSection } from './prestige-section'
import { formatNumber } from '@/game/logic'
import { selectProductionRate, useGameStore } from '@/stores/game-store'

export function CodePanel() {
  return (
    <GamePanel title="Lines of code">
      <LocStats />
      <WriteButton />
      <PanelHeading className="mt-5">Office floor</PanelHeading>
      <OfficeFloor />
      <PrestigeSection />
    </GamePanel>
  )
}

function LocStats() {
  const loc = useGameStore((s) => s.loc)
  const rate = useGameStore(selectProductionRate)

  return (
    <div>
      <div className="font-mono text-[26px] font-bold text-ink tabular-nums">
        {formatNumber(loc)}
      </div>
      <div className="font-mono text-[13px] text-green tabular-nums">
        +{formatNumber(rate)} LOC/sec
      </div>
    </div>
  )
}

function WriteButton() {
  const writeCode = useGameStore((s) => s.writeCode)

  return (
    <>
      <button
        type="button"
        onClick={writeCode}
        className="mt-3.5 w-full rounded-lg border border-amber-dim bg-gradient-to-b from-amber/15 to-amber/5 px-2.5 py-5 font-mono text-[15px] font-bold tracking-[0.03em] text-amber transition-transform duration-100 ease-snappy select-none hover:from-amber/25 hover:to-amber/10 active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        &gt; write_code()
      </button>
      <p className="mt-1.5 text-center text-[11px] text-ink-dim">click, or press space</p>
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import { GamePanel, PanelHeading } from './game-panel'
import { OfficeFloor } from './office-floor'
import { PrestigeSection } from './prestige-section'
import { formatNumber } from '@/game/logic'
import { selectClickPower, selectProductionRate, useGameStore } from '@/stores/game-store'

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
  const { motes, buttonRef, handlePointerDown, removeMote } = useClickMotes()

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={writeCode}
          onPointerDown={handlePointerDown}
          className="mt-3.5 w-full rounded-lg border border-green/30 bg-gradient-to-b from-green/10 to-green/5 px-2.5 py-5 font-mono text-[15px] font-bold tracking-[0.03em] text-green transition-all duration-300 ease-smooth select-none hover:border-green/60 hover:from-green/20 hover:to-green/10 hover:shadow-[0_0_20px_rgba(0,255,65,0.25)] active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          &gt; write_code()
        </button>
        {motes.map((mote) => (
          <span
            key={mote.id}
            onAnimationEnd={() => removeMote(mote.id)}
            style={{ left: mote.x, top: mote.y }}
            className="pointer-events-none absolute z-10 animate-float-up font-mono text-[13px] font-bold text-green tabular-nums"
            aria-hidden
          >
            {mote.label}
          </span>
        ))}
      </div>
      <p className="mt-1.5 text-center text-[11px] text-ink-dim">click, or press space</p>
    </>
  )
}

interface ClickMote {
  id: number
  x: number
  y: number
  label: string
}

const MAX_MOTES = 12
const POINTER_FRESH_MS = 150

/**
 * Spawns a floating "+N" for every click, driven by totalClicks changes so
 * spacebar presses produce feedback too. Mouse clicks anchor to the pointer;
 * keyboard clicks scatter across the button.
 */
function useClickMotes() {
  const [motes, setMotes] = useState<Array<ClickMote>>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pointerRef = useRef<{ x: number; y: number; at: number } | null>(null)
  const nextIdRef = useRef(1)

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    pointerRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      at: performance.now(),
    }
  }

  function removeMote(id: number) {
    setMotes((current) => current.filter((mote) => mote.id !== id))
  }

  useEffect(() => {
    return useGameStore.subscribe((state, prev) => {
      if (state.totalClicks === prev.totalClicks) return
      const button = buttonRef.current
      if (!button) return
      const pointer = pointerRef.current
      const isFresh = pointer !== null && performance.now() - pointer.at < POINTER_FRESH_MS
      const x = isFresh ? pointer.x : button.offsetWidth * (0.25 + Math.random() * 0.5)
      const y = (isFresh ? pointer.y : 14) + button.offsetTop
      const label = `+${formatNumber(selectClickPower(state))}`
      setMotes((current) => [
        ...current.slice(-(MAX_MOTES - 1)),
        { id: nextIdRef.current++, x, y, label },
      ])
    })
  }, [])

  return { motes, buttonRef, handlePointerDown, removeMote }
}

import { GamePanel } from './game-panel'
import { GeneratorRow } from './generator-row'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { GENERATOR_DEFS } from '@/game/definitions'
import type { BuyQuantity } from '@/game/types'
import { useGameStore } from '@/stores/game-store'

const QUANTITY_OPTIONS: Array<{ value: BuyQuantity; label: string }> = [
  { value: '1', label: '×1' },
  { value: '10', label: '×10' },
  { value: 'max', label: 'max' },
]

export function ShopPanel() {
  const buyQuantity = useGameStore((s) => s.buyQuantity)
  const setBuyQuantity = useGameStore((s) => s.setBuyQuantity)
  const hasRDDepartment = useGameStore((s) => s.metaPerks['rd-department'])

  const visibleGenerators = GENERATOR_DEFS.filter(
    (def) => def.id !== 'principal' || hasRDDepartment,
  )

  return (
    <GamePanel title="Hire & build">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] text-ink-dim">buy quantity</span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={buyQuantity}
          onValueChange={(value) => {
            if (value) setBuyQuantity(value as BuyQuantity)
          }}
          aria-label="Buy quantity"
        >
          {QUANTITY_OPTIONS.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value} className="font-mono text-xs">
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {visibleGenerators.map((def) => (
        <GeneratorRow key={def.id} def={def} />
      ))}
    </GamePanel>
  )
}

import {
  COST_GROWTH,
  GENERATOR_DEFS,
  INTERN_CLICK_BONUS,
  OFFLINE_CAP_SEC,
  PRESTIGE_THRESHOLD,
  STAR_BONUS,
} from './definitions'
import type { GameSave, GeneratorDef, GeneratorId } from './types'

export function freshSave(): GameSave {
  const generators = Object.fromEntries(GENERATOR_DEFS.map((g) => [g.id, { owned: 0 }])) as Record<
    GeneratorId,
    { owned: number }
  >
  return {
    version: 1,
    loc: 0,
    totalLoc: 0,
    stars: 0,
    prestigeCount: 0,
    generators,
    achievements: {},
    isMuted: false,
    lastSavedAt: Date.now(),
  }
}

export function costFor({ def, owned }: { def: GeneratorDef; owned: number }): number {
  return Math.ceil(def.baseCost * Math.pow(COST_GROWTH, owned))
}

/** Total cost of buying `qty` units starting at `owned`, via the geometric series closed form. */
export function bulkCost({
  def,
  owned,
  qty,
}: {
  def: GeneratorDef
  owned: number
  qty: number
}): number {
  if (qty <= 0) return 0
  if (qty === 1) return costFor({ def, owned })
  const r = COST_GROWTH
  const first = def.baseCost * Math.pow(r, owned)
  return Math.ceil((first * (Math.pow(r, qty) - 1)) / (r - 1))
}

/** Largest `qty` such that bulkCost fits in `budget`. Closed-form estimate, then ±1 correction. */
export function maxAffordable({
  def,
  owned,
  budget,
}: {
  def: GeneratorDef
  owned: number
  budget: number
}): number {
  if (budget < costFor({ def, owned })) return 0
  const r = COST_GROWTH
  const first = def.baseCost * Math.pow(r, owned)
  let qty = Math.floor(Math.log((budget * (r - 1)) / first + 1) / Math.log(r))
  while (qty > 1 && bulkCost({ def, owned, qty }) > budget) qty--
  while (bulkCost({ def, owned, qty: qty + 1 }) <= budget) qty++
  return Math.max(qty, 1)
}

export function starMultiplier(stars: number): number {
  return 1 + stars * STAR_BONUS
}

export function productionRate({
  save,
  eventProdMult = 1,
}: {
  save: GameSave
  eventProdMult?: number
}): number {
  let base = 0
  for (const def of GENERATOR_DEFS) base += def.baseProd * save.generators[def.id].owned
  return base * starMultiplier(save.stars) * eventProdMult
}

export function clickPower({
  save,
  eventClickMult = 1,
}: {
  save: GameSave
  eventClickMult?: number
}): number {
  const internBonus = 1 + save.generators.intern.owned * INTERN_CLICK_BONUS
  return internBonus * starMultiplier(save.stars) * eventClickMult
}

export function prestigeGain(totalLoc: number): number {
  return Math.floor(Math.sqrt(totalLoc / PRESTIGE_THRESHOLD))
}

/** LOC earned while away, at the current production rate, capped at OFFLINE_CAP_SEC. */
export function offlineEarnings({
  save,
  elapsedSec,
}: {
  save: GameSave
  elapsedSec: number
}): number {
  if (elapsedSec <= 0) return 0
  return productionRate({ save }) * Math.min(elapsedSec, OFFLINE_CAP_SEC)
}

const NUMBER_UNITS = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx']

export function formatNumber(value: number): string {
  if (value < 1000) return value.toFixed(value < 10 ? 1 : 0)
  let n = value
  let unitIndex = -1
  while (n >= 1000 && unitIndex < NUMBER_UNITS.length - 1) {
    n /= 1000
    unitIndex++
  }
  return n.toFixed(2) + NUMBER_UNITS[unitIndex]
}

export function formatDuration(totalSec: number): string {
  const sec = Math.floor(totalSec)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ${sec % 60}s`
  const hours = Math.floor(min / 60)
  return `${hours}h ${min % 60}m`
}

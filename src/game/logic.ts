import {
  ACHIEVEMENT_BONUS,
  COST_GROWTH,
  GENERATOR_DEFS,
  GOLDEN_CLICK_FLOOR,
  GOLDEN_PROD_SECONDS,
  INTERN_CLICK_BONUS,
  MILESTONE_THRESHOLDS,
  OFFLINE_CAP_EXTENDED_SEC,
  OFFLINE_CAP_SEC,
  PREFERRED_TERMS_DISCOUNT,
  PRESTIGE_THRESHOLD,
  STAR_BONUS,
  UPGRADE_DEFS,
} from './definitions'
import type {
  GameSave,
  GeneratorDef,
  GeneratorId,
  PerkId,
  UpgradeDef,
  UpgradeTarget,
} from './types'

export function freshSave(): GameSave {
  const generators = Object.fromEntries(GENERATOR_DEFS.map((g) => [g.id, { owned: 0 }])) as Record<
    GeneratorId,
    { owned: number }
  >
  return {
    version: 1,
    loc: 0,
    totalLoc: 0,
    runLoc: 0,
    bestRunLoc: 0,
    totalClicks: 0,
    goldenClicks: 0,
    playTimeSec: 0,
    stars: 0,
    prestigeCount: 0,
    generators,
    achievements: {},
    upgrades: {},
    perks: {},
    isMuted: false,
    lastSavedAt: Date.now(),
  }
}

export function hasPerk(save: GameSave, id: PerkId): boolean {
  return Boolean(save.perks[id])
}

/** Discount applied to all generator costs (preferred-terms perk). */
export function costMultiplier(save: GameSave): number {
  return hasPerk(save, 'preferred-terms') ? PREFERRED_TERMS_DISCOUNT : 1
}

export function costFor({
  def,
  owned,
  costMult = 1,
}: {
  def: GeneratorDef
  owned: number
  costMult?: number
}): number {
  return Math.ceil(def.baseCost * Math.pow(COST_GROWTH, owned) * costMult)
}

/** Total cost of buying `qty` units starting at `owned`, via the geometric series closed form. */
export function bulkCost({
  def,
  owned,
  qty,
  costMult = 1,
}: {
  def: GeneratorDef
  owned: number
  qty: number
  costMult?: number
}): number {
  if (qty <= 0) return 0
  if (qty === 1) return costFor({ def, owned, costMult })
  const r = COST_GROWTH
  const first = def.baseCost * Math.pow(r, owned) * costMult
  return Math.ceil((first * (Math.pow(r, qty) - 1)) / (r - 1))
}

/** Largest `qty` such that bulkCost fits in `budget`. Closed-form estimate, then ±1 correction. */
export function maxAffordable({
  def,
  owned,
  budget,
  costMult = 1,
}: {
  def: GeneratorDef
  owned: number
  budget: number
  costMult?: number
}): number {
  if (budget < costFor({ def, owned, costMult })) return 0
  const r = COST_GROWTH
  const first = def.baseCost * Math.pow(r, owned) * costMult
  let qty = Math.floor(Math.log((budget * (r - 1)) / first + 1) / Math.log(r))
  while (qty > 1 && bulkCost({ def, owned, qty, costMult }) > budget) qty--
  while (bulkCost({ def, owned, qty: qty + 1, costMult }) <= budget) qty++
  return Math.max(qty, 1)
}

export function starMultiplier(stars: number): number {
  return 1 + stars * STAR_BONUS
}

/** Each unlocked achievement grants +1% production, forever. */
export function achievementMultiplier(save: GameSave): number {
  const unlockedCount = Object.values(save.achievements).filter(Boolean).length
  return 1 + unlockedCount * ACHIEVEMENT_BONUS
}

/** Combined multiplier from all purchased upgrades affecting `target`. */
export function upgradeMultiplier({
  save,
  target,
}: {
  save: GameSave
  target: UpgradeTarget
}): number {
  let mult = 1
  for (const def of UPGRADE_DEFS)
    if (def.target === target && save.upgrades[def.id]) mult *= def.multiplier
  return mult
}

export function isUpgradeUnlocked({ save, def }: { save: GameSave; def: UpgradeDef }): boolean {
  if ('totalLoc' in def.unlock) return save.totalLoc >= def.unlock.totalLoc
  return save.generators[def.unlock.generator].owned >= def.unlock.owned
}

/** Output doubles at each owned-count milestone (10, 25, 50 → up to ×8). */
export function milestoneMultiplier(owned: number): number {
  let mult = 1
  for (const threshold of MILESTONE_THRESHOLDS) if (owned >= threshold) mult *= 2
  return mult
}

/** The next milestone ahead of `owned`, or null once all are passed. */
export function nextMilestone(owned: number): number | null {
  for (const threshold of MILESTONE_THRESHOLDS) if (owned < threshold) return threshold
  return null
}

export function productionRate({
  save,
  eventProdMult = 1,
}: {
  save: GameSave
  eventProdMult?: number
}): number {
  let base = 0
  for (const def of GENERATOR_DEFS) {
    const owned = save.generators[def.id].owned
    base +=
      def.baseProd *
      owned *
      milestoneMultiplier(owned) *
      upgradeMultiplier({ save, target: def.id })
  }
  return (
    base *
    upgradeMultiplier({ save, target: 'all' }) *
    starMultiplier(save.stars) *
    achievementMultiplier(save) *
    eventProdMult
  )
}

export function clickPower({
  save,
  eventClickMult = 1,
}: {
  save: GameSave
  eventClickMult?: number
}): number {
  const internBonus = 1 + save.generators.intern.owned * INTERN_CLICK_BONUS
  const perkMult = hasPerk(save, 'golden-fingers') ? 2 : 1
  return (
    internBonus *
    perkMult *
    upgradeMultiplier({ save, target: 'click' }) *
    starMultiplier(save.stars) *
    eventClickMult
  )
}

/**
 * With crunch-insurance, harmful event multipliers (< 1) are softened by
 * halving their penalty; beneficial multipliers are untouched.
 */
export function effectiveEventMult({ save, mult }: { save: GameSave; mult: number }): number {
  if (mult >= 1 || !hasPerk(save, 'crunch-insurance')) return mult
  return 1 - (1 - mult) / 2
}

/** Golden commit reward: a minute of production, floored at 100 clicks' worth. */
export function goldenReward(save: GameSave): number {
  return Math.max(
    productionRate({ save }) * GOLDEN_PROD_SECONDS,
    clickPower({ save }) * GOLDEN_CLICK_FLOOR,
  )
}

export function prestigeGain(totalLoc: number): number {
  return Math.floor(Math.sqrt(totalLoc / PRESTIGE_THRESHOLD))
}

/** LOC earned while away, capped at 8h (24h with the angel-network perk). */
export function offlineEarnings({
  save,
  elapsedSec,
}: {
  save: GameSave
  elapsedSec: number
}): number {
  if (elapsedSec <= 0) return 0
  const capSec = hasPerk(save, 'angel-network') ? OFFLINE_CAP_EXTENDED_SEC : OFFLINE_CAP_SEC
  return productionRate({ save }) * Math.min(elapsedSec, capSec)
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

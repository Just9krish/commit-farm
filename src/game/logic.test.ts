import { describe, expect, it } from 'vitest'
import { GENERATOR_DEFS, OFFLINE_CAP_SEC } from './definitions'
import {
  bulkCost,
  clickPower,
  costFor,
  formatDuration,
  formatNumber,
  freshSave,
  maxAffordable,
  offlineEarnings,
  prestigeGain,
  productionRate,
  starMultiplier,
} from './logic'

const intern = GENERATOR_DEFS[0]
const junior = GENERATOR_DEFS[1]

describe('costFor', () => {
  it('returns base cost when none are owned', () => {
    expect(costFor({ def: intern, owned: 0 })).toBe(15)
    expect(costFor({ def: junior, owned: 0 })).toBe(100)
  })

  it('grows by x1.15 per owned, rounded up', () => {
    expect(costFor({ def: intern, owned: 1 })).toBe(Math.ceil(15 * 1.15))
    expect(costFor({ def: junior, owned: 10 })).toBe(Math.ceil(100 * 1.15 ** 10))
  })
})

describe('bulkCost', () => {
  it('matches costFor for a single purchase', () => {
    expect(bulkCost({ def: junior, owned: 5, qty: 1 })).toBe(costFor({ def: junior, owned: 5 }))
  })

  it('is zero for zero quantity', () => {
    expect(bulkCost({ def: junior, owned: 0, qty: 0 })).toBe(0)
  })

  it('closed form tracks the per-unit geometric sum', () => {
    const exact = Array.from({ length: 10 }, (_, i) => 100 * 1.15 ** i).reduce((a, b) => a + b, 0)
    expect(bulkCost({ def: junior, owned: 0, qty: 10 })).toBe(Math.ceil(exact))
  })
})

describe('maxAffordable', () => {
  it('is zero when even one unit is unaffordable', () => {
    expect(maxAffordable({ def: junior, owned: 0, budget: 99 })).toBe(0)
  })

  it('never returns a quantity that exceeds the budget', () => {
    for (const budget of [100, 1000, 12345, 1e6, 1e9]) {
      const qty = maxAffordable({ def: junior, owned: 3, budget })
      expect(bulkCost({ def: junior, owned: 3, qty })).toBeLessThanOrEqual(budget)
      expect(bulkCost({ def: junior, owned: 3, qty: qty + 1 })).toBeGreaterThan(budget)
    }
  })
})

describe('production and click power', () => {
  it('sums generator output with star and event multipliers', () => {
    const save = freshSave()
    save.generators.junior.owned = 3
    save.generators.senior.owned = 1
    expect(productionRate({ save })).toBeCloseTo(3 * 1 + 8)
    save.stars = 10 // +20%
    expect(productionRate({ save })).toBeCloseTo(11 * 1.2)
    expect(productionRate({ save, eventProdMult: 3 })).toBeCloseTo(11 * 1.2 * 3)
  })

  it('click power scales with interns, stars and click events', () => {
    const save = freshSave()
    expect(clickPower({ save })).toBe(1)
    save.generators.intern.owned = 5 // +50%
    save.stars = 5 // +10%
    expect(clickPower({ save })).toBeCloseTo(1.5 * 1.1)
    expect(clickPower({ save, eventClickMult: 4 })).toBeCloseTo(1.5 * 1.1 * 4)
  })
})

describe('prestige', () => {
  it('unlocks at the 1M lifetime threshold', () => {
    expect(prestigeGain(999_999)).toBe(0)
    expect(prestigeGain(1_000_000)).toBe(1)
    expect(prestigeGain(4_000_000)).toBe(2)
    expect(prestigeGain(9_000_000)).toBe(3)
  })

  it('star multiplier grants +2% per star', () => {
    expect(starMultiplier(0)).toBe(1)
    expect(starMultiplier(50)).toBeCloseTo(2)
  })
})

describe('offlineEarnings', () => {
  it('earns at the production rate without event multipliers', () => {
    const save = freshSave()
    save.generators.junior.owned = 10 // 10 LOC/s
    expect(offlineEarnings({ save, elapsedSec: 60 })).toBeCloseTo(600)
  })

  it('caps at 8 hours', () => {
    const save = freshSave()
    save.generators.junior.owned = 1
    expect(offlineEarnings({ save, elapsedSec: OFFLINE_CAP_SEC * 10 })).toBeCloseTo(OFFLINE_CAP_SEC)
  })

  it('never earns for negative elapsed time', () => {
    const save = freshSave()
    save.generators.junior.owned = 1
    expect(offlineEarnings({ save, elapsedSec: -5 })).toBe(0)
  })
})

describe('formatNumber', () => {
  it('shows one decimal under 10', () => {
    expect(formatNumber(0)).toBe('0.0')
    expect(formatNumber(9.55)).toBe('9.6')
  })

  it('shows whole numbers from 10 to 999', () => {
    expect(formatNumber(10)).toBe('10')
    expect(formatNumber(999)).toBe('999')
  })

  it('abbreviates thousands and beyond', () => {
    expect(formatNumber(1_500)).toBe('1.50K')
    expect(formatNumber(2_340_000)).toBe('2.34M')
    expect(formatNumber(1e9)).toBe('1.00B')
    expect(formatNumber(1e21)).toBe('1.00Sx')
    expect(formatNumber(1e24)).toBe('1000.00Sx')
  })
})

describe('formatDuration', () => {
  it('formats seconds, minutes and hours', () => {
    expect(formatDuration(45)).toBe('45s')
    expect(formatDuration(125)).toBe('2m 5s')
    expect(formatDuration(3_700)).toBe('1h 1m')
  })
})

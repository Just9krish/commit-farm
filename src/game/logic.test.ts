import { describe, expect, it } from 'vitest'
import {
  ACHIEVEMENT_DEFS,
  GENERATOR_DEFS,
  OFFLINE_CAP_SEC,
  PERK_DEFS,
  UPGRADE_DEFS,
} from './definitions'
import {
  achievementMultiplier,
  bulkCost,
  clickPower,
  costFor,
  costMultiplier,
  effectiveEventMult,
  formatDuration,
  formatNumber,
  freshSave,
  goldenReward,
  isUpgradeUnlocked,
  maxAffordable,
  milestoneMultiplier,
  nextMilestone,
  offlineEarnings,
  prestigeGain,
  productionRate,
  starMultiplier,
  upgradeMultiplier,
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

describe('upgrades', () => {
  it('multiplies only the targeted generator output', () => {
    const save = freshSave()
    save.generators.intern.owned = 5 // 0.5 LOC/s
    save.generators.junior.owned = 2 // 2 LOC/s
    expect(productionRate({ save })).toBeCloseTo(2.5)
    save.upgrades['ergonomic-chairs'] = true // interns x2
    expect(productionRate({ save })).toBeCloseTo(3)
  })

  it("'all' upgrades multiply total production", () => {
    const save = freshSave()
    save.generators.junior.owned = 4 // 4 LOC/s
    save.upgrades['monorepo'] = true // all x1.5
    expect(productionRate({ save })).toBeCloseTo(6)
  })

  it("'click' upgrades multiply click power and stack", () => {
    const save = freshSave()
    expect(clickPower({ save })).toBe(1)
    save.upgrades['mechanical-keyboards'] = true // x2
    save.upgrades['espresso-iv'] = true // x2
    expect(clickPower({ save })).toBeCloseTo(4)
  })

  it('upgradeMultiplier ignores unpurchased upgrades', () => {
    const save = freshSave()
    expect(upgradeMultiplier({ save, target: 'intern' })).toBe(1)
    expect(upgradeMultiplier({ save, target: 'all' })).toBe(1)
  })

  it('unlock gates work for generator and totalLoc conditions', () => {
    const save = freshSave()
    const chairs = UPGRADE_DEFS.find((u) => u.id === 'ergonomic-chairs')!
    const keyboards = UPGRADE_DEFS.find((u) => u.id === 'mechanical-keyboards')!
    expect(isUpgradeUnlocked({ save, def: chairs })).toBe(false)
    expect(isUpgradeUnlocked({ save, def: keyboards })).toBe(false)
    save.generators.intern.owned = 5
    save.totalLoc = 500
    expect(isUpgradeUnlocked({ save, def: chairs })).toBe(true)
    expect(isUpgradeUnlocked({ save, def: keyboards })).toBe(true)
  })

  it('every upgrade id is unique', () => {
    const ids = UPGRADE_DEFS.map((u) => u.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('achievements', () => {
  it('each unlocked achievement grants +1% production', () => {
    const save = freshSave()
    save.generators.junior.owned = 5 // 5 LOC/s
    expect(productionRate({ save })).toBeCloseTo(5)
    save.achievements['hello'] = true
    save.achievements['ship'] = true
    expect(achievementMultiplier(save)).toBeCloseTo(1.02)
    expect(productionRate({ save })).toBeCloseTo(5.1)
  })

  it('every achievement id is unique', () => {
    const ids = ACHIEVEMENT_DEFS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('click achievements track totalClicks', () => {
    const save = freshSave()
    const firstCommit = ACHIEVEMENT_DEFS.find((a) => a.id === 'first-commit')!
    expect(firstCommit.test(save)).toBe(false)
    save.totalClicks = 1
    expect(firstCommit.test(save)).toBe(true)
  })
})

describe('prestige', () => {
  it('unlocks at the 1M lifetime threshold', () => {
    expect(prestigeGain(999_999, 0)).toBe(0)
    expect(prestigeGain(1_000_000, 0)).toBe(1)
    expect(prestigeGain(4_000_000, 0)).toBe(2)
    expect(prestigeGain(9_000_000, 0)).toBe(3)
  })

  it('star multiplier grants +2% per star', () => {
    const save = freshSave()
    expect(starMultiplier(save)).toBe(1)
    save.stars = 50
    expect(starMultiplier(save)).toBeCloseTo(2)
  })
})

describe('goldenReward', () => {
  it('grants a minute of production once production dominates', () => {
    const save = freshSave()
    save.generators.senior.owned = 5 // 40 LOC/s
    expect(goldenReward(save)).toBeCloseTo(40 * 60)
  })

  it('floors at 100 clicks worth for early game', () => {
    const save = freshSave()
    expect(goldenReward(save)).toBeCloseTo(100) // clickPower 1 x 100
  })
})

describe('milestones', () => {
  it('doubles output at 10, 25 and 50 owned', () => {
    expect(milestoneMultiplier(0)).toBe(1)
    expect(milestoneMultiplier(9)).toBe(1)
    expect(milestoneMultiplier(10)).toBe(2)
    expect(milestoneMultiplier(25)).toBe(4)
    expect(milestoneMultiplier(50)).toBe(8)
    expect(milestoneMultiplier(500)).toBe(8)
  })

  it('reports the next milestone target', () => {
    expect(nextMilestone(0)).toBe(10)
    expect(nextMilestone(10)).toBe(25)
    expect(nextMilestone(25)).toBe(50)
    expect(nextMilestone(50)).toBeNull()
  })

  it('applies per generator in the production rate', () => {
    const save = freshSave()
    save.generators.junior.owned = 10 // 10 LOC/s base, x2 milestone
    expect(productionRate({ save })).toBeCloseTo(20)
  })
})

describe('perks', () => {
  it('preferred-terms discounts all generator costs by 10%', () => {
    const save = freshSave()
    expect(costMultiplier(save)).toBe(1)
    save.perks['preferred-terms'] = true
    expect(costMultiplier(save)).toBeCloseTo(0.9)
    expect(costFor({ def: junior, owned: 0, costMult: 0.9 })).toBe(90)
  })

  it('golden-fingers doubles click power', () => {
    const save = freshSave()
    expect(clickPower({ save })).toBe(1)
    save.perks['golden-fingers'] = true
    expect(clickPower({ save })).toBe(2)
  })

  it('crunch-insurance halves negative event penalties only', () => {
    const save = freshSave()
    expect(effectiveEventMult({ save, mult: 0.7 })).toBeCloseTo(0.7)
    save.perks['crunch-insurance'] = true
    expect(effectiveEventMult({ save, mult: 0.7 })).toBeCloseTo(0.85)
    expect(effectiveEventMult({ save, mult: 3 })).toBe(3)
  })

  it('angel-network raises the offline cap to 24h', () => {
    const save = freshSave()
    save.generators.junior.owned = 1 // 1 LOC/s
    const twoDaysSec = 48 * 3600
    expect(offlineEarnings({ save, elapsedSec: twoDaysSec })).toBeCloseTo(OFFLINE_CAP_SEC)
    save.perks['angel-network'] = true
    expect(offlineEarnings({ save, elapsedSec: twoDaysSec })).toBeCloseTo(24 * 3600)
  })

  it('every perk id is unique', () => {
    const ids = PERK_DEFS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('offlineEarnings', () => {
  it('earns at the production rate without event multipliers', () => {
    const save = freshSave()
    save.generators.junior.owned = 5 // 5 LOC/s
    expect(offlineEarnings({ save, elapsedSec: 60 })).toBeCloseTo(300)
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

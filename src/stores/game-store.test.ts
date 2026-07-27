import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from './game-store'
import { GENERATOR_DEFS, PRESTIGE_THRESHOLD } from '@/game/definitions'
import { costFor, freshSave, goldenReward } from '@/game/logic'

const intern = GENERATOR_DEFS.find((g) => g.id === 'intern')!

function seed(partial: Partial<ReturnType<typeof freshSave>> = {}) {
  useGameStore.setState({ ...freshSave(), ...partial })
}

beforeEach(() => {
  useGameStore.setState({
    ...freshSave(),
    isMuted: true, // keep sounds out of the test runs
    activeEvent: null,
    golden: null,
    nextGoldenAt: Number.MAX_SAFE_INTEGER,
    log: [],
    buyQuantity: '1',
    welcomeBack: null,
    hasStarted: false,
    lastTickAt: Date.now(),
  })
})

describe('writeCode', () => {
  it('adds click power to loc and counts the click', () => {
    useGameStore.getState().writeCode()
    const s = useGameStore.getState()
    expect(s.loc).toBe(1)
    expect(s.totalLoc).toBe(1)
    expect(s.runLoc).toBe(1)
    expect(s.totalClicks).toBe(1)
  })
})

describe('buyGenerator', () => {
  it('buys one and deducts the cost', () => {
    seed({ loc: 100, isMuted: true })
    useGameStore.getState().buyGenerator('intern')
    const s = useGameStore.getState()
    expect(s.generators.intern.owned).toBe(1)
    expect(s.loc).toBe(100 - costFor({ def: intern, owned: 0 }))
  })

  it('refuses when unaffordable', () => {
    seed({ loc: 5, isMuted: true })
    useGameStore.getState().buyGenerator('intern')
    expect(useGameStore.getState().generators.intern.owned).toBe(0)
    expect(useGameStore.getState().loc).toBe(5)
  })

  it('buys 10 with the x10 quantity', () => {
    seed({ loc: 1_000_000, isMuted: true })
    useGameStore.setState({ buyQuantity: '10' })
    useGameStore.getState().buyGenerator('intern')
    expect(useGameStore.getState().generators.intern.owned).toBe(10)
  })

  it('buys as many as affordable with max', () => {
    seed({ loc: 50, isMuted: true }) // 15 + 18 = 33 affordable, +21 would be 54
    useGameStore.setState({ buyQuantity: 'max' })
    useGameStore.getState().buyGenerator('intern')
    expect(useGameStore.getState().generators.intern.owned).toBe(2)
  })
})

describe('buyUpgrade', () => {
  it('rejects locked upgrades even when affordable', () => {
    seed({ loc: 10_000, isMuted: true })
    useGameStore.getState().buyUpgrade('ergonomic-chairs') // needs 5 interns
    expect(useGameStore.getState().upgrades['ergonomic-chairs']).toBeUndefined()
    expect(useGameStore.getState().loc).toBe(10_000)
  })

  it('buys an unlocked upgrade once and deducts loc', () => {
    seed({ loc: 10_000, isMuted: true })
    useGameStore.setState({
      generators: { ...useGameStore.getState().generators, intern: { owned: 5 } },
    })
    useGameStore.getState().buyUpgrade('ergonomic-chairs')
    expect(useGameStore.getState().upgrades['ergonomic-chairs']).toBe(true)
    expect(useGameStore.getState().loc).toBe(9_500)
    // buying again is a no-op
    useGameStore.getState().buyUpgrade('ergonomic-chairs')
    expect(useGameStore.getState().loc).toBe(9_500)
  })
})

describe('buyPerk', () => {
  it('spends stars and keeps the perk', () => {
    seed({ stars: 5, isMuted: true })
    useGameStore.getState().buyPerk('head-start') // 2 stars
    expect(useGameStore.getState().perks['head-start']).toBe(true)
    expect(useGameStore.getState().stars).toBe(3)
  })

  it('refuses without enough stars', () => {
    seed({ stars: 1, isMuted: true })
    useGameStore.getState().buyPerk('head-start')
    expect(useGameStore.getState().perks['head-start']).toBeUndefined()
    expect(useGameStore.getState().stars).toBe(1)
  })
})

describe('prestige', () => {
  it('converts lifetime loc into stars and resets the run', () => {
    seed({
      loc: 500,
      totalLoc: PRESTIGE_THRESHOLD * 4, // sqrt(4) = 2 stars
      runLoc: 123,
      isMuted: true,
    })
    useGameStore.setState({
      generators: { ...useGameStore.getState().generators, junior: { owned: 7 } },
      upgrades: { 'vim-bindings': true },
    })
    useGameStore.getState().prestige()
    const s = useGameStore.getState()
    expect(s.stars).toBe(2)
    expect(s.prestigeCount).toBe(1)
    expect(s.loc).toBe(0)
    expect(s.runLoc).toBe(0)
    expect(s.generators.junior.owned).toBe(0)
    expect(s.upgrades['vim-bindings']).toBeUndefined()
    // lifetime stats survive
    expect(s.totalLoc).toBe(PRESTIGE_THRESHOLD * 4)
  })

  it('does nothing below the threshold', () => {
    seed({ totalLoc: PRESTIGE_THRESHOLD / 2, isMuted: true })
    useGameStore.getState().prestige()
    expect(useGameStore.getState().prestigeCount).toBe(0)
  })

  it('grants head-start interns when the perk is owned', () => {
    seed({ totalLoc: PRESTIGE_THRESHOLD, perks: { 'head-start': true }, isMuted: true })
    useGameStore.getState().prestige()
    expect(useGameStore.getState().generators.intern.owned).toBe(5)
  })
})

describe('grantAwayEarnings', () => {
  it('adds production for the time away and shows the dialog', () => {
    seed({ isMuted: true })
    useGameStore.setState({
      generators: { ...useGameStore.getState().generators, junior: { owned: 5 } }, // 5 LOC/s
    })
    useGameStore.getState().grantAwayEarnings(120)
    const s = useGameStore.getState()
    expect(s.loc).toBeCloseTo(600)
    expect(s.welcomeBack).not.toBeNull()
    expect(s.welcomeBack?.earnedLoc).toBeCloseTo(600)
  })

  it('skips the dialog for short absences', () => {
    seed({ isMuted: true })
    useGameStore.setState({
      generators: { ...useGameStore.getState().generators, junior: { owned: 5 } },
    })
    useGameStore.getState().grantAwayEarnings(30)
    expect(useGameStore.getState().loc).toBeCloseTo(150)
    expect(useGameStore.getState().welcomeBack).toBeNull()
  })
})

describe('clickGoldenCommit', () => {
  it('grants the reward and clears the golden', () => {
    seed({ isMuted: true })
    useGameStore.setState({
      golden: { hash: 'abc1234', xPct: 50, yPct: 50, expiresAt: Date.now() + 10_000 },
    })
    const expected = goldenReward(useGameStore.getState())
    useGameStore.getState().clickGoldenCommit()
    const s = useGameStore.getState()
    expect(s.loc).toBeCloseTo(expected)
    expect(s.goldenClicks).toBe(1)
    expect(s.golden).toBeNull()
  })

  it('is a no-op without an active golden', () => {
    seed({ isMuted: true })
    useGameStore.getState().clickGoldenCommit()
    expect(useGameStore.getState().loc).toBe(0)
  })
})

describe('export / import', () => {
  it('round-trips a save through export and import', () => {
    seed({ loc: 4_321, stars: 3, isMuted: true })
    useGameStore.setState({
      generators: { ...useGameStore.getState().generators, senior: { owned: 4 } },
      achievements: { hello: true },
      perks: { 'head-start': true },
    })
    const exported = useGameStore.getState().exportSave()
    expect(exported.startsWith('CF1.')).toBe(true)

    useGameStore.getState().resetSave()
    expect(useGameStore.getState().loc).toBe(0)

    expect(useGameStore.getState().importSave(exported)).toBe(true)
    const s = useGameStore.getState()
    expect(s.loc).toBe(4_321)
    expect(s.stars).toBe(3)
    expect(s.generators.senior.owned).toBe(4)
    expect(s.achievements['hello']).toBe(true)
    expect(s.perks['head-start']).toBe(true)
  })

  it('rejects garbage payloads', () => {
    expect(useGameStore.getState().importSave('not a save')).toBe(false)
    expect(useGameStore.getState().importSave('CF1.%%%')).toBe(false)
    expect(useGameStore.getState().importSave(`CF1.${btoa('{"nope":1}')}`)).toBe(false)
  })
})

describe('tick', () => {
  it('accrues production and play time for the elapsed delta', () => {
    seed({ isMuted: true })
    const now = Date.now()
    useGameStore.setState({
      generators: { ...useGameStore.getState().generators, junior: { owned: 5 } }, // 5 LOC/s
      lastTickAt: now - 1000,
      nextGoldenAt: Number.MAX_SAFE_INTEGER,
    })
    useGameStore.getState().tick(now)
    const s = useGameStore.getState()
    expect(s.loc).toBeCloseTo(5, 1)
    expect(s.playTimeSec).toBeCloseTo(1, 1)
  })
})

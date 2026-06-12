import { selectTemplate, isEligible, renderTemplate } from "@/lib/notifications/weeklyTemplate"
import type { WeeklyStats } from "@/lib/weeklyStats"

function baseStats(overrides: Partial<WeeklyStats> = {}): WeeklyStats {
  return {
    activityCount:         10,
    totalKm:               40,
    uniqueUserCount:       5,
    topCatalogs:           [{ name: "běh", emoji: "🏃", count: 6 }, { name: "plavání", emoji: "🏊", count: 4 }],
    varietyCount:          2,
    firstTimers:           [],
    prevWeekActivityCount: 0,
    prevWeekTotalKm:       0,
    cumulativeKm:          200,
    daysRemaining:         20,
    nearestMilestone:      null,
    bonusesEarned:         [],
    mostActiveDay:         null,
    ...overrides,
  }
}

describe("isEligible", () => {
  it("A is eligible whenever any activity exists", () => {
    expect(isEligible("A", baseStats({ activityCount: 1 }))).toBe(true)
    expect(isEligible("A", baseStats({ activityCount: 0 }))).toBe(false)
  })

  it("B requires variety >= 4", () => {
    expect(isEligible("B", baseStats({ varietyCount: 4 }))).toBe(true)
    expect(isEligible("B", baseStats({ varietyCount: 3 }))).toBe(false)
  })

  it("C requires previous week activity", () => {
    expect(isEligible("C", baseStats({ prevWeekActivityCount: 1 }))).toBe(true)
    expect(isEligible("C", baseStats({ prevWeekActivityCount: 0 }))).toBe(false)
  })

  it("D requires nearestMilestone to be present", () => {
    expect(isEligible("D", baseStats())).toBe(false)
    expect(isEligible("D", baseStats({
      nearestMilestone: { value: 1000, remaining: 50, justCrossed: false },
    }))).toBe(true)
  })

  it("E requires at least one bonus earned", () => {
    expect(isEligible("E", baseStats())).toBe(false)
    expect(isEligible("E", baseStats({
      bonusesEarned: [{ ruleName: "Týden plavce", userName: "Marek", bonusPoints: 30 }],
    }))).toBe(true)
  })

  it("F requires mostActiveDay to be present", () => {
    expect(isEligible("F", baseStats())).toBe(false)
    expect(isEligible("F", baseStats({
      mostActiveDay: { name: "úterý", count: 5 },
    }))).toBe(true)
  })
})

describe("selectTemplate", () => {
  it("falls back to A when nothing else is eligible", () => {
    const stats = baseStats({ activityCount: 3, varietyCount: 1 })
    expect(selectTemplate(stats, 0)).toBe("A")
    expect(selectTemplate(stats, 7)).toBe("A")
  })

  it("D always wins when nearestMilestone is set", () => {
    const stats = baseStats({
      varietyCount:          5, // B eligible
      prevWeekActivityCount: 10, // C eligible
      bonusesEarned:         [{ ruleName: "X", userName: "Y", bonusPoints: 10 }], // E
      mostActiveDay:         { name: "úterý", count: 5 }, // F
      nearestMilestone:      { value: 1000, remaining: 50, justCrossed: false },
    })
    expect(selectTemplate(stats, 0)).toBe("D")
    expect(selectTemplate(stats, 3)).toBe("D")
    expect(selectTemplate(stats, 999)).toBe("D")
  })

  it("rotates among eligible pool by weekIndex", () => {
    const stats = baseStats({
      varietyCount:          5,
      prevWeekActivityCount: 10,
      bonusesEarned:         [{ ruleName: "X", userName: "Y", bonusPoints: 10 }],
      mostActiveDay:         { name: "úterý", count: 5 },
    })
    // Pool: A, B, C, E, F (all eligible) → 5 templates
    const got = [0, 1, 2, 3, 4, 5, 6].map((w) => selectTemplate(stats, w))
    expect(got).toEqual(["A", "B", "C", "E", "F", "A", "B"])
  })

  it("skips ineligible templates within the rotation", () => {
    // Only A and F are eligible — B/C/E fail their preconditions.
    const stats = baseStats({
      activityCount:  20,
      varietyCount:   2,        // B not eligible
      prevWeekActivityCount: 0, // C not eligible
      bonusesEarned:  [],       // E not eligible
      mostActiveDay:  { name: "úterý", count: 8 }, // F eligible
    })
    const got = [0, 1, 2, 3].map((w) => selectTemplate(stats, w))
    // eligible = [A, F] → modulo rotation
    expect(got).toEqual(["A", "F", "A", "F"])
  })
})

describe("renderTemplate", () => {
  it("A produces a self-contained message", () => {
    const out = renderTemplate("A", "Zimní 2026", baseStats({ activityCount: 12, totalKm: 80 }))
    expect(out).toContain("Páteční ohlédnutí")
    expect(out).toContain("Zimní 2026")
    expect(out).toContain("12 aktivit") // plural form for 12
    expect(out).toContain("80 km")
    expect(out).toContain("Hezký víkend")
  })

  it("D celebrates when milestone just crossed", () => {
    const out = renderTemplate("D", "Zimní 2026", baseStats({
      nearestMilestone: { value: 1000, remaining: 0, justCrossed: true },
    }))
    expect(out).toContain("překonali jsme 1000 km")
  })

  it("D shows the gap when milestone is upcoming", () => {
    const out = renderTemplate("D", "Zimní 2026", baseStats({
      nearestMilestone: { value: 1000, remaining: 47, justCrossed: false },
    }))
    expect(out).toContain("blížíme se")
    expect(out).toContain("47 km")
  })

  it("C frames a negative delta neutrally without shaming", () => {
    const out = renderTemplate("C", "Zimní 2026", baseStats({
      totalKm:         40,
      prevWeekTotalKm: 80,
      prevWeekActivityCount: 12,
    }))
    expect(out).toContain("klidnější")
    expect(out).not.toMatch(/ztratili|propadli|propad/i)
  })

  it("E lists one bonus inline when only one was earned", () => {
    const out = renderTemplate("E", "Zimní 2026", baseStats({
      bonusesEarned: [{ ruleName: "Týden plavce", userName: "Marek", bonusPoints: 30 }],
    }))
    expect(out).toContain("Marek")
    expect(out).toContain("Týden plavce")
    expect(out).toContain("30 km")
  })

  it("E aggregates when 4+ bonuses were earned", () => {
    const out = renderTemplate("E", "Zimní 2026", baseStats({
      bonusesEarned: [
        { ruleName: "A", userName: "P1", bonusPoints: 10 },
        { ruleName: "B", userName: "P2", bonusPoints: 10 },
        { ruleName: "C", userName: "P3", bonusPoints: 10 },
        { ruleName: "D", userName: "P4", bonusPoints: 10 },
      ],
    }))
    expect(out).toContain("4 splněných bonusů")
    expect(out).toContain("40 km")
  })
})

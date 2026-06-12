import { pickMilestone } from "@/lib/weeklyStats"

describe("pickMilestone", () => {
  it("returns a celebratory result when a milestone was crossed this week", () => {
    // 480 → 520, crossed 500 within the window
    const m = pickMilestone(480, 520, 40, 30)
    expect(m).toEqual({ value: 500, remaining: 0, justCrossed: true })
  })

  it("fires the just-crossed branch regardless of reachability of the next milestone", () => {
    // Even with zero pace and zero days, the celebration still applies.
    const m = pickMilestone(490, 505, 0, 0)
    expect(m).toEqual({ value: 500, remaining: 0, justCrossed: true })
  })

  it("returns null when no milestone is within proximity", () => {
    // 200 km in, next milestone 500, proximity threshold is 1000 → within proximity, but check reachability is unrelated.
    // Bump cumulative to 1100 (next milestone 2500, distance 1400, > 1000 proximity) — null regardless of pace.
    const m = pickMilestone(1050, 1100, 200, 30)
    expect(m).toBeNull()
  })

  it("returns null when the milestone is not reachable at current pace", () => {
    // Scenario from production: 343 km in, weekly pace 144, only 2 days remaining.
    // Next milestone 500, distance 157, projected = 144 * (2/7) ≈ 41 km → unreachable.
    const m = pickMilestone(343 - 144, 343, 144, 2)
    expect(m).toBeNull()
  })

  it("returns the upcoming milestone when within proximity AND reachable", () => {
    // 800 km in, weekly pace 200, 20 days left → projected 571 km, milestone 1000 only 200 km away.
    const m = pickMilestone(600, 800, 200, 20)
    expect(m).toEqual({ value: 1000, remaining: 200, justCrossed: false })
  })

  it("blocks an approaching milestone when the challenge ends today", () => {
    // daysRemaining = 0 ⇒ projected = 0 ⇒ unreachable for any non-zero remaining.
    const m = pickMilestone(900, 950, 200, 0)
    expect(m).toBeNull()
  })

  it("returns null past the highest milestone in the list", () => {
    const m = pickMilestone(60_000, 60_100, 500, 30)
    expect(m).toBeNull()
  })
})

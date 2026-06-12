import { calculatePoints } from "@/lib/calculatePoints"

describe("calculatePoints", () => {
  it("multiplies value by pointsPerUnit", () => {
    expect(calculatePoints(5, 2.5)).toBe(12.5)
  })

  it("returns 0 for zero value", () => {
    expect(calculatePoints(0, 10)).toBe(0)
  })

  it("handles fractional values", () => {
    expect(calculatePoints(0.5, 10)).toBe(5)
  })

  it("handles large values", () => {
    expect(calculatePoints(100, 2.5)).toBe(250)
  })

  it("handles pointsPerUnit < 1", () => {
    expect(calculatePoints(10, 0.5)).toBe(5)
  })
})

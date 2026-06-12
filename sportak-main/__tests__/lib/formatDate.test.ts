import { formatDate } from "@/lib/formatDate"

describe("formatDate", () => {
  it("formats a standard date", () => {
    expect(formatDate("2024-01-15")).toBe("15. 1. 2024")
  })

  it("removes leading zeros from day and month", () => {
    expect(formatDate("2025-03-07")).toBe("7. 3. 2025")
  })

  it("handles December (month 12)", () => {
    expect(formatDate("2024-12-31")).toBe("31. 12. 2024")
  })

  it("handles single-digit day with double-digit month", () => {
    expect(formatDate("2025-11-01")).toBe("1. 11. 2025")
  })

  it("preserves the full year", () => {
    expect(formatDate("2030-06-20")).toBe("20. 6. 2030")
  })
})

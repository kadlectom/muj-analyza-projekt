import { formatPartnerTaggedMessage } from "@/lib/notifications/format"

describe("formatPartnerTaggedMessage", () => {
  const base = {
    actorName:    "Honza",
    activityName: "Běh",
    unit:         "km",
    value:        5,
    pointsTotal:  12.5,
    challengeUrl: "https://example.com/challenges/zima-2026",
  }

  it("contains actor, activity, value, points and url", () => {
    const out = formatPartnerTaggedMessage(base)
    expect(out).toContain("Honza")
    expect(out).toContain("Běh")
    expect(out).toContain("5 km")
    expect(out).toContain("12,5".replace(",", ".")) // we format as 12.5
    expect(out).toContain("12.5 km")
    expect(out).toContain("https://example.com/challenges/zima-2026")
  })

  it("uses Slack mrkdwn bold around actor and activity", () => {
    const out = formatPartnerTaggedMessage(base)
    expect(out).toContain("*Honza*")
    expect(out).toContain("*Běh*")
    expect(out).toContain("*12.5 km*")
  })

  it("drops trailing zeros for integer values", () => {
    const out = formatPartnerTaggedMessage({ ...base, value: 10, pointsTotal: 25 })
    expect(out).toContain("10 km")
    expect(out).toContain("*25 km*")
    expect(out).not.toMatch(/10\.0|25\.00/)
  })

  it("handles units other than km", () => {
    const out = formatPartnerTaggedMessage({ ...base, activityName: "Lezení", unit: "h", value: 1.5, pointsTotal: 22.5 })
    expect(out).toContain("1.5 h")
    expect(out).toContain("*Lezení*")
  })

  it("survives long actor names without breaking", () => {
    const longName = "Bartoloměj Krátkonohý-Pomalešnický"
    const out = formatPartnerTaggedMessage({ ...base, actorName: longName })
    expect(out).toContain(longName)
  })
})

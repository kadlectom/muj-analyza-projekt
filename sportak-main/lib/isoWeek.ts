// ISO 8601 week (week starts Monday, week containing Jan 4 is week 1).
// Returns "YYYY-Www" — week padded to 2 digits, e.g. "2026-W19".
// Used as notification_log.refId so each Friday cron fires at most once per
// calendar week regardless of which UTC slot triggered it.
export function currentIsoWeek(now: Date = new Date()): string {
  const [year, week] = isoWeekParts(now)
  return `${year}-W${week.toString().padStart(2, "0")}`
}

// Returns [isoYear, weekNumber]. The ISO year can differ from the calendar
// year at year boundaries (e.g. 2026-01-01 may belong to 2025-W53).
export function isoWeekParts(d: Date): [number, number] {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = date.getUTCDay() || 7 // Sunday becomes 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum) // shift to the Thursday of this week
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1)
  const weekNum = Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7)
  return [date.getUTCFullYear(), weekNum]
}

import type { BonusRule } from "@/db/schema"

type ActivityRow = {
  catalogItemId: string
  date: string
  points: number
}

/**
 * Filters a user's activities to those that count toward a given bonus rule.
 * Applies catalogItemIds, window, and daysOfWeek filters.
 */
export function filterActivitiesForRule(rule: BonusRule, activities: ActivityRow[]): ActivityRow[] {
  const allowedIds: string[] | null = rule.catalogItemIds
    ? (JSON.parse(rule.catalogItemIds) as string[])
    : null

  return activities.filter((a) => {
    if (allowedIds !== null && !allowedIds.includes(a.catalogItemId)) return false
    if (rule.windowStart !== null && a.date < rule.windowStart) return false
    if (rule.windowEnd !== null && a.date > rule.windowEnd) return false
    if (rule.daysOfWeek !== null) {
      const allowed = JSON.parse(rule.daysOfWeek) as number[]
      const dow = new Date(a.date + "T12:00:00Z").getUTCDay()
      if (!allowed.includes(dow)) return false
    }
    return true
  })
}

/**
 * Returns the current progress value for a rule given filtered activities.
 * COUNT_ACTIVITIES → count of activities
 * TOTAL_POINTS → sum of points (km)
 */
export function currentValueForRule(rule: BonusRule, filtered: ActivityRow[]): number {
  if (rule.conditionType === "COUNT_ACTIVITIES") return filtered.length
  return filtered.reduce((s, a) => s + a.points, 0)
}

/**
 * Whether a participant should see this rule on the bonus list.
 * Visible iff: window is currently open (today within [windowStart, windowEnd]) OR user already earned it.
 * Past unearned rules and not-yet-started future rules are hidden.
 */
export function isRuleVisibleToParticipant(
  rule: Pick<BonusRule, "id" | "windowStart" | "windowEnd">,
  todayIso: string,
  earnedRuleIds: ReadonlySet<string>,
): boolean {
  if (earnedRuleIds.has(rule.id)) return true
  const start = rule.windowStart ?? ""
  const end = rule.windowEnd ?? "9999-12-31"
  return start <= todayIso && todayIso <= end
}

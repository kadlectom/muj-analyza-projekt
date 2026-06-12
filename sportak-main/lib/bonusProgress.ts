import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { activities, activityCatalog, bonusAchievements, bonusRules } from "@/db/schema"
import { currentValueForRule, filterActivitiesForRule, isRuleVisibleToParticipant } from "@/lib/bonusFilter"
import type { BonusRuleProgress } from "@/components/challenges/challengeDetail.types"

/**
 * Loads all bonus rules for a challenge, computes progress + earned state for the given user,
 * and applies the participant visibility filter:
 *   - currently-open rules: visible
 *   - earned rules: visible (even after window end)
 *   - future or past-unearned rules: hidden
 *
 * Single source of truth for participant-facing bonus data (SSR + API).
 */
export async function buildBonusRulesProgress(
  challengeId: string,
  userId: string,
): Promise<BonusRuleProgress[]> {
  const rawRules = await db
    .select()
    .from(bonusRules)
    .where(eq(bonusRules.challengeId, challengeId))

  if (rawRules.length === 0) return []

  const earnedRows = await db
    .select({ bonusRuleId: bonusAchievements.bonusRuleId })
    .from(bonusAchievements)
    .where(and(eq(bonusAchievements.userId, userId), eq(bonusAchievements.challengeId, challengeId)))
  const earnedSet = new Set(earnedRows.map((e) => e.bonusRuleId))

  const todayIso = new Date().toISOString().slice(0, 10)
  const visibleRules = rawRules.filter((rule) => isRuleVisibleToParticipant(rule, todayIso, earnedSet))
  if (visibleRules.length === 0) return []

  const userActs = await db
    .select({ catalogItemId: activities.catalogItemId, date: activities.date, points: activities.points })
    .from(activities)
    .where(and(eq(activities.userId, userId), eq(activities.challengeId, challengeId)))

  const catalogNames = await db
    .select({ id: activityCatalog.id, name: activityCatalog.name })
    .from(activityCatalog)
  const catalogNameMap = new Map(catalogNames.map((c) => [c.id, c.name]))

  return visibleRules.map((rule) => {
    const filtered = filterActivitiesForRule(rule, userActs)
    const currentValue = currentValueForRule(rule, filtered)
    return {
      ruleId: rule.id,
      name: rule.name,
      conditionType: rule.conditionType,
      threshold: rule.threshold,
      bonusPoints: rule.bonusPoints,
      catalogItemNames: rule.catalogItemIds
        ? (JSON.parse(rule.catalogItemIds) as string[]).map((id) => catalogNameMap.get(id) ?? id)
        : null,
      windowStart: rule.windowStart,
      windowEnd: rule.windowEnd,
      daysOfWeek: rule.daysOfWeek ? (JSON.parse(rule.daysOfWeek) as number[]) : null,
      earned: earnedSet.has(rule.id),
      currentValue,
    }
  })
}

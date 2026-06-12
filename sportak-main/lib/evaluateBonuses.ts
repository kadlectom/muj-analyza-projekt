import { randomUUID } from "crypto"
import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { bonusRules, bonusAchievements, activities } from "@/db/schema"
import { filterActivitiesForRule, currentValueForRule } from "@/lib/bonusFilter"

/**
 * Called after a new activity is saved. Checks all bonus rules for the challenge,
 * inserts achievements for newly satisfied rules, and returns them.
 * Race conditions are handled by catching unique constraint violations.
 */
export async function evaluateBonuses(
  userId: string,
  challengeId: string
): Promise<{ name: string; bonusPoints: number }[]> {
  // 1. Load all bonus rules for this challenge
  const rules = await db
    .select()
    .from(bonusRules)
    .where(eq(bonusRules.challengeId, challengeId))

  if (rules.length === 0) return []

  // 2. Load already-earned achievements for this user+challenge
  const earned = await db
    .select({ bonusRuleId: bonusAchievements.bonusRuleId })
    .from(bonusAchievements)
    .where(
      and(
        eq(bonusAchievements.userId, userId),
        eq(bonusAchievements.challengeId, challengeId)
      )
    )
  const earnedSet = new Set(earned.map((e) => e.bonusRuleId))

  // 3. Load user's activities for this challenge
  const userActivities = await db
    .select({
      catalogItemId: activities.catalogItemId,
      date: activities.date,
      points: activities.points,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        eq(activities.challengeId, challengeId)
      )
    )

  // 4. Evaluate each unearned rule
  const newlyEarned: { name: string; bonusPoints: number }[] = []

  for (const rule of rules) {
    if (earnedSet.has(rule.id)) continue

    const filtered = filterActivitiesForRule(rule, userActivities)
    const value = currentValueForRule(rule, filtered)

    if (value < rule.threshold) continue

    // 5. Insert achievement — ignore unique constraint race
    try {
      await db.insert(bonusAchievements).values({
        id: randomUUID(),
        bonusRuleId: rule.id,
        userId,
        challengeId,
        bonusPoints: rule.bonusPoints,
        earnedAt: new Date(),
      })
      newlyEarned.push({ name: rule.name, bonusPoints: rule.bonusPoints })
    } catch {
      // Another concurrent request already inserted — skip silently
    }
  }

  return newlyEarned
}

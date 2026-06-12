import { and, inArray, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { activities, activityPartners, bonusAchievements, challenges, users } from "@/db/schema"

export type LeaderboardEntry = {
  userId: string
  name: string
  avatarUrl: string | null
  totalKm: number
  bonusKm: number
  rank: number
  /** Rank as of 7 days ago. Null if the user wasn't on the leaderboard then. */
  previousRank: number | null
}

/**
 * Recomputes the leaderboard "as of end of cutoffDateStr" and returns userId → rank.
 * Used to derive the 7-day position change shown next to each row.
 *
 * Activities are filtered by their user-supplied `date` (when the activity happened),
 * bonus achievements by their `earnedAt` timestamp. Users with 0 km in the past
 * window are absent from the map (UI renders them as "▲ NOVÝ").
 */
export async function computePastRanks(
  challengeId: string,
  partnerBonus: number,
  cutoffDateStr: string,
): Promise<Map<string, number>> {
  const cutoffEndOfDay = new Date(`${cutoffDateStr}T23:59:59.999Z`)
  const dateFilter = and(
    eq(activities.challengeId, challengeId),
    sql`${activities.date} <= ${cutoffDateStr}`,
  )

  const ownRows = await db
    .select({ userId: activities.userId, km: sql<number>`sum(${activities.points})`.as("km") })
    .from(activities)
    .where(dateFilter)
    .groupBy(activities.userId)

  const partnerRows = await db
    .select({ userId: activityPartners.userId, km: sql<number>`sum(${activities.points})`.as("km") })
    .from(activityPartners)
    .innerJoin(activities, eq(activityPartners.activityId, activities.id))
    .where(dateFilter)
    .groupBy(activityPartners.userId)

  const kmMap = new Map<string, number>()
  for (const r of ownRows) kmMap.set(r.userId, r.km)
  for (const r of partnerRows) kmMap.set(r.userId, (kmMap.get(r.userId) ?? 0) + r.km)

  if (partnerBonus > 0) {
    const actorBonus = await db
      .select({ userId: activities.userId, cnt: sql<number>`count(distinct ${activityPartners.activityId})`.as("cnt") })
      .from(activityPartners)
      .innerJoin(activities, eq(activityPartners.activityId, activities.id))
      .where(dateFilter)
      .groupBy(activities.userId)

    for (const r of actorBonus) {
      kmMap.set(r.userId, (kmMap.get(r.userId) ?? 0) + r.cnt * partnerBonus)
    }

    const partnerBonusRows = await db
      .select({ userId: activityPartners.userId, cnt: sql<number>`count(*)`.as("cnt") })
      .from(activityPartners)
      .innerJoin(activities, eq(activityPartners.activityId, activities.id))
      .where(dateFilter)
      .groupBy(activityPartners.userId)

    for (const r of partnerBonusRows) {
      kmMap.set(r.userId, (kmMap.get(r.userId) ?? 0) + r.cnt * partnerBonus)
    }
  }

  const bonusKmRows = await db
    .select({
      userId: bonusAchievements.userId,
      total: sql<number>`sum(${bonusAchievements.bonusPoints})`.as("total"),
    })
    .from(bonusAchievements)
    .where(and(
      eq(bonusAchievements.challengeId, challengeId),
      sql`${bonusAchievements.earnedAt} <= ${cutoffEndOfDay}`,
    ))
    .groupBy(bonusAchievements.userId)

  for (const r of bonusKmRows) {
    kmMap.set(r.userId, (kmMap.get(r.userId) ?? 0) + r.total)
  }

  // Sort, drop zero-km users, assign ranks with tie handling.
  const sorted = Array.from(kmMap.entries())
    .filter(([, km]) => km > 0)
    .sort((a, b) => b[1] - a[1])

  const rankMap = new Map<string, number>()
  let rank = 0
  let prevKm: number | null = null
  for (let i = 0; i < sorted.length; i++) {
    const [userId, km] = sorted[i]
    if (km !== prevKm) {
      rank = i + 1
      prevKm = km
    }
    rankMap.set(userId, rank)
  }

  return rankMap
}

/** Returns the YYYY-MM-DD that is `days` ago from today (UTC). */
export function cutoffDateString(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

type RawEntry = { userId: string; name: string; avatarUrl: string | null; totalKm: number; bonusKm: number }

function assignRanks(entries: RawEntry[]): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => b.totalKm - a.totalKm)
  let rank = 0
  let prevKm: number | null = null
  return sorted.map((row, i) => {
    if (row.totalKm !== prevKm) {
      rank = i + 1
      prevKm = row.totalKm
    }
    return { ...row, rank, previousRank: null }
  })
}

/** Returns top N entries per challenge (4 DB calls regardless of N). */
export async function buildBatchLeaderboard(
  challengeIds: string[],
  topN = 3,
): Promise<Record<string, LeaderboardEntry[]>> {
  if (challengeIds.length === 0) return {}

  // Own activity points per (challenge, user)
  const ownRows = await db
    .select({
      challengeId: activities.challengeId,
      userId: activities.userId,
      name: users.name,
      avatarUrl: users.avatarUrl,
      km: sql<number>`sum(${activities.points})`.as("km"),
    })
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .where(inArray(activities.challengeId, challengeIds))
    .groupBy(activities.challengeId, activities.userId, users.name, users.avatarUrl)

  // Partner activity points per (challenge, user)
  const partnerRows = await db
    .select({
      challengeId: activities.challengeId,
      userId: activityPartners.userId,
      name: users.name,
      avatarUrl: users.avatarUrl,
      km: sql<number>`sum(${activities.points})`.as("km"),
    })
    .from(activityPartners)
    .innerJoin(activities, eq(activityPartners.activityId, activities.id))
    .innerJoin(users, eq(activityPartners.userId, users.id))
    .where(inArray(activities.challengeId, challengeIds))
    .groupBy(activities.challengeId, activityPartners.userId, users.name, users.avatarUrl)

  // Build per-challenge maps
  const totals = new Map<string, Map<string, RawEntry>>()

  const getOrCreate = (cId: string) => {
    if (!totals.has(cId)) totals.set(cId, new Map())
    return totals.get(cId)!
  }

  for (const r of ownRows) {
    getOrCreate(r.challengeId).set(r.userId, {
      userId: r.userId, name: r.name, avatarUrl: r.avatarUrl, totalKm: r.km, bonusKm: 0,
    })
  }
  for (const r of partnerRows) {
    const cMap = getOrCreate(r.challengeId)
    const ex = cMap.get(r.userId)
    if (ex) {
      ex.totalKm += r.km
    } else {
      cMap.set(r.userId, { userId: r.userId, name: r.name, avatarUrl: r.avatarUrl, totalKm: r.km, bonusKm: 0 })
    }
  }

  // Partner bonus for challenges that have it
  const challengeRows = await db
    .select({ id: challenges.id, partnerBonus: challenges.partnerBonus })
    .from(challenges)
    .where(inArray(challenges.id, challengeIds))

  const bonusChallengeIds = challengeRows.filter(c => c.partnerBonus > 0).map(c => c.id)
  const bonusMap = Object.fromEntries(challengeRows.map(c => [c.id, c.partnerBonus]))

  if (bonusChallengeIds.length > 0) {
    const actorBonusRows = await db
      .select({
        challengeId: activities.challengeId,
        userId: activities.userId,
        cnt: sql<number>`count(distinct ${activityPartners.activityId})`.as("cnt"),
      })
      .from(activityPartners)
      .innerJoin(activities, eq(activityPartners.activityId, activities.id))
      .where(inArray(activities.challengeId, bonusChallengeIds))
      .groupBy(activities.challengeId, activities.userId)

    for (const r of actorBonusRows) {
      const e = totals.get(r.challengeId)?.get(r.userId)
      if (e) e.totalKm += r.cnt * bonusMap[r.challengeId]
    }

    const partnerBonusRows = await db
      .select({
        challengeId: activities.challengeId,
        userId: activityPartners.userId,
        cnt: sql<number>`count(*)`.as("cnt"),
      })
      .from(activityPartners)
      .innerJoin(activities, eq(activityPartners.activityId, activities.id))
      .where(inArray(activities.challengeId, bonusChallengeIds))
      .groupBy(activities.challengeId, activityPartners.userId)

    for (const r of partnerBonusRows) {
      const e = totals.get(r.challengeId)?.get(r.userId)
      if (e) e.totalKm += r.cnt * bonusMap[r.challengeId]
    }
  }

  // Bonus achievements
  const bonusAchRows = await db
    .select({
      challengeId: bonusAchievements.challengeId,
      userId: bonusAchievements.userId,
      total: sql<number>`sum(${bonusAchievements.bonusPoints})`.as("total"),
    })
    .from(bonusAchievements)
    .where(inArray(bonusAchievements.challengeId, challengeIds))
    .groupBy(bonusAchievements.challengeId, bonusAchievements.userId)

  for (const r of bonusAchRows) {
    const e = totals.get(r.challengeId)?.get(r.userId)
    if (e) {
      e.totalKm += r.total
      e.bonusKm += r.total
    }
  }

  // Rank and slice per challenge
  const result: Record<string, LeaderboardEntry[]> = {}
  for (const cId of challengeIds) {
    const cMap = totals.get(cId)
    result[cId] = cMap && cMap.size > 0
      ? assignRanks(Array.from(cMap.values())).slice(0, topN)
      : []
  }
  return result
}

import { eq, and, desc, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { activities, activityPartners, bonusAchievements, activityCatalog, users, enrollments } from "@/db/schema"
import { buildBonusRulesProgress } from "@/lib/bonusProgress"
import { computePastRanks, cutoffDateString } from "@/lib/leaderboardCalc"
import type { WeeklyHighlights, BonusRuleProgress } from "@/components/challenges/challengeDetail.types"
import type { LeaderboardEntry } from "@/components/leaderboard/LeaderboardTable"

const POSUN_DAYS = 7

export async function fetchWeeklyHighlights(challengeId: string): Promise<WeeklyHighlights> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10)

  const [rawBiggestActivity, rawWeeklyGain, rawMostActive] = await Promise.all([
    db
      .select({
        userId: users.id,
        userName: users.name,
        userAvatarUrl: users.avatarUrl,
        catalogEmoji: activityCatalog.emoji,
        catalogName: activityCatalog.name,
        points: activities.points,
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .innerJoin(activityCatalog, eq(activities.catalogItemId, activityCatalog.id))
      .where(and(eq(activities.challengeId, challengeId), sql`${activities.date} >= ${sevenDaysAgoStr}`))
      .orderBy(desc(activities.points))
      .limit(1)
      .then((r) => r[0] ?? null),

    db
      .select({
        userId: users.id,
        userName: users.name,
        userAvatarUrl: users.avatarUrl,
        totalKm: sql<number>`sum(${activities.points})`.as("totalKm"),
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .where(and(eq(activities.challengeId, challengeId), sql`${activities.date} >= ${sevenDaysAgoStr}`))
      .groupBy(activities.userId, users.name, users.avatarUrl)
      .orderBy(desc(sql`sum(${activities.points})`))
      .limit(1)
      .then((r) => r[0] ?? null),

    db
      .select({
        userId: users.id,
        userName: users.name,
        userAvatarUrl: users.avatarUrl,
        activityCount: sql<number>`count(*)`.as("activityCount"),
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .where(and(eq(activities.challengeId, challengeId), sql`${activities.date} >= ${sevenDaysAgoStr}`))
      .groupBy(activities.userId, users.name, users.avatarUrl)
      .orderBy(desc(sql`count(*)`))
      .limit(1)
      .then((r) => r[0] ?? null),
  ])

  return {
    biggestActivity: rawBiggestActivity,
    biggestWeeklyGain: rawWeeklyGain,
    mostActiveUser: rawMostActive,
  }
}

export async function fetchBonusRulesProgress(challengeId: string, userId: string): Promise<BonusRuleProgress[]> {
  return buildBonusRulesProgress(challengeId, userId)
}

type EnrolledUser = { id: string; name: string; avatarUrl: string | null }

export async function fetchLeaderboardForChallenge(
  challengeId: string,
  partnerBonus: number,
  rawEnrolled: EnrolledUser[],
  userId: string,
): Promise<{
  userRank: number | null
  userTotalKm: number | null
  gapToNextKm: number | null
  initialLeaderboard: LeaderboardEntry[]
}> {
  const ownRows = await db
    .select({ userId: activities.userId, km: sql<number>`sum(${activities.points})`.as("km") })
    .from(activities)
    .where(eq(activities.challengeId, challengeId))
    .groupBy(activities.userId)

  const partnerRows = await db
    .select({ userId: activityPartners.userId, km: sql<number>`sum(${activities.points})`.as("km") })
    .from(activityPartners)
    .innerJoin(activities, eq(activityPartners.activityId, activities.id))
    .where(eq(activities.challengeId, challengeId))
    .groupBy(activityPartners.userId)

  const kmMap = new Map<string, number>()
  for (const r of ownRows) kmMap.set(r.userId, r.km)
  for (const r of partnerRows) kmMap.set(r.userId, (kmMap.get(r.userId) ?? 0) + r.km)

  if (partnerBonus > 0) {
    const actorBonus = await db
      .select({ userId: activities.userId, cnt: sql<number>`count(distinct ${activityPartners.activityId})`.as("cnt") })
      .from(activityPartners)
      .innerJoin(activities, eq(activityPartners.activityId, activities.id))
      .where(eq(activities.challengeId, challengeId))
      .groupBy(activities.userId)

    for (const r of actorBonus) {
      kmMap.set(r.userId, (kmMap.get(r.userId) ?? 0) + r.cnt * partnerBonus)
    }

    const partnerBonusRows = await db
      .select({ userId: activityPartners.userId, cnt: sql<number>`count(*)`.as("cnt") })
      .from(activityPartners)
      .innerJoin(activities, eq(activityPartners.activityId, activities.id))
      .where(eq(activities.challengeId, challengeId))
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
    .where(eq(bonusAchievements.challengeId, challengeId))
    .groupBy(bonusAchievements.userId)

  for (const r of bonusKmRows) {
    kmMap.set(r.userId, (kmMap.get(r.userId) ?? 0) + r.total)
  }

  const merged = Array.from(kmMap.entries()).map(([uid, totalKm]) => ({ userId: uid, totalKm }))
  merged.sort((a, b) => b.totalKm - a.totalKm)

  const pastRanks = await computePastRanks(challengeId, partnerBonus, cutoffDateString(POSUN_DAYS))

  const userProfileMap = new Map(rawEnrolled.map((u) => [u.id, u]))
  const bonusKmMap = new Map(bonusKmRows.map((r) => [r.userId, r.total]))

  let userRank: number | null = null
  let userTotalKm: number | null = null
  let gapToNextKm: number | null = null
  const initialLeaderboard: LeaderboardEntry[] = []

  let rank = 0
  let prev: number | null = null
  for (let i = 0; i < merged.length; i++) {
    const km = merged[i].totalKm
    if (km !== prev) { rank = i + 1; prev = km }
    const profile = userProfileMap.get(merged[i].userId)
    initialLeaderboard.push({
      userId: merged[i].userId,
      name: profile?.name ?? merged[i].userId,
      avatarUrl: profile?.avatarUrl ?? null,
      totalKm: km,
      bonusKm: bonusKmMap.get(merged[i].userId) ?? 0,
      rank,
      previousRank: pastRanks.get(merged[i].userId) ?? null,
    })
    if (merged[i].userId === userId) {
      userRank = rank
      userTotalKm = km
    }
  }

  if (userTotalKm === null) {
    userRank = merged.length + 1
    userTotalKm = 0
  }

  const myKm = userTotalKm
  for (let i = merged.length - 1; i >= 0; i--) {
    if (merged[i].totalKm > myKm) {
      gapToNextKm = parseFloat((merged[i].totalKm - myKm).toFixed(1))
      break
    }
  }

  return { userRank, userTotalKm, gapToNextKm, initialLeaderboard }
}

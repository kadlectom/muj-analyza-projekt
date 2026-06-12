import type { NextApiRequest, NextApiResponse } from "next"
import { eq, sql } from "drizzle-orm"
import { requireAuth, isAdmin } from "@/lib/permissions"
import { db } from "@/lib/db"
import { activities, activityPartners, bonusAchievements, challenges, users } from "@/db/schema"
import { computePastRanks, cutoffDateString } from "@/lib/leaderboardCalc"

const POSUN_DAYS = 7

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end()

  const user = await requireAuth({ req, res })
  if (!user) return

  const challengeId = req.query.challengeId as string | undefined
  if (!challengeId) return res.status(400).json({ error: "challengeId je povinné" })

  const challenge = await db
    .select({ id: challenges.id, status: challenges.status, partnerBonus: challenges.partnerBonus })
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .then((r) => r[0] ?? null)

  if (!challenge) return res.status(404).json({ error: "Výzva nenalezena" })

  // DRAFT visible only to admins
  if (challenge.status === "DRAFT" && !isAdmin(user.role)) {
    return res.status(403).json({ error: "Nedostatečná oprávnění" })
  }

  // Own activity points per user
  const ownRows = await db
    .select({
      userId: activities.userId,
      name: users.name,
      avatarUrl: users.avatarUrl,
      km: sql<number>`sum(${activities.points})`.as("km"),
    })
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .where(eq(activities.challengeId, challengeId))
    .groupBy(activities.userId, users.name, users.avatarUrl)

  // Partner activity points — same points as the actor, credited to tagged users
  const partnerRows = await db
    .select({
      userId: activityPartners.userId,
      name: users.name,
      avatarUrl: users.avatarUrl,
      km: sql<number>`sum(${activities.points})`.as("km"),
    })
    .from(activityPartners)
    .innerJoin(activities, eq(activityPartners.activityId, activities.id))
    .innerJoin(users, eq(activityPartners.userId, users.id))
    .where(eq(activities.challengeId, challengeId))
    .groupBy(activityPartners.userId, users.name, users.avatarUrl)

  // Merge own + partner points into one map
  type Entry = { userId: string; name: string; avatarUrl: string | null; totalKm: number; bonusKm: number }
  const totals = new Map<string, Entry>()

  for (const r of ownRows) {
    totals.set(r.userId, { userId: r.userId, name: r.name, avatarUrl: r.avatarUrl, totalKm: r.km, bonusKm: 0 })
  }
  for (const r of partnerRows) {
    const existing = totals.get(r.userId)
    if (existing) {
      existing.totalKm += r.km
    } else {
      totals.set(r.userId, { userId: r.userId, name: r.name, avatarUrl: r.avatarUrl, totalKm: r.km, bonusKm: 0 })
    }
  }

  // Add partner bonus (flat per activity) for both actor and tagged partners
  if (challenge.partnerBonus > 0) {
    // Actor: count of own activities that have at least one partner tagged
    const actorBonusRows = await db
      .select({
        userId: activities.userId,
        cnt: sql<number>`count(distinct ${activityPartners.activityId})`.as("cnt"),
      })
      .from(activityPartners)
      .innerJoin(activities, eq(activityPartners.activityId, activities.id))
      .where(eq(activities.challengeId, challengeId))
      .groupBy(activities.userId)

    for (const r of actorBonusRows) {
      const e = totals.get(r.userId)
      if (e) e.totalKm += r.cnt * challenge.partnerBonus
    }

    // Tagged partners: count of activities they were tagged in
    const partnerBonusRows = await db
      .select({
        userId: activityPartners.userId,
        cnt: sql<number>`count(*)`.as("cnt"),
      })
      .from(activityPartners)
      .innerJoin(activities, eq(activityPartners.activityId, activities.id))
      .where(eq(activities.challengeId, challengeId))
      .groupBy(activityPartners.userId)

    for (const r of partnerBonusRows) {
      const e = totals.get(r.userId)
      if (e) e.totalKm += r.cnt * challenge.partnerBonus
    }
  }

  // Add bonus achievements km
  const bonusRows = await db
    .select({
      userId: bonusAchievements.userId,
      total: sql<number>`sum(${bonusAchievements.bonusPoints})`.as("total"),
    })
    .from(bonusAchievements)
    .where(eq(bonusAchievements.challengeId, challengeId))
    .groupBy(bonusAchievements.userId)

  for (const r of bonusRows) {
    const e = totals.get(r.userId)
    if (e) { e.totalKm += r.total; e.bonusKm += r.total }
  }

  const merged = Array.from(totals.values())
  merged.sort((a, b) => b.totalKm - a.totalKm)

  // Past ranks (7 days ago) for the "Posun" column on desktop. Computed
  // alongside the current ranks so the response carries everything the
  // client needs in one round trip.
  const pastRanks = await computePastRanks(
    challengeId,
    challenge.partnerBonus,
    cutoffDateString(POSUN_DAYS),
  )

  // Assign ranks (handle ties: same totalKm = same rank)
  let rank = 0
  let prevKm: number | null = null

  const ranked = merged.map((row, i) => {
    if (row.totalKm !== prevKm) {
      rank = i + 1
      prevKm = row.totalKm
    }
    return { ...row, rank, previousRank: pastRanks.get(row.userId) ?? null }
  })

  return res.status(200).json(ranked)
}

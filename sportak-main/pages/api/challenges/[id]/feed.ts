import type { NextApiRequest, NextApiResponse } from "next"
import { eq, desc, inArray } from "drizzle-orm"
import { requireAuth, isAdmin } from "@/lib/permissions"
import { db } from "@/lib/db"
import { activities, activityCatalog, activityPartners, challenges, users } from "@/db/schema"

export type FeedItem = {
  userId: string
  userName: string
  userAvatarUrl: string | null
  catalogEmoji: string | null
  catalogName: string
  catalogUnit: string
  value: number
  points: number
  partnerBonus: number
  date: string
  createdAt: number
  partners: { name: string }[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end()

  const user = await requireAuth({ req, res })
  if (!user) return

  const { id } = req.query as { id: string }
  const limit = Math.min(Number(req.query.limit ?? 20), 50)

  const challenge = await db
    .select({ status: challenges.status, partnerBonus: challenges.partnerBonus })
    .from(challenges)
    .where(eq(challenges.id, id))
    .then((r) => r[0] ?? null)

  if (!challenge) return res.status(404).json({ error: "Výzva nenalezena" })
  if (challenge.status === "DRAFT" && !isAdmin(user.role)) {
    return res.status(403).json({ error: "Nedostatečná oprávnění" })
  }

  const rows = await db
    .select({
      activityId: activities.id,
      userId: activities.userId,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
      catalogEmoji: activityCatalog.emoji,
      catalogName: activityCatalog.name,
      catalogUnit: activityCatalog.unit,
      value: activities.value,
      points: activities.points,
      date: activities.date,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .innerJoin(activityCatalog, eq(activities.catalogItemId, activityCatalog.id))
    .where(eq(activities.challengeId, id))
    .orderBy(desc(activities.createdAt))
    .limit(limit)

  const activityIds = rows.map((r) => r.activityId)
  const partnerRows = activityIds.length > 0
    ? await db
        .select({ activityId: activityPartners.activityId, name: users.name })
        .from(activityPartners)
        .innerJoin(users, eq(activityPartners.userId, users.id))
        .where(inArray(activityPartners.activityId, activityIds))
    : []
  const partnerMap = new Map<string, { name: string }[]>()
  for (const r of partnerRows) {
    const list = partnerMap.get(r.activityId) ?? []
    list.push({ name: r.name })
    partnerMap.set(r.activityId, list)
  }

  return res.status(200).json(
    rows.map((r) => {
      const partners = partnerMap.get(r.activityId) ?? []
      return {
        userId: r.userId,
        userName: r.userName,
        userAvatarUrl: r.userAvatarUrl,
        catalogEmoji: r.catalogEmoji,
        catalogName: r.catalogName,
        catalogUnit: r.catalogUnit,
        value: r.value,
        points: r.points,
        partnerBonus: partners.length > 0 ? challenge.partnerBonus : 0,
        date: r.date,
        createdAt: r.createdAt.getTime(),
        partners,
      }
    })
  )
}

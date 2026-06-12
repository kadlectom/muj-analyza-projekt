import type { NextApiRequest, NextApiResponse } from "next"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/permissions"
import { db } from "@/lib/db"
import { bonusRules, bonusAchievements } from "@/db/schema"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PATCH") return handlePatch(req, res)
  if (req.method === "DELETE") return handleDelete(req, res)
  return res.status(405).end()
}

// ── PATCH /api/bonus-rules/[id] ───────────────────────────────────────────────

async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAdmin({ req, res })
  if (!user) return

  const id = req.query.id as string

  const existing = await db.select().from(bonusRules).where(eq(bonusRules.id, id))
  if (existing.length === 0) return res.status(404).json({ error: "Pravidlo nenalezeno" })

  const {
    name,
    conditionType,
    threshold,
    catalogItemIds,
    windowStart,
    windowEnd,
    daysOfWeek,
    bonusPoints,
  } = req.body

  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0))
    return res.status(400).json({ error: "Název nesmí být prázdný" })
  if (conditionType !== undefined && conditionType !== "COUNT_ACTIVITIES" && conditionType !== "TOTAL_POINTS")
    return res.status(400).json({ error: "Neplatný typ podmínky" })
  if (threshold !== undefined && (typeof threshold !== "number" || threshold <= 0))
    return res.status(400).json({ error: "Práh musí být větší než 0" })
  if (bonusPoints !== undefined && (typeof bonusPoints !== "number" || bonusPoints <= 0))
    return res.status(400).json({ error: "Bonus km musí být větší než 0" })

  const updates: Partial<typeof bonusRules.$inferInsert> = {}
  if (name !== undefined) updates.name = name.trim()
  if (conditionType !== undefined) updates.conditionType = conditionType
  if (threshold !== undefined) updates.threshold = threshold
  if ("catalogItemIds" in req.body) {
    updates.catalogItemIds = Array.isArray(catalogItemIds) && catalogItemIds.length > 0
      ? JSON.stringify(catalogItemIds)
      : null
  }
  if ("windowStart" in req.body) updates.windowStart = windowStart ?? null
  if ("windowEnd" in req.body) updates.windowEnd = windowEnd ?? null
  if ("daysOfWeek" in req.body) {
    updates.daysOfWeek = Array.isArray(daysOfWeek) && daysOfWeek.length > 0
      ? JSON.stringify(daysOfWeek)
      : null
  }
  if (bonusPoints !== undefined) updates.bonusPoints = bonusPoints

  const updated = await db
    .update(bonusRules)
    .set(updates)
    .where(eq(bonusRules.id, id))
    .returning()

  return res.status(200).json({
    ...updated[0],
    createdAt: updated[0].createdAt instanceof Date ? updated[0].createdAt.getTime() : updated[0].createdAt,
  })
}

// ── DELETE /api/bonus-rules/[id] ──────────────────────────────────────────────

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAdmin({ req, res })
  if (!user) return

  const id = req.query.id as string

  const existing = await db.select().from(bonusRules).where(eq(bonusRules.id, id))
  if (existing.length === 0) return res.status(404).json({ error: "Pravidlo nenalezeno" })

  // Cascade: remove achievements first (no FK cascade in SQLite)
  await db.delete(bonusAchievements).where(eq(bonusAchievements.bonusRuleId, id))
  await db.delete(bonusRules).where(eq(bonusRules.id, id))

  return res.status(204).end()
}

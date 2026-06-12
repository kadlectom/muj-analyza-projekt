import { randomUUID } from "crypto"
import type { NextApiRequest, NextApiResponse } from "next"
import { eq } from "drizzle-orm"
import { requireAuth, requireAdmin } from "@/lib/permissions"
import { db } from "@/lib/db"
import { bonusRules } from "@/db/schema"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return handleGet(req, res)
  if (req.method === "POST") return handlePost(req, res)
  return res.status(405).end()
}

// ── GET /api/bonus-rules?challengeId=X ────────────────────────────────────────

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth({ req, res })
  if (!user) return

  const challengeId = req.query.challengeId as string | undefined
  if (!challengeId) return res.status(400).json({ error: "challengeId je povinné" })

  const rules = await db
    .select()
    .from(bonusRules)
    .where(eq(bonusRules.challengeId, challengeId))

  return res.status(200).json(rules.map(serializeRule))
}

// ── POST /api/bonus-rules ──────────────────────────────────────────────────────

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAdmin({ req, res })
  if (!user) return

  const {
    challengeId,
    name,
    conditionType,
    threshold,
    catalogItemIds,
    windowStart,
    windowEnd,
    daysOfWeek,
    bonusPoints,
  } = req.body

  if (!challengeId || typeof challengeId !== "string")
    return res.status(400).json({ error: "challengeId je povinné" })
  if (!name || typeof name !== "string" || name.trim().length === 0)
    return res.status(400).json({ error: "Název je povinný" })
  if (conditionType !== "COUNT_ACTIVITIES" && conditionType !== "TOTAL_POINTS")
    return res.status(400).json({ error: "Neplatný typ podmínky" })
  if (typeof threshold !== "number" || threshold <= 0)
    return res.status(400).json({ error: "Práh musí být větší než 0" })
  if (typeof bonusPoints !== "number" || bonusPoints <= 0)
    return res.status(400).json({ error: "Bonus km musí být větší než 0" })

  const now = new Date()
  const row = await db
    .insert(bonusRules)
    .values({
      id: randomUUID(),
      challengeId,
      name: name.trim(),
      conditionType,
      threshold,
      catalogItemIds: Array.isArray(catalogItemIds) && catalogItemIds.length > 0
        ? JSON.stringify(catalogItemIds)
        : null,
      windowStart: windowStart ?? null,
      windowEnd: windowEnd ?? null,
      daysOfWeek: Array.isArray(daysOfWeek) && daysOfWeek.length > 0
        ? JSON.stringify(daysOfWeek)
        : null,
      bonusPoints,
      createdAt: now,
    })
    .returning()

  return res.status(201).json(serializeRule(row[0]))
}

function serializeRule(rule: typeof bonusRules.$inferSelect) {
  return {
    ...rule,
    createdAt: rule.createdAt instanceof Date ? rule.createdAt.getTime() : rule.createdAt,
  }
}

import type { NextApiRequest, NextApiResponse } from "next"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/permissions"
import { db } from "@/lib/db"
import { activityCatalog, challenges } from "@/db/schema"

const VALID_CATEGORIES = ["sport", "wellness", "culture"] as const
const VALID_CHALLENGE_TYPES = ["WINTER", "SUMMER", "BOTH"] as const

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const user = await requireAdmin({ req, res })
  if (!user) return

  const { name, unit, pointsPerUnit, category, challengeType, challengeId, emoji, minValue } =
    req.body ?? {}

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Název aktivity je povinný" })
  }
  if (!unit || typeof unit !== "string" || !unit.trim()) {
    return res.status(400).json({ error: "Jednotka je povinná" })
  }
  if (typeof pointsPerUnit !== "number" || pointsPerUnit <= 0) {
    return res.status(400).json({ error: "Počet bodů za jednotku musí být kladné číslo" })
  }
  if (minValue !== undefined && minValue !== null) {
    if (typeof minValue !== "number" || minValue <= 0) {
      return res.status(400).json({ error: "Minimální hodnota musí být kladné číslo" })
    }
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "Neplatná kategorie" })
  }
  if (!VALID_CHALLENGE_TYPES.includes(challengeType)) {
    return res.status(400).json({ error: "Neplatný typ výzvy" })
  }

  // Validate challengeId if provided
  if (challengeId) {
    if (typeof challengeId !== "string") {
      return res.status(400).json({ error: "Neplatné ID výzvy" })
    }
    const challenge = await db
      .select({ id: challenges.id })
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .then((r) => r[0] ?? null)
    if (!challenge) return res.status(404).json({ error: "Výzva nenalezena" })
  }

  const id = crypto.randomUUID()

  await db.insert(activityCatalog).values({
    id,
    challengeId: challengeId ?? null,
    name: name.trim(),
    unit: unit.trim(),
    pointsPerUnit,
    minValue: typeof minValue === "number" ? minValue : null,
    category,
    challengeType,
    emoji: typeof emoji === "string" && emoji.trim() ? emoji.trim() : null,
    isActive: true,
    createdAt: new Date(),
  })

  return res.status(201).json({ id })
}

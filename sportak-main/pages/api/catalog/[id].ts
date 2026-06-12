import type { NextApiRequest, NextApiResponse } from "next"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/permissions"
import { db } from "@/lib/db"
import { activityCatalog } from "@/db/schema"

const VALID_CATEGORIES = ["sport", "wellness", "culture"] as const
const VALID_CHALLENGE_TYPES = ["WINTER", "SUMMER", "BOTH"] as const

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH" && req.method !== "DELETE") return res.status(405).end()

  const user = await requireAdmin({ req, res })
  if (!user) return

  const { id } = req.query as { id: string }

  // ── Soft-delete ───────────────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const item = await db
      .select({ id: activityCatalog.id })
      .from(activityCatalog)
      .where(eq(activityCatalog.id, id))
      .then((r) => r[0] ?? null)

    if (!item) return res.status(404).json({ error: "Aktivita nenalezena" })

    await db
      .update(activityCatalog)
      .set({ isActive: false })
      .where(eq(activityCatalog.id, id))

    return res.status(200).json({ ok: true })
  }

  // ── Edit / reactivate ─────────────────────────────────────────────────────
  const { name, unit, pointsPerUnit, category, challengeType, isActive, emoji, minValue } =
    req.body ?? {}

  // Reactivate-only shortcut
  if (isActive === true && Object.keys(req.body ?? {}).length === 1) {
    const item = await db
      .select({ id: activityCatalog.id })
      .from(activityCatalog)
      .where(eq(activityCatalog.id, id))
      .then((r) => r[0] ?? null)

    if (!item) return res.status(404).json({ error: "Aktivita nenalezena" })

    await db
      .update(activityCatalog)
      .set({ isActive: true })
      .where(eq(activityCatalog.id, id))

    return res.status(200).json({ ok: true })
  }

  // Full edit validation
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

  const item = await db
    .select({ id: activityCatalog.id })
    .from(activityCatalog)
    .where(eq(activityCatalog.id, id))
    .then((r) => r[0] ?? null)

  if (!item) return res.status(404).json({ error: "Aktivita nenalezena" })

  await db
    .update(activityCatalog)
    .set({
      name: name.trim(),
      unit: unit.trim(),
      pointsPerUnit,
      minValue: typeof minValue === "number" ? minValue : null,
      category,
      challengeType,
      emoji: typeof emoji === "string" && emoji.trim() ? emoji.trim() : null,
    })
    .where(eq(activityCatalog.id, id))

  return res.status(200).json({ ok: true })
}

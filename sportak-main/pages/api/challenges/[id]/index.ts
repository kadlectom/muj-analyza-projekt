import type { NextApiRequest, NextApiResponse } from "next"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/permissions"
import { db } from "@/lib/db"
import { challenges } from "@/db/schema"

const VALID_TRANSITIONS: Record<string, string> = {
  DRAFT: "ACTIVE",
  ACTIVE: "CLOSED",
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).end()

  const user = await requireAdmin({ req, res })
  if (!user) return

  const { id } = req.query as { id: string }
  const body = req.body ?? {}

  // ── Status transition ─────────────────────────────────────────────────────
  if ("status" in body) {
    const { status } = body
    if (!["ACTIVE", "CLOSED"].includes(status)) {
      return res.status(400).json({ error: "Neplatný cílový stav" })
    }

    const current = await db
      .select({ status: challenges.status })
      .from(challenges)
      .where(eq(challenges.id, id))
      .then((r) => r[0] ?? null)

    if (!current) return res.status(404).json({ error: "Výzva nenalezena" })
    if (current.status === "CLOSED" || current.status === "ARCHIVED") {
      return res.status(409).json({ error: "Uzavřenou nebo archivovanou výzvu nelze změnit" })
    }
    if (VALID_TRANSITIONS[current.status] !== status) {
      return res.status(400).json({ error: "Neplatný přechod stavu" })
    }

    await db
      .update(challenges)
      .set({ status, updatedAt: new Date() })
      .where(eq(challenges.id, id))

    return res.status(200).json({ ok: true })
  }

  // ── Field edit ────────────────────────────────────────────────────────────
  const { name, type, startDate, endDate, partnerBonus } = body

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Název výzvy je povinný" })
  }
  if (!["WINTER", "SUMMER"].includes(type)) {
    return res.status(400).json({ error: "Typ výzvy musí být WINTER nebo SUMMER" })
  }
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return res.status(400).json({ error: "Datum začátku je povinné (YYYY-MM-DD)" })
  }
  if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return res.status(400).json({ error: "Datum konce je povinné (YYYY-MM-DD)" })
  }
  if (startDate >= endDate) {
    return res.status(400).json({ error: "Datum začátku musí být před datem konce" })
  }

  const current = await db
    .select({ status: challenges.status })
    .from(challenges)
    .where(eq(challenges.id, id))
    .then((r) => r[0] ?? null)

  if (!current) return res.status(404).json({ error: "Výzva nenalezena" })
  if (current.status === "CLOSED" || current.status === "ARCHIVED") {
    return res.status(409).json({ error: "Uzavřenou nebo archivovanou výzvu nelze upravit" })
  }

  await db
    .update(challenges)
    .set({
      name: name.trim(),
      type: type as "WINTER" | "SUMMER",
      startDate,
      endDate,
      partnerBonus: typeof partnerBonus === "number" && partnerBonus >= 0 ? partnerBonus : 0,
      updatedAt: new Date(),
    })
    .where(eq(challenges.id, id))

  return res.status(200).json({ ok: true })
}

import type { NextApiRequest, NextApiResponse } from "next"
import { isNotNull } from "drizzle-orm"
import { requireAdmin } from "@/lib/permissions"
import { db } from "@/lib/db"
import { challenges } from "@/db/schema"
import { uniqueSlug } from "@/lib/slugify"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const user = await requireAdmin({ req, res })
  if (!user) return

  const { name, type, startDate, endDate } = req.body ?? {}

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

  const id = crypto.randomUUID()
  const now = new Date()

  const existingSlugs = await db
    .select({ slug: challenges.slug })
    .from(challenges)
    .where(isNotNull(challenges.slug))
  const taken = new Set(existingSlugs.map((r) => r.slug!).filter(Boolean))
  const slug = uniqueSlug(name.trim(), taken)

  await db.insert(challenges).values({
    id,
    slug,
    name: name.trim(),
    type: type as "WINTER" | "SUMMER",
    status: "DRAFT",
    startDate,
    endDate,
    createdAt: now,
    updatedAt: now,
  })

  return res.status(201).json({ id, slug })
}

import type { NextApiRequest, NextApiResponse } from "next"
import { eq } from "drizzle-orm"
import { requireAuth, requireAdmin } from "@/lib/permissions"
import { db } from "@/lib/db"
import { appContent } from "@/db/schema"
import {
  parseHowToContent,
  serializeHowToContent,
  EMPTY_HOW_TO,
  type HowToSection,
} from "@/lib/howToContent"
import { HOW_TO_KEY } from "@/lib/getHowToContent"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const user = await requireAuth({ req, res })
    if (!user) return

    const rows = await db
      .select({ data: appContent.data })
      .from(appContent)
      .where(eq(appContent.key, HOW_TO_KEY))
      .limit(1)
    const content = rows[0] ? parseHowToContent(rows[0].data) : EMPTY_HOW_TO
    return res.status(200).json(content)
  }

  if (req.method === "PUT") {
    const user = await requireAdmin({ req, res })
    if (!user) return

    const body = req.body ?? {}
    const rawSections = Array.isArray(body.sections) ? body.sections : null
    if (!rawSections) {
      return res.status(400).json({ error: "Pole 'sections' je povinné" })
    }

    const sections: HowToSection[] = []
    for (const s of rawSections) {
      if (!s || typeof s !== "object") {
        return res.status(400).json({ error: "Neplatný formát sekce" })
      }
      const title = typeof s.title === "string" ? s.title.trim() : ""
      const bodyText = typeof s.body === "string" ? s.body : ""
      if (!title) {
        return res.status(400).json({ error: "Název sekce je povinný" })
      }
      const id = typeof s.id === "string" && s.id ? s.id : crypto.randomUUID()
      sections.push({ id, title, body: bodyText })
    }

    const now = new Date()
    const data = serializeHowToContent({ sections })

    const existing = await db
      .select({ key: appContent.key })
      .from(appContent)
      .where(eq(appContent.key, HOW_TO_KEY))
      .limit(1)

    if (existing[0]) {
      await db
        .update(appContent)
        .set({ data, updatedAt: now, updatedBy: user.id })
        .where(eq(appContent.key, HOW_TO_KEY))
    } else {
      await db.insert(appContent).values({
        key: HOW_TO_KEY,
        data,
        updatedAt: now,
        updatedBy: user.id,
      })
    }

    return res.status(200).json({ sections })
  }

  return res.status(405).end()
}

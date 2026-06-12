import type { NextApiRequest, NextApiResponse } from "next"
import { and, eq } from "drizzle-orm"
import { requireAuth } from "@/lib/permissions"
import { db } from "@/lib/db"
import { challenges, enrollments } from "@/db/schema"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const user = await requireAuth({ req, res })
  if (!user) return

  const { challengeId } = req.body ?? {}

  if (!challengeId || typeof challengeId !== "string") {
    return res.status(400).json({ error: "ID výzvy je povinné" })
  }

  const challenge = await db
    .select({ id: challenges.id, status: challenges.status })
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .then((r) => r[0] ?? null)

  if (!challenge) return res.status(404).json({ error: "Výzva nenalezena" })

  if (challenge.status !== "ACTIVE") {
    return res.status(400).json({ error: "Registrace je možná pouze do aktivní výzvy" })
  }

  // Check duplicate enrollment
  const existing = await db
    .select({ userId: enrollments.userId })
    .from(enrollments)
    .where(and(eq(enrollments.userId, user.id), eq(enrollments.challengeId, challengeId)))
    .then((r) => r[0] ?? null)

  if (existing) {
    return res.status(409).json({ error: "Jste již zaregistrován/a" })
  }

  await db.insert(enrollments).values({
    userId: user.id,
    challengeId,
    enrolledAt: new Date(),
  })

  return res.status(201).json({ ok: true })
}

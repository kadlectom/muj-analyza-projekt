import type { NextApiRequest, NextApiResponse } from "next"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/permissions"
import { db } from "@/lib/db"
import { auditLog, users } from "@/db/schema"

export type AuditEntry = {
  id: string
  action: "CREATE" | "UPDATE" | "DELETE"
  actorId: string
  actorName: string
  actorAvatarUrl: string | null
  targetUserId: string | null
  targetUserName: string | null
  targetUserAvatarUrl: string | null
  diff: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }
  createdAt: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end()

  const user = await requireAuth({ req, res })
  if (!user) return

  const { id: challengeId } = req.query as { id: string }

  const actor = users
  const targetUser = {
    id: users.id,
    name: users.name,
    avatarUrl: users.avatarUrl,
  }

  // Fetch audit entries for this challenge, join actor and target user
  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      actorId: auditLog.actorId,
      actorName: actor.name,
      actorAvatarUrl: actor.avatarUrl,
      targetUserId: auditLog.targetUserId,
      diff: auditLog.diff,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .innerJoin(actor, eq(actor.id, auditLog.actorId))
    .where(eq(auditLog.challengeId, challengeId))
    .orderBy(auditLog.createdAt)
    .then((r) => r.reverse()) // newest first without desc() import

  // Batch-fetch target users
  const targetIds = [...new Set(rows.map((r) => r.targetUserId).filter(Boolean) as string[])]
  const targetMap = new Map<string, { name: string; avatarUrl: string | null }>()
  if (targetIds.length > 0) {
    const targets = await db
      .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .then((all) => all.filter((u) => targetIds.includes(u.id)))
    for (const t of targets) targetMap.set(t.id, { name: t.name, avatarUrl: t.avatarUrl })
  }

  const entries: AuditEntry[] = rows.map((row) => {
    const target = row.targetUserId ? targetMap.get(row.targetUserId) ?? null : null
    let diff: AuditEntry["diff"] = { before: null, after: null }
    try {
      if (row.diff) diff = JSON.parse(row.diff)
    } catch { /* malformed diff — show nothing */ }

    return {
      id: row.id,
      action: row.action,
      actorId: row.actorId,
      actorName: row.actorName,
      actorAvatarUrl: row.actorAvatarUrl,
      targetUserId: row.targetUserId,
      targetUserName: target?.name ?? null,
      targetUserAvatarUrl: target?.avatarUrl ?? null,
      diff,
      createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Number(row.createdAt),
    }
  })

  return res.status(200).json(entries)
}

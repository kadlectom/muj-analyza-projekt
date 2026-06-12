import { db } from "@/lib/db"
import { auditLog } from "@/db/schema"

type AuditAction = "CREATE" | "UPDATE" | "DELETE"
type AuditTarget = "activity" | "challenge" | "catalog" | "user"

export async function writeAuditLog({
  actorId,
  action,
  targetType,
  targetId,
  challengeId,
  targetUserId,
  before,
  after,
}: {
  actorId: string
  action: AuditAction
  targetType: AuditTarget
  targetId: string
  challengeId?: string
  targetUserId?: string
  before?: unknown
  after?: unknown
}) {
  await db.insert(auditLog).values({
    id:           crypto.randomUUID(),
    actorId,
    action,
    targetType,
    targetId,
    challengeId:  challengeId ?? null,
    targetUserId: targetUserId ?? null,
    diff:         JSON.stringify({ before: before ?? null, after: after ?? null }),
    createdAt:    new Date(),
  })
}

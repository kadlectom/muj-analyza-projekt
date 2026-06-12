import type { NextApiRequest, NextApiResponse } from "next"
import { eq } from "drizzle-orm"
import { requireAuth, isAdmin, isAdminIntervention } from "@/lib/permissions"
import { db } from "@/lib/db"
import { activities, activityCatalog, activityPartners, challenges, enrollments } from "@/db/schema"
import { calculatePoints } from "@/lib/calculatePoints"
import { writeAuditLog } from "@/lib/audit"
import { notifyPartnerTagged } from "@/lib/notifications/partnerTagged"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PATCH") return handlePatch(req, res)
  if (req.method === "DELETE") return handleDelete(req, res)
  return res.status(405).end()
}

// ── PATCH /api/activities/[id] ─────────────────────────────────────────────────

async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth({ req, res })
  if (!user) return

  const { id } = req.query as { id: string }

  const activity = await db
    .select()
    .from(activities)
    .where(eq(activities.id, id))
    .then((r) => r[0] ?? null)

  if (!activity) return res.status(404).json({ error: "Aktivita nenalezena" })

  // Check permissions: own activity or admin
  const isOwn = activity.userId === user.id
  if (!isOwn && !isAdmin(user.role)) {
    return res.status(403).json({ error: "Nedostatečná oprávnění" })
  }

  // Challenge must be ACTIVE
  const challenge = await db
    .select({ status: challenges.status, startDate: challenges.startDate, endDate: challenges.endDate })
    .from(challenges)
    .where(eq(challenges.id, activity.challengeId))
    .then((r) => r[0] ?? null)

  if (!challenge || challenge.status !== "ACTIVE") {
    return res.status(400).json({ error: "Aktivity lze upravovat pouze v aktivní výzvě" })
  }

  const { value, date, catalogItemId, note, partnerIds } = req.body ?? {}
  const updates: Record<string, unknown> = {}

  // Validate and collect field updates
  if (value !== undefined) {
    if (typeof value !== "number" || value <= 0) {
      return res.status(400).json({ error: "Hodnota musí být kladné číslo" })
    }
    updates.value = value
  }

  if (date !== undefined) {
    if (typeof date !== "string" || !DATE_RE.test(date)) {
      return res.status(400).json({ error: "Datum musí být ve formátu YYYY-MM-DD" })
    }
    if (date < challenge.startDate || date > challenge.endDate) {
      return res.status(400).json({ error: "Datum musí být v rozsahu výzvy" })
    }
    updates.date = date
  }

  if (catalogItemId !== undefined) {
    if (typeof catalogItemId !== "string") {
      return res.status(400).json({ error: "Neplatné catalogItemId" })
    }
    const item = await db
      .select({ id: activityCatalog.id, isActive: activityCatalog.isActive })
      .from(activityCatalog)
      .where(eq(activityCatalog.id, catalogItemId))
      .then((r) => r[0] ?? null)
    if (!item) return res.status(400).json({ error: "Aktivita z katalogu nenalezena" })
    if (!item.isActive) return res.status(400).json({ error: "Tato aktivita je neaktivní" })
    updates.catalogItemId = catalogItemId
  }

  if (note !== undefined) {
    updates.note = typeof note === "string" ? note.trim() || null : null
  }

  // Recalculate points if value or catalogItemId changed
  if (updates.value !== undefined || updates.catalogItemId !== undefined) {
    const finalCatalogId = (updates.catalogItemId as string) ?? activity.catalogItemId
    const catalogItem = await db
      .select({ pointsPerUnit: activityCatalog.pointsPerUnit, minValue: activityCatalog.minValue, unit: activityCatalog.unit })
      .from(activityCatalog)
      .where(eq(activityCatalog.id, finalCatalogId))
      .then((r) => r[0]!)
    const finalValue = (updates.value as number) ?? activity.value
    if (catalogItem.minValue !== null && finalValue < catalogItem.minValue) {
      return res.status(400).json({ error: `Minimální hodnota pro tuto aktivitu je ${catalogItem.minValue} ${catalogItem.unit}` })
    }
    updates.points = calculatePoints(finalValue, catalogItem.pointsPerUnit)
  }

  // Validate partner IDs before any writes
  let processPartners = false
  let rawPartnerIds: string[] = []

  if (Array.isArray(partnerIds)) {
    processPartners = true
    rawPartnerIds = partnerIds.filter((p): p is string => typeof p === "string")

    if (rawPartnerIds.includes(activity.userId)) {
      return res.status(400).json({ error: "Nemůžete označit vlastníka aktivity jako partnera" })
    }

    if (rawPartnerIds.length > 0) {
      const enrolled = await db
        .select({ userId: enrollments.userId })
        .from(enrollments)
        .where(eq(enrollments.challengeId, activity.challengeId))
        .then((rows) => new Set(rows.map((r) => r.userId)))

      const unenrolled = rawPartnerIds.filter((pid) => !enrolled.has(pid))
      if (unenrolled.length > 0) {
        return res.status(400).json({ error: "Někteří partneři nejsou zaregistrováni v této výzvě" })
      }
    }
  }

  if (Object.keys(updates).length === 0 && !processPartners) {
    return res.status(400).json({ error: "Žádné změny k uložení" })
  }

  if (Object.keys(updates).length > 0) {
    await db.update(activities).set(updates).where(eq(activities.id, id))
  }

  let newlyAddedPartners: string[] = []

  if (processPartners) {
    // Snapshot existing partners before the replace so we can DM only the
    // brand-new ones — re-adding someone who was already tagged should not
    // re-fire a notification.
    const existing = await db
      .select({ userId: activityPartners.userId })
      .from(activityPartners)
      .where(eq(activityPartners.activityId, id))
      .then((rows) => new Set(rows.map((r) => r.userId)))

    newlyAddedPartners = rawPartnerIds.filter((pid) => !existing.has(pid))

    await db.delete(activityPartners).where(eq(activityPartners.activityId, id))
    if (rawPartnerIds.length > 0) {
      await db.insert(activityPartners).values(
        rawPartnerIds.map((partnerId) => ({ activityId: id, userId: partnerId }))
      )
    }
  }

  if (newlyAddedPartners.length > 0) {
    await notifyPartnerTagged({
      activityId:     id,
      partnerUserIds: newlyAddedPartners,
      challengeId:    activity.challengeId,
      actorUserId:    user.id,
    })
  }

  // Audit log for admin intervention
  if (isAdminIntervention(user.id, activity.userId)) {
    const afterData: Record<string, unknown> = { ...updates }
    if (processPartners) afterData.partnerIds = rawPartnerIds
    await writeAuditLog({
      actorId: user.id,
      action: "UPDATE",
      targetType: "activity",
      targetId: id,
      challengeId: activity.challengeId,
      targetUserId: activity.userId,
      before: { value: activity.value, date: activity.date, catalogItemId: activity.catalogItemId, note: activity.note, points: activity.points },
      after: afterData,
    })
  }

  return res.status(200).json({ ok: true, points: (updates.points as number) ?? activity.points })
}

// ── DELETE /api/activities/[id] ────────────────────────────────────────────────

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth({ req, res })
  if (!user) return

  const { id } = req.query as { id: string }

  const activity = await db
    .select()
    .from(activities)
    .where(eq(activities.id, id))
    .then((r) => r[0] ?? null)

  if (!activity) return res.status(404).json({ error: "Aktivita nenalezena" })

  const isOwn = activity.userId === user.id
  if (!isOwn && !isAdmin(user.role)) {
    return res.status(403).json({ error: "Nedostatečná oprávnění" })
  }

  // Challenge must be ACTIVE
  const challenge = await db
    .select({ status: challenges.status })
    .from(challenges)
    .where(eq(challenges.id, activity.challengeId))
    .then((r) => r[0] ?? null)

  if (!challenge || challenge.status !== "ACTIVE") {
    return res.status(400).json({ error: "Aktivity lze mazat pouze v aktivní výzvě" })
  }

  // activity_partners.activityId references activities.id without ON DELETE CASCADE,
  // so the join rows must be removed first or the parent delete fails with a FK error.
  await db.delete(activityPartners).where(eq(activityPartners.activityId, id))
  await db.delete(activities).where(eq(activities.id, id))

  // Audit log for admin intervention
  if (isAdminIntervention(user.id, activity.userId)) {
    await writeAuditLog({
      actorId: user.id,
      action: "DELETE",
      targetType: "activity",
      targetId: id,
      challengeId: activity.challengeId,
      targetUserId: activity.userId,
      before: { value: activity.value, date: activity.date, catalogItemId: activity.catalogItemId, note: activity.note, points: activity.points },
    })
  }

  return res.status(200).json({ ok: true })
}

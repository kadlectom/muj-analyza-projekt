import type { NextApiRequest, NextApiResponse } from "next"
import { and, eq, desc, inArray } from "drizzle-orm"
import { requireAuth, isAdmin } from "@/lib/permissions"
import { db } from "@/lib/db"
import { activities, activityCatalog, activityPartners, challenges, enrollments, users } from "@/db/schema"
import { calculatePoints } from "@/lib/calculatePoints"
import { evaluateBonuses } from "@/lib/evaluateBonuses"
import { notifyPartnerTagged } from "@/lib/notifications/partnerTagged"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return handleGet(req, res)
  if (req.method === "POST") return handlePost(req, res)
  return res.status(405).end()
}

// ── GET /api/activities?challengeId=X ──────────────────────────────────────────

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth({ req, res })
  if (!user) return

  const challengeId = req.query.challengeId as string | undefined
  if (!challengeId) return res.status(400).json({ error: "challengeId je povinné" })

  const admin = isAdmin(user.role)

  const challengeRow = await db
    .select({ partnerBonus: challenges.partnerBonus })
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .then((r) => r[0] ?? null)
  const partnerBonusKm = challengeRow?.partnerBonus ?? 0

  if (admin) {
    const rows = await db
      .select({
        id: activities.id,
        userId: activities.userId,
        userName: users.name,
        userAvatarUrl: users.avatarUrl,
        catalogItemId: activities.catalogItemId,
        catalogName: activityCatalog.name,
        catalogEmoji: activityCatalog.emoji,
        catalogUnit: activityCatalog.unit,
        value: activities.value,
        points: activities.points,
        date: activities.date,
        note: activities.note,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .innerJoin(activityCatalog, eq(activities.catalogItemId, activityCatalog.id))
      .innerJoin(users, eq(activities.userId, users.id))
      .where(eq(activities.challengeId, challengeId))
      .orderBy(desc(activities.date), desc(activities.createdAt))

    const activityIds = rows.map((r) => r.id)
    const partnerMap = await fetchPartners(activityIds)
    return res.status(200).json(rows.map((r) => {
      const partners = partnerMap.get(r.id) ?? []
      return {
        ...r,
        createdAt: r.createdAt.getTime(),
        partners,
        partnerBonus: partners.length > 0 ? partnerBonusKm : 0,
      }
    }))
  }

  const rows = await db
    .select({
      id: activities.id,
      userId: activities.userId,
      catalogItemId: activities.catalogItemId,
      catalogName: activityCatalog.name,
      catalogEmoji: activityCatalog.emoji,
      catalogUnit: activityCatalog.unit,
      value: activities.value,
      points: activities.points,
      date: activities.date,
      note: activities.note,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .innerJoin(activityCatalog, eq(activities.catalogItemId, activityCatalog.id))
    .where(and(eq(activities.challengeId, challengeId), eq(activities.userId, user.id)))
    .orderBy(desc(activities.date), desc(activities.createdAt))

  const activityIds = rows.map((r) => r.id)
  const partnerMap = await fetchPartners(activityIds)
  const ownEntries = rows.map((r) => {
    const partners = partnerMap.get(r.id) ?? []
    return {
      ...r,
      createdAt: r.createdAt.getTime(),
      partners,
      partnerBonus: partners.length > 0 ? partnerBonusKm : 0,
      viaPartner: null as null | { id: string; name: string },
    }
  })

  // Also fetch activities where current user was tagged as partner
  const creditedRows = await db
    .select({
      id: activities.id,
      userId: activities.userId,
      catalogItemId: activities.catalogItemId,
      catalogName: activityCatalog.name,
      catalogEmoji: activityCatalog.emoji,
      catalogUnit: activityCatalog.unit,
      value: activities.value,
      points: activities.points,
      date: activities.date,
      note: activities.note,
      createdAt: activities.createdAt,
      actorId: activities.userId,
      actorName: users.name,
    })
    .from(activityPartners)
    .innerJoin(activities, eq(activityPartners.activityId, activities.id))
    .innerJoin(activityCatalog, eq(activities.catalogItemId, activityCatalog.id))
    .innerJoin(users, eq(activities.userId, users.id))
    .where(and(eq(activityPartners.userId, user.id), eq(activities.challengeId, challengeId)))

  // Credited rows: tagged partner is credited with the actor's full points plus the partner
  // bonus — same total as the actor (matches what the leaderboard sums).
  const creditedEntries = creditedRows.map((r) => ({
    id: r.id,
    userId: r.userId,
    catalogItemId: r.catalogItemId,
    catalogName: r.catalogName,
    catalogEmoji: r.catalogEmoji,
    catalogUnit: r.catalogUnit,
    value: r.value,
    points: r.points,
    partnerBonus: partnerBonusKm,
    date: r.date,
    note: r.note,
    createdAt: r.createdAt.getTime(),
    partners: [] as { id: string; name: string }[],
    viaPartner: { id: r.actorId, name: r.actorName },
  }))

  const merged = [...ownEntries, ...creditedEntries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)

  return res.status(200).json(merged)
}

// ── POST /api/activities ───────────────────────────────────────────────────────

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth({ req, res })
  if (!user) return

  const { challengeId, catalogItemId, value, date, note, partnerIds, ignoreDuplicateWarning } = req.body ?? {}

  const rawPartnerIds: string[] =
    Array.isArray(partnerIds) ? partnerIds.filter((p): p is string => typeof p === "string") : []

  // Validate required fields
  if (!challengeId || typeof challengeId !== "string") {
    return res.status(400).json({ error: "challengeId je povinné" })
  }
  if (!catalogItemId || typeof catalogItemId !== "string") {
    return res.status(400).json({ error: "catalogItemId je povinné" })
  }
  if (typeof value !== "number" || value <= 0) {
    return res.status(400).json({ error: "Hodnota musí být kladné číslo" })
  }
  if (!date || typeof date !== "string" || !DATE_RE.test(date)) {
    return res.status(400).json({ error: "Datum musí být ve formátu YYYY-MM-DD" })
  }

  // Partner IDs must not include the actor
  if (rawPartnerIds.includes(user.id)) {
    return res.status(400).json({ error: "Nemůžete označit sami sebe jako partnera" })
  }

  // Challenge must exist and be ACTIVE
  const challenge = await db
    .select({ id: challenges.id, status: challenges.status, startDate: challenges.startDate, endDate: challenges.endDate })
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .then((r) => r[0] ?? null)

  if (!challenge) return res.status(404).json({ error: "Výzva nenalezena" })
  if (challenge.status !== "ACTIVE") {
    return res.status(400).json({ error: "Aktivity lze zapisovat pouze do aktivní výzvy" })
  }

  // Date must be within challenge range and not in the future
  const today = new Date().toISOString().slice(0, 10)
  if (date < challenge.startDate || date > challenge.endDate) {
    return res.status(400).json({ error: "Datum musí být v rozsahu výzvy" })
  }
  if (date > today) {
    return res.status(400).json({ error: "Aktivitu nelze zapsat do budoucna" })
  }

  // User must be enrolled
  const enrollment = await db
    .select({ userId: enrollments.userId })
    .from(enrollments)
    .where(and(eq(enrollments.userId, user.id), eq(enrollments.challengeId, challengeId)))
    .then((r) => r[0] ?? null)

  if (!enrollment) {
    return res.status(400).json({ error: "Musíte být zaregistrován/a do výzvy" })
  }

  // Catalog item must exist and be active
  const catalogItem = await db
    .select({ id: activityCatalog.id, pointsPerUnit: activityCatalog.pointsPerUnit, isActive: activityCatalog.isActive, minValue: activityCatalog.minValue, unit: activityCatalog.unit })
    .from(activityCatalog)
    .where(eq(activityCatalog.id, catalogItemId))
    .then((r) => r[0] ?? null)

  if (!catalogItem) return res.status(400).json({ error: "Aktivita z katalogu nenalezena" })
  if (!catalogItem.isActive) return res.status(400).json({ error: "Tato aktivita je neaktivní" })
  if (catalogItem.minValue !== null && value < catalogItem.minValue) {
    return res.status(400).json({ error: `Minimální hodnota pro tuto aktivitu je ${catalogItem.minValue} ${catalogItem.unit}` })
  }

  // Each partner must be enrolled in the challenge
  if (rawPartnerIds.length > 0) {
    const partnerEnrollments = await db
      .select({ userId: enrollments.userId })
      .from(enrollments)
      .where(and(eq(enrollments.challengeId, challengeId)))
      .then((rows) => new Set(rows.map((r) => r.userId)))

    const unenrolled = rawPartnerIds.filter((pid) => !partnerEnrollments.has(pid))
    if (unenrolled.length > 0) {
      return res.status(400).json({ error: "Některý z partnerů není zaregistrován v této výzvě" })
    }
  }

  // Warn if this user was already credited as a partner for the same activity on the same date
  if (!ignoreDuplicateWarning) {
    const alreadyTagged = await db
      .select({ activityId: activityPartners.activityId })
      .from(activityPartners)
      .innerJoin(activities, eq(activityPartners.activityId, activities.id))
      .where(and(
        eq(activityPartners.userId, user.id),
        eq(activities.challengeId, challengeId),
        eq(activities.catalogItemId, catalogItemId),
        eq(activities.date, date),
      ))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (alreadyTagged) {
      return res.status(200).json({ warning: "duplicate_partner" })
    }
  }

  const points = calculatePoints(value, catalogItem.pointsPerUnit)
  const id = crypto.randomUUID()

  await db.insert(activities).values({
    id,
    userId: user.id,
    challengeId,
    catalogItemId,
    value,
    points,
    date,
    note: note && typeof note === "string" ? note.trim() || null : null,
    createdAt: new Date(),
    createdById: user.id,
  })

  if (rawPartnerIds.length > 0) {
    await db.insert(activityPartners).values(
      rawPartnerIds.map((partnerId) => ({ activityId: id, userId: partnerId }))
    )

    await notifyPartnerTagged({
      activityId:     id,
      partnerUserIds: rawPartnerIds,
      challengeId,
      actorUserId:    user.id,
    })
  }

  const newlyEarnedBonuses = await evaluateBonuses(user.id, challengeId)

  return res.status(201).json({ id, points, newlyEarnedBonuses })
}

// ── Shared helper ─────────────────────────────────────────────────────────────

async function fetchPartners(activityIds: string[]): Promise<Map<string, { id: string; name: string }[]>> {
  if (activityIds.length === 0) return new Map()
  const rows = await db
    .select({ activityId: activityPartners.activityId, userId: users.id, name: users.name })
    .from(activityPartners)
    .innerJoin(users, eq(activityPartners.userId, users.id))
    .where(inArray(activityPartners.activityId, activityIds))
  const map = new Map<string, { id: string; name: string }[]>()
  for (const r of rows) {
    const list = map.get(r.activityId) ?? []
    list.push({ id: r.userId, name: r.name })
    map.set(r.activityId, list)
  }
  return map
}

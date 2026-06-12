import { eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { activities, activityCatalog, challenges, notificationLog, users } from "@/db/schema"
import { sendSlackDM } from "@/lib/slack"
import { formatPartnerTaggedMessage } from "@/lib/notifications/format"

const NOTIFICATION_TYPE = "partner_tagged"

type Args = {
  activityId:     string
  partnerUserIds: string[] // recipients (only newly added — caller computes the delta on edit)
  challengeId:    string
  actorUserId:    string
}

// Sends a DM to each newly tagged partner. Never throws — Slack failures and
// missing tokens are logged and swallowed so the calling API handler stays
// happy. Idempotent via notification_log unique constraint.
export async function notifyPartnerTagged(args: Args): Promise<void> {
  if (args.partnerUserIds.length === 0) return

  try {
    const context = await loadContext(args)
    if (!context) return

    const challengeUrl = buildChallengeUrl(context.challengeSlug, args.challengeId)

    const message = formatPartnerTaggedMessage({
      actorName:    context.actorName,
      activityName: context.catalogName,
      unit:         context.catalogUnit,
      value:        context.value,
      pointsTotal:  context.points + context.partnerBonus,
      challengeUrl,
    })

    await Promise.allSettled(
      context.recipients.map((recipient) => deliver(recipient, args.activityId, message)),
    )
  } catch (err) {
    console.error("[notify:partnerTagged] unexpected", err)
  }
}

type Recipient = { userId: string; slackId: string }

type Context = {
  actorName:      string
  catalogName:    string
  catalogUnit:    string
  value:          number
  points:         number
  partnerBonus:   number
  challengeSlug:  string | null
  recipients:     Recipient[]
}

async function loadContext(args: Args): Promise<Context | null> {
  const [actor, activityRow, recipients] = await Promise.all([
    db.select({ name: users.name }).from(users).where(eq(users.id, args.actorUserId)).then((r) => r[0] ?? null),
    db
      .select({
        value:        activities.value,
        points:       activities.points,
        catalogName:  activityCatalog.name,
        catalogUnit:  activityCatalog.unit,
        partnerBonus: challenges.partnerBonus,
        challengeSlug: challenges.slug,
      })
      .from(activities)
      .innerJoin(activityCatalog, eq(activities.catalogItemId, activityCatalog.id))
      .innerJoin(challenges, eq(activities.challengeId, challenges.id))
      .where(eq(activities.id, args.activityId))
      .then((r) => r[0] ?? null),
    db
      .select({ userId: users.id, slackId: users.slackId })
      .from(users)
      .where(inArray(users.id, args.partnerUserIds)),
  ])

  if (!actor || !activityRow) {
    console.warn("[notify:partnerTagged] missing actor or activity row", { args })
    return null
  }

  const validRecipients = recipients.filter((r) => Boolean(r.slackId))
  if (validRecipients.length === 0) return null

  return {
    actorName:     actor.name,
    catalogName:   activityRow.catalogName,
    catalogUnit:   activityRow.catalogUnit,
    value:         activityRow.value,
    points:        activityRow.points,
    partnerBonus:  activityRow.partnerBonus ?? 0,
    challengeSlug: activityRow.challengeSlug,
    recipients:    validRecipients,
  }
}

async function deliver(recipient: Recipient, activityId: string, message: string): Promise<void> {
  // Insert the log row first; the unique (type, ref_id, user_id) index makes
  // this our idempotency check. If it throws on conflict, we silently skip —
  // the message has already been sent on a previous call.
  try {
    await db.insert(notificationLog).values({
      id:     crypto.randomUUID(),
      type:   NOTIFICATION_TYPE,
      refId:  activityId,
      userId: recipient.userId,
      sentAt: new Date(),
    })
  } catch {
    return
  }

  const result = await sendSlackDM(recipient.slackId, message)
  if (!result.ok) {
    console.warn("[notify:partnerTagged] slack failed", {
      activityId,
      recipientUserId: recipient.userId,
      error: result.error,
    })
  }
}

function buildChallengeUrl(slug: string | null, id: string): string {
  const base = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")
  return `${base}/challenges/${slug ?? id}`
}

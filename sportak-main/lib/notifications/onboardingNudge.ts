import { and, eq, inArray, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { activities, challenges, enrollments, notificationLog, users } from "@/db/schema"
import { sendSlackDM } from "@/lib/slack"
import { formatOnboardingNudgeMessage } from "@/lib/notifications/format"

const NOTIFICATION_TYPE = "onboarding_nudge"
const MIN_AGE_DAYS = 3 // nudge sent no earlier than 3 days after enrolment
const MAX_AGE_DAYS = 7 // ...and no later than 7 days (catches missed cron runs)

type NudgeResult = {
  attempted: number  // candidates matched by the SQL filter
  sent:      number  // Slack call returned ok
  skipped:   number  // already notified, or had activity, or insert raced
  failed:    number  // Slack call returned error
  reason?:   string  // global skip reason
}

// Daily cron — DMs each user who enrolled in an ACTIVE challenge 3–7 days ago
// and still has zero activities. Idempotent via notification_log
// (1× per (user, challenge) for the entire challenge lifetime).
//
// Never throws — broadcast failures must not break the cron run.
export async function notifyOnboardingNudge(): Promise<NudgeResult> {
  const result: NudgeResult = { attempted: 0, sent: 0, skipped: 0, failed: 0 }

  try {
    const now = new Date()
    const minAge = new Date(now.getTime() - MAX_AGE_DAYS * 86_400_000) // oldest acceptable enrolledAt
    const maxAge = new Date(now.getTime() - MIN_AGE_DAYS * 86_400_000) // newest acceptable enrolledAt

    // Step 1 — candidates: enrolment in ACTIVE challenge, aged 3–7 days.
    const candidates = await db
      .select({
        userId:        users.id,
        slackId:       users.slackId,
        challengeId:   challenges.id,
        challengeName: challenges.name,
        challengeSlug: challenges.slug,
      })
      .from(enrollments)
      .innerJoin(users,      eq(enrollments.userId, users.id))
      .innerJoin(challenges, eq(enrollments.challengeId, challenges.id))
      .where(and(
        eq(challenges.status, "ACTIVE"),
        sql`${enrollments.enrolledAt} >= ${minAge}`,
        sql`${enrollments.enrolledAt} <= ${maxAge}`,
      ))

    if (candidates.length === 0) {
      result.reason = "no_candidates"
      return result
    }

    result.attempted = candidates.length

    // Step 2 — drop candidates that already have at least one activity.
    const userIds      = Array.from(new Set(candidates.map((c) => c.userId)))
    const challengeIds = Array.from(new Set(candidates.map((c) => c.challengeId)))

    const haveActivityRows = await db
      .select({
        userId:      activities.userId,
        challengeId: activities.challengeId,
      })
      .from(activities)
      .where(and(
        inArray(activities.userId, userIds),
        inArray(activities.challengeId, challengeIds),
      ))
      .groupBy(activities.userId, activities.challengeId)
    const haveActivity = new Set(haveActivityRows.map((r) => `${r.userId}|${r.challengeId}`))

    // Step 3 — drop candidates already DM'd (idempotency check).
    const refIds = candidates.map((c) => `${c.userId}:${c.challengeId}`)
    const sentRows = await db
      .select({ refId: notificationLog.refId })
      .from(notificationLog)
      .where(and(
        eq(notificationLog.type, NOTIFICATION_TYPE),
        inArray(notificationLog.refId, refIds),
      ))
    const alreadySent = new Set(sentRows.map((r) => r.refId))

    const base = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")

    // Step 4 — deliver to the survivors.
    for (const c of candidates) {
      if (haveActivity.has(`${c.userId}|${c.challengeId}`)) {
        result.skipped += 1
        continue
      }
      const refId = `${c.userId}:${c.challengeId}`
      if (alreadySent.has(refId)) {
        result.skipped += 1
        continue
      }

      // Log-first idempotency. Concurrent cron runs hit the unique constraint
      // and we silently skip — the other run will deliver.
      try {
        await db.insert(notificationLog).values({
          id:     crypto.randomUUID(),
          type:   NOTIFICATION_TYPE,
          refId,
          userId: c.userId,
          sentAt: new Date(),
        })
      } catch {
        result.skipped += 1
        continue
      }

      const message = formatOnboardingNudgeMessage({
        challengeName: c.challengeName,
        challengeUrl:  `${base}/challenges/${c.challengeSlug ?? c.challengeId}`,
      })

      const slack = await sendSlackDM(c.slackId, message)
      if (slack.ok) {
        result.sent += 1
      } else {
        result.failed += 1
        console.warn("[notify:onboardingNudge] slack failed", {
          userId:      c.userId,
          challengeId: c.challengeId,
          error:       slack.error,
        })
      }
    }
  } catch (err) {
    console.error("[notify:onboardingNudge] unexpected", err)
  }

  return result
}

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { challenges, notificationLog } from "@/db/schema"
import { sendSlackChannel } from "@/lib/slack"
import { getWeeklyStats, shiftIso } from "@/lib/weeklyStats"
import { selectTemplate, renderTemplate } from "@/lib/notifications/weeklyTemplate"
import { currentIsoWeek, isoWeekParts } from "@/lib/isoWeek"

const NOTIFICATION_TYPE = "weekly_summary"
const WINDOW_DAYS = 7

type WeeklySummaryResult = {
  attempted: number  // active challenges considered
  sent:      number  // Slack call succeeded
  skipped:   number  // no activity, already sent, or no SLACK_CHANNEL_ID
  failed:    number  // Slack call failed
  reason?:   string  // global skip reason if attempted = 0
}

// Sends one channel message per ACTIVE challenge summarising the past 7 days.
// Idempotent via notification_log (one row per challenge × ISO week).
// Never throws — broadcast notifications must not break the cron run.
export async function notifyWeeklySummary(): Promise<WeeklySummaryResult> {
  const result: WeeklySummaryResult = { attempted: 0, sent: 0, skipped: 0, failed: 0 }

  const channelId = process.env.SLACK_CHANNEL_ID
  if (!channelId) {
    console.warn("[notify:weeklySummary] SLACK_CHANNEL_ID not configured — skipping")
    result.reason = "no_channel"
    return result
  }

  try {
    const activeChallenges = await db
      .select({ id: challenges.id, name: challenges.name, startDate: challenges.startDate, endDate: challenges.endDate })
      .from(challenges)
      .where(eq(challenges.status, "ACTIVE"))

    if (activeChallenges.length === 0) {
      result.reason = "no_active_challenge"
      return result
    }

    const now = new Date()
    const todayIso = now.toISOString().slice(0, 10)
    const isoWeek = currentIsoWeek(now)
    const [, weekNumber] = isoWeekParts(now)

    for (const ch of activeChallenges) {
      result.attempted += 1

      // Rolling 7-day window, clamped to challenge.startDate for the very first week.
      const naturalFromIso = shiftIso(todayIso, -(WINDOW_DAYS - 1))
      const fromIso = naturalFromIso < ch.startDate ? ch.startDate : naturalFromIso
      const toIso   = todayIso

      const stats = await getWeeklyStats({
        challengeId:  ch.id,
        startDateIso: ch.startDate,
        endDateIso:   ch.endDate,
        fromIso,
        toIso,
        todayIso,
      })

      if (stats.activityCount === 0) {
        result.skipped += 1
        continue
      }

      const templateId = selectTemplate(stats, weekNumber)
      const message = renderTemplate(templateId, ch.name, stats)

      // Log-first idempotency. refId binds (challenge, isoWeek) so a re-run is a no-op.
      const refId = `${ch.id}:${isoWeek}`
      try {
        await db.insert(notificationLog).values({
          id:     crypto.randomUUID(),
          type:   NOTIFICATION_TYPE,
          refId,
          userId: null,
          sentAt: new Date(),
        })
      } catch {
        result.skipped += 1
        continue
      }

      const slack = await sendSlackChannel(channelId, message)
      if (slack.ok) {
        result.sent += 1
      } else {
        result.failed += 1
        console.warn("[notify:weeklySummary] slack failed", {
          challengeId: ch.id,
          templateId,
          error: slack.error,
        })
      }
    }
  } catch (err) {
    console.error("[notify:weeklySummary] unexpected", err)
  }

  return result
}

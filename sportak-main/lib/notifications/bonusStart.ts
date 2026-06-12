import { and, eq, inArray, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { activityCatalog, bonusRules, challenges, notificationLog } from "@/db/schema"
import { sendSlackChannel } from "@/lib/slack"
import { formatBonusStartMessage } from "@/lib/notifications/format"

const NOTIFICATION_TYPE = "bonus_start"

type BonusStartResult = {
  attempted: number  // how many rules matched the window/active filter
  sent:      number  // how many made it through to a successful Slack call
  skipped:   number  // already in notification_log (idempotent skip)
  failed:    number  // logged but Slack returned an error
}

// Finds bonus rules whose window starts today in an ACTIVE challenge and posts
// one channel message per rule. Idempotent via notification_log — re-running on
// the same day is a no-op. Designed for daily cron at ~8:30 local.
//
// Never throws — channel-broadcast notifications must not break the cron run.
export async function notifyBonusStart(): Promise<BonusStartResult> {
  const result: BonusStartResult = { attempted: 0, sent: 0, skipped: 0, failed: 0 }

  const channelId = process.env.SLACK_CHANNEL_ID
  if (!channelId) {
    console.warn("[notify:bonusStart] SLACK_CHANNEL_ID not configured — skipping")
    return result
  }

  try {
    const today = new Date().toISOString().slice(0, 10)

    // Already-sent rule IDs for today (idempotency). refId == bonusRule.id.
    const alreadySent = await db
      .select({ refId: notificationLog.refId })
      .from(notificationLog)
      .where(and(eq(notificationLog.type, NOTIFICATION_TYPE), isNull(notificationLog.userId)))
    const sentSet = new Set(alreadySent.map((r) => r.refId))

    // Today's starting rules in ACTIVE challenges, joined with challenge name + (optional) catalog item.
    const rows = await db
      .select({
        ruleId:         bonusRules.id,
        ruleName:       bonusRules.name,
        conditionType:  bonusRules.conditionType,
        threshold:      bonusRules.threshold,
        catalogItemIds: bonusRules.catalogItemIds,
        windowStart:    bonusRules.windowStart,
        windowEnd:      bonusRules.windowEnd,
        daysOfWeek:     bonusRules.daysOfWeek,
        bonusPoints:    bonusRules.bonusPoints,
        challengeId:    bonusRules.challengeId,
        challengeName:  challenges.name,
        challengeSlug:  challenges.slug,
      })
      .from(bonusRules)
      .innerJoin(challenges, eq(bonusRules.challengeId, challenges.id))
      .where(and(eq(bonusRules.windowStart, today), eq(challenges.status, "ACTIVE")))

    const pending = rows.filter((r) => !sentSet.has(r.ruleId))
    result.attempted = pending.length
    result.skipped = rows.length - pending.length

    if (pending.length === 0) return result

    // Catalog names for any rule that filters by catalog item.
    const allCatalogIds = new Set<string>()
    for (const r of pending) {
      if (!r.catalogItemIds) continue
      try {
        for (const id of JSON.parse(r.catalogItemIds) as string[]) allCatalogIds.add(id)
      } catch { /* malformed JSON — skip */ }
    }
    const catalogNameMap = new Map<string, string>()
    if (allCatalogIds.size > 0) {
      const catalogRows = await db
        .select({ id: activityCatalog.id, name: activityCatalog.name })
        .from(activityCatalog)
        .where(inArray(activityCatalog.id, Array.from(allCatalogIds)))
      for (const c of catalogRows) catalogNameMap.set(c.id, c.name)
    }

    const base = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")

    for (const r of pending) {
      const catalogItemNames = r.catalogItemIds
        ? (() => {
            try {
              return (JSON.parse(r.catalogItemIds!) as string[]).map((id) => catalogNameMap.get(id) ?? id)
            } catch {
              return null
            }
          })()
        : null

      const daysOfWeek = r.daysOfWeek
        ? (() => {
            try { return JSON.parse(r.daysOfWeek!) as number[] } catch { return null }
          })()
        : null

      const message = formatBonusStartMessage({
        challengeName: r.challengeName,
        challengeUrl:  `${base}/challenges/${r.challengeSlug ?? r.challengeId}`,
        ruleName:      r.ruleName,
        bonusPoints:   r.bonusPoints,
        condition: {
          conditionType: r.conditionType,
          threshold:     r.threshold,
          catalogItemNames,
          windowStart:   r.windowStart,
          windowEnd:     r.windowEnd,
          daysOfWeek,
        },
      })

      // Log-first idempotency. If the insert conflicts (e.g. concurrent cron run),
      // skip silently — the other run will deliver.
      try {
        await db.insert(notificationLog).values({
          id:     crypto.randomUUID(),
          type:   NOTIFICATION_TYPE,
          refId:  r.ruleId,
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
        console.warn("[notify:bonusStart] slack failed", { ruleId: r.ruleId, error: slack.error })
      }
    }
  } catch (err) {
    console.error("[notify:bonusStart] unexpected", err)
  }

  return result
}

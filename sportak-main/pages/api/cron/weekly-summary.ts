import type { NextApiRequest, NextApiResponse } from "next"
import { assertCronAuth } from "@/lib/cronAuth"
import { notifyWeeklySummary } from "@/lib/notifications/weeklySummary"
import { isPragueHour } from "@/lib/pragueTime"

// Weekly cron — Friday afternoon summary into the shared channel.
// Schedule defined in vercel.json: two Friday entries (12:00 + 13:00 UTC).
// Only the one that lands at 14:00 Prague-local actually delivers.
// Trigger manually with:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        -H "X-Manual-Trigger: 1" \
//        https://<host>/api/cron/weekly-summary
const PRAGUE_HOUR = 14

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!assertCronAuth(req, res)) return

  const manualTrigger = req.headers["x-manual-trigger"] === "1"
  if (!manualTrigger && !isPragueHour(PRAGUE_HOUR)) {
    return res.status(200).json({ ok: true, skipped: "outside_prague_window" })
  }

  const result = await notifyWeeklySummary()
  res.status(200).json({ ok: true, ...result })
}

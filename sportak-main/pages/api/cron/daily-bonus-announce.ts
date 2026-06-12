import type { NextApiRequest, NextApiResponse } from "next"
import { assertCronAuth } from "@/lib/cronAuth"
import { notifyBonusStart } from "@/lib/notifications/bonusStart"
import { isPragueHour } from "@/lib/pragueTime"

// Daily cron — announces bonus rules whose window starts today.
// Schedule defined in vercel.json: two entries (07:00 + 08:00 UTC). Only the
// one that lands at 09:00 Prague-local actually runs; the other no-ops.
// Trigger manually with:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        https://<host>/api/cron/daily-bonus-announce
const PRAGUE_HOUR = 9

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!assertCronAuth(req, res)) return

  // Skip gating when triggered manually so curl-based tests deliver immediately.
  const manualTrigger = req.headers["x-manual-trigger"] === "1"
  if (!manualTrigger && !isPragueHour(PRAGUE_HOUR)) {
    return res.status(200).json({ ok: true, skipped: "outside_prague_window" })
  }

  const result = await notifyBonusStart()
  res.status(200).json({ ok: true, ...result })
}

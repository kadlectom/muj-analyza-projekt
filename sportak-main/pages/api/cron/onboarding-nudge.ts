import type { NextApiRequest, NextApiResponse } from "next"
import { assertCronAuth } from "@/lib/cronAuth"
import { notifyOnboardingNudge } from "@/lib/notifications/onboardingNudge"
import { isPragueHour } from "@/lib/pragueTime"

// Daily cron — DMs users who joined an ACTIVE challenge 3–7 days ago and
// haven't logged a single activity yet. Schedule defined in vercel.json:
// two entries (08:00 + 09:00 UTC). Only the one that lands at 10:00 Prague-
// local actually delivers. Trigger manually with:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        -H "X-Manual-Trigger: 1" \
//        https://<host>/api/cron/onboarding-nudge
const PRAGUE_HOUR = 10

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!assertCronAuth(req, res)) return

  const manualTrigger = req.headers["x-manual-trigger"] === "1"
  if (!manualTrigger && !isPragueHour(PRAGUE_HOUR)) {
    return res.status(200).json({ ok: true, skipped: "outside_prague_window" })
  }

  const result = await notifyOnboardingNudge()
  res.status(200).json({ ok: true, ...result })
}

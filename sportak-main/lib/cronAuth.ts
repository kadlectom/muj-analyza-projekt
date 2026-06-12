import type { NextApiRequest, NextApiResponse } from "next"

// Vercel cron jobs hit the endpoint with `Authorization: Bearer $CRON_SECRET`.
// Returns true if the request is authorized; otherwise sends a 401 and returns
// false (caller should just `return`).
export function assertCronAuth(req: NextApiRequest, res: NextApiResponse): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    res.status(500).json({ error: "CRON_SECRET not configured" })
    return false
  }

  const header = req.headers.authorization ?? ""
  if (header !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Unauthorized" })
    return false
  }

  return true
}

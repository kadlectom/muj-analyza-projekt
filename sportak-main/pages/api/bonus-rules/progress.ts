import type { NextApiRequest, NextApiResponse } from "next"
import { requireAuth } from "@/lib/permissions"
import { buildBonusRulesProgress } from "@/lib/bonusProgress"

// GET /api/bonus-rules/progress?challengeId=X
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end()

  const user = await requireAuth({ req, res })
  if (!user) return

  const challengeId = req.query.challengeId as string | undefined
  if (!challengeId) return res.status(400).json({ error: "challengeId je povinné" })

  const progress = await buildBonusRulesProgress(challengeId, user.id)
  return res.status(200).json(progress)
}

import type { NextApiRequest, NextApiResponse } from "next"
import { requireAuth } from "@/lib/permissions"
import { buildBatchLeaderboard } from "@/lib/leaderboardCalc"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end()

  const user = await requireAuth({ req, res })
  if (!user) return

  const raw = req.query.challengeIds as string | undefined
  if (!raw) return res.status(400).json({ error: "challengeIds je povinné" })

  const challengeIds = raw.split(",").map(s => s.trim()).filter(Boolean)
  if (challengeIds.length === 0) return res.status(400).json({ error: "challengeIds je prázdné" })

  const topN = Number(req.query.topN ?? 3)

  const data = await buildBatchLeaderboard(challengeIds, topN)

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60")
  return res.status(200).json(data)
}

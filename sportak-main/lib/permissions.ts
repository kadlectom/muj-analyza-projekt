import { getServerSession } from "next-auth"
import type { NextApiRequest, NextApiResponse } from "next"
import type { GetServerSidePropsContext } from "next"
import { authOptions } from "@/lib/auth"

export type SessionUser = {
  id: string
  role: string
  name?: string | null
  email?: string | null
  image?: string | null
}

// ─── Role checks ──────────────────────────────────────────────────────────────

export function isAdmin(role: string): boolean {
  return role === "admin"
}

// When an admin edits their OWN activity it is treated as a participant action.
// When actorId !== targetUserId it is an admin intervention → write audit log.
export function isAdminIntervention(actorId: string, targetUserId: string): boolean {
  return actorId !== targetUserId
}

// ─── API route helpers ────────────────────────────────────────────────────────

type ApiCtx = { req: NextApiRequest; res: NextApiResponse }

export async function requireAuth(ctx: ApiCtx): Promise<SessionUser | null> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session?.user?.id) {
    ctx.res.status(401).json({ error: "Nepřihlášen" })
    return null
  }
  return session.user as SessionUser
}

export async function requireAdmin(ctx: ApiCtx): Promise<SessionUser | null> {
  const user = await requireAuth(ctx)
  if (!user) return null
  if (!isAdmin(user.role)) {
    ctx.res.status(403).json({ error: "Nedostatečná oprávnění" })
    return null
  }
  return user
}

// ─── Page (getServerSideProps) helper ─────────────────────────────────────────

export async function getSessionUser(
  ctx: GetServerSidePropsContext
): Promise<SessionUser | null> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  return (session?.user as SessionUser) ?? null
}

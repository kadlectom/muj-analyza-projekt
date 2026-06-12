import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { challenges } from "@/db/schema"

export type ActiveChallenge = { id: string; slug: string | null; name: string; type: "WINTER" | "SUMMER" }

/** Returns the single ACTIVE challenge's id, slug, name and type, or null */
export async function getActiveChallenge(): Promise<ActiveChallenge | null> {
  const rows = await db
    .select({ id: challenges.id, slug: challenges.slug, name: challenges.name, type: challenges.type })
    .from(challenges)
    .where(eq(challenges.status, "ACTIVE"))
    .limit(1)
  return rows[0] ?? null
}

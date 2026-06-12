/**
 * Backfills the `slug` column for existing challenges.
 *
 * Usage:  npx tsx scripts/backfill-challenge-slugs.ts
 * Idempotent — only touches rows where slug IS NULL.
 */

import { config } from "dotenv"
config({ path: ".env.local" })
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { eq, isNull, isNotNull } from "drizzle-orm"
import * as schema from "../db/schema"
import { uniqueSlug } from "../lib/slugify"

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) throw new Error("Missing env var: TURSO_DATABASE_URL")
  const authToken = process.env.TURSO_AUTH_TOKEN
  const client = createClient({ url, ...(authToken ? { authToken } : {}) })
  const db = drizzle(client, { schema })

  const existing = await db
    .select({ slug: schema.challenges.slug })
    .from(schema.challenges)
    .where(isNotNull(schema.challenges.slug))

  const taken = new Set<string>(existing.map((r) => r.slug!).filter(Boolean))

  const missing = await db
    .select({ id: schema.challenges.id, name: schema.challenges.name })
    .from(schema.challenges)
    .where(isNull(schema.challenges.slug))

  if (missing.length === 0) {
    console.log("No challenges to backfill — all have slugs.")
    return
  }

  for (const row of missing) {
    const slug = uniqueSlug(row.name, taken)
    taken.add(slug)
    await db
      .update(schema.challenges)
      .set({ slug })
      .where(eq(schema.challenges.id, row.id))
    console.log(`  ${row.id} → ${slug}   (${row.name})`)
  }

  console.log(`\nBackfilled ${missing.length} challenge slug(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

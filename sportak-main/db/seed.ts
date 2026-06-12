/**
 * Seed activity catalog with zimní výzva 2025 activities.
 *
 * Usage:  npx tsx db/seed.ts
 * Idempotent — skips items that already exist (matched by name).
 */

import { config } from "dotenv"
config({ path: ".env.local" })
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { eq } from "drizzle-orm"
import * as schema from "./schema"

const ACTIVITIES: {
  name: string
  emoji: string
  unit: string
  pointsPerUnit: number
  category: "sport" | "wellness" | "culture"
}[] = [
  // ── Sport ──────────────────────────────────────────────────────────────────
  { name: "Běh",                          emoji: "🏃", unit: "km",       pointsPerUnit: 2.5,  category: "sport" },
  { name: "Turistika",                    emoji: "🥾", unit: "km",       pointsPerUnit: 1,    category: "sport" },
  { name: "Vysokohorská turistika",       emoji: "🏔️", unit: "km",       pointsPerUnit: 1.5,  category: "sport" },
  { name: "Brusle",                       emoji: "⛸️", unit: "km",       pointsPerUnit: 1.5,  category: "sport" },
  { name: "Kolo",                         emoji: "🚴", unit: "km",       pointsPerUnit: 0.5,  category: "sport" },
  { name: "MTB",                          emoji: "🚵", unit: "km",       pointsPerUnit: 1.2,  category: "sport" },
  { name: "Běžky",                        emoji: "⛷️", unit: "km",       pointsPerUnit: 2,    category: "sport" },
  { name: "Plavání",                      emoji: "🏊", unit: "km",       pointsPerUnit: 10,   category: "sport" },
  { name: "Sjezdovky",                    emoji: "🎿", unit: "den",      pointsPerUnit: 30,   category: "sport" },
  { name: "Cvičení – nízká intenzita",    emoji: "🧘", unit: "h",        pointsPerUnit: 5,    category: "sport" },
  { name: "Cvičení – střední intenzita",  emoji: "💪", unit: "h",        pointsPerUnit: 10,   category: "sport" },
  { name: "Cvičení – vysoká intenzita",   emoji: "🏋️", unit: "h",        pointsPerUnit: 15,   category: "sport" },
  { name: "Lezení",                       emoji: "🧗", unit: "h",        pointsPerUnit: 15,   category: "sport" },
  { name: "Týmový sport",                 emoji: "🏅", unit: "h",        pointsPerUnit: 15,   category: "sport" },
  { name: "Vodní sport",                  emoji: "🚣", unit: "h",        pointsPerUnit: 10,   category: "sport" },
  { name: "Wellness (sauna/masáž)",       emoji: "🧖", unit: "návštěva", pointsPerUnit: 5,    category: "sport" },
  { name: "Otužování",                    emoji: "🥶", unit: "návštěva", pointsPerUnit: 5,    category: "sport" },
  { name: "Tanec",                        emoji: "💃", unit: "návštěva", pointsPerUnit: 5,    category: "sport" },
  // ── Kultura ────────────────────────────────────────────────────────────────
  { name: "Divadlo",                      emoji: "🎭", unit: "návštěva", pointsPerUnit: 10,   category: "culture" },
  { name: "Kino",                         emoji: "🎬", unit: "návštěva", pointsPerUnit: 10,   category: "culture" },
  { name: "Kniha",                        emoji: "📚", unit: "návštěva", pointsPerUnit: 10,   category: "culture" },
  { name: "Koncert",                      emoji: "🎵", unit: "návštěva", pointsPerUnit: 10,   category: "culture" },
  { name: "Výstava",                      emoji: "🖼️", unit: "návštěva", pointsPerUnit: 10,   category: "culture" },
  { name: "ZOO / Botanická",              emoji: "🦁", unit: "návštěva", pointsPerUnit: 10,   category: "culture" },
  { name: "Sportovní utkání",             emoji: "🏟️", unit: "návštěva", pointsPerUnit: 5,    category: "culture" },
]

async function seed() {
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error("Missing env var: TURSO_DATABASE_URL — make sure .env.local is loaded")
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const db = drizzle(client, { schema })

  let inserted = 0
  let skipped = 0

  for (const item of ACTIVITIES) {
    const existing = await db
      .select({ id: schema.activityCatalog.id })
      .from(schema.activityCatalog)
      .where(eq(schema.activityCatalog.name, item.name))
      .then((r) => r[0] ?? null)

    if (existing) {
      skipped++
      continue
    }

    await db.insert(schema.activityCatalog).values({
      id: crypto.randomUUID(),
      challengeId: null,
      name: item.name,
      emoji: item.emoji,
      unit: item.unit,
      pointsPerUnit: item.pointsPerUnit,

      category: item.category,
      challengeType: "BOTH",
      isActive: true,
      createdAt: new Date(),
    })
    inserted++
  }

  console.log(`Seed done: ${inserted} inserted, ${skipped} skipped (already exist)`)
  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})

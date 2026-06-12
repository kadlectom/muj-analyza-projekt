/**
 * Seeds a default "how_to" row in app_content so the Jak na to page
 * has a starting structure admins can edit. Idempotent — skips if present.
 *
 * Usage:  npx tsx scripts/seed-how-to.ts
 */

import { config } from "dotenv"
config({ path: ".env.local" })
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { eq } from "drizzle-orm"
import * as schema from "../db/schema"
import { serializeHowToContent } from "../lib/howToContent"

const DEFAULT_SECTIONS = [
  {
    title: "Úvod",
    body:
      "Sportovní výzva je interní soutěž pro zaměstnance. Zaznamenávej své sportovní a wellness aktivity — každá se přepočítá na kilometry podle katalogu.",
  },
  {
    title: "Bodování",
    body:
      "Aktivity se přepočítávají na kilometrové ekvivalenty. Přesné hodnoty najdeš v katalogu výzvy.",
  },
  {
    title: "Bonusy",
    body:
      "Některé aktivity nebo jejich kombinace spouštějí bonusy. Přesná pravidla bonusů určuje admin pro každou výzvu.",
  },
  {
    title: "Tipy",
    body:
      "Zapisuj pravidelně, ať na nic nezapomeneš. Parťáky přidávej hned při zápisu — automaticky dostanou bonus km.",
  },
]

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) throw new Error("Missing env var: TURSO_DATABASE_URL")
  const authToken = process.env.TURSO_AUTH_TOKEN
  const client = createClient({ url, ...(authToken ? { authToken } : {}) })
  const db = drizzle(client, { schema })

  const existing = await db
    .select({ key: schema.appContent.key })
    .from(schema.appContent)
    .where(eq(schema.appContent.key, "how_to"))
    .limit(1)

  if (existing[0]) {
    console.log("app_content['how_to'] already exists — skipping.")
    return
  }

  const sections = DEFAULT_SECTIONS.map((s) => ({ id: crypto.randomUUID(), ...s }))
  const data = serializeHowToContent({ sections })

  await db.insert(schema.appContent).values({
    key: "how_to",
    data,
    updatedAt: new Date(),
    updatedBy: null,
  })

  console.log(`Seeded ${sections.length} default section(s) into app_content['how_to'].`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appContent } from "@/db/schema"
import { parseHowToContent, EMPTY_HOW_TO, type HowToContent } from "@/lib/howToContent"

export const HOW_TO_KEY = "how_to"

/** Reads the "Jak na to" content row. Returns empty sections if the row is missing. */
export async function getHowToContent(): Promise<HowToContent> {
  const rows = await db
    .select({ data: appContent.data })
    .from(appContent)
    .where(eq(appContent.key, HOW_TO_KEY))
    .limit(1)
  if (!rows[0]) return EMPTY_HOW_TO
  return parseHowToContent(rows[0].data)
}

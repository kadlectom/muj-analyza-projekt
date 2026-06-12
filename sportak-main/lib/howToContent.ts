export type HowToSection = {
  id: string      // stable uuid per section
  title: string
  body: string
}

export type HowToContent = {
  sections: HowToSection[]
}

export const EMPTY_HOW_TO: HowToContent = { sections: [] }

/**
 * Safely parses the JSON blob stored in app_content.data for key='how_to'.
 * Drops any section that doesn't have string id/title/body. Never throws.
 */
export function parseHowToContent(raw: string | null | undefined): HowToContent {
  if (!raw) return EMPTY_HOW_TO
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return EMPTY_HOW_TO
  }
  if (!parsed || typeof parsed !== "object") return EMPTY_HOW_TO
  const rawSections = (parsed as { sections?: unknown }).sections
  if (!Array.isArray(rawSections)) return EMPTY_HOW_TO

  const sections: HowToSection[] = []
  for (const s of rawSections) {
    if (!s || typeof s !== "object") continue
    const { id, title, body } = s as { id?: unknown; title?: unknown; body?: unknown }
    if (typeof id !== "string" || typeof title !== "string" || typeof body !== "string") continue
    sections.push({ id, title, body })
  }
  return { sections }
}

/** Serializes a content object to the storage format. */
export function serializeHowToContent(content: HowToContent): string {
  return JSON.stringify({
    sections: content.sections.map((s) => ({ id: s.id, title: s.title, body: s.body })),
  })
}

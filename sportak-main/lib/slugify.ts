/**
 * Converts a human-readable name (typically Czech) to a URL-safe slug.
 * Strips diacritics, lowercases, and replaces non-alphanumerics with hyphens.
 *
 *   "Zimní výzva 2026" → "zimni-vyzva-2026"
 *   "Běh přes poušť!"  → "beh-pres-poust"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Returns a slug that does not collide with any in `taken`.
 * Appends -2, -3, … until a free one is found. If the base slug is empty
 * (e.g. name was only symbols), falls back to `fallback`.
 */
export function uniqueSlug(name: string, taken: Set<string>, fallback = "vyzva"): string {
  const base = slugify(name) || fallback
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

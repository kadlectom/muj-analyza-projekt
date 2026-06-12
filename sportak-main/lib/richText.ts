export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; children: Inline[] }
  | { type: "italic"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] }
  | { type: "br" }

export type Block =
  | { type: "paragraph"; inlines: Inline[] }
  | { type: "list"; items: Inline[][] }

const BOLD_RE = /\*\*(\S(?:(?:[^*]|\*(?!\*))*?\S)?)\*\*/
const ITALIC_RE = /\*(\S(?:[^*]*?\S)?)\*/
const LINK_RE = /\[([^\]]+)\]\(([^\s)]+)\)/

const TOKEN_RE = new RegExp(
  `${BOLD_RE.source}|${ITALIC_RE.source}|${LINK_RE.source}`,
)

export function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed)
    if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:") {
      return u.toString()
    }
    return null
  } catch {
    return null
  }
}

function pushText(out: Inline[], text: string): void {
  if (!text) return
  const parts = text.split("\n")
  parts.forEach((part, i) => {
    if (i > 0) out.push({ type: "br" })
    if (!part) return
    const last = out[out.length - 1]
    if (last && last.type === "text") {
      last.text += part
    } else {
      out.push({ type: "text", text: part })
    }
  })
}

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let cursor = 0
  while (cursor < text.length) {
    const remaining = text.slice(cursor)
    const m = TOKEN_RE.exec(remaining)
    if (!m) {
      pushText(out, remaining)
      break
    }
    if (m.index > 0) pushText(out, remaining.slice(0, m.index))

    if (m[1] !== undefined) {
      out.push({ type: "bold", children: parseInline(m[1]) })
    } else if (m[2] !== undefined) {
      out.push({ type: "italic", children: parseInline(m[2]) })
    } else if (m[3] !== undefined && m[4] !== undefined) {
      const safe = sanitizeUrl(m[4])
      if (safe) {
        out.push({ type: "link", href: safe, children: parseInline(m[3]) })
      } else {
        pushText(out, m[0])
      }
    }
    cursor += m.index + m[0].length
  }
  return out
}

export function parseRichText(source: string): Block[] {
  const blocks: Block[] = []
  const lines = source.replace(/\r\n/g, "\n").split("\n")

  let paraLines: string[] = []
  let listItems: string[] = []

  function flushParagraph(): void {
    if (paraLines.length === 0) return
    const text = paraLines.join("\n")
    blocks.push({ type: "paragraph", inlines: parseInline(text) })
    paraLines = []
  }

  function flushList(): void {
    if (listItems.length === 0) return
    blocks.push({
      type: "list",
      items: listItems.map((item) => parseInline(item)),
    })
    listItems = []
  }

  for (const line of lines) {
    const bullet = line.match(/^- (.*)$/)
    if (bullet) {
      flushParagraph()
      listItems.push(bullet[1])
      continue
    }
    if (line.trim() === "") {
      flushParagraph()
      flushList()
      continue
    }
    flushList()
    paraLines.push(line)
  }
  flushParagraph()
  flushList()
  return blocks
}

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/router"
import { Plus, Trash2, ArrowUp, ArrowDown, Bold, Italic, List, Link as LinkIcon } from "lucide-react"
import { type HowToSection } from "@/lib/howToContent"

type Props = { initialSections: HowToSection[] }

function newSection(): HowToSection {
  return { id: crypto.randomUUID(), title: "", body: "" }
}

type PendingSelection = { sectionId: string; start: number; end: number }

export function HowToEditor({ initialSections }: Props) {
  const router = useRouter()
  const [sections, setSections] = useState<HowToSection[]>(
    initialSections.length > 0 ? initialSections : [newSection()]
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})
  const pendingSelectionRef = useRef<PendingSelection | null>(null)

  useEffect(() => {
    const sel = pendingSelectionRef.current
    if (!sel) return
    const ref = textareaRefs.current[sel.sectionId]
    if (ref) {
      ref.focus()
      ref.setSelectionRange(sel.start, sel.end)
    }
    pendingSelectionRef.current = null
  }, [sections])

  function updateSection(index: number, patch: Partial<HowToSection>) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function addSection() {
    setSections((prev) => [...prev, newSection()])
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index))
  }

  function moveSection(index: number, delta: -1 | 1) {
    setSections((prev) => {
      const target = index + delta
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function applyWrap(index: number, before: string, after: string, placeholder: string) {
    const section = sections[index]
    const ref = textareaRefs.current[section.id]
    if (!ref) return
    const start = ref.selectionStart
    const end = ref.selectionEnd
    const value = ref.value
    const selected = value.slice(start, end) || placeholder
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end)
    pendingSelectionRef.current = {
      sectionId: section.id,
      start: start + before.length,
      end: start + before.length + selected.length,
    }
    updateSection(index, { body: newValue })
  }

  function applyLink(index: number) {
    const section = sections[index]
    const ref = textareaRefs.current[section.id]
    if (!ref) return
    const start = ref.selectionStart
    const end = ref.selectionEnd
    const value = ref.value
    const label = value.slice(start, end) || "odkaz"
    const urlPlaceholder = "https://"
    const inserted = `[${label}](${urlPlaceholder})`
    const newValue = value.slice(0, start) + inserted + value.slice(end)
    const urlStart = start + 1 + label.length + 2
    pendingSelectionRef.current = {
      sectionId: section.id,
      start: urlStart,
      end: urlStart + urlPlaceholder.length,
    }
    updateSection(index, { body: newValue })
  }

  function applyBullet(index: number) {
    const section = sections[index]
    const ref = textareaRefs.current[section.id]
    if (!ref) return
    const start = ref.selectionStart
    const end = ref.selectionEnd
    const value = ref.value
    const lineStart = value.lastIndexOf("\n", start - 1) + 1
    const block = value.slice(lineStart, end)
    const transformed = block
      .split("\n")
      .map((l) => (l.startsWith("- ") ? l : `- ${l}`))
      .join("\n")
    const newValue = value.slice(0, lineStart) + transformed + value.slice(end)
    pendingSelectionRef.current = {
      sectionId: section.id,
      start: lineStart,
      end: lineStart + transformed.length,
    }
    updateSection(index, { body: newValue })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) {
    if (!(e.ctrlKey || e.metaKey)) return
    if (e.key === "b" || e.key === "B") {
      e.preventDefault()
      applyWrap(index, "**", "**", "tučně")
    } else if (e.key === "i" || e.key === "I") {
      e.preventDefault()
      applyWrap(index, "*", "*", "kurzíva")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    for (const s of sections) {
      if (!s.title.trim()) {
        setError("Každá sekce musí mít název")
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch("/api/content/how-to", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Nepodařilo se uložit obsah")
        return
      }
      const data = (await res.json()) as { sections: HowToSection[] }
      setSections(data.sections)
      setSavedAt(Date.now())
      router.replace(router.asPath, undefined, { scroll: false })
    } catch {
      setError("Síťová chyba, zkuste to znovu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {sections.map((s, i) => (
        <div
          key={s.id}
          className="bg-white rounded-lg border border-gray-border shadow-sm p-5 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-mid">
              Sekce {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveSection(i, -1)}
                disabled={i === 0}
                aria-label="Přesunout sekci nahoru"
                className="p-1.5 rounded-sm text-gray-mid hover:text-dark hover:bg-gray-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => moveSection(i, 1)}
                disabled={i === sections.length - 1}
                aria-label="Přesunout sekci dolů"
                className="p-1.5 rounded-sm text-gray-mid hover:text-dark hover:bg-gray-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => removeSection(i)}
                aria-label="Smazat sekci"
                className="p-1.5 rounded-sm text-gray-mid hover:text-red hover:bg-red/10 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-dark mb-1.5">
              Název sekce <span className="text-red">*</span>
            </label>
            <input
              type="text"
              value={s.title}
              onChange={(e) => updateSection(i, { title: e.target.value })}
              placeholder="např. Bodování"
              className="w-full border border-gray-border rounded-sm px-3 py-2 text-base text-dark placeholder:text-gray-mid focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-dark mb-1.5">
              Obsah
            </label>
            <div className="flex items-center gap-1 mb-1.5">
              <ToolbarButton onClick={() => applyWrap(i, "**", "**", "tučně")} label="Tučně (Ctrl+B)">
                <Bold size={14} />
              </ToolbarButton>
              <ToolbarButton onClick={() => applyWrap(i, "*", "*", "kurzíva")} label="Kurzíva (Ctrl+I)">
                <Italic size={14} />
              </ToolbarButton>
              <ToolbarButton onClick={() => applyBullet(i)} label="Odrážka">
                <List size={14} />
              </ToolbarButton>
              <ToolbarButton onClick={() => applyLink(i)} label="Odkaz">
                <LinkIcon size={14} />
              </ToolbarButton>
            </div>
            <textarea
              ref={(el) => {
                textareaRefs.current[s.id] = el
              }}
              value={s.body}
              onChange={(e) => updateSection(i, { body: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, i)}
              rows={6}
              placeholder="Popište sekci…"
              className="w-full border border-gray-border rounded-sm px-3 py-2 text-base text-dark placeholder:text-gray-mid focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue resize-y font-mono text-[13px]"
            />
            <p className="text-[11px] text-gray-mid mt-1.5">
              Podporujeme: <code>**tučně**</code>, <code>*kurzíva*</code>, <code>- odrážka</code>, <code>[odkaz](https://…)</code>. Prázdný řádek = nový odstavec.
            </p>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addSection}
        className="w-full inline-flex items-center justify-center gap-1.5 bg-white text-blue text-[13px] font-bold px-4 py-3 rounded-sm border border-dashed border-blue/40 hover:bg-blue-light transition-colors"
      >
        <Plus size={14} />
        Přidat sekci
      </button>

      {error && (
        <p className="text-[13px] text-red bg-red/10 rounded-sm px-3 py-2">{error}</p>
      )}
      {savedAt && !error && (
        <p className="text-[13px] text-green bg-green/10 rounded-sm px-3 py-2">
          Uloženo.
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue text-white font-bold text-[14px] px-6 py-2.5 rounded-sm hover:bg-[#0056cc] disabled:opacity-60 transition-colors"
        >
          {loading ? "Ukládám…" : "Uložit"}
        </button>
      </div>
    </form>
  )
}

function ToolbarButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="p-1.5 rounded-sm text-gray-dark hover:text-blue hover:bg-blue-light active:bg-blue-light transition-colors"
    >
      {children}
    </button>
  )
}

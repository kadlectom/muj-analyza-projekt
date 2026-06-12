import { useState, useMemo } from "react"
import { Search, ChevronRight, ChevronDown, X } from "lucide-react"
import { calculatePoints } from "@/lib/calculatePoints"

type CatalogOption = {
  id: string
  name: string
  emoji: string | null
  unit: string
  pointsPerUnit: number
  minValue: number | null
  category: string
}

type EditActivity = {
  id: string
  catalogItemId: string
  value: number
  date: string
  note: string | null
  partnerIds?: string[]
}

type Participant = { id: string; name: string; avatarUrl: string | null }

type CreateProps = { mode: "create" }
type EditProps = { mode: "edit"; activity: EditActivity }
type Props = (CreateProps | EditProps) & {
  challengeId: string
  startDate: string
  endDate: string
  catalogItems: CatalogOption[]
  /** "pill" shows a visual pill grid + search; "select" uses native <select>. Defaults to "select". */
  variant?: "pill" | "select"
  /** Enrolled participants that can be tagged as partners (exclude current user before passing). Create mode only. */
  enrolledParticipants?: Participant[]
  /** Per-activity partner bonus in km equivalent. */
  partnerBonus?: number
  onSuccess: (result?: {
    points: number
    partnerBonus: number
    newlyEarnedBonuses?: { name: string; bonusPoints: number }[]
    activityName: string
    activityEmoji: string | null
    inputValue: number
    inputUnit: string
    partnerNames: string[]
  }) => void
  onCancel: () => void
}

function CatalogDropdownRow({
  item,
  active,
  onSelect,
}: {
  item: CatalogOption
  active: boolean
  onSelect: (id: string) => void
}) {
  const pts = item.pointsPerUnit % 1 === 0 ? item.pointsPerUnit : item.pointsPerUnit.toFixed(1)
  return (
    <button
      type="button"
      // preventDefault on mousedown keeps focus on the search input, so the wrapping
      // div's onBlur doesn't fire and the dropdown stays mounted long enough for the
      // tap's onClick to land. iOS Safari doesn't focus buttons on tap, so without
      // this the dropdown unmounts mid-tap and selection silently fails.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelect(item.id)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-gray-border last:border-b-0 ${
        active ? "bg-blue-light" : "hover:bg-gray-light"
      }`}
    >
      <span className="text-[16px] flex-shrink-0">{item.emoji ?? "🏃"}</span>
      <span className="text-[13px] font-semibold text-dark flex-1">{item.name}</span>
      <span className="flex flex-col items-end flex-shrink-0 leading-tight">
        <span className="text-[11px] text-gray-mid">1 {item.unit} → {pts} km</span>
        {item.minValue !== null && (
          <span className="text-[10px] font-semibold" style={{ color: "#d97706" }}>min. {item.minValue} {item.unit}</span>
        )}
      </span>
    </button>
  )
}

function todayClamped(start: string, end: string): string {
  const today = new Date().toISOString().slice(0, 10)
  const maxDate = today < end ? today : end
  if (today < start) return start
  return maxDate
}

const CATEGORY_LABELS: Record<string, string> = {
  sport: "Sport",
  wellness: "Wellness",
  culture: "Kultura",
}

export function ActivityForm(props: Props) {
  const editing = props.mode === "edit" ? props.activity : null
  const isPill = props.variant === "pill"
  const canTagPartners = (props.enrolledParticipants?.length ?? 0) > 0

  const [catalogItemId, setCatalogItemId] = useState(editing?.catalogItemId ?? "")
  const [value, setValue] = useState(editing ? String(editing.value) : "")
  const [date, setDate] = useState(editing?.date ?? todayClamped(props.startDate, props.endDate))
  const [note, setNote] = useState(editing?.note ?? "")
  const [showNote, setShowNote] = useState(!!(editing?.note))
  const [searchQuery, setSearchQuery] = useState("")
  const [partnerIds, setPartnerIds] = useState<string[]>(editing?.partnerIds ?? [])
  const [showPartners, setShowPartners] = useState(false)
  const [partnerSearch, setPartnerSearch] = useState("")
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [valueError, setValueError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedItem = useMemo(
    () => props.catalogItems.find((i) => i.id === catalogItemId) ?? null,
    [catalogItemId, props.catalogItems]
  )

  const preview = useMemo(() => {
    const num = parseFloat(value)
    if (!selectedItem || isNaN(num) || num <= 0) return null
    return calculatePoints(num, selectedItem.pointsPerUnit)
  }, [value, selectedItem])

  // Group catalog items by category (used in select variant)
  const grouped = useMemo(() => {
    const map = new Map<string, CatalogOption[]>()
    for (const item of props.catalogItems) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return map
  }, [props.catalogItems])

  const [searchFocused, setSearchFocused] = useState(false)

  // Pill variant: top 5 quick-pick rows + search/browse dropdown
  const top5 = useMemo(() => props.catalogItems.slice(0, 5), [props.catalogItems])
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return props.catalogItems.filter((i) => i.name.toLowerCase().includes(q))
  }, [searchQuery, props.catalogItems])

  async function submit(ignoreDuplicate = false) {
    setError(null)
    setDuplicateWarning(false)

    let hasFieldError = false
    if (!catalogItemId) { setCatalogError("Vyber aktivitu"); hasFieldError = true } else { setCatalogError(null) }
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      setValueError(`Zadej počet ${selectedItem?.unit ?? "jednotek"} větší než 0`)
      hasFieldError = true
    } else if (selectedItem?.minValue != null && num < selectedItem.minValue) {
      setValueError(`Minimální hodnota je ${selectedItem.minValue} ${selectedItem.unit}`)
      hasFieldError = true
    } else {
      setValueError(null)
    }
    if (hasFieldError) return

    setLoading(true)
    try {
      const url = editing ? `/api/activities/${editing.id}` : "/api/activities"
      const method = editing ? "PATCH" : "POST"
      const body = editing
        ? { catalogItemId, value: num, date, note: note.trim() || null, ...(canTagPartners ? { partnerIds } : {}) }
        : { challengeId: props.challengeId, catalogItemId, value: num, date, note: note.trim() || null, partnerIds, ignoreDuplicateWarning: ignoreDuplicate }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Aktivitu se nepodařilo uložit — zkus to znovu")
        return
      }

      const data = await res.json().catch(() => ({}))
      if (data.warning === "duplicate_partner") {
        setDuplicateWarning(true)
        return
      }

      const partnerNames = partnerIds
        .map((id) => props.enrolledParticipants?.find((p) => p.id === id)?.name)
        .filter((n): n is string => typeof n === "string")
      props.onSuccess(editing ? undefined : {
        points: typeof data.points === "number" ? data.points : (selectedItem ? calculatePoints(num, selectedItem.pointsPerUnit) : 0),
        partnerBonus: partnerIds.length > 0 ? (props.partnerBonus ?? 0) : 0,
        newlyEarnedBonuses: data.newlyEarnedBonuses,
        activityName: selectedItem?.name ?? "",
        activityEmoji: selectedItem?.emoji ?? null,
        inputValue: num,
        inputUnit: selectedItem?.unit ?? "",
        partnerNames,
      })
    } catch {
      setError("Připojení selhalo — nic se neuložilo, zkus to znovu")
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit(false)
  }

  const inputClass = `w-full border rounded-sm px-3 text-base text-dark placeholder:text-gray-mid focus:outline-none focus:ring-2 focus:border-blue transition-[border-color,box-shadow] duration-150 ${isPill ? "py-[14px]" : "py-2"}`
  const valueInputClass = `${inputClass} ${valueError ? "border-red focus:ring-red/30" : "border-gray-border focus:ring-blue/30"}`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isPill ? (
        /* ── Pill variant: quick-pick rows + search/browse ──────────── */
        <div>
          <label className="flex items-center justify-between text-[13px] font-semibold text-dark mb-3">
            <span>Aktivita <span className="text-red">*</span></span>
            {catalogError && <span className="text-[11px] font-semibold text-red">{catalogError}</span>}
          </label>

          {selectedItem && !searchFocused && !searchQuery.trim() ? (
            /* ── Selected state: same card regardless of source ── */
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] border border-blue bg-blue-light">
              <span className="text-[20px] leading-none flex-shrink-0">{selectedItem.emoji ?? "🏃"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-dark truncate">{selectedItem.name}</p>
                <p className="text-[11px] text-gray-mid">
                  1 {selectedItem.unit} → {selectedItem.pointsPerUnit % 1 === 0 ? selectedItem.pointsPerUnit : selectedItem.pointsPerUnit.toFixed(1)} km
                  {selectedItem.minValue !== null && (
                    <span className="ml-1.5 font-semibold" style={{ color: "#d97706" }}>· min. {selectedItem.minValue} {selectedItem.unit}</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setCatalogItemId(""); setSearchQuery(""); setCatalogError(null) }}
                aria-label="Změnit aktivitu"
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-mid hover:text-dark hover:bg-white/60 transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            /* ── Picker state: top-5 + search/browse ── */
            <>
              <div className="space-y-1.5 mb-3">
                {top5.map((item) => {
                  const pts = item.pointsPerUnit % 1 === 0 ? item.pointsPerUnit : item.pointsPerUnit.toFixed(1)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { setCatalogItemId(item.id); setSearchQuery(""); setSearchFocused(false); setCatalogError(null) }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] border border-gray-border bg-white hover:border-blue/40 hover:bg-blue-light/40 text-left transition-colors active:scale-[0.98]"
                    >
                      <span className="text-[20px] leading-none flex-shrink-0">{item.emoji ?? "🏃"}</span>
                      <span className="text-[13px] font-semibold text-dark flex-1">{item.name}</span>
                      <span className="flex flex-col items-end flex-shrink-0 leading-tight">
                        <span className="text-[11px] text-gray-mid">1 {item.unit} → {pts} km</span>
                        {item.minValue !== null && (
                          <span className="text-[10px] font-semibold" style={{ color: "#d97706" }}>min. {item.minValue} {item.unit}</span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setSearchFocused(false)
                }}
              >
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="Procházet nebo hledat další aktivity…"
                    className="w-full border border-gray-border rounded-sm pl-8 pr-3 py-2.5 text-base text-dark placeholder:text-gray-mid focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-[border-color,box-shadow] duration-150"
                  />
                </div>

                {(searchFocused || searchQuery.trim() !== "") && (
                  <div className="mt-1 border border-gray-border rounded-[8px] overflow-hidden max-h-60 overflow-y-auto">
                    {searchQuery.trim() ? (
                      searchResults.length === 0 ? (
                        <p className="text-[13px] text-gray-mid text-center py-4">Žádná shoda</p>
                      ) : (
                        searchResults.map((item) => (
                          <CatalogDropdownRow
                            key={item.id}
                            item={item}
                            active={catalogItemId === item.id}
                            onSelect={(id) => { setCatalogItemId(id); setSearchQuery(""); setSearchFocused(false); setCatalogError(null) }}
                          />
                        ))
                      )
                    ) : (
                      Array.from(grouped.entries()).map(([cat, items]) => (
                        <div key={cat}>
                          <div className="px-3 py-1.5 bg-[#f5f6f8] sticky top-0 z-10 border-b border-gray-border">
                            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-mid">
                              {CATEGORY_LABELS[cat] ?? cat}
                            </span>
                          </div>
                          {items.map((item) => (
                            <CatalogDropdownRow
                              key={item.id}
                              item={item}
                              active={catalogItemId === item.id}
                              onSelect={(id) => { setCatalogItemId(id); setSearchQuery(""); setSearchFocused(false) }}
                            />
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        /* ── Select variant: native grouped dropdown ─────────────── */
        <div>
          <label className="flex items-center justify-between text-[13px] font-semibold text-dark mb-1">
            <span>Aktivita <span className="text-red">*</span></span>
            {catalogError && <span className="text-[11px] font-semibold text-red">{catalogError}</span>}
          </label>
          <select
            value={catalogItemId}
            onChange={(e) => { setCatalogItemId(e.target.value); setCatalogError(null) }}
            className={`w-full border rounded-sm px-3 py-2 text-[14px] text-dark focus:outline-none focus:ring-2 focus:border-blue transition-[border-color,box-shadow] duration-150 bg-white ${catalogError ? "border-red focus:ring-red/30" : "border-gray-border focus:ring-blue/30"}`}
          >
            <option value="">Vyberte aktivitu…</option>
            {Array.from(grouped.entries()).map(([cat, items]) => (
              <optgroup key={cat} label={CATEGORY_LABELS[cat] ?? cat}>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.emoji ? `${item.emoji} ` : ""}{item.name} ({item.unit}){item.minValue !== null ? ` — min. ${item.minValue}` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      {/* Value + Date side-by-side. min-w-0 on cells lets the native date
          input shrink below its intrinsic content width — iOS Safari otherwise
          forces the grid cell wider than the viewport. */}
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label className="block text-[13px] font-semibold text-dark mb-1">
            Hodnota {selectedItem && <span className="font-normal text-gray-mid">({selectedItem.unit})</span>}
            {selectedItem?.minValue != null && (
              <span className="ml-1.5 text-[11px] font-semibold" style={{ color: "#d97706" }}>min. {selectedItem.minValue}</span>
            )}
            <span className="text-red"> *</span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => { setValue(e.target.value); setValueError(null) }}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            step="any"
            placeholder="0"
            className={valueInputClass}
          />
          {valueError ? (
            <p className="text-[12px] text-red mt-1">{valueError}</p>
          ) : preview !== null ? (
            <>
              <p className="text-[13px] font-bold mt-1" style={{ color: "#18C872" }}>
                = {preview % 1 === 0 ? preview : preview.toFixed(1)} km
              </p>
              <p className="text-[11px] text-gray-mid mt-0.5">km ekvivalent pro žebříček</p>
            </>
          ) : null}
        </div>

        <div className="min-w-0">
          <label className="block text-[13px] font-semibold text-dark mb-1">
            Datum <span className="text-red">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              const today = new Date().toLocaleDateString("en-CA")
              const maxDate = today < props.endDate ? today : props.endDate
              const v = e.target.value
              setDate(v > maxDate ? maxDate : v < props.startDate ? props.startDate : v)
            }}
            required
            min={props.startDate}
            max={(() => { const today = new Date().toLocaleDateString("en-CA"); return today < props.endDate ? today : props.endDate })()}
            // iOS Safari gives <input type="date"> an intrinsic min-width that
            // ignores `min-w-0` on the parent. Force min-width:0 on the input
            // itself, and disable the UA appearance so its inner-chrome padding
            // can't push the box past the grid cell. The native picker still opens.
            style={{ WebkitAppearance: "none", appearance: "none", minWidth: 0 }}
            className={`${inputClass} max-w-full border-gray-border focus:ring-blue/30`}
          />
        </div>
      </div>

      {/* Note — toggled in pill variant, always visible in select */}
      {isPill ? (
        <div>
          <button
            type="button"
            onClick={() => setShowNote((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-dark/50 hover:text-dark transition-colors"
          >
            <span className="text-[14px] leading-none">💬</span>
            {showNote ? "Skrýt poznámku" : "Přidat poznámku (volitelné)"}
            {showNote ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          {showNote && (
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="např. ráno v parku"
              className={`${inputClass} mt-2`}
            />
          )}
        </div>
      ) : (
        <div>
          <label className="block text-[13px] font-semibold text-dark mb-1">
            Poznámka <span className="text-[12px] text-gray-mid font-normal">(volitelné)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="např. ráno v parku"
            className="w-full border border-gray-border rounded-sm px-3 py-2 text-[14px] text-dark placeholder:text-gray-mid focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-[border-color,box-shadow] duration-150"
          />
        </div>
      )}

      {/* Partner picker — pill/create mode only, when challenge has enrolled participants */}
      {canTagPartners && (
        <div>
          <button
            type="button"
            onClick={() => setShowPartners((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-dark/50 hover:text-dark transition-colors"
          >
            <span className="text-[14px] leading-none">🤝</span>
            {partnerIds.length > 0
              ? `Partneři: ${partnerIds.length} vybrán${partnerIds.length === 1 ? "" : partnerIds.length < 5 ? "i" : "o"}`
              : "Přidat partnera (volitelné)"}
            {showPartners ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>

          {showPartners && (
            <div className="mt-2 border border-gray-border rounded-[8px] overflow-hidden">
              {(props.enrolledParticipants ?? []).length > 5 && (
                <div className="px-3 py-2 border-b border-gray-border">
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    placeholder="Hledat účastníka…"
                    className="w-full text-base text-dark placeholder:text-gray-mid focus:outline-none bg-transparent"
                  />
                </div>
              )}
              <div className="max-h-52 overflow-y-auto">
                {(props.enrolledParticipants ?? [])
                  .filter((p) => !partnerSearch.trim() || p.name.toLowerCase().includes(partnerSearch.toLowerCase()))
                  .map((p) => {
                    const selected = partnerIds.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setPartnerIds((prev) =>
                            selected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                          )
                        }
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-gray-border last:border-b-0 ${
                          selected ? "bg-blue-light" : "hover:bg-gray-light"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full flex-shrink-0 bg-blue-light text-blue text-[11px] font-bold flex items-center justify-center overflow-hidden">
                          {p.avatarUrl
                            ? <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                            : p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[13px] font-semibold text-dark flex-1">{p.name}</span>
                        {selected && <span className="text-blue text-[12px] font-bold">✓</span>}
                      </button>
                    )
                  })}
              </div>
            </div>
          )}

          {partnerIds.length > 0 && props.partnerBonus && props.partnerBonus > 0 && (
            <p className="text-[12px] font-semibold mt-1.5" style={{ color: "#18C872" }}>
              +{props.partnerBonus % 1 === 0 ? props.partnerBonus : props.partnerBonus.toFixed(1)} km bonus za společnou aktivitu
            </p>
          )}
        </div>
      )}

      {/* Duplicate partner warning */}
      {duplicateWarning && (
        <div role="alert" className="rounded-sm px-3 py-2.5 bg-[#fef3c7] border border-[#fde68a]">
          <p className="text-[13px] font-semibold text-[#92400e] mb-2">
            Vypadá to, že tuto aktivitu za tebe někdo již zaznamenal jako partner — body ti byly přidány automaticky.
          </p>
          <p className="text-[12px] text-[#92400e]/80 mb-3">Chceš ji přesto zapsat znovu?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={loading}
              className="text-[12px] font-bold px-3 py-1.5 rounded-sm bg-[#92400e] text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {loading ? "Ukládám…" : "Zapsat znovu"}
            </button>
            <button
              type="button"
              onClick={() => setDuplicateWarning(false)}
              className="text-[12px] font-semibold px-3 py-1.5 text-[#92400e]/70 hover:text-[#92400e] transition-colors"
            >
              Zrušit
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p role="alert" className="text-[13px] text-red bg-red/10 rounded-sm px-3 py-2">{error}</p>
      )}

      {/* Actions */}
      <div className={`flex gap-3 pt-2 ${isPill ? "flex-col" : ""}`}>
        <button
          type="submit"
          disabled={loading}
          className={`font-bold text-[14px] text-white disabled:opacity-60 hover:opacity-90 active:scale-[0.98] transition-[opacity,transform] duration-150 ${
            isPill
              ? "w-full py-3.5 rounded-[50px]"
              : "px-5 py-2 rounded-sm"
          }`}
          style={{ background: "var(--gradient)" }}
        >
          {loading ? "Ukládám…" : editing ? "Uložit změny" : "Uložit aktivitu"}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          className={`text-[14px] font-semibold text-gray-mid hover:text-dark transition-colors ${isPill ? "text-center py-1" : "px-3"}`}
        >
          Zrušit
        </button>
      </div>
    </form>
  )
}

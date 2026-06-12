import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { ArchiveCard, type ArchiveChallengeData } from "./ArchiveCard"

type Filter = { q: string; type: "ALL" | "SUMMER" | "WINTER"; joined: boolean }

type Props = {
  challenges: ArchiveChallengeData[]
  currentUserId: string
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-[12.5px] font-bold px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-dark text-white border-dark"
          : "bg-white text-gray-dark border-gray-border hover:bg-gray-light"
      }`}
    >
      {children}
    </button>
  )
}

export function ArchiveSection({ challenges, currentUserId }: Props) {
  const [filter, setFilter] = useState<Filter>({ q: "", type: "ALL", joined: false })

  const yearGroups = useMemo(() => {
    let filtered = challenges
    if (filter.type !== "ALL") filtered = filtered.filter(c => c.type === filter.type)
    if (filter.joined) filtered = filtered.filter(c => c.joined)
    if (filter.q) {
      const q = filter.q.toLowerCase()
      filtered = filtered.filter(c => c.name.toLowerCase().includes(q))
    }

    const map = new Map<number, ArchiveChallengeData[]>()
    for (const c of filtered) {
      const year = Number(c.endDate.slice(0, 4))
      if (!map.has(year)) map.set(year, [])
      map.get(year)!.push(c)
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0])
  }, [challenges, filter])

  const pluralVyzev = (n: number) => (n === 1 ? "výzva" : n < 5 ? "výzvy" : "výzev")

  return (
    <div className="mt-8">
      {/* Section header + filters */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-[18px] font-extrabold text-dark">Archiv výzev</h2>
          <p className="text-[12px] text-gray-mid mt-0.5">
            Historické výzvy — pouze pro čtení. {challenges.length} {pluralVyzev(challenges.length)} celkem.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-mid pointer-events-none" />
            <input
              value={filter.q}
              onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
              placeholder="Hledat výzvu…"
              className="pl-8 pr-3 py-1.5 text-[13px] bg-white border border-gray-border rounded-sm w-[180px] outline-none focus:border-blue"
            />
          </div>
          <FilterChip active={filter.type === "ALL"} onClick={() => setFilter(f => ({ ...f, type: "ALL" }))}>Vše</FilterChip>
          <FilterChip active={filter.type === "SUMMER"} onClick={() => setFilter(f => ({ ...f, type: "SUMMER" }))}>☀️ Léto</FilterChip>
          <FilterChip active={filter.type === "WINTER"} onClick={() => setFilter(f => ({ ...f, type: "WINTER" }))}>❄️ Zima</FilterChip>
          <FilterChip active={filter.joined} onClick={() => setFilter(f => ({ ...f, joined: !f.joined }))}>Moje</FilterChip>
        </div>
      </div>

      {yearGroups.length === 0 ? (
        <div className="bg-white rounded-md border border-gray-border p-8 text-center">
          <p className="text-[32px] mb-2">🔎</p>
          <p className="text-[14px] font-bold text-dark">Žádná výzva neodpovídá filtru</p>
          <p className="text-[12px] text-gray-mid mt-1">Zkus uvolnit filtry nebo změnit hledaný výraz.</p>
        </div>
      ) : (
        yearGroups.map(([year, list]) => (
          <div key={year} className="mb-8">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="font-display text-[44px] leading-none font-bold text-dark">{year}</span>
              <div className="flex-1 h-px bg-gray-border" />
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-mid">
                {list.length} {pluralVyzev(list.length)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map(c => (
                <ArchiveCard key={c.id} challenge={c} currentUserId={currentUserId} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

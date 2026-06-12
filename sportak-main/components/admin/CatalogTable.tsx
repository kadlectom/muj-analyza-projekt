import { useState } from "react"
import { useRouter } from "next/router"
import { Pencil, PowerOff, Power, Plus } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { CatalogItemForm } from "@/components/admin/CatalogItemForm"

export type CatalogItem = {
  id: string
  challengeId: string | null
  name: string
  emoji: string | null
  unit: string
  pointsPerUnit: number
  minValue: number | null
  category: "sport" | "wellness" | "culture"
  challengeType: "WINTER" | "SUMMER" | "BOTH"
  isActive: boolean
  createdAt: number
}

const CATEGORY_LABELS: Record<string, string> = {
  sport: "Sport",
  wellness: "Wellness",
  culture: "Kultura",
}

const TYPE_LABELS: Record<string, string> = {
  WINTER: "⛷️ Zimní",
  SUMMER: "☀️ Letní",
  BOTH: "🏅 Obě",
}

type Props = {
  items: CatalogItem[]
  challengeId: string
  challengeType: "WINTER" | "SUMMER"
  isAdmin: boolean
}

export function CatalogTable({ items, challengeId, challengeType, isAdmin }: Props) {
  const router = useRouter()
  const [editItem, setEditItem] = useState<CatalogItem | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  async function toggleActive(item: CatalogItem) {
    setLoadingId(item.id)
    setToggleError(null)
    try {
      const method = item.isActive ? "DELETE" : "PATCH"
      const body = item.isActive ? undefined : JSON.stringify({ isActive: true })
      const res = await fetch(`/api/catalog/${item.id}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body,
      })
      if (res.ok) {
        router.replace(router.asPath)
      } else {
        const data = await res.json().catch(() => ({}))
        setToggleError(data.error ?? "Akce se nezdařila. Zkus to znovu.")
      }
    } catch {
      setToggleError("Nepodařilo se připojit k serveru.")
    } finally {
      setLoadingId(null)
    }
  }

  function onSaved() {
    setEditItem(null)
    setAddOpen(false)
    router.replace(router.asPath)
  }

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 bg-blue text-white text-[13px] font-bold px-4 py-2 rounded-sm hover:bg-[#0056cc] transition-colors"
          >
            <Plus size={14} />
            Přidat aktivitu
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-[14px] text-gray-mid text-center py-8 italic">
          Katalog aktivit je prázdný.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left border-b border-gray-border">
                <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.4px] text-[11px]">Název</th>
                <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.4px] text-[11px]">Kategorie</th>
                <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.4px] text-[11px]">Jednotka</th>
                <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.4px] text-[11px]">Body/j</th>
                <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.4px] text-[11px]">Min.</th>
                <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.4px] text-[11px]">Typ</th>
                <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.4px] text-[11px]">Stav</th>
                {isAdmin && (
                  <th className="pb-3 text-gray-mid font-semibold uppercase tracking-[0.4px] text-[11px]">Akce</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border">
              {items.map((item) => (
                <tr key={item.id} className={item.isActive ? "" : "opacity-50"}>
                  <td className="py-3 pr-4 font-semibold text-dark">{item.name}</td>
                  <td className="py-3 pr-4 text-gray-dark">{CATEGORY_LABELS[item.category]}</td>
                  <td className="py-3 pr-4 text-gray-dark">{item.unit}</td>
                  <td className="py-3 pr-4 text-dark font-semibold">{item.pointsPerUnit}</td>
                  <td className="py-3 pr-4 text-gray-dark">
                    {item.minValue !== null ? `${item.minValue} ${item.unit}` : <span className="text-gray-mid">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-gray-dark">{TYPE_LABELS[item.challengeType]}</td>
                  <td className="py-3 pr-4">
                    {item.isActive ? (
                      <span className="inline-block bg-[#d1fae5] text-[#065f46] text-[11px] font-bold px-2 py-0.5 rounded-sm">
                        Aktivní
                      </span>
                    ) : (
                      <span className="inline-block bg-[#f3f4f6] text-[#939393] text-[11px] font-bold px-2 py-0.5 rounded-sm">
                        Neaktivní
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditItem(item)}
                          className="p-2.5 text-gray-mid hover:text-blue active:text-blue transition-colors"
                          title="Upravit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleActive(item)}
                          disabled={loadingId === item.id}
                          className="p-2.5 text-gray-mid hover:text-red active:text-red transition-colors disabled:opacity-40"
                          title={item.isActive ? "Deaktivovat" : "Aktivovat"}
                        >
                          {item.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toggleError && (
        <p className="text-[13px] font-semibold text-red mt-3">{toggleError}</p>
      )}

      {/* Add modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Přidat aktivitu do katalogu">
        <CatalogItemForm
          mode="create"
          challengeId={challengeId}
          challengeType={challengeType}
          onSuccess={onSaved}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Upravit aktivitu">
        {editItem && (
          <CatalogItemForm
            mode="edit"
            item={editItem}
            onSuccess={onSaved}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>
    </div>
  )
}

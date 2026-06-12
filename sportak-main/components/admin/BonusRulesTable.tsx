import { useState } from "react"
import { useRouter } from "next/router"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { BonusRuleForm } from "@/components/admin/BonusRuleForm"
import type { BonusRule } from "@/db/schema"

export type { BonusRule }

type CatalogOption = { id: string; name: string }

type Props = {
  rules: BonusRule[]
  challengeId: string
  catalogItems: CatalogOption[]
}

const DAY_NAMES = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"]

function formatDays(json: string | null): string {
  if (!json) return "—"
  try {
    const days = JSON.parse(json) as number[]
    return days.map((d) => DAY_NAMES[d]).join(", ")
  } catch {
    return "—"
  }
}

function formatWindow(start: string | null, end: string | null): string {
  if (!start && !end) return "—"
  if (start && end) return `${start} – ${end}`
  if (start) return `od ${start}`
  return `do ${end}`
}

export function BonusRulesTable({ rules, challengeId, catalogItems }: Props) {
  const router = useRouter()
  const [editRule, setEditRule] = useState<BonusRule | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function deleteRule(id: string) {
    setDeletingId(id)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/bonus-rules/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.replace(router.asPath)
      } else {
        const data = await res.json().catch(() => ({}))
        setDeleteError(data.error ?? "Smazání se nezdařilo. Zkus to znovu.")
      }
    } catch {
      setDeleteError("Nepodařilo se připojit k serveru.")
    } finally {
      setDeletingId(null)
    }
  }

  function onSaved() {
    setEditRule(null)
    setAddOpen(false)
    router.replace(router.asPath)
  }

  const catalogMap = new Map(catalogItems.map((c) => [c.id, c.name]))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-gray-mid">
          {rules.length === 0 ? "Zatím žádná pravidla." : `${rules.length} pravidl${rules.length >= 5 ? "el" : rules.length >= 2 ? "a" : "o"}`}
        </p>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 bg-blue text-white text-[13px] font-semibold px-3 py-1.5 rounded-sm hover:bg-[#0056cc] transition-colors"
        >
          <Plus size={14} />
          Přidat bonus
        </button>
      </div>

      {rules.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-border">
                <th className="text-left py-2 pr-4 font-semibold text-dark">Název</th>
                <th className="text-left py-2 pr-4 font-semibold text-dark">Podmínka</th>
                <th className="text-right py-2 pr-4 font-semibold text-dark">Práh</th>
                <th className="text-left py-2 pr-4 font-semibold text-dark">Aktivita</th>
                <th className="text-left py-2 pr-4 font-semibold text-dark">Okno</th>
                <th className="text-left py-2 pr-4 font-semibold text-dark">Dny</th>
                <th className="text-right py-2 pr-4 font-semibold text-dark">Bonus km</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-border last:border-0 hover:bg-gray-light/50">
                  <td className="py-2.5 pr-4 font-semibold text-dark">{rule.name}</td>
                  <td className="py-2.5 pr-4 text-gray-mid">
                    {rule.conditionType === "COUNT_ACTIVITIES" ? "Počet aktivit" : "Celkové km"}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-dark num">
                    {rule.threshold % 1 === 0 ? rule.threshold : rule.threshold.toFixed(1)}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-mid">
                    {rule.catalogItemIds
                      ? (() => {
                          try {
                            return (JSON.parse(rule.catalogItemIds) as string[])
                              .map((id) => catalogMap.get(id) ?? id)
                              .join(", ")
                          } catch {
                            return "—"
                          }
                        })()
                      : "Všechny"}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-mid">{formatWindow(rule.windowStart, rule.windowEnd)}</td>
                  <td className="py-2.5 pr-4 text-gray-mid">{formatDays(rule.daysOfWeek)}</td>
                  <td className="py-2.5 pr-4 text-right font-bold num" style={{ color: "#18C872" }}>
                    +{rule.bonusPoints % 1 === 0 ? rule.bonusPoints : rule.bonusPoints.toFixed(1)}
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setEditRule(rule)}
                        className="w-10 h-10 flex items-center justify-center rounded-sm text-gray-mid hover:text-blue hover:bg-blue-light active:bg-blue-light transition-colors"
                        title="Upravit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        disabled={deletingId === rule.id}
                        className="w-10 h-10 flex items-center justify-center rounded-sm text-gray-mid hover:text-red hover:bg-red/10 active:bg-red/10 transition-colors disabled:opacity-50"
                        title="Smazat"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteError && (
        <p className="text-[13px] font-semibold text-red mt-3">{deleteError}</p>
      )}

      {/* Add modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Přidat bonus">
        <BonusRuleForm
          mode="create"
          challengeId={challengeId}
          catalogItems={catalogItems}
          onSuccess={onSaved}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editRule} onClose={() => setEditRule(null)} title="Upravit bonus">
        {editRule && (
          <BonusRuleForm
            mode="edit"
            rule={editRule}
            catalogItems={catalogItems}
            onSuccess={onSaved}
            onCancel={() => setEditRule(null)}
          />
        )}
      </Modal>
    </div>
  )
}

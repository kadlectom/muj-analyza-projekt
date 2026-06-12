import { useState, useEffect } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { ActivityOverlay } from "@/components/activities/ActivityOverlay"
import { BottomSheet } from "@/components/activities/BottomSheet"
import { ActivityForm } from "@/components/activities/ActivityForm"
import { avatarColor, getInitials } from "@/lib/avatarColor"
import { formatDate } from "@/lib/formatDate"
import type { CatalogItem } from "@/components/admin/CatalogTable"

type AdminActivityEntry = {
  id: string
  userId: string
  userName: string
  userAvatarUrl: string | null
  catalogItemId: string
  catalogName: string
  catalogEmoji: string | null
  catalogUnit: string
  value: number
  points: number
  date: string
  note: string | null
  createdAt: number
  partners?: { id: string; name: string }[]
}

type Participant = { id: string; name: string; avatarUrl: string | null }

type Props = {
  challengeId: string
  challengeStatus: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED"
  startDate: string
  endDate: string
  catalogItems: CatalogItem[]
  enrolledParticipants?: Participant[]
  partnerBonus?: number
}

export function AdminActivityTable({
  challengeId,
  challengeStatus,
  startDate,
  endDate,
  catalogItems,
  enrolledParticipants,
  partnerBonus,
}: Props) {
  const [data, setData] = useState<AdminActivityEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const isActive = challengeStatus === "ACTIVE"
  const activeCatalogItems = catalogItems.filter((i) => i.isActive)
  const editingActivity = data?.find((a) => a.id === editingId) ?? null

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    fetch(`/api/activities?challengeId=${challengeId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Nepodařilo se načíst aktivity")
        return r.json()
      })
      .then((rows: AdminActivityEntry[]) => { if (!cancelled) setData(rows) })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [challengeId])

  function refresh() {
    setData(null)
    fetch(`/api/activities?challengeId=${challengeId}`)
      .then((r) => r.json())
      .then((rows: AdminActivityEntry[]) => setData(rows))
      .catch(() => setData([]))
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" })
      if (res.ok) {
        setConfirmDeleteId(null)
        refresh()
      } else {
        setDeleteError("Nepodařilo se smazat aktivitu — zkus to znovu")
        setConfirmDeleteId(null)
      }
    } catch {
      setDeleteError("Připojení selhalo — zkus to znovu")
      setConfirmDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }

  function handleEditSuccess() {
    setEditingId(null)
    refresh()
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[14px] text-red mb-3">{error}</p>
        <button
          onClick={refresh}
          className="text-[13px] text-blue hover:underline"
        >
          Zkusit znovu
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 h-10 animate-pulse">
            <div className="w-16 h-4 bg-gray-border rounded" />
            <div className="w-8 h-8 bg-gray-border rounded-full flex-shrink-0" />
            <div className="w-24 h-4 bg-gray-border rounded" />
            <div className="flex-1 h-4 bg-gray-border rounded" />
            <div className="w-16 h-4 bg-gray-border rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[32px] mb-3">📋</p>
        <p className="text-[15px] font-bold text-dark mb-1">Žádné aktivity</p>
        <p className="text-[13px] text-gray-mid">V této výzvě zatím nikdo nic nezapsal.</p>
      </div>
    )
  }

  return (
    <>
      {!isActive && (
        <p className="text-[13px] text-[#92400e] bg-[#fef3c7] rounded-sm px-3 py-2 mb-4">
          Výzva není aktivní — aktivity jsou jen ke čtení.
        </p>
      )}

      {deleteError && (
        <p role="alert" className="text-[13px] text-red bg-red/10 rounded-sm px-3 py-2 mb-3">
          {deleteError}
        </p>
      )}

      <p className="text-[13px] text-gray-mid mb-4">{data.length} aktivit celkem</p>

      {/* ── Mobile card list (< md) ── */}
      <div className="md:hidden flex flex-col divide-y divide-gray-border">
        {data.map((a) => (
          <div key={a.id} className="py-3">
            <div className="flex items-start justify-between gap-2">
              {/* Left: user + activity + meta */}
              <div className="min-w-0 flex-1">
                {/* User row */}
                <div className="flex items-center gap-2 mb-1">
                  {a.userAvatarUrl ? (
                    <img src={a.userAvatarUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: avatarColor(a.userId) }}
                    >
                      {getInitials(a.userName)}
                    </div>
                  )}
                  <span className="text-[13px] font-semibold text-gray-mid truncate">{a.userName}</span>
                  <span className="text-[12px] text-gray-mid flex-shrink-0">{formatDate(a.date)}</span>
                </div>
                {/* Activity */}
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-[15px] font-bold text-dark leading-snug">
                    {a.catalogEmoji && <span className="mr-0.5">{a.catalogEmoji}</span>}
                    {a.catalogName}
                  </span>
                  <span className="text-[13px] text-gray-dark">
                    {a.value % 1 === 0 ? a.value : a.value.toFixed(1)} {a.catalogUnit}
                  </span>
                </div>
                {(a.note || (a.partners && a.partners.length > 0)) && (
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {a.note && <span className="text-[12px] text-gray-mid truncate max-w-[180px]">{a.note}</span>}
                    {a.partners && a.partners.length > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="text-[11px] text-gray-mid">🤝</span>
                        {a.partners.map((p) => (
                          <span key={p.id} className="text-[11px] text-gray-mid">{p.name}</span>
                        ))}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right: points + actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[15px] font-black text-dark num leading-none mr-1">
                  {a.points % 1 === 0 ? a.points : a.points.toFixed(1)}{" "}
                  <span className="text-[12px] font-semibold text-gray-mid">km</span>
                </span>

                {isActive && (
                  confirmDeleteId === a.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(a.id)}
                        disabled={deletingId === a.id}
                        className="text-[13px] font-bold text-red bg-red/10 hover:bg-red/20 px-3 py-2 rounded-sm transition-colors disabled:opacity-60 min-h-[44px]"
                      >
                        {deletingId === a.id ? "…" : "Smazat"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[13px] font-semibold text-gray-mid hover:text-dark transition-colors px-3 py-2 min-h-[44px]"
                      >
                        Zrušit
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <button
                        onClick={() => setEditingId(a.id)}
                        className="text-gray-mid hover:text-blue transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Upravit aktivitu"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(a.id)}
                        className="text-gray-mid hover:text-red transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Smazat aktivitu"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop table (md+) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left border-b border-gray-border">
              <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.06em] text-[11px]">Datum</th>
              <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.06em] text-[11px]">Účastník</th>
              <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.06em] text-[11px]">Aktivita</th>
              <th className="pb-3 pr-4 text-right text-gray-mid font-semibold uppercase tracking-[0.06em] text-[11px]">Výkon</th>
              <th className="pb-3 pr-4 text-right text-gray-mid font-semibold uppercase tracking-[0.06em] text-[11px]">Km body</th>
              <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.06em] text-[11px]">Poznámka</th>
              {isActive && (
                <th className="pb-3 text-right text-gray-mid font-semibold uppercase tracking-[0.06em] text-[11px] w-[150px]">Akce</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border">
            {data.map((a) => (
              <tr key={a.id}>
                <td className="py-3 pr-4 text-gray-dark whitespace-nowrap">{formatDate(a.date)}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    {a.userAvatarUrl ? (
                      <img src={a.userAvatarUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                        style={{ backgroundColor: avatarColor(a.userId) }}
                      >
                        {getInitials(a.userName)}
                      </div>
                    )}
                    <span className="font-semibold text-dark whitespace-nowrap">{a.userName}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 font-semibold text-dark">
                  <div>
                    <span>
                      {a.catalogEmoji && <span className="mr-1">{a.catalogEmoji}</span>}
                      {a.catalogName}
                    </span>
                    {a.partners && a.partners.length > 0 && (
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-gray-mid">🤝</span>
                        {a.partners.map((p) => (
                          <span key={p.id} className="text-[11px] text-gray-mid font-normal">{p.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 text-right text-gray-dark whitespace-nowrap num">
                  {a.value % 1 === 0 ? a.value : a.value.toFixed(1)} {a.catalogUnit}
                </td>
                <td className="py-3 pr-4 text-right text-dark font-semibold num whitespace-nowrap">
                  {a.points % 1 === 0 ? a.points : a.points.toFixed(1)} km
                </td>
                <td className="py-3 pr-4 text-gray-mid max-w-[160px] truncate">{a.note ?? "—"}</td>
                {isActive && (
                  <td className="py-3 whitespace-nowrap w-[150px]">
                    {confirmDeleteId === a.id ? (
                      <div className="flex items-center justify-end gap-1.5 h-9">
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deletingId === a.id}
                          className="h-9 inline-flex items-center text-[12px] font-bold text-red hover:bg-red/10 px-2.5 rounded-sm transition-colors disabled:opacity-60"
                        >
                          {deletingId === a.id ? "…" : "Smazat"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="h-9 inline-flex items-center text-[12px] font-semibold text-gray-mid hover:text-dark transition-colors px-1.5"
                        >
                          Zrušit
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end h-9">
                        <button
                          onClick={() => setEditingId(a.id)}
                          className="h-9 w-9 inline-flex items-center justify-center text-gray-mid hover:text-blue active:text-blue transition-colors rounded-sm"
                          aria-label="Upravit aktivitu"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(a.id)}
                          className="h-9 w-9 inline-flex items-center justify-center text-gray-mid hover:text-red active:text-red transition-colors rounded-sm ml-0.5"
                          aria-label="Smazat aktivitu"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit overlay — desktop (md+) */}
      <ActivityOverlay
        isOpen={!!editingActivity}
        onClose={() => setEditingId(null)}
        title="Upravit aktivitu"
      >
        {editingActivity && (
          <ActivityForm
            mode="edit"
            activity={{
              id: editingActivity.id,
              catalogItemId: editingActivity.catalogItemId,
              value: editingActivity.value,
              date: editingActivity.date,
              note: editingActivity.note,
              partnerIds: editingActivity.partners?.map((p) => p.id) ?? [],
            }}
            challengeId={challengeId}
            startDate={startDate}
            endDate={endDate}
            catalogItems={activeCatalogItems}
            enrolledParticipants={enrolledParticipants?.filter((p) => p.id !== editingActivity.userId)}
            partnerBonus={partnerBonus}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingId(null)}
          />
        )}
      </ActivityOverlay>

      {/* Edit sheet — mobile (< md) */}
      <BottomSheet
        isOpen={!!editingActivity}
        onClose={() => setEditingId(null)}
        title="Upravit aktivitu"
      >
        {editingActivity && (
          <ActivityForm
            mode="edit"
            activity={{
              id: editingActivity.id,
              catalogItemId: editingActivity.catalogItemId,
              value: editingActivity.value,
              date: editingActivity.date,
              note: editingActivity.note,
              partnerIds: editingActivity.partners?.map((p) => p.id) ?? [],
            }}
            challengeId={challengeId}
            startDate={startDate}
            endDate={endDate}
            catalogItems={activeCatalogItems}
            enrolledParticipants={enrolledParticipants?.filter((p) => p.id !== editingActivity.userId)}
            partnerBonus={partnerBonus}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingId(null)}
          />
        )}
      </BottomSheet>
    </>
  )
}

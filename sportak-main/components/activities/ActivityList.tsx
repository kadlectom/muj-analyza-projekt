import { useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { ActivityOverlay } from "@/components/activities/ActivityOverlay"
import { BottomSheet } from "@/components/activities/BottomSheet"
import { ActivityForm } from "@/components/activities/ActivityForm"
import { ActivityScoreBlock } from "@/components/activities/ActivityScoreBlock"
import { formatDate } from "@/lib/formatDate"

export type ActivityEntry = {
  id: string
  catalogItemId: string
  catalogName: string
  catalogEmoji: string | null
  catalogUnit: string
  value: number
  /** Base points the CURRENT user earned from this row. Same as the actor for viaPartner rows. */
  points: number
  /** Partner bonus the current user earned from this row (0 if none). */
  partnerBonus: number
  date: string
  note: string | null
  createdAt: number
  partners?: { id: string; name: string }[]
  viaPartner?: { id: string; name: string }
}

type CatalogOption = {
  id: string
  name: string
  emoji: string | null
  unit: string
  pointsPerUnit: number
  minValue: number | null
  category: string
}

type Participant = { id: string; name: string; avatarUrl: string | null }

type Props = {
  activities: ActivityEntry[]
  challengeId: string
  startDate: string
  endDate: string
  catalogItems: CatalogOption[]
  isActive: boolean
  enrolledParticipants?: Participant[]
  partnerBonus?: number
  currentUserId?: string
}

export function ActivityList({
  activities,
  challengeId,
  startDate,
  endDate,
  catalogItems,
  isActive,
  enrolledParticipants,
  partnerBonus,
  currentUserId,
}: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const editingActivity = activities.find((a) => a.id === editingId) ?? null

  async function handleDelete(id: string) {
    setDeletingId(id)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.replace(router.asPath)
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

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[32px] mb-3">📝</p>
        <p className="text-[15px] font-bold text-dark mb-1">Čas přidat první kilometry!</p>
        <p className="text-[13px] text-gray-mid">Přidej první kilometry a začni stoupat v žebříčku!</p>
      </div>
    )
  }

  // Partners available for the edit picker (exclude the activity owner — which is currentUserId for own activities)
  const editPartnerOptions = enrolledParticipants?.filter((p) => p.id !== currentUserId) ?? []

  const editForm = (activity: ActivityEntry) => (
    <ActivityForm
      mode="edit"
      activity={{
        id: activity.id,
        catalogItemId: activity.catalogItemId,
        value: activity.value,
        date: activity.date,
        note: activity.note,
        partnerIds: activity.partners?.map((p) => p.id) ?? [],
      }}
      challengeId={challengeId}
      startDate={startDate}
      endDate={endDate}
      catalogItems={catalogItems}
      enrolledParticipants={editPartnerOptions}
      partnerBonus={partnerBonus}
      onSuccess={() => {
        setEditingId(null)
        router.replace(router.asPath)
      }}
      onCancel={() => setEditingId(null)}
    />
  )

  return (
    <>
      {deleteError && (
        <p role="alert" className="text-[13px] text-red bg-red/10 rounded-sm px-3 py-2 mb-3">
          {deleteError}
        </p>
      )}

      {/* ── Mobile card list (< md) ── */}
      <div className="md:hidden flex flex-col divide-y divide-gray-border">
        {activities.map((a) => (
          <div
            key={`${a.id}-${a.viaPartner ? "via" : "own"}`}
            className={`py-3 ${a.viaPartner ? "opacity-80" : ""}`}
          >
            {confirmDeleteId === a.id ? (
              /* Confirm overlay — replaces the row content while preserving height anchor */
              <div className="flex items-center gap-2 bg-red/5 rounded-md px-2 py-2 -mx-1">
                <span className="text-[20px] flex-shrink-0">{a.catalogEmoji ?? "🏅"}</span>
                <span className="text-[13px] font-semibold text-dark flex-1 truncate">Opravdu smazat?</span>
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  className="text-[13px] font-bold text-red bg-red/10 hover:bg-red/20 px-3 py-2 rounded-sm transition-colors disabled:opacity-60 min-h-[44px] flex-shrink-0"
                >
                  {deletingId === a.id ? "…" : "Smazat"}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-[13px] font-semibold text-gray-mid hover:text-dark transition-colors px-2 py-2 min-h-[44px] flex-shrink-0"
                >
                  Zrušit
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                {/* Left: activity name + meta */}
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-[15px] font-bold text-dark leading-snug">
                      {a.catalogEmoji && <span className="mr-0.5">{a.catalogEmoji}</span>}
                      {a.catalogName}
                    </span>
                    <span className="text-[13px] text-gray-dark">
                      {a.value % 1 === 0 ? a.value : a.value.toFixed(1)} {a.catalogUnit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[12px] text-gray-mid">{formatDate(a.date)}</span>
                    {a.note && (
                      <span className="text-[12px] text-gray-mid truncate max-w-[180px]">{a.note}</span>
                    )}
                    {!a.viaPartner && a.partners && a.partners.length > 0 && (
                      <span className="flex items-center gap-1 flex-wrap">
                        <span className="text-[11px] text-gray-mid">🤝</span>
                        {a.partners.map((p) => (
                          <Link key={p.id} href={`/users/${p.id}?from=${challengeId}`} className="text-[11px] text-gray-mid hover:text-blue transition-colors">{p.name}</Link>
                        ))}
                        {a.partnerBonus > 0 && (
                          <span className="text-[11px] font-semibold" style={{ color: "#d97706" }}>· +{a.partnerBonus % 1 === 0 ? a.partnerBonus : a.partnerBonus.toFixed(1)} km</span>
                        )}
                      </span>
                    )}
                    {a.viaPartner && (
                      <span className="text-[11px] text-gray-mid">
                        🤝{" "}
                        <Link href={`/users/${a.viaPartner.id}?from=${challengeId}`} className="hover:text-blue transition-colors">{a.viaPartner.name}</Link>
                        {a.partnerBonus > 0 && (
                          <span className="ml-1 font-semibold" style={{ color: "#d97706" }}>· +{a.partnerBonus % 1 === 0 ? a.partnerBonus : a.partnerBonus.toFixed(1)} km</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: points + actions */}
                <div className="flex items-start gap-1 flex-shrink-0">
                  <div className="mr-1">
                    <ActivityScoreBlock basePoints={a.points} partnerBonus={a.partnerBonus} />
                  </div>

                  {isActive && !a.viaPartner && (
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
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Desktop table (md+) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left border-b border-gray-border">
              <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.06em] text-[11px]">Datum</th>
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
            {activities.map((a) => (
              <tr key={`${a.id}-${a.viaPartner ? "via" : "own"}`} className={a.viaPartner ? "opacity-80" : ""}>
                <td className="py-3 pr-4 text-gray-dark whitespace-nowrap">{formatDate(a.date)}</td>
                <td className="py-3 pr-4 font-semibold text-dark">
                  <div>
                    <span>
                      {a.catalogEmoji && <span className="mr-1">{a.catalogEmoji}</span>}
                      {a.catalogName}
                    </span>
                    {!a.viaPartner && a.partners && a.partners.length > 0 && (
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-gray-mid">🤝</span>
                        {a.partners.map((p) => (
                          <Link key={p.id} href={`/users/${p.id}?from=${challengeId}`} className="text-[11px] text-gray-mid font-normal hover:text-blue transition-colors">{p.name}</Link>
                        ))}
                        {a.partnerBonus > 0 && (
                          <span className="text-[11px] font-semibold" style={{ color: "#d97706" }}>· +{a.partnerBonus % 1 === 0 ? a.partnerBonus : a.partnerBonus.toFixed(1)} km</span>
                        )}
                      </div>
                    )}
                    {a.viaPartner && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-gray-mid">🤝 zaznamenal/a</span>
                        <Link href={`/users/${a.viaPartner.id}?from=${challengeId}`} className="text-[11px] text-gray-mid font-normal hover:text-blue transition-colors">{a.viaPartner.name}</Link>
                        {a.partnerBonus > 0 && (
                          <span className="text-[11px] font-semibold" style={{ color: "#d97706" }}>· +{a.partnerBonus % 1 === 0 ? a.partnerBonus : a.partnerBonus.toFixed(1)} km</span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 text-right text-gray-dark whitespace-nowrap num">
                  {a.value % 1 === 0 ? a.value : a.value.toFixed(1)} {a.catalogUnit}
                </td>
                <td className="py-3 pr-4 text-right">
                  <ActivityScoreBlock basePoints={a.points} partnerBonus={a.partnerBonus} size="sm" />
                </td>
                <td className="py-3 pr-4 text-gray-mid max-w-[200px] truncate">{a.note ?? "—"}</td>
                {isActive && (
                  <td className="py-3 whitespace-nowrap w-[150px]">
                    {!a.viaPartner && (
                      // Both modes wrap in a fixed-height (h-9) flex container so swapping
                      // between the icon row and the confirm buttons doesn't change the
                      // table row height — that was causing the whole column to jump
                      // when a user clicked the trash icon.
                      confirmDeleteId === a.id ? (
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
                            className="h-9 w-9 inline-flex items-center justify-center text-gray-mid hover:text-blue transition-colors rounded-sm"
                            aria-label="Upravit aktivitu"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(a.id)}
                            className="h-9 w-9 inline-flex items-center justify-center text-gray-mid hover:text-red transition-colors rounded-sm ml-0.5"
                            aria-label="Smazat aktivitu"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )
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
        {editingActivity && editForm(editingActivity)}
      </ActivityOverlay>

      {/* Edit sheet — mobile (< md) */}
      <BottomSheet
        isOpen={!!editingActivity}
        onClose={() => setEditingId(null)}
        title="Upravit aktivitu"
      >
        {editingActivity && editForm(editingActivity)}
      </BottomSheet>
    </>
  )
}

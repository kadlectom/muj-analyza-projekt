import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { avatarColor, getInitials } from "@/lib/avatarColor"
import { formatDate } from "@/lib/formatDate"
import type { AuditEntry } from "@/pages/api/audit/challenge/[id]"

function Avatar({ name, avatarUrl, userId }: { name: string; avatarUrl: string | null; userId: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
  }
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
      style={{ backgroundColor: avatarColor(userId) }}
    >
      {getInitials(name)}
    </div>
  )
}

function diffSummary(entry: AuditEntry): string {
  if (entry.action === "DELETE") {
    const b = entry.diff.before
    if (!b) return ""
    const pts = typeof b.points === "number"
      ? (b.points % 1 === 0 ? String(b.points) : b.points.toFixed(1))
      : null
    const date = typeof b.date === "string" ? ` ze dne ${formatDate(b.date)}` : ""
    return pts ? `${pts} km${date}` : date.trim()
  }

  if (entry.action === "UPDATE") {
    const a = entry.diff.after
    if (!a) return ""
    const parts: string[] = []
    if (typeof a.points === "number") {
      const b = entry.diff.before
      const before = typeof b?.points === "number"
        ? (b.points % 1 === 0 ? String(b.points) : b.points.toFixed(1))
        : null
      const after = a.points % 1 === 0 ? String(a.points) : a.points.toFixed(1)
      if (before && before !== after) parts.push(`${before} → ${after} km`)
    }
    if (typeof a.date === "string") {
      parts.push(`datum: ${formatDate(a.date)}`)
    }
    if (typeof a.note === "string" || a.note === null) {
      parts.push("poznámka upravena")
    }
    return parts.join(" · ")
  }

  return ""
}

function actionLabel(action: AuditEntry["action"]): string {
  if (action === "DELETE") return "smazal aktivitu"
  if (action === "UPDATE") return "upravil aktivitu"
  return "změnil data"
}

function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "právě teď"
  if (diffMin < 60) return `před ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `před ${diffH} h`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return "včera"
  return `před ${diffD} dny`
}

export function AuditLogSection({ challengeId }: { challengeId: string }) {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/audit/challenge/${challengeId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: AuditEntry[]) => { if (!cancelled) setEntries(data) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [challengeId])

  // Loading
  if (entries === null && !error) return null

  // Error — silent, don't break the leaderboard
  if (error) return null

  const hasEntries = entries!.length > 0

  return (
    <div className="mt-6 border-t border-gray-border pt-4">
      {!hasEntries ? (
        <div className="flex items-center gap-2 py-1">
          <span
            className="flex items-center justify-center w-5 h-5 rounded-full text-[11px] flex-shrink-0"
            style={{ background: "#d1fae5", color: "#065f46" }}
          >
            ✓
          </span>
          <span className="text-[13px] text-gray-mid">Žádné zásahy administrátora</span>
        </div>
      ) : (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between py-1 text-left"
          >
            <span className="text-[13px] font-semibold text-gray-mid">
              Zásahy administrátora
              <span className="ml-1.5 text-[12px] font-bold px-1.5 py-0.5 rounded bg-gray-border text-gray-dark">
                {entries!.length}
              </span>
            </span>
            {expanded
              ? <ChevronUp size={15} className="text-gray-mid flex-shrink-0" />
              : <ChevronDown size={15} className="text-gray-mid flex-shrink-0" />
            }
          </button>

          {expanded && (
            <ul className="mt-3 space-y-3">
              {entries!.map((entry) => {
                const summary = diffSummary(entry)
                return (
                  <li key={entry.id} className="flex items-start gap-3">
                    <Avatar
                      name={entry.actorName}
                      avatarUrl={entry.actorAvatarUrl}
                      userId={entry.actorId}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-dark leading-snug">
                        <span className="font-semibold">{entry.actorName}</span>
                        {" "}{actionLabel(entry.action)}{" "}
                        {entry.targetUserName && (
                          <>uživatele <span className="font-semibold">{entry.targetUserName}</span></>
                        )}
                        {summary && (
                          <span className="text-gray-mid"> · {summary}</span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-mid mt-0.5">{relativeTime(entry.createdAt)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

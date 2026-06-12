import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { avatarColor, getInitials } from "@/lib/avatarColor"
import { Podium, PodiumSkeleton } from "./Podium"

export type LeaderboardEntry = {
  userId: string
  name: string
  avatarUrl: string | null
  totalKm: number
  bonusKm: number
  rank: number
  /** Rank as of 7 days ago. Null if the user wasn't on the leaderboard then. */
  previousRank: number | null
}

type Props = {
  challengeId: string
  currentUserId: string
  initialData?: LeaderboardEntry[]
}

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" }
const RANK_COLORS: Record<number, string> = {
  1: "text-[#f59e0b]",
  2: "text-[#94a3b8]",
  3: "text-[#b45309]",
}
const MEDAL_COLOR: Record<number, string> = {
  1: "#f59e0b",
  2: "#94a3b8",
  3: "#b45309",
}


export function LeaderboardTable({ challengeId, currentUserId, initialData }: Props) {
  const [data, setData] = useState<LeaderboardEntry[] | null>(initialData ?? null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  // Tracked as state (callback ref) so the observer/scroll effects re-fire the
  // moment the user's row attaches or detaches — useRef wouldn't notify them.
  const [myMobileRowEl, setMyMobileRowEl] = useState<HTMLDivElement | null>(null)
  const myDesktopRowRef = useRef<HTMLTableRowElement>(null)
  // True iff the user's mobile row is currently within the viewport. Drives the
  // sticky "Moje pozice" pill — it only appears once the row scrolls out of view.
  const [isMyRowVisible, setIsMyRowVisible] = useState(true)

  useEffect(() => {
    const target = window.matchMedia("(min-width: 768px)").matches
      ? myDesktopRowRef.current
      : myMobileRowEl
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [data, myMobileRowEl])

  // Watch the user's mobile row for viewport visibility. The negative bottom
  // rootMargin treats the row as "out of view" once it slips under the floating
  // Zapsat CTA — otherwise observer would say "still intersecting" for a row
  // the user can't actually see. Re-runs whenever the row element changes.
  useEffect(() => {
    if (!myMobileRowEl) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsMyRowVisible(entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -100px 0px" },
    )
    observer.observe(myMobileRowEl)
    return () => observer.disconnect()
  }, [myMobileRowEl])

  useEffect(() => {
    // Skip initial fetch when server-side data was provided — only fetch on explicit retry
    if (initialData && retryCount === 0) return

    let cancelled = false
    setData(null)
    setError(null)

    fetch(`/api/leaderboard?challengeId=${challengeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Nepodařilo se načíst žebříček")
        return res.json()
      })
      .then((rows) => { if (!cancelled) setData(rows) })
      .catch((err) => { if (!cancelled) setError(err.message) })

    return () => { cancelled = true }
  }, [challengeId, retryCount])

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[14px] text-red mb-3">{error}</p>
        <button
          onClick={() => setRetryCount((n) => n + 1)}
          className="text-[13px] font-semibold text-blue hover:underline"
        >
          Zkusit znovu
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <>
        <PodiumSkeleton />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 h-12 animate-pulse">
              <div className="w-8 h-4 bg-gray-border rounded" />
              <div className="w-8 h-8 bg-gray-border rounded-full" />
              <div className="flex-1 h-4 bg-gray-border rounded" />
              <div className="w-16 h-4 bg-gray-border rounded" />
            </div>
          ))}
        </div>
      </>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[32px] mb-3">🏆</p>
        <p className="text-[15px] font-bold text-dark mb-1">Žebříček čeká na krále!</p>
        <p className="text-[13px] text-gray-mid">Buď první, kdo rozhýbá závod!</p>
      </div>
    )
  }

  const podiumEntries = data.filter((e) => e.rank <= 3).slice(0, 3)
  const podiumActive = podiumEntries.some((e) => e.totalKm > 0)
  const podiumIds = new Set(podiumActive ? podiumEntries.map((e) => e.userId) : [])
  const mobileTableRows = data.filter((e) => !podiumIds.has(e.userId))

  const meRow = data.find((e) => e.userId === currentUserId) ?? null
  const showMyPosition = podiumActive && meRow !== null && !podiumIds.has(meRow.userId) && meRow.totalKm > 0
  const lastPodium = podiumEntries[podiumEntries.length - 1]
  const gapToPodium = lastPodium && meRow ? Math.max(0, lastPodium.totalKm - meRow.totalKm) : 0

  return (
    <>
      {/* ── Mobile podium (top 3 cards) ── */}
      {podiumActive && (
        <div className="md:hidden">
          <Podium entries={podiumEntries} currentUserId={currentUserId} challengeId={challengeId} />
        </div>
      )}

      {/* ── Mobile list (excludes top 3) ── */}
      {mobileTableRows.length > 0 && (
        <div className="md:hidden flex flex-col divide-y divide-gray-border">
          {mobileTableRows.map((entry, index) => {
            const isMe = entry.userId === currentUserId
            return (
              <div
                key={entry.userId}
                ref={isMe ? setMyMobileRowEl : undefined}
                className={`flex items-center gap-3 py-4 ${isMe ? "bg-blue-light -mx-3 px-3 rounded-md" : ""}`}
                style={{ animation: "row-enter 0.22s ease-out both", animationDelay: `${index * 0.04}s` }}
              >
                <div className="w-9 flex-shrink-0 text-center">
                  <span className={`block font-bold text-[17px] leading-none ${RANK_COLORS[entry.rank] ?? "text-gray-mid"}`}>
                    {MEDALS[entry.rank] ?? `${entry.rank}.`}
                  </span>
                  <MobilePosun rank={entry.rank} previousRank={entry.previousRank} />
                </div>

                <Link href={`/users/${entry.userId}?from=${challengeId}`} className="flex-shrink-0">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt="" loading="lazy" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
                      style={{ backgroundColor: avatarColor(entry.userId) }}
                    >
                      {getInitials(entry.name)}
                    </div>
                  )}
                </Link>

                <Link href={`/users/${entry.userId}?from=${challengeId}`} className="flex-1 min-w-0 group">
                  <span className="font-semibold text-dark group-hover:text-blue transition-colors truncate block text-[15px]">
                    {entry.name}
                    {isMe && (
                      <span className="ml-2 text-[11px] font-bold text-blue bg-blue/10 px-1.5 py-0.5 rounded">Já</span>
                    )}
                  </span>
                </Link>

                <div className="flex-shrink-0 text-right">
                  <span className="num font-bold text-dark" style={{ fontFamily: "var(--font-display)", fontSize: 17, letterSpacing: "0.01em" }}>
                    {entry.totalKm % 1 === 0 ? entry.totalKm : entry.totalKm.toFixed(1)}{" "}
                    <span className="text-[13px] font-semibold text-gray-mid">km</span>
                  </span>
                  {entry.bonusKm > 0 && (
                    <span className="block text-[11px] font-semibold text-[#d97706] num">
                      🏆 z toho {entry.bonusKm % 1 === 0 ? entry.bonusKm : entry.bonusKm.toFixed(1)} km
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Mobile sticky "Moje pozice" pill — appears once my list row scrolls out of view ── */}
      {showMyPosition && meRow && (
        <div
          className={`md:hidden fixed left-3 right-3 z-30 bg-blue-light rounded-[12px] px-3 py-2.5 shadow-lg flex items-center gap-3 transition-all duration-200 ease-out ${
            isMyRowVisible
              ? "opacity-0 translate-y-2 pointer-events-none"
              : "opacity-100 translate-y-0"
          }`}
          style={{ bottom: "calc(100px + env(safe-area-inset-bottom))" }}
          aria-hidden={isMyRowVisible}
        >
          <span
            className="font-bold text-blue text-center w-8 flex-shrink-0 num"
            style={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 1 }}
          >
            {meRow.rank}.
          </span>
          <Link href={`/users/${meRow.userId}?from=${challengeId}`} className="flex-shrink-0">
            {meRow.avatarUrl ? (
              <img src={meRow.avatarUrl} alt="" loading="lazy" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                style={{ backgroundColor: avatarColor(meRow.userId) }}
              >
                {getInitials(meRow.name)}
              </div>
            )}
          </Link>
          <Link href={`/users/${meRow.userId}?from=${challengeId}`} className="flex-1 min-w-0 group">
            <span className="block font-semibold text-dark truncate group-hover:text-blue transition-colors text-[14px]">
              {meRow.name}
              <span className="ml-1.5 text-[10px] font-bold text-blue bg-blue/10 px-1.5 py-0.5 rounded">Já</span>
            </span>
            {gapToPodium > 0 && (
              <span className="block text-[11px] font-semibold mt-0.5" style={{ color: "#d97706" }}>
                +{gapToPodium % 1 === 0 ? gapToPodium : gapToPodium.toFixed(1)} km do {lastPodium.rank}. místa
              </span>
            )}
          </Link>
          <span
            className="num font-bold text-dark flex-shrink-0 whitespace-nowrap"
            style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1 }}
          >
            {meRow.totalKm % 1 === 0 ? meRow.totalKm : meRow.totalKm.toFixed(1)}
            <span className="ml-1 text-[12px] font-semibold text-gray-mid">km</span>
          </span>
        </div>
      )}

      {/* ── Desktop unified table (top 3 + rest, with Posun column) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left border-b border-gray-border">
              <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.06em] text-[11px] w-12">#</th>
              <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.06em] text-[11px]">Účastník</th>
              <th className="pb-3 pr-4 text-gray-mid font-semibold uppercase tracking-[0.06em] text-[11px] text-right">Skóre</th>
              <th className="pb-3 text-gray-mid font-semibold uppercase tracking-[0.06em] text-[11px] text-right w-20">Posun</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border">
            {data.map((entry, index) => {
              const isMe = entry.userId === currentUserId
              return (
                <tr
                  key={entry.userId}
                  ref={isMe ? myDesktopRowRef : undefined}
                  className={isMe ? "bg-blue-light" : ""}
                  style={{ animation: "row-enter 0.22s ease-out both", animationDelay: `${index * 0.04}s` }}
                >
                  <td className={`py-3 pr-4 font-bold text-[16px] ${RANK_COLORS[entry.rank] ?? "text-gray-mid"}`}>
                    {entry.rank}.
                  </td>
                  <td className="py-3 pr-4">
                    <Link href={`/users/${entry.userId}?from=${challengeId}`} className="flex items-center gap-3 group w-fit">
                      <DesktopAvatar entry={entry} />
                      <span className="font-semibold text-dark group-hover:text-blue transition-colors">
                        {entry.name}
                        {isMe && (
                          <span className="ml-2 text-[11px] font-bold text-blue bg-blue-light px-1.5 py-0.5 rounded">
                            Já
                          </span>
                        )}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="num" style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--dark)", letterSpacing: "0.01em" }}>
                      {entry.totalKm % 1 === 0 ? entry.totalKm : entry.totalKm.toFixed(1)} km
                    </span>
                    {entry.bonusKm > 0 && (
                      <span className="block text-[11px] font-semibold text-[#d97706] num">
                        🏆 z toho {entry.bonusKm % 1 === 0 ? entry.bonusKm : entry.bonusKm.toFixed(1)} km bonus
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <Trend rank={entry.rank} previousRank={entry.previousRank} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

function DesktopAvatar({ entry }: { entry: LeaderboardEntry }) {
  const ringStyle = entry.rank <= 3
    ? { boxShadow: `0 0 0 2px ${MEDAL_COLOR[entry.rank]}` }
    : undefined
  if (entry.avatarUrl) {
    return (
      <img
        src={entry.avatarUrl}
        alt=""
        loading="lazy"
        className="w-8 h-8 rounded-full object-cover"
        style={ringStyle}
      />
    )
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
      style={{ backgroundColor: avatarColor(entry.userId), ...ringStyle }}
    >
      {getInitials(entry.name)}
    </div>
  )
}

/**
 * Compact inline trend used inside mobile rows. Returns null when there's
 * nothing meaningful to show — leaders and unchanged ranks stay quiet so
 * the indicator only draws the eye when something actually moved.
 */
function MobilePosun({ rank, previousRank }: { rank: number; previousRank: number | null }) {
  if (rank === 1) return null
  if (previousRank === null) {
    return (
      <span className="inline-block mt-1 text-[9px] font-bold text-green bg-green/10 px-1 py-0.5 rounded-full leading-none whitespace-nowrap">
        NOVÝ
      </span>
    )
  }
  if (previousRank === rank) return null
  const delta = previousRank - rank
  if (delta > 0) {
    return <span className="block mt-1 text-[10px] font-bold text-green leading-none">▲{delta}</span>
  }
  return <span className="block mt-1 text-[10px] font-bold text-red leading-none">▼{-delta}</span>
}

function Trend({ rank, previousRank }: { rank: number; previousRank: number | null }) {
  // The leader has nowhere to climb to — show a trophy instead of a delta.
  if (rank === 1) {
    return <span className="text-[16px]" aria-label="Lídr">🏆</span>
  }
  if (previousRank === null) {
    return (
      <span className="inline-block text-[10px] font-bold text-green bg-green/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
        ▲ NOVÝ
      </span>
    )
  }
  if (previousRank === rank) {
    return <span className="text-gray-mid font-bold">–</span>
  }
  const delta = previousRank - rank
  if (delta > 0) {
    return <span className="text-green font-bold whitespace-nowrap">▲{delta}</span>
  }
  return <span className="text-red font-bold whitespace-nowrap">▼{-delta}</span>
}

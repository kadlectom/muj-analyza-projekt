import { useState, useEffect } from "react"
import { avatarColor, getInitials } from "@/lib/avatarColor"

type LeaderboardEntry = {
  userId: string
  name: string
  avatarUrl: string | null
  totalKm: number
  rank: number
}

type Props = {
  challengeId: string
  currentUserId: string
}

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" }
const RANK_COLORS: Record<number, string> = {
  1: "#f59e0b",
  2: "#94a3b8",
  3: "#b45309",
}

function LeaderRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 ${isMe ? "bg-blue-light" : ""}`}>
      <span
        className="text-[15px] font-extrabold w-6 text-center flex-shrink-0"
        style={{ color: RANK_COLORS[entry.rank] ?? "#8B909E" }}
      >
        {MEDALS[entry.rank] ?? `${entry.rank}.`}
      </span>
      {entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
          alt=""
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
          style={{ backgroundColor: avatarColor(entry.userId) }}
        >
          {getInitials(entry.name)}
        </div>
      )}
      <span className="flex-1 text-[14px] font-semibold text-dark truncate">
        {entry.name}
        {isMe && (
          <span className="ml-1.5 text-[10px] font-bold text-blue bg-blue-light px-1.5 py-0.5 rounded">
            Já
          </span>
        )}
      </span>
      <span className="text-[14px] font-extrabold text-dark flex-shrink-0 num" style={{ fontFamily: "var(--font-display)" }}>
        {entry.totalKm % 1 === 0 ? entry.totalKm : entry.totalKm.toFixed(1)} km
      </span>
    </div>
  )
}

export function MiniLeaderboard({ challengeId, currentUserId }: Props) {
  const [data, setData] = useState<LeaderboardEntry[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/leaderboard?challengeId=${challengeId}`)
      .then((r) => r.json())
      .then((rows) => { if (!cancelled) setData(rows) })
      .catch(() => { if (!cancelled) setData([]) })
    return () => { cancelled = true }
  }, [challengeId])

  const top3 = data?.slice(0, 3) ?? []
  const userEntry = data?.find((e) => e.userId === currentUserId)
  const userInTop3 = top3.some((e) => e.userId === currentUserId)

  return (
    <div>
      <div className="px-5 py-4 border-b border-gray-border">
        <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-gray-mid">Žebříček</p>
      </div>

      {data === null ? (
        <div className="space-y-3 px-5 py-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-6 h-4 bg-gray-border rounded" />
              <div className="w-8 h-8 bg-gray-border rounded-full" />
              <div className="flex-1 h-4 bg-gray-border rounded" />
              <div className="w-14 h-4 bg-gray-border rounded" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-[28px] mb-2">🏆</p>
          <p className="text-[14px] font-bold text-dark mb-0.5">Závod ještě nezačal</p>
          <p className="text-[12px] text-gray-mid">Přidej první aktivitu a vezmi si vedení!</p>
        </div>
      ) : (
        <div>
          {top3.map((entry, i) => (
            <div key={entry.userId} style={{ animation: "row-enter 0.22s ease-out both", animationDelay: `${i * 0.05}s` }}>
              <LeaderRow entry={entry} isMe={entry.userId === currentUserId} />
            </div>
          ))}
          {!userInTop3 && userEntry && (
            <>
              <div className="mx-5 py-1.5 flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-border" />
                <span className="text-[11px] text-gray-mid">···</span>
                <div className="flex-1 h-px bg-gray-border" />
              </div>
              <LeaderRow entry={userEntry} isMe={true} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

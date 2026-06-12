import Link from "next/link"
import { StatusBadge } from "./StatusBadge"
import { formatDate } from "@/lib/formatDate"
import { avatarColor, getInitials } from "@/lib/avatarColor"
import type { LeaderboardEntry } from "@/lib/leaderboardCalc"

export type ArchiveChallengeData = {
  id: string
  slug: string | null
  name: string
  type: "WINTER" | "SUMMER"
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED"
  startDate: string
  endDate: string
  participantCount: number
  progressPercent: number
  joined: boolean
  podium: LeaderboardEntry[]
}

const RANK_COLORS: Record<number, string> = {
  1: "#f59e0b",
  2: "#94a3b8",
  3: "#b45309",
}
const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" }

function PodiumRow({ entry, challengeId }: { entry: LeaderboardEntry; challengeId: string }) {
  return (
    <li className="flex items-center gap-2 py-0.5">
      <span className="text-[13px] w-5 text-center flex-shrink-0" style={{ color: RANK_COLORS[entry.rank] ?? "#939393" }}>
        {RANK_MEDALS[entry.rank] ?? `${entry.rank}.`}
      </span>
      <Link
        href={`/users/${entry.userId}?from=${challengeId}`}
        className="flex items-center gap-2 flex-1 min-w-0 group no-underline"
      >
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt="" className="w-[18px] h-[18px] rounded-full object-cover flex-shrink-0" />
        ) : (
          <div
            className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{ background: avatarColor(entry.userId), fontSize: 7, fontWeight: 700 }}
          >
            {getInitials(entry.name)}
          </div>
        )}
        <span className="flex-1 text-[12px] font-semibold text-dark truncate group-hover:text-blue transition-colors">
          {entry.name}
        </span>
      </Link>
      <span className="font-display text-[13px] font-bold num text-gray-dark flex-shrink-0">
        {entry.totalKm % 1 === 0 ? entry.totalKm : entry.totalKm.toFixed(1)} km
      </span>
    </li>
  )
}

type Props = { challenge: ArchiveChallengeData; currentUserId: string }

export function ArchiveCard({ challenge: c, currentUserId }: Props) {
  const myPodiumEntry = c.joined ? c.podium.find(e => e.userId === currentUserId) : null
  const href = `/challenges/${c.slug ?? c.id}`

  return (
    <div className="bg-white rounded-md border border-gray-border p-4 hover:shadow-sm transition-shadow flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-[3px] rounded-full uppercase tracking-[0.05em] ${
              c.type === "SUMMER" ? "bg-[#fff3e0] text-[#b0550a]" : "bg-blue-light text-blue"
            }`}
          >
            {c.type === "SUMMER" ? "☀️ Léto" : "❄️ Zima"}
          </span>
          <StatusBadge status={c.status} />
        </div>
        {c.joined && (
          <span className="text-[10.5px] font-bold px-2 py-[2px] rounded-full uppercase tracking-[0.05em] bg-blue-light text-blue flex-shrink-0 whitespace-nowrap">
            Účastnil/a jsem se
          </span>
        )}
      </div>

      <p className="text-[15px] font-extrabold text-dark leading-snug mb-0.5">{c.name}</p>
      <p className="text-[11.5px] text-gray-mid mb-3">
        {formatDate(c.startDate)} – {formatDate(c.endDate)} · {c.participantCount} účastníků
      </p>

      {/* Podium */}
      {c.podium.length > 0 && (
        <div className="bg-gray-light rounded-sm p-2.5 mb-2 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-mid mb-1.5 flex items-center gap-1">
            🏆 Vítězové
          </p>
          <ul>
            {c.podium.map(entry => (
              <PodiumRow key={entry.userId} entry={entry} challengeId={c.id} />
            ))}
          </ul>
        </div>
      )}

      {/* My result — only if I appear in the top-3 podium */}
      {myPodiumEntry && (
        <div className="mt-2 flex items-center justify-between text-[12px]">
          <span className="text-gray-mid">Tvoje umístění</span>
          <span className="font-bold text-dark num">
            {myPodiumEntry.rank}. místo · {myPodiumEntry.totalKm % 1 === 0 ? myPodiumEntry.totalKm : myPodiumEntry.totalKm.toFixed(1)} km
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-gray-border">
        <Link href={href} className="text-[12px] text-blue font-bold hover:underline no-underline">
          Zobrazit výsledky →
        </Link>
      </div>
    </div>
  )
}

import Link from "next/link"
import { avatarColor, getInitials } from "@/lib/avatarColor"
import type { LeaderboardEntry } from "./LeaderboardTable"

const MEDAL_COLOR: Record<number, string> = { 1: "#f59e0b", 2: "#94a3b8", 3: "#b45309" }

type Props = {
  entries: LeaderboardEntry[]
  currentUserId: string
  challengeId: string
}

function fmt(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

function staggerDelay(position: number): string {
  return position === 0 ? "0.2s" : position === 1 ? "0.1s" : "0s"
}

/**
 * Mobile-only podium for the top 3. Desktop renders an inline table row instead
 * (see LeaderboardTable) so the visual difference between #4 and #3 is just the
 * avatar ring color, not a separate stack of cards.
 */
export function Podium({ entries, currentUserId, challengeId }: Props) {
  const top = entries.slice(0, 3)
  if (top.length === 0) return null

  return (
    <div className="flex flex-col gap-4 mb-5">
      {top.map((entry, i) => (
        <MobileRow key={entry.userId} entry={entry} position={i} currentUserId={currentUserId} challengeId={challengeId} />
      ))}
    </div>
  )
}

function Avatar({
  url,
  userId,
  name,
  size,
  textSize,
  ringColor,
  ringWidth,
}: {
  url: string | null
  userId: string
  name: string
  size: string
  textSize: string
  ringColor: string
  ringWidth: number
}) {
  const ringStyle = { boxShadow: `0 0 0 ${ringWidth}px ${ringColor}` }
  if (url) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        className={`${size} rounded-full object-cover`}
        style={ringStyle}
      />
    )
  }
  return (
    <div
      className={`${size} ${textSize} rounded-full flex items-center justify-center text-white font-bold`}
      style={{ backgroundColor: avatarColor(userId), ...ringStyle }}
    >
      {getInitials(name)}
    </div>
  )
}

function MobileRow({
  entry,
  position,
  currentUserId,
  challengeId,
}: {
  entry: LeaderboardEntry
  position: number
  currentUserId: string
  challengeId: string
}) {
  const isMe = entry.userId === currentUserId
  const isLeader = position === 0
  const ringColor = MEDAL_COLOR[entry.rank] ?? "#cbd5e1"
  const avatarSize = isLeader ? "w-12 h-12" : "w-10 h-10"
  const avatarText = isLeader ? "text-[14px]" : "text-[12px]"
  const scoreSize = isLeader ? 22 : 18
  const nameSize = isLeader ? "text-[15px]" : "text-[14px]"

  return (
    <div
      className="flex items-center gap-3"
      style={{
        animation: "podium-rise 0.45s cubic-bezier(0.16,1,0.3,1) both",
        animationDelay: staggerDelay(position),
      }}
    >
      <Link href={`/users/${entry.userId}?from=${challengeId}`} className="flex-shrink-0">
        <Avatar
          url={entry.avatarUrl}
          userId={entry.userId}
          name={entry.name}
          size={avatarSize}
          textSize={avatarText}
          ringColor={ringColor}
          ringWidth={isLeader ? 3 : 2.5}
        />
      </Link>

      <Link href={`/users/${entry.userId}?from=${challengeId}`} className="flex-1 min-w-0 group">
        <span
          className={`block font-semibold text-dark truncate group-hover:text-blue transition-colors ${nameSize}`}
          title={entry.name}
        >
          {entry.name}
          {isMe && (
            <span className="ml-1.5 text-[10px] font-bold text-blue bg-blue/10 px-1.5 py-0.5 rounded">
              Já
            </span>
          )}
        </span>
      </Link>

      <div className="flex-shrink-0 text-right whitespace-nowrap">
        <div>
          <span
            className="num font-bold text-dark"
            style={{ fontFamily: "var(--font-display)", fontSize: scoreSize, lineHeight: 1 }}
          >
            {fmt(entry.totalKm)}
          </span>
          <span className="ml-1 text-[12px] font-semibold text-gray-mid">km</span>
        </div>
        <PodiumPosun rank={entry.rank} previousRank={entry.previousRank} />
      </div>
    </div>
  )
}

/**
 * Small posun line shown below the podium score on mobile. The leader gets
 * nothing because the gold ring already says "first"; users with the same
 * rank as a week ago also stay quiet so the indicator highlights actual
 * movement instead of becoming background noise.
 */
function PodiumPosun({ rank, previousRank }: { rank: number; previousRank: number | null }) {
  if (rank === 1) return null
  if (previousRank === null) {
    return (
      <span className="inline-block mt-1 text-[9px] font-bold text-green bg-green/10 px-1.5 py-0.5 rounded-full leading-none">
        NOVÝ
      </span>
    )
  }
  if (previousRank === rank) return null
  const delta = previousRank - rank
  if (delta > 0) {
    return <span className="block mt-1 text-[11px] font-bold text-green leading-none">▲{delta}</span>
  }
  return <span className="block mt-1 text-[11px] font-bold text-red leading-none">▼{-delta}</span>
}

/** Mobile-only loading skeleton for the podium block. Desktop uses table-row skeletons. */
export function PodiumSkeleton() {
  return (
    <div className="md:hidden flex flex-col gap-4 mb-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-border animate-pulse" />
        <div className="flex-1 h-4 bg-gray-border rounded animate-pulse" />
        <div className="w-14 h-5 bg-gray-border rounded animate-pulse" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-border animate-pulse" />
        <div className="flex-1 h-4 bg-gray-border rounded animate-pulse" />
        <div className="w-12 h-4 bg-gray-border rounded animate-pulse" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-border animate-pulse" />
        <div className="flex-1 h-4 bg-gray-border rounded animate-pulse" />
        <div className="w-12 h-4 bg-gray-border rounded animate-pulse" />
      </div>
    </div>
  )
}

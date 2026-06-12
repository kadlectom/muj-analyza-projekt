import { useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { Plus, Trophy } from "lucide-react"
import { avatarColor, getInitials } from "@/lib/avatarColor"
import { type LeaderboardEntry } from "@/lib/leaderboardCalc"

const CZ_MONTHS = ["led.", "úno.", "bře.", "dub.", "kvě.", "čvn.", "čvc.", "srp.", "zář.", "říj.", "lis.", "pro."]

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${d}. ${CZ_MONTHS[m - 1]} ${y}`
}

function fmtDateShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number)
  return `${d}. ${CZ_MONTHS[m - 1]}`
}

function daysRemaining(endDate: string): number {
  return Math.max(0, Math.ceil((new Date(endDate + "T23:59:59").getTime() - Date.now()) / 86_400_000))
}

function daysUntilStart(startDate: string): number {
  return Math.max(0, Math.ceil((new Date(startDate + "T00:00:00").getTime() - Date.now()) / 86_400_000))
}

function formatKm(km: number): string {
  return km % 1 === 0 ? String(km) : km.toFixed(1)
}

function daysWord(n: number): string {
  if (n === 1) return "den"
  if (n >= 2 && n <= 4) return "dny"
  return "dní"
}

export type ChallengeHeroBData = {
  id: string
  slug: string | null
  name: string
  type: "WINTER" | "SUMMER"
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED"
  startDate: string
  endDate: string
  participantCount: number
  progressPercent: number
  isEnrolled: boolean
}

type Props = {
  challenge: ChallengeHeroBData
  currentUserId: string
  isAdmin: boolean
}

export function ChallengeHeroB({ challenge, currentUserId, isAdmin }: Props) {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null)
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)

  const isUpcoming = Date.now() < new Date(challenge.startDate + "T00:00:00").getTime()

  useEffect(() => {
    // Skip leaderboard fetch for upcoming challenges — there's nothing to show and
    // the aside renders a countdown instead.
    if (isUpcoming) return
    let cancelled = false
    fetch(`/api/leaderboard?challengeId=${challenge.id}`)
      .then((r) => r.json())
      .then((rows: LeaderboardEntry[]) => { if (!cancelled) setLeaderboard(rows) })
      .catch(() => { if (!cancelled) setLeaderboard([]) })
    return () => { cancelled = true }
  }, [challenge.id, isUpcoming])

  const daysRem = daysRemaining(challenge.endDate)
  const daysToStart = daysUntilStart(challenge.startDate)
  const pct = challenge.progressPercent
  const top5 = leaderboard ? leaderboard.slice(0, 5) : []
  const meRow = leaderboard?.find((r) => r.userId === currentUserId) ?? null
  const slug = challenge.slug ?? challenge.id
  const typeLabel = challenge.type === "SUMMER" ? "Léto" : "Zima"
  const canRecord = challenge.isEnrolled && !isUpcoming

  async function handleEnroll() {
    setEnrollLoading(true)
    setEnrollError(null)
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setEnrollError(data.error ?? "Nepodařilo se zaregistrovat")
        return
      }
      router.replace(router.asPath, undefined, { scroll: false })
    } catch {
      setEnrollError("Síťová chyba — zkuste to znovu")
    } finally {
      setEnrollLoading(false)
    }
  }

  return (
    <section className="relative rounded-lg overflow-hidden shadow-md border border-gray-border text-white">
      {/* Gradient background (navy → blue → green, extending past the end for a dramatic edge) */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg,#0a3d92 0%,#006DFF 55%,#18C872 140%)" }}
      />

      {/* Decorative diagonal stripes */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none"
        viewBox="0 0 800 400"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <g stroke="#fff" strokeWidth="1">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={i * 80 - 100} y1={0} x2={i * 80 + 200} y2={400} />
          ))}
        </g>
      </svg>

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5 lg:gap-6 p-4 sm:p-5 lg:p-7">
        {/* Left column: status, title, stats, progress, CTAs */}
        <div className="min-w-0">
          {/* Status pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {!isUpcoming && (
              <span className="relative w-2 h-2 rounded-full ping-dot flex-shrink-0" style={{ background: "#c5ffdd" }} />
            )}
            <span className="text-[9.5px] sm:text-[10.5px] font-bold rounded-full uppercase tracking-[0.06em] sm:tracking-[0.1em] bg-white/15 backdrop-blur px-1.5 sm:px-2.5 py-[2px] sm:py-[3px]">
              {isUpcoming ? "Začíná brzy" : "Aktivní"}
            </span>
            <span className="text-[9.5px] sm:text-[10.5px] font-bold rounded-full uppercase tracking-[0.06em] sm:tracking-[0.1em] bg-white/15 backdrop-blur px-1.5 sm:px-2.5 py-[2px] sm:py-[3px]">
              {typeLabel}
            </span>
            {challenge.isEnrolled && (
              <span className="text-[9.5px] sm:text-[10.5px] font-bold rounded-full uppercase tracking-[0.06em] sm:tracking-[0.1em] bg-green text-[#06351d] px-1.5 sm:px-2.5 py-[2px] sm:py-[3px]">
                Účastním se
              </span>
            )}
            {isAdmin && (
              <span className="text-[9.5px] sm:text-[10.5px] font-bold rounded-full uppercase tracking-[0.06em] sm:tracking-[0.1em] bg-white text-blue px-1.5 sm:px-2.5 py-[2px] sm:py-[3px]">
                Admin
              </span>
            )}
          </div>

          {/* Title */}
          <Link
            href={`/challenges/${slug}`}
            className="block no-underline text-white hover:text-white/90 transition-colors"
          >
            <h1
              className="mt-2 sm:mt-3 text-[26px] sm:text-[38px] lg:text-[44px] xl:text-[52px] leading-[1.05] lg:leading-[0.98] font-extrabold tracking-[-0.02em] text-balance hover:underline decoration-white/40 decoration-2 underline-offset-4"
              style={{ animation: "hero-enter 0.5s cubic-bezier(0.16,1,0.3,1) 0.08s both" }}
            >
              {challenge.name}
            </h1>
          </Link>

          {/* Date line */}
          <p className="mt-1 sm:mt-2 text-[12px] sm:text-[14px] opacity-80">
            {fmtDateShort(challenge.startDate)} — {fmtDate(challenge.endDate)} · {challenge.participantCount} účastníků
          </p>

          {/* Big stats */}
          <div className="mt-3 sm:mt-5 grid grid-cols-3 gap-2 sm:gap-3 max-w-[520px]">
            <BigStat
              value={isUpcoming ? daysToStart : daysRem}
              label={isUpcoming ? "Dní do startu" : "Dní zbývá"}
            />
            <BigStat
              value={challenge.isEnrolled && meRow ? `${meRow.rank}.` : "—"}
              label="Moje pořadí"
            />
            <BigStat
              value={challenge.isEnrolled && meRow ? formatKm(meRow.totalKm) : "—"}
              label="Moje km"
            />
          </div>

          {/* Progress */}
          <div className="mt-3.5 sm:mt-5 max-w-[520px]">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.06em] sm:tracking-[0.08em] opacity-80">
                Průběh výzvy
              </span>
              <span className="text-[11px] sm:text-[12px] font-bold num">
                {isUpcoming ? "Ještě nezačala" : `${pct}% uplynulo`}
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${isUpcoming ? 0 : Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-3.5 sm:mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-2">
            {canRecord ? (
              <Link
                href={`/challenges/${slug}?action=record`}
                className="inline-flex items-center justify-center gap-2 bg-white text-blue font-bold rounded-sm shadow-sm hover:bg-blue-light transition-colors text-[14px] px-5 py-2.5 no-underline"
              >
                <Plus size={16} />
                Zapsat aktivitu
              </Link>
            ) : !challenge.isEnrolled ? (
              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrollLoading}
                className="inline-flex items-center justify-center gap-2 bg-white text-blue font-bold rounded-sm shadow-sm hover:bg-blue-light transition-colors text-[14px] px-5 py-2.5 disabled:opacity-60 disabled:cursor-wait"
              >
                <Plus size={16} />
                {enrollLoading ? "Registruji…" : "Zapojit se"}
              </button>
            ) : (
              <Link
                href={`/challenges/${slug}`}
                className="inline-flex items-center justify-center gap-2 bg-white text-blue font-bold rounded-sm shadow-sm hover:bg-blue-light transition-colors text-[14px] px-5 py-2.5 no-underline"
              >
                Zobrazit výzvu
              </Link>
            )}
            {!isUpcoming && (
              <div className="flex gap-2">
                <Link
                  href={`/challenges/${slug}?tab=leaderboard`}
                  className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur text-white font-bold rounded-sm hover:bg-white/25 transition-colors text-[13px] sm:text-[14px] px-3 sm:px-4 py-2.5 flex-1 sm:flex-initial no-underline"
                >
                  <Trophy size={15} />
                  Žebříček
                </Link>
              </div>
            )}
          </div>
          {enrollError && (
            <p role="alert" className="mt-2 text-[12px] font-semibold text-white bg-red/40 rounded-sm px-3 py-1.5 inline-block">
              {enrollError}
            </p>
          )}
        </div>

        {/* Right aside: countdown for upcoming, top 5 leaderboard otherwise */}
        {isUpcoming ? (
          <aside className="bg-white text-dark rounded-md shadow-md p-4 sm:p-5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.08em] text-gray-mid">
              Startuje za
            </span>
            <div className="mt-2 mb-1 flex items-baseline gap-1.5">
              <span
                className="num font-extrabold text-dark"
                style={{ fontFamily: "var(--font-display)", fontSize: 64, lineHeight: 1, letterSpacing: "-0.01em" }}
              >
                {daysToStart}
              </span>
              <span className="text-[15px] font-semibold text-gray-mid">{daysWord(daysToStart)}</span>
            </div>
            <span className="text-[12px] sm:text-[13px] text-gray-mid">
              {fmtDate(challenge.startDate)}
            </span>
          </aside>
        ) : (
        <aside className="bg-white text-dark rounded-md shadow-md p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.06em] sm:tracking-[0.08em] text-gray-mid">
              Žebříček · top 5
            </span>
            <Link
              href={`/challenges/${slug}?tab=leaderboard`}
              className="text-[11.5px] sm:text-[12px] font-bold text-blue whitespace-nowrap no-underline hover:underline"
            >
              Celý →
            </Link>
          </div>

          {leaderboard === null ? (
            <LeaderboardSkeleton />
          ) : top5.length === 0 ? (
            <p className="text-[12px] text-gray-mid py-3 text-center">Zatím žádné zápisy</p>
          ) : (
            <ul>
              {top5.map((r) => (
                <LBRow key={r.userId} entry={r} isMe={r.userId === currentUserId} />
              ))}
              {meRow && meRow.rank > top5.length && (
                <>
                  <li className="text-center text-gray-mid text-[11px] py-0.5" aria-hidden="true">···</li>
                  <LBRow entry={meRow} isMe />
                </>
              )}
            </ul>
          )}
        </aside>
        )}
      </div>
    </section>
  )
}

function BigStat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="bg-white/15 backdrop-blur rounded-md border border-white/10 min-w-0 px-2 sm:px-3 py-2 sm:py-3">
      <div className="font-display leading-none font-bold text-[22px] sm:text-[32px] lg:text-[40px] truncate">
        {value}
      </div>
      <div className="uppercase font-bold opacity-80 leading-tight text-[9px] sm:text-[10.5px] tracking-[0.05em] sm:tracking-[0.08em] mt-1">
        {label}
      </div>
    </div>
  )
}

function LBRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const rankColor =
    entry.rank === 1 ? "text-[#f59e0b]" :
    entry.rank === 2 ? "text-[#94a3b8]" :
    entry.rank === 3 ? "text-[#b45309]" :
    "text-gray-mid"

  return (
    <li
      className={`flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 border-b border-gray-border last:border-0 ${
        isMe ? "bg-blue-light rounded-sm -mx-3 sm:-mx-4 px-3 sm:px-4" : ""
      }`}
    >
      <span className={`font-display font-bold text-center text-[17px] sm:text-[20px] w-4 sm:w-6 ${isMe ? "text-blue" : rankColor}`}>
        {entry.rank}.
      </span>
      <LBAvatar userId={entry.userId} name={entry.name} avatarUrl={entry.avatarUrl} isMe={isMe} />
      <span className={`flex-1 min-w-0 truncate text-[12px] sm:text-[13px] ${isMe ? "font-extrabold text-blue" : "font-semibold text-dark"}`}>
        {entry.name}
      </span>
      <span className={`font-display font-bold num text-[16px] sm:text-[20px] ${isMe ? "text-blue" : "text-dark"}`}>
        {formatKm(entry.totalKm)}
      </span>
    </li>
  )
}

function LBAvatar({ userId, name, avatarUrl, isMe }: { userId: string; name: string; avatarUrl: string | null; isMe: boolean }) {
  const ring = isMe ? "ring-2 ring-blue" : ""
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`rounded-full object-cover flex-shrink-0 w-[22px] h-[22px] sm:w-7 sm:h-7 ${ring}`}
      />
    )
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 w-[22px] h-[22px] sm:w-7 sm:h-7 text-[9px] sm:text-[11px] ${ring}`}
      style={{ backgroundColor: avatarColor(userId) }}
    >
      {getInitials(name)}
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <ul>
      {[0, 1, 2, 3, 4].map((i) => (
        <li
          key={i}
          className="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 border-b border-gray-border last:border-0 animate-pulse"
        >
          <div className="w-4 sm:w-6 h-4 bg-gray-border/70 rounded" />
          <div className="w-[22px] h-[22px] sm:w-7 sm:h-7 rounded-full bg-gray-border/70 flex-shrink-0" />
          <div className="flex-1 h-4 bg-gray-border/70 rounded" />
          <div className="w-10 h-5 bg-gray-border/70 rounded" />
        </li>
      ))}
    </ul>
  )
}

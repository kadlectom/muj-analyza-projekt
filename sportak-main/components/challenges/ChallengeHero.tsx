import { useMemo, type ReactNode } from "react"
import { StatusBadge } from "./StatusBadge"
import { formatDate } from "@/lib/formatDate"

export type ChallengeHeroChallenge = {
  id: string
  slug: string | null
  name: string
  type: "WINTER" | "SUMMER"
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED"
  startDate: string
  endDate: string
}

type Props = {
  challenge: ChallengeHeroChallenge
  participantCount: number
  userRank: number | null
  userTotalKm: number | null
  gapToNextKm?: number | null
  totalChallengeKm?: number
  dailyCumulativeKm?: { date: string; km: number }[]
  topRowStart?: ReactNode
  topRowEnd?: ReactNode
  ctaRow?: ReactNode
  inlineCta?: ReactNode
  onRankPillClick?: () => void
}

// Podium glow for rank 1 / 2 / 3
const PODIUM_GLOW: Record<number, string> = {
  1: "0 0 0 1.5px rgba(245,158,11,.75), 0 0 18px rgba(245,158,11,.35)",
  2: "0 0 0 1.5px rgba(148,163,184,.7), 0 0 14px rgba(148,163,184,.25)",
  3: "0 0 0 1.5px rgba(180,83,9,.6), 0 0 14px rgba(180,83,9,.2)",
}

function daysRemaining(endDate: string): number | null {
  const end = new Date(endDate + "T23:59:59").getTime()
  const now = Date.now()
  if (now >= end) return null
  return Math.ceil((end - now) / 86400000)
}

function buildSparklinePaths(
  data: { date: string; km: number }[],
  startDate: string,
  endDate: string,
): { area: string; line: string } | null {
  if (data.length < 2) return null
  const maxKm = data[data.length - 1].km
  if (maxKm === 0) return null

  const startTs = new Date(startDate).getTime()
  const endTs = new Date(endDate).getTime()
  const range = endTs - startTs || 1

  const SAMPLE_COUNT = 20
  const step = Math.max(1, Math.floor(data.length / SAMPLE_COUNT))
  const sampled: typeof data = []
  for (let i = 0; i < data.length; i += step) sampled.push(data[i])
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1])
  }

  const todayTs = Math.min(Date.now(), endTs)
  const progressRatio = (todayTs - startTs) / range
  const isChallengeOver = progressRatio >= 0.99
  let yMax: number
  if (isChallengeOver || progressRatio < 0.05) {
    yMax = maxKm
  } else {
    yMax = (maxKm / progressRatio) * 1.2
  }

  const W = 1000
  const H = 200
  const topPad = 30

  const pts = sampled.map((d) => ({
    x: ((new Date(d.date).getTime() - startTs) / range) * W,
    y: H - (d.km / yMax) * (H - topPad),
  }))

  const lineParts: string[] = [`M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`]
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1]
    const p1 = pts[i]
    const dx = (p1.x - p0.x) / 3
    lineParts.push(
      `C ${(p0.x + dx).toFixed(1)},${p0.y.toFixed(1)} ${(p1.x - dx).toFixed(1)},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`
    )
  }
  const line = lineParts.join(" ")
  const last = pts[pts.length - 1]
  const first = pts[0]
  const area = `${line} L ${last.x.toFixed(1)},${H} L ${first.x.toFixed(1)},${H} Z`

  return { area, line }
}

export function ChallengeHero({
  challenge,
  participantCount,
  userRank,
  userTotalKm,
  gapToNextKm,
  totalChallengeKm,
  dailyCumulativeKm = [],
  topRowStart,
  topRowEnd,
  ctaRow,
  inlineCta,
  onRankPillClick,
}: Props) {
  const isActive = challenge.status === "ACTIVE"
  const daysLeft = daysRemaining(challenge.endDate)

  const sparklinePaths = useMemo(
    () => buildSparklinePaths(dailyCumulativeKm, challenge.startDate, challenge.endDate),
    [dailyCumulativeKm, challenge.startDate, challenge.endDate],
  )

  const rankPillStyle: React.CSSProperties = {
    background: "rgba(255,255,255,.2)",
    border: "1.5px solid rgba(255,255,255,.32)",
    borderRadius: 50,
    padding: "9px 20px",
    ...(userRank !== null && PODIUM_GLOW[userRank] ? { boxShadow: PODIUM_GLOW[userRank] } : {}),
  }

  const rankPillContent = (
    <>
      <span style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "var(--font-display)" }}>
        {userRank !== null ? `${userRank}. místo` : "—"}
      </span>
      {userTotalKm !== null && userTotalKm > 0 && (
        <>
          <span style={{ width: 1, height: 18, background: "rgba(255,255,255,.3)", display: "inline-block" }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,.78)", fontFamily: "var(--font-display)" }}>
            {userTotalKm % 1 === 0 ? userTotalKm : userTotalKm.toFixed(1)} km
          </span>
        </>
      )}
      {gapToNextKm != null && gapToNextKm > 0 &&
        (gapToNextKm <= 5 || (userTotalKm !== null && userTotalKm > 0 && gapToNextKm / userTotalKm <= 0.15)) && (
        <span className="hidden sm:contents">
          <span style={{ width: 1, height: 18, background: "rgba(255,255,255,.3)", display: "inline-block" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.6)" }}>
            ↑ {gapToNextKm % 1 === 0 ? gapToNextKm : gapToNextKm.toFixed(1)} km na {userRank !== null ? `${userRank - 1}.` : "výš"}
          </span>
        </span>
      )}
    </>
  )

  return (
    <div
      className="text-white mb-6 relative overflow-hidden"
      style={{
        background: "var(--gradient)",
        borderRadius: 32,
        padding: "clamp(16px, 5vw, 36px) clamp(20px, 5vw, 44px)",
      }}
    >
      {/* Diagonal stripe texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, rgba(255,255,255,.045) 0, rgba(255,255,255,.045) 1px, transparent 0, transparent 32px)",
        }}
      />

      {/* Sparkline background */}
      {sparklinePaths && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={sparklinePaths.area} fill="rgba(255,255,255,0.07)" />
          <path
            d={sparklinePaths.line}
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {topRowStart}
            <StatusBadge status={challenge.status} />
          </div>
          {topRowEnd}
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-x-10">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            <h1
              className="font-display text-[32px] md:text-[38px] font-bold tracking-[0.01em] leading-[1.05] mb-3 uppercase"
              style={{ animation: "hero-enter 0.5s cubic-bezier(0.16,1,0.3,1) 0.08s both" }}
            >
              {challenge.name}
            </h1>

            <div
              className="flex items-center gap-2 text-[14px] mb-4"
              style={{ color: "rgba(255,255,255,.75)", animation: "hero-enter 0.5s cubic-bezier(0.16,1,0.3,1) 0.16s both" }}
            >
              <span className="hidden sm:inline">{formatDate(challenge.startDate)} – {formatDate(challenge.endDate)}</span>
              <span className="hidden sm:inline w-[3px] h-[3px] rounded-full" style={{ background: "rgba(255,255,255,.4)" }} />
              <span className="hidden sm:inline">{participantCount} účastníků</span>
              {isActive && daysLeft !== null && (
                <>
                  <span className="hidden sm:inline w-[3px] h-[3px] rounded-full" style={{ background: "rgba(255,255,255,.4)" }} />
                  <span>{daysLeft} dní zbývá</span>
                </>
              )}
            </div>

            {/* Rank pill + total km pill (mobile) */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {userRank !== null && (
                onRankPillClick ? (
                  <button
                    type="button"
                    onClick={onRankPillClick}
                    className="inline-flex items-center gap-[10px] transition-opacity hover:opacity-90 active:opacity-75"
                    style={{ ...rankPillStyle, cursor: "pointer", animation: "hero-enter 0.5s cubic-bezier(0.16,1,0.3,1) 0.24s both" }}
                  >
                    {rankPillContent}
                  </button>
                ) : (
                  <div
                    className="inline-flex items-center gap-[10px]"
                    style={{ ...rankPillStyle, animation: "hero-enter 0.5s cubic-bezier(0.16,1,0.3,1) 0.24s both" }}
                  >
                    {rankPillContent}
                  </div>
                )
              )}

              {/* Total challenge km pill — mobile only */}
              {totalChallengeKm !== undefined && (
                <div
                  className="md:hidden inline-flex items-center gap-[10px]"
                  style={{
                    background: "rgba(255,255,255,.14)",
                    border: "1.5px solid rgba(255,255,255,.22)",
                    borderRadius: 50,
                    padding: "9px 18px",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,.6)" }}>
                    Celkem
                  </span>
                  <span style={{ width: 1, height: 18, background: "rgba(255,255,255,.25)", display: "inline-block" }} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "var(--font-display)" }}>
                    {totalChallengeKm % 1 === 0 ? totalChallengeKm : totalChallengeKm.toFixed(1)} km
                  </span>
                </div>
              )}

              {/* Inline CTA — desktop only (mobile uses sticky bottom CTA) */}
              {inlineCta && <div className="hidden md:inline-flex">{inlineCta}</div>}
            </div>

            {/* CTA slot */}
            {ctaRow}
          </div>

          {/* Right column — desktop: collective km stat */}
          {totalChallengeKm !== undefined && (
            <div
              className="hidden md:flex flex-col items-end gap-1.5 flex-shrink-0 pb-[3px]"
              style={{ animation: "hero-enter 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,.55)" }}>
                Dohromady nasbíráno
              </p>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 72, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.01em" }}>
                {totalChallengeKm % 1 === 0 ? totalChallengeKm : totalChallengeKm.toFixed(1)}
                <span style={{ fontSize: 30, fontWeight: 700, color: "rgba(255,255,255,.7)", marginLeft: 6 }}>km</span>
              </div>
              {participantCount > 0 && totalChallengeKm > 0 && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.6)", fontWeight: 600 }}>
                  ∅ {(totalChallengeKm / participantCount).toFixed(1)} km / osoba
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import React from "react"

const CONFETTI_COLORS = ["#18C872", "#006DFF", "#fff", "#f59e0b", "#18C872", "#006DFF", "#f59e0b"]
const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  left: `${8 + (i * 6.4) % 84}%`,
  top: `${2 + (i * 5.3) % 38}%`,
  size: i % 3 === 0 ? 9 : 6,
  round: i % 2 === 0,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rotation: `${(i * 53 + 120) % 560}deg`,
  duration: `${0.6 + (i % 4) * 0.1}s`,
  delay: `${i * 0.04}s`,
}))

type Props = {
  points: number
  partnerBonus: number
  newlyEarnedBonuses?: { name: string; bonusPoints: number }[]
  challengeName: string
  userTotalKm: number | null
  activityName?: string
  activityEmoji?: string | null
  inputValue?: number
  inputUnit?: string
  partnerNames?: string[]
}

function fmt(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

export function ActivitySuccessView({
  points,
  partnerBonus,
  newlyEarnedBonuses,
  challengeName,
  userTotalKm,
  activityName,
  activityEmoji,
  inputValue,
  inputUnit,
  partnerNames,
}: Props) {
  const total = points + partnerBonus
  const hasPartners = (partnerNames?.length ?? 0) > 0 && partnerBonus > 0
  return (
    <div className="text-center py-4 relative overflow-hidden">
      {CONFETTI.map((p, i) => (
        <span
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: p.round ? "50%" : 2,
            background: p.color,
            "--r": p.rotation,
            animation: `confetti-fall ${p.duration} ease-out ${p.delay} both`,
          } as React.CSSProperties}
        />
      ))}
      <div className="text-[52px] mb-3 leading-none relative z-10">🎉</div>
      <h3 className="text-[22px] font-extrabold text-dark tracking-[-0.02em] mb-1 relative z-10">Skvělá práce!</h3>
      <p className="text-[12px] text-gray-mid mb-3 relative z-10">Přidáno do {challengeName}</p>
      {activityName && inputValue !== undefined && inputUnit && (
        <p className="text-[14px] font-semibold text-dark mb-2 relative z-10">
          {activityEmoji && <span className="mr-1">{activityEmoji}</span>}
          {activityName} · {fmt(inputValue)} {inputUnit}
        </p>
      )}
      <div
        className="mb-1 leading-none relative z-10 num"
        style={{ fontSize: 56, fontWeight: 800, color: "#18C872", letterSpacing: "0.01em", fontFamily: "var(--font-display)", textTransform: "uppercase" }}
      >
        +{fmt(total)} km
      </div>
      {hasPartners && (
        <p className="text-[12px] mb-1 relative z-10">
          <span className="text-gray-mid font-semibold">🤝 s {partnerNames!.join(", ")}</span>
          <span className="ml-1 font-bold" style={{ color: "#d97706" }}>· +{fmt(partnerBonus)} km</span>
        </p>
      )}
      {userTotalKm !== null && (
        <p className="text-[12px] text-gray-mid font-semibold mb-4 relative z-10 num">
          Celkem: {((userTotalKm || 0) + total).toFixed(1)} km
        </p>
      )}
      {newlyEarnedBonuses && newlyEarnedBonuses.length > 0 && (
        <div className="mx-auto mb-3 max-w-[280px] relative z-10 space-y-1.5">
          {newlyEarnedBonuses.map((b) => (
            <div
              key={b.name}
              className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left"
              style={{ background: "rgba(245,158,11,.10)", border: "1.5px solid rgba(245,158,11,.35)" }}
            >
              <span className="text-[20px] leading-none flex-shrink-0">🏆</span>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-[#92400e] leading-tight truncate">{b.name}</p>
                <p className="text-[12px] font-bold" style={{ color: "#18C872" }}>
                  +{b.bonusPoints % 1 === 0 ? b.bonusPoints : b.bonusPoints.toFixed(1)} km bonus
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-gray-mid relative z-10">Za chvíli zobrazím tvoje aktivity…</p>
    </div>
  )
}

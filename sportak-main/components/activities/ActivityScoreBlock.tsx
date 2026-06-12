type Props = {
  basePoints: number
  partnerBonus: number
  size?: "sm" | "md" | "lg"
}

function fmt(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

export function ActivityScoreBlock({ basePoints, partnerBonus, size = "md" }: Props) {
  const total = basePoints + partnerBonus

  if (size === "lg") {
    return (
      <div className="flex items-baseline gap-1 flex-shrink-0">
        <span
          className="font-extrabold leading-none num"
          style={{ color: "#272727", fontSize: 30, letterSpacing: "-0.02em", fontFamily: "var(--font-display)" }}
        >
          +{fmt(total)}
        </span>
        <span className="text-[13px] font-semibold text-gray-mid">km</span>
      </div>
    )
  }

  const totalClass = size === "sm" ? "text-[14px]" : "text-[15px]"
  return (
    <p className={`num font-extrabold text-dark leading-snug flex-shrink-0 text-right whitespace-nowrap ${totalClass}`}>
      +{fmt(total)} km
    </p>
  )
}

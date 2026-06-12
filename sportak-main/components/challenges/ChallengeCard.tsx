import Link from "next/link"
import { StatusBadge } from "./StatusBadge"
import { formatDate } from "@/lib/formatDate"

export type ChallengeCardData = {
  id: string
  slug: string | null
  name: string
  type: "WINTER" | "SUMMER"
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED"
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  participantCount: number
  progressPercent: number // 0–100
}

function daysRemaining(endDate: string) {
  return Math.max(0, Math.ceil((new Date(endDate + "T23:59:59").getTime() - Date.now()) / 86_400_000))
}

export function ChallengeCard({ challenge }: { challenge: ChallengeCardData }) {
  const isOpen = challenge.status === "ACTIVE" || challenge.status === "DRAFT"

  return (
    <Link href={`/challenges/${challenge.slug ?? challenge.id}`} className="block no-underline">
      <div className="bg-white rounded-lg border border-gray-border shadow-sm p-[22px] cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:shadow-sm active:translate-y-0 transition-all duration-150">
        {/* Top row */}
        <div className="flex items-start justify-between mb-[14px]">
          <div
            className={`w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[22px] ${
              challenge.type === "WINTER" ? "bg-blue-light" : "bg-[#fff3e0]"
            }`}
          >
            {challenge.type === "WINTER" ? "⛷️" : "☀️"}
          </div>
          <StatusBadge status={challenge.status} />
        </div>

        {/* Name + period */}
        <p className="text-[16px] font-bold text-dark mb-1">{challenge.name}</p>
        <p className="text-[13px] text-gray-mid mb-4">
          {formatDate(challenge.startDate)} – {formatDate(challenge.endDate)}
        </p>

        {/* Stats */}
        <div className="flex gap-5 mb-4">
          <div>
            <p className="text-[11px] text-gray-mid font-semibold uppercase tracking-[0.06em]">Účastníci</p>
            <p className="text-[20px] font-extrabold text-dark num" style={{ fontFamily: "var(--font-display)" }}>{challenge.participantCount}</p>
          </div>
          {challenge.status === "ACTIVE" && (
            <div>
              <p className="text-[11px] text-gray-mid font-semibold uppercase tracking-[0.06em]">Zbývá dní</p>
              <p className="text-[20px] font-extrabold text-dark num" style={{ fontFamily: "var(--font-display)" }}>{daysRemaining(challenge.endDate)}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-border rounded-[2px] mb-2 overflow-hidden">
          <div
            className="h-full bg-brand rounded-[2px] transition-[width]"
            style={{ width: `${challenge.progressPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-mid mb-4">{challenge.progressPercent}% výzvy uplynulo</p>

        {/* Footer */}
        <div className="border-t border-gray-border pt-[14px]">
          <div
            className={`w-full text-center py-[9px] rounded-sm text-[13px] font-bold transition-colors ${
              isOpen
                ? "bg-blue-light text-blue hover:bg-blue-mid active:bg-blue-mid"
                : "bg-gray-light text-gray-dark hover:bg-gray-border active:bg-gray-border"
            }`}
          >
            {isOpen ? "Zobrazit výzvu" : "Prohlédnout"}
          </div>
        </div>
      </div>
    </Link>
  )
}

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { ChallengeCardData } from "./ChallengeCard"
import { StatusBadge } from "./StatusBadge"
import { formatDate } from "@/lib/formatDate"

type Props = { challenge: ChallengeCardData }

export function ChallengeRow({ challenge: c }: Props) {
  const emoji = c.type === "WINTER" ? "⛷️" : "☀️"

  return (
    <Link
      href={`/challenges/${c.slug ?? c.id}`}
      className="flex items-center gap-4 bg-white px-5 py-[15px] border-b border-gray-border last:border-b-0 hover:bg-gray-light active:bg-gray-light transition-colors no-underline"
    >
      {/* Icon */}
      <div className="w-[38px] h-[38px] rounded-[10px] bg-[#f0f2f5] flex items-center justify-center text-[19px] flex-shrink-0">
        {emoji}
      </div>

      {/* Name + dates */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-dark truncate">{c.name}</p>
        <p className="text-[12px] text-gray-mid mt-0.5">
          {formatDate(c.startDate)} – {formatDate(c.endDate)}
        </p>
      </div>

      <StatusBadge status={c.status} />

      {/* Participant count */}
      <div className="hidden sm:block text-right ml-4">
        <p className="text-[16px] font-extrabold text-dark">{c.participantCount}</p>
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-gray-mid">Účastníků</p>
      </div>

      <ChevronRight size={16} className="text-gray-mid ml-1 flex-shrink-0" />
    </Link>
  )
}

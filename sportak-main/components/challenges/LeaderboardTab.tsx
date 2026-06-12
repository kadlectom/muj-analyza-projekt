import { LeaderboardTable, type LeaderboardEntry } from "@/components/leaderboard/LeaderboardTable"
import { AuditLogSection } from "@/components/leaderboard/AuditLogSection"

type Props = {
  challengeId: string
  currentUserId: string
  initialLeaderboard: LeaderboardEntry[]
}

export function LeaderboardTab({ challengeId, currentUserId, initialLeaderboard }: Props) {
  return (
    <div className="bg-white rounded-[12px] border border-gray-border p-6">
      <LeaderboardTable
        challengeId={challengeId}
        currentUserId={currentUserId}
        initialData={initialLeaderboard.length > 0 ? initialLeaderboard : undefined}
      />
      <AuditLogSection challengeId={challengeId} />
    </div>
  )
}

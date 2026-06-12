import type { FeedItem } from "@/components/activities/ActivityFeed"

export type Tab = "nastenska" | "moje-aktivity" | "leaderboard" | "sprava"

export const TABS: { id: Tab; label: string }[] = [
  { id: "nastenska", label: "Nástěnka" },
  { id: "moje-aktivity", label: "Moje aktivity" },
  { id: "leaderboard", label: "Žebříček" },
  { id: "sprava", label: "Správa" },
]

export type EnrolledParticipant = { id: string; name: string; avatarUrl: string | null }

export type EnrollmentEvent = {
  userId: string
  userName: string
  userAvatarUrl: string | null
  enrolledAt: number
}

export type WeeklyHighlights = {
  biggestActivity: { userId: string; userName: string; userAvatarUrl: string | null; catalogEmoji: string | null; catalogName: string; points: number } | null
  biggestWeeklyGain: { userId: string; userName: string; userAvatarUrl: string | null; totalKm: number } | null
  mostActiveUser: { userId: string; userName: string; userAvatarUrl: string | null; activityCount: number } | null
}

export type BonusRuleProgress = {
  ruleId: string
  name: string
  conditionType: "COUNT_ACTIVITIES" | "TOTAL_POINTS"
  threshold: number
  bonusPoints: number
  catalogItemNames: string[] | null
  windowStart: string | null
  windowEnd: string | null
  daysOfWeek: number[] | null
  earned: boolean
  currentValue: number
}

export type RecentAchievement = {
  userId: string
  userName: string
  userAvatarUrl: string | null
  bonusName: string
  bonusPoints: number
  earnedAt: number
}

export type MergedFeedEntry =
  | { type: "activity"; key: string; ts: number; item: FeedItem }
  | { type: "achievement"; key: string; ts: number; item: RecentAchievement }
  | { type: "enrollment"; key: string; ts: number; item: EnrollmentEvent }

import { and, eq, inArray, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { activities, activityCatalog, bonusAchievements, bonusRules, users } from "@/db/schema"

const MILESTONES = [500, 1000, 2500, 5000, 10000, 25000, 50000] as const
const MILESTONE_PROXIMITY_KM = 1000 // how close to a milestone "we're approaching" applies (~2.5 weeks of buildup at ~420 km/week pace)

// Day-of-week names in Czech accusative case ("Nejaktivnější den: úterý").
// Indexed by SQLite strftime('%w', ...) which returns "0"–"6" with Sunday = 0.
const DAY_NAMES_CS = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"]

export type CatalogStat = {
  name:  string
  emoji: string | null
  count: number
}

export type FirstTimer = {
  catalogName:  string
  catalogEmoji: string | null
  userName:     string
}

export type EarnedBonus = {
  ruleName:    string
  userName:    string
  bonusPoints: number
}

export type Milestone = {
  value:        number  // 500, 1000, ...
  remaining:    number  // 0 when justCrossed
  justCrossed:  boolean // true if cumulative crossed `value` within the window
}

export type WeeklyStats = {
  activityCount:         number
  totalKm:               number
  uniqueUserCount:       number
  topCatalogs:           CatalogStat[]      // up to 2
  varietyCount:          number             // distinct catalog items this week
  firstTimers:           FirstTimer[]       // catalog items that appeared for the first time this week
  prevWeekActivityCount: number
  prevWeekTotalKm:       number
  cumulativeKm:          number             // sum of points across the whole challenge
  daysRemaining:         number             // 0 if today >= endDate
  nearestMilestone:      Milestone | null   // null if no milestone within proximity and none just crossed
  bonusesEarned:         EarnedBonus[]      // bonus achievements earned within the window
  mostActiveDay:         { name: string; count: number } | null // Czech day name + activity count; null if not enough data
}

type Args = {
  challengeId:  string
  startDateIso: string  // challenge.startDate
  endDateIso:   string  // challenge.endDate
  fromIso:      string  // window start (inclusive), already clamped to startDateIso
  toIso:        string  // window end (inclusive)
  todayIso:     string  // for daysRemaining
}

export async function getWeeklyStats(args: Args): Promise<WeeklyStats> {
  const { challengeId, fromIso, toIso, endDateIso, todayIso } = args
  const prevToIso = shiftIso(fromIso, -1)
  const prevFromIso = shiftIso(fromIso, -7)
  const fromTs = new Date(`${fromIso}T00:00:00.000Z`)
  const toTs   = new Date(`${toIso}T23:59:59.999Z`)

  const inWindow = and(
    eq(activities.challengeId, challengeId),
    sql`${activities.date} >= ${fromIso}`,
    sql`${activities.date} <= ${toIso}`,
  )

  const [
    weekAgg,
    prevWeekAgg,
    topCatalogRows,
    cumulativeRow,
    firstAppearanceIdRows,
    dayCountRows,
    bonusRows,
  ] = await Promise.all([
    db.select({
      cnt:   sql<number>`count(*)`.as("cnt"),
      km:    sql<number>`coalesce(sum(${activities.points}), 0)`.as("km"),
      users: sql<number>`count(distinct ${activities.userId})`.as("users"),
      variety: sql<number>`count(distinct ${activities.catalogItemId})`.as("variety"),
    }).from(activities).where(inWindow),

    db.select({
      cnt: sql<number>`count(*)`.as("cnt"),
      km:  sql<number>`coalesce(sum(${activities.points}), 0)`.as("km"),
    }).from(activities).where(and(
      eq(activities.challengeId, challengeId),
      sql`${activities.date} >= ${prevFromIso}`,
      sql`${activities.date} <= ${prevToIso}`,
    )),

    db.select({
      catalogItemId: activities.catalogItemId,
      name:          activityCatalog.name,
      emoji:         activityCatalog.emoji,
      count:         sql<number>`count(*)`.as("count"),
    })
      .from(activities)
      .innerJoin(activityCatalog, eq(activities.catalogItemId, activityCatalog.id))
      .where(inWindow)
      .groupBy(activities.catalogItemId, activityCatalog.name, activityCatalog.emoji)
      .orderBy(sql`count(*) desc`)
      .limit(2),

    db.select({
      km: sql<number>`coalesce(sum(${activities.points}), 0)`.as("km"),
    }).from(activities).where(eq(activities.challengeId, challengeId)),

    // Catalog items whose first ever appearance in this challenge falls within the window.
    db.select({
      catalogItemId: activities.catalogItemId,
      firstDate:     sql<string>`min(${activities.date})`.as("firstDate"),
    })
      .from(activities)
      .where(eq(activities.challengeId, challengeId))
      .groupBy(activities.catalogItemId)
      .having(sql`min(${activities.date}) >= ${fromIso} AND min(${activities.date}) <= ${toIso}`),

    db.select({
      dow: sql<string>`strftime('%w', ${activities.date})`.as("dow"),
      cnt: sql<number>`count(*)`.as("cnt"),
    })
      .from(activities)
      .where(inWindow)
      .groupBy(sql`strftime('%w', ${activities.date})`)
      .orderBy(sql`count(*) desc`)
      .limit(1),

    db.select({
      ruleName:    bonusRules.name,
      userName:    users.name,
      bonusPoints: bonusAchievements.bonusPoints,
    })
      .from(bonusAchievements)
      .innerJoin(bonusRules, eq(bonusAchievements.bonusRuleId, bonusRules.id))
      .innerJoin(users, eq(bonusAchievements.userId, users.id))
      .where(and(
        eq(bonusAchievements.challengeId, challengeId),
        sql`${bonusAchievements.earnedAt} >= ${fromTs}`,
        sql`${bonusAchievements.earnedAt} <= ${toTs}`,
      )),
  ])

  const cumulativeKm = cumulativeRow[0]?.km ?? 0
  const totalKm      = weekAgg[0]?.km ?? 0
  const daysRemaining = daysBetween(todayIso, endDateIso)

  // Resolve catalog names and the user who logged the first-ever activity for each newly-appearing item.
  let firstTimers: FirstTimer[] = []
  if (firstAppearanceIdRows.length > 0) {
    const ids = firstAppearanceIdRows.map((r) => r.catalogItemId)
    const firstRows = await db.select({
      catalogItemId: activities.catalogItemId,
      catalogName:   activityCatalog.name,
      catalogEmoji:  activityCatalog.emoji,
      userName:      users.name,
      date:          activities.date,
    })
      .from(activities)
      .innerJoin(activityCatalog, eq(activities.catalogItemId, activityCatalog.id))
      .innerJoin(users,           eq(activities.userId, users.id))
      .where(and(
        eq(activities.challengeId, challengeId),
        inArray(activities.catalogItemId, ids),
      ))
      .orderBy(activities.date)

    const seen = new Set<string>()
    for (const row of firstRows) {
      if (seen.has(row.catalogItemId)) continue
      seen.add(row.catalogItemId)
      firstTimers.push({
        catalogName:  row.catalogName,
        catalogEmoji: row.catalogEmoji,
        userName:     row.userName,
      })
    }
  }

  // Cumulative km before this week, to detect "we just crossed milestone X".
  const cumulativeBeforeWeek = cumulativeKm - totalKm
  const nearestMilestone = pickMilestone(cumulativeBeforeWeek, cumulativeKm, totalKm, daysRemaining)

  // Day-of-week label only when we have enough activities to be meaningful.
  let mostActiveDay: { name: string; count: number } | null = null
  if ((weekAgg[0]?.cnt ?? 0) >= 10 && dayCountRows[0]) {
    const dow = parseInt(dayCountRows[0].dow, 10)
    if (dow >= 0 && dow <= 6) {
      mostActiveDay = { name: DAY_NAMES_CS[dow], count: dayCountRows[0].cnt }
    }
  }

  return {
    activityCount:         weekAgg[0]?.cnt ?? 0,
    totalKm,
    uniqueUserCount:       weekAgg[0]?.users ?? 0,
    topCatalogs:           topCatalogRows.map((r) => ({ name: r.name, emoji: r.emoji, count: r.count })),
    varietyCount:          weekAgg[0]?.variety ?? 0,
    firstTimers,
    prevWeekActivityCount: prevWeekAgg[0]?.cnt ?? 0,
    prevWeekTotalKm:       prevWeekAgg[0]?.km ?? 0,
    cumulativeKm,
    daysRemaining,
    nearestMilestone,
    bonusesEarned:         bonusRows.map((r) => ({ ruleName: r.ruleName, userName: r.userName, bonusPoints: r.bonusPoints })),
    mostActiveDay,
  }
}

// Picks the nearest meaningful milestone: prefers a milestone the cumulative
// just crossed within the window; otherwise the next upcoming milestone if
// it is both within MILESTONE_PROXIMITY_KM AND realistically reachable before
// the challenge ends at the current weekly pace. Exported for testing.
export function pickMilestone(
  cumulativeBefore: number,
  cumulativeNow:    number,
  weeklyPaceKm:     number,
  daysRemaining:    number,
): Milestone | null {
  const crossed = MILESTONES.find((m) => cumulativeBefore < m && m <= cumulativeNow)
  if (crossed !== undefined) {
    return { value: crossed, remaining: 0, justCrossed: true }
  }
  const upcoming = MILESTONES.find((m) => m > cumulativeNow)
  if (upcoming === undefined) return null

  const remaining = upcoming - cumulativeNow
  if (remaining > MILESTONE_PROXIMITY_KM) return null

  // Reachability: don't frame "blížíme se" for a milestone the team realistically
  // can't reach at their current pace before the challenge ends.
  const projectedKm = weeklyPaceKm * (daysRemaining / 7)
  if (projectedKm < remaining) return null

  return { value: upcoming, remaining, justCrossed: false }
}

// Pure date math, treating YYYY-MM-DD as UTC midnight. Returns days from `a` to `b` (b - a).
function daysBetween(aIso: string, bIso: string): number {
  const a = Date.UTC(...parseIso(aIso))
  const b = Date.UTC(...parseIso(bIso))
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

// Shifts a YYYY-MM-DD string by N days (positive or negative) and returns YYYY-MM-DD.
export function shiftIso(iso: string, days: number): string {
  const d = new Date(Date.UTC(...parseIso(iso)))
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function parseIso(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10))
  return [y, m - 1, d]
}

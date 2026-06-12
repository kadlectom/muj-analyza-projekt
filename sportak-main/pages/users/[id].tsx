import type { GetServerSideProps } from "next"
import Head from "next/head"
import Link from "next/link"
import { getSessionUser } from "@/lib/permissions"
import { db } from "@/lib/db"
import { users, activities, activityCatalog, activityPartners, challenges, enrollments, bonusAchievements, bonusRules } from "@/db/schema"
import { eq, and, inArray, desc } from "drizzle-orm"
import { avatarColor, getInitials } from "@/lib/avatarColor"
import { ActivityScoreBlock } from "@/components/activities/ActivityScoreBlock"

type ActivityRow = {
  id: string
  date: string
  /** Base km the profile user earned from this row. 0 for credited (viaPartner) rows. */
  points: number
  /** Partner bonus the profile user earned from this row (0 if challenge has no bonus or no partners). */
  partnerBonus: number
  value: number
  unit: string
  catalogName: string
  catalogEmoji: string | null
  note: string | null
  partners?: { name: string }[]   // people tagged on own activities
  creditedBy?: string             // name of the person who logged this activity with profile user as partner
}

type EarnedBonus = {
  name: string
  bonusPoints: number
}

type ChallengeGroup = {
  id: string
  slug: string | null
  name: string
  totalPoints: number
  activities: ActivityRow[]
  earnedBonuses: EarnedBonus[]
}

type Props = {
  profile: {
    id: string
    name: string
    avatarUrl: string | null
  }
  challengeGroups: ChallengeGroup[]
  isOwnProfile: boolean
  fromChallengeId: string | null
}

export default function UserProfilePage({ profile, challengeGroups, isOwnProfile, fromChallengeId }: Props) {
  const totalPoints = challengeGroups.reduce((sum, g) => sum + g.totalPoints, 0)
  const activityCount = challengeGroups.reduce((sum, g) => sum + g.activities.length, 0)
  const bonusKm = challengeGroups.reduce(
    (sum, g) =>
      sum +
      g.activities.reduce((s, a) => s + a.partnerBonus, 0) +
      g.earnedBonuses.reduce((s, b) => s + b.bonusPoints, 0),
    0,
  )
  const fmt = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1))

  return (
    <>
      <Head>
        <title>{profile.name} – Jerryho Výzvy</title>
      </Head>

      <div className="min-h-dvh" style={{ background: "var(--page-bg, #e8ecf0)" }}>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

          {/* Back */}
          <Link
            href={fromChallengeId ? `/challenges/${fromChallengeId}` : "/challenges"}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-mid hover:text-dark transition-colors"
          >
            ← {fromChallengeId ? "Zpět na výzvu" : "Zpět na výzvy"}
          </Link>

          {/* Profile header */}
          <div className="bg-white rounded-xl border border-gray-border shadow-sm p-6 flex items-center gap-5">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                style={{ backgroundColor: avatarColor(profile.id) }}
              >
                {getInitials(profile.name)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-[22px] font-bold text-dark leading-tight truncate">
                {profile.name}
                {isOwnProfile && (
                  <span className="ml-2 text-[12px] font-bold text-blue bg-blue-light px-2 py-0.5 rounded align-middle">
                    Já
                  </span>
                )}
              </h1>
              {totalPoints > 0 && (
                <p className="text-[14px] text-gray-mid mt-0.5">
                  napříč {challengeGroups.length} {challengeGroups.length === 1 ? "výzvou" : challengeGroups.length < 5 ? "výzvami" : "výzvami"}
                </p>
              )}
            </div>
          </div>

          {/* Stats strip */}
          {activityCount > 0 && (
            <div className="bg-white rounded-xl border border-gray-border shadow-sm grid grid-cols-3 divide-x divide-gray-border">
              <div className="p-4 text-center">
                <p className="num font-extrabold text-blue leading-none" style={{ fontSize: 26, fontFamily: "var(--font-display)" }}>
                  {fmt(totalPoints)}
                </p>
                <p className="text-[10px] uppercase font-bold tracking-[0.06em] text-gray-mid mt-1">km celkem</p>
              </div>
              <div className="p-4 text-center">
                <p className="num font-extrabold text-dark leading-none" style={{ fontSize: 26, fontFamily: "var(--font-display)" }}>
                  {activityCount}
                </p>
                <p className="text-[10px] uppercase font-bold tracking-[0.06em] text-gray-mid mt-1">aktivit</p>
              </div>
              <div className="p-4 text-center">
                <p className="num font-extrabold leading-none" style={{ fontSize: 26, fontFamily: "var(--font-display)", color: bonusKm > 0 ? "#d97706" : "#939393" }}>
                  {fmt(bonusKm)}
                </p>
                <p className="text-[10px] uppercase font-bold tracking-[0.06em] text-gray-mid mt-1">z toho bonus</p>
              </div>
            </div>
          )}

          {/* Activities */}
          {challengeGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-border shadow-sm p-10 text-center">
              <p className="text-[32px] mb-3">🏃</p>
              <p className="text-[15px] font-bold text-dark mb-1">Zatím žádné aktivity</p>
              <p className="text-[13px] text-gray-mid">
                {isOwnProfile
                  ? "Přidej první aktivitu a začni stoupat v žebříčku!"
                  : "Tento účastník ještě nic nezaznamenal ve výzvách, kterých se účastníš."}
              </p>
            </div>
          ) : (
            challengeGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-xl border border-gray-border shadow-sm overflow-hidden">
                {/* Challenge header */}
                <div className="px-6 py-4 border-b border-gray-border flex items-center justify-between gap-4">
                  <Link
                    href={`/challenges/${group.slug ?? group.id}`}
                    className="text-[15px] font-bold text-dark hover:text-blue transition-colors"
                  >
                    {group.name}
                  </Link>
                  <span className="text-[13px] font-bold text-gray-mid whitespace-nowrap">
                    {group.totalPoints % 1 === 0 ? group.totalPoints : group.totalPoints.toFixed(1)} km celkem
                  </span>
                </div>

                {/* Activity rows (bonuses first, then activities) */}
                <ul className="divide-y divide-gray-border">
                  {group.earnedBonuses.map((b) => (
                    <li key={`bonus-${b.name}`} className="px-6 py-3 flex items-center gap-3 bg-[#fffbeb]">
                      <span className="text-[20px] w-7 text-center flex-shrink-0">🏆</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-dark truncate">{b.name}</p>
                        <p className="text-[11px] text-gray-mid">Bonus splněn</p>
                      </div>
                      <div className="text-right flex-shrink-0" aria-hidden />
                      <div className="w-20 flex-shrink-0">
                        <ActivityScoreBlock basePoints={b.bonusPoints} partnerBonus={0} size="sm" />
                      </div>
                    </li>
                  ))}
                  {group.activities.map((a) => (
                    <li key={a.id} className="px-6 py-3 flex items-center gap-3">
                      <span className="text-[20px] w-7 text-center flex-shrink-0">
                        {a.catalogEmoji ?? "🏅"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-dark truncate">{a.catalogName}</p>
                        {a.creditedBy && (
                          <p className="text-[11px] text-gray-mid truncate">
                            🤝 zaznamenal/a {a.creditedBy}
                            {a.partnerBonus > 0 && (
                              <span className="ml-1 font-semibold" style={{ color: "#d97706" }}>· +{fmt(a.partnerBonus)} km</span>
                            )}
                          </p>
                        )}
                        {!a.creditedBy && a.partners && a.partners.length > 0 && (
                          <p className="text-[11px] text-gray-mid truncate">
                            🤝 {a.partners.map((p) => p.name).join(", ")}
                            {a.partnerBonus > 0 && (
                              <span className="ml-1 font-semibold" style={{ color: "#d97706" }}>· +{fmt(a.partnerBonus)} km</span>
                            )}
                          </p>
                        )}
                        {!a.creditedBy && (!a.partners || a.partners.length === 0) && a.note && (
                          <p className="text-[12px] text-gray-mid truncate">{a.note}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[13px] font-bold text-dark num">
                          {a.value % 1 === 0 ? a.value : a.value.toFixed(1)} {a.unit}
                        </p>
                        <p className="text-[11px] text-gray-mid">{formatDate(a.date)}</p>
                      </div>
                      <div className="w-20 flex-shrink-0">
                        <ActivityScoreBlock basePoints={a.points} partnerBonus={a.partnerBonus} size="sm" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("cs-CZ", { day: "numeric", month: "short" })
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const viewer = await getSessionUser(ctx)
  if (!viewer) {
    return { redirect: { destination: "/login", permanent: false } }
  }

  const profileId = ctx.params?.id as string
  const fromChallengeId = typeof ctx.query.from === "string" ? ctx.query.from : null

  // Load profile user
  const profileUser = await db
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, profileId))
    .get()

  if (!profileUser) return { notFound: true }

  // Find challenges where the viewer is enrolled
  const viewerEnrollments = await db
    .select({ challengeId: enrollments.challengeId })
    .from(enrollments)
    .where(eq(enrollments.userId, viewer.id))

  const sharedChallengeIds = viewerEnrollments.map((e) => e.challengeId)

  if (sharedChallengeIds.length === 0) {
    return {
      props: {
        profile: profileUser,
        challengeGroups: [],
        isOwnProfile: viewer.id === profileId,
        fromChallengeId,
      },
    }
  }

  // Load profile user's own activities in shared challenges
  const ownRows = await db
    .select({
      activityId:    activities.id,
      date:          activities.date,
      points:        activities.points,
      value:         activities.value,
      note:          activities.note,
      unit:          activityCatalog.unit,
      catalogName:   activityCatalog.name,
      catalogEmoji:  activityCatalog.emoji,
      challengeId:   challenges.id,
      challengeSlug: challenges.slug,
      challengeName: challenges.name,
      challengePartnerBonus: challenges.partnerBonus,
    })
    .from(activities)
    .innerJoin(activityCatalog, eq(activities.catalogItemId, activityCatalog.id))
    .innerJoin(challenges, eq(activities.challengeId, challenges.id))
    .where(
      and(
        eq(activities.userId, profileId),
        inArray(activities.challengeId, sharedChallengeIds)
      )
    )
    .orderBy(desc(activities.date), desc(activities.createdAt))

  // Load activities where profile user was tagged as partner (credited activities)
  const creditedRows = await db
    .select({
      activityId:    activities.id,
      date:          activities.date,
      points:        activities.points,
      value:         activities.value,
      note:          activities.note,
      unit:          activityCatalog.unit,
      catalogName:   activityCatalog.name,
      catalogEmoji:  activityCatalog.emoji,
      challengeId:   challenges.id,
      challengeSlug: challenges.slug,
      challengeName: challenges.name,
      challengePartnerBonus: challenges.partnerBonus,
      actorName:     users.name,
    })
    .from(activityPartners)
    .innerJoin(activities, eq(activityPartners.activityId, activities.id))
    .innerJoin(activityCatalog, eq(activities.catalogItemId, activityCatalog.id))
    .innerJoin(challenges, eq(activities.challengeId, challenges.id))
    .innerJoin(users, eq(activities.userId, users.id))
    .where(
      and(
        eq(activityPartners.userId, profileId),
        inArray(activities.challengeId, sharedChallengeIds)
      )
    )
    .orderBy(desc(activities.date), desc(activities.createdAt))

  // Fetch partners for own activities
  const ownActivityIds = ownRows.map((r) => r.activityId)
  const partnerRows = ownActivityIds.length > 0
    ? await db
        .select({ activityId: activityPartners.activityId, name: users.name })
        .from(activityPartners)
        .innerJoin(users, eq(activityPartners.userId, users.id))
        .where(inArray(activityPartners.activityId, ownActivityIds))
    : []

  const partnerMap = new Map<string, { name: string }[]>()
  for (const r of partnerRows) {
    const list = partnerMap.get(r.activityId) ?? []
    list.push({ name: r.name })
    partnerMap.set(r.activityId, list)
  }

  // Merge and sort
  type RawRow = typeof ownRows[number] & { actorName?: string }
  const rows: RawRow[] = [
    ...ownRows,
    ...creditedRows.map((r) => ({ ...r, actorName: r.actorName })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  // Load bonus achievements for profile user in shared challenges
  const achievementRows = sharedChallengeIds.length > 0
    ? await db
        .select({
          challengeId: bonusAchievements.challengeId,
          bonusPoints: bonusAchievements.bonusPoints,
          name: bonusRules.name,
        })
        .from(bonusAchievements)
        .innerJoin(bonusRules, eq(bonusAchievements.bonusRuleId, bonusRules.id))
        .where(
          and(
            eq(bonusAchievements.userId, profileId),
            inArray(bonusAchievements.challengeId, sharedChallengeIds)
          )
        )
    : []

  const bonusMap = new Map<string, EarnedBonus[]>()
  for (const r of achievementRows) {
    const list = bonusMap.get(r.challengeId) ?? []
    list.push({ name: r.name, bonusPoints: r.bonusPoints })
    bonusMap.set(r.challengeId, list)
  }

  // Group by challenge
  const groupMap = new Map<string, ChallengeGroup>()
  for (const row of rows) {
    if (!groupMap.has(row.challengeId)) {
      groupMap.set(row.challengeId, {
        id: row.challengeId,
        slug: row.challengeSlug ?? null,
        name: row.challengeName,
        totalPoints: 0,
        activities: [],
        earnedBonuses: bonusMap.get(row.challengeId) ?? [],
      })
    }
    const group = groupMap.get(row.challengeId)!
    const isOwn = !(row as RawRow).actorName
    const ownPartners = isOwn ? (partnerMap.get(row.activityId) ?? []) : []
    // Profile user's earned km from this row: full base points either way (own or credited),
    // plus the partner bonus when partners are tagged. Mirrors the leaderboard math.
    const basePoints = row.points
    const partnerBonus = isOwn
      ? (ownPartners.length > 0 ? row.challengePartnerBonus : 0)
      : row.challengePartnerBonus
    group.totalPoints += basePoints + partnerBonus
    group.activities.push({
      id:            row.activityId,
      date:          row.date,
      points:        basePoints,
      partnerBonus,
      value:         row.value,
      unit:          row.unit,
      catalogName:   row.catalogName,
      catalogEmoji:  row.catalogEmoji,
      note:          row.note,
      partners:      isOwn ? ownPartners : undefined,
      creditedBy:    (row as RawRow).actorName,
    })
  }

  // Add groups that have only bonuses (no activities)
  for (const [challengeId, bonuses] of bonusMap) {
    if (!groupMap.has(challengeId)) {
      const ch = await db.select({ id: challenges.id, slug: challenges.slug, name: challenges.name })
        .from(challenges).where(eq(challenges.id, challengeId)).get()
      if (ch) {
        groupMap.set(challengeId, { id: ch.id, slug: ch.slug ?? null, name: ch.name, totalPoints: 0, activities: [], earnedBonuses: bonuses })
      }
    }
  }

  // Add bonus km to group totals
  for (const [challengeId, bonuses] of bonusMap) {
    const group = groupMap.get(challengeId)
    if (group) group.totalPoints += bonuses.reduce((s, b) => s + b.bonusPoints, 0)
  }

  return {
    props: {
      profile: profileUser,
      challengeGroups: Array.from(groupMap.values()),
      isOwnProfile: viewer.id === profileId,
      fromChallengeId,
    },
  }
}

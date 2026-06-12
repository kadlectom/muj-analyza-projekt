import { useState, useMemo, useEffect } from "react"
import type { GetServerSideProps } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { eq, count, or, and, isNull, desc, sql, inArray } from "drizzle-orm"
import { getSessionUser, isAdmin, type SessionUser } from "@/lib/permissions"
import { db } from "@/lib/db"
import { challenges, enrollments, activityCatalog, activities, activityPartners, bonusAchievements, bonusRules, users } from "@/db/schema"
import { getActiveChallenge, type ActiveChallenge } from "@/lib/getActiveChallenge"
import { AppLayout } from "@/components/layout/AppLayout"
import { ChallengeHero } from "@/components/challenges/ChallengeHero"
import { type CatalogItem } from "@/components/admin/CatalogTable"
import { ActivityForm } from "@/components/activities/ActivityForm"
import { type ActivityEntry } from "@/components/activities/ActivityList"
import { ActivityOverlay } from "@/components/activities/ActivityOverlay"
import { BottomSheet } from "@/components/activities/BottomSheet"
import { type FeedItem } from "@/components/activities/ActivityFeed"
import { type LeaderboardEntry } from "@/components/leaderboard/LeaderboardTable"
import { Modal } from "@/components/ui/Modal"
import { ActivitySuccessView } from "@/components/challenges/ActivitySuccessView"
import { ChallengeKebabMenu } from "@/components/challenges/ChallengeKebabMenu"
import { NastenkaTab } from "@/components/challenges/NastenkaTab"
import { MojeAktivityTab } from "@/components/challenges/MojeAktivityTab"
import { LeaderboardTab } from "@/components/challenges/LeaderboardTab"
import { SpravTab } from "@/components/challenges/SpravTab"
import {
  TABS,
  type Tab,
  type EnrolledParticipant,
  type EnrollmentEvent,
  type WeeklyHighlights,
  type BonusRuleProgress,
  type RecentAchievement,
  type MergedFeedEntry,
} from "@/components/challenges/challengeDetail.types"
import { useChallengeKebab } from "@/hooks/useChallengeKebab"
import { useChallengeStatus } from "@/hooks/useChallengeStatus"
import { useChallengeEnroll } from "@/hooks/useChallengeEnroll"
import { useActivityForm } from "@/hooks/useActivityForm"
import { fetchWeeklyHighlights, fetchBonusRulesProgress, fetchLeaderboardForChallenge } from "@/lib/challengeDetail.server"

type Props = {
  user: SessionUser
  challenge: {
    id: string
    slug: string | null
    name: string
    type: "WINTER" | "SUMMER"
    status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED"
    startDate: string
    endDate: string
    partnerBonus: number
  }
  participantCount: number
  catalogItems: CatalogItem[]
  isEnrolled: boolean
  myActivities: ActivityEntry[]
  userRank: number | null
  userTotalKm: number | null
  feedItems: FeedItem[]
  challengeFreq: Record<string, number>
  enrolledParticipants: EnrolledParticipant[]
  activeChallengeForHeader: ActiveChallenge | null
  bonusRulesProgress: BonusRuleProgress[]
  gapToNextKm: number | null
  recentAchievements: RecentAchievement[]
  enrollmentEvents: EnrollmentEvent[]
  weeklyHighlights: WeeklyHighlights
  initialLeaderboard: LeaderboardEntry[]
  totalChallengeKm: number
  dailyCumulativeKm: { date: string; km: number }[]
}

export default function ChallengeDetailPage({
  user,
  challenge,
  participantCount,
  catalogItems,
  isEnrolled,
  myActivities,
  userRank,
  userTotalKm,
  feedItems,
  challengeFreq,
  enrolledParticipants,
  activeChallengeForHeader,
  bonusRulesProgress,
  gapToNextKm,
  recentAchievements,
  enrollmentEvents,
  weeklyHighlights,
  initialLeaderboard,
  totalChallengeKm,
  dailyCumulativeKm,
}: Props) {
  const router = useRouter()
  const initialTab: Tab = (() => {
    const t = router.query.tab
    if (typeof t === "string" && TABS.some((tab) => tab.id === t)) return t as Tab
    return "nastenska"
  })()
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [feedPage, setFeedPage] = useState(1)

  const { statusLoading, statusError, confirmTransition, setConfirmTransition, transitionStatus } = useChallengeStatus(challenge.id)
  const { kebabOpen, setKebabOpen, kebabRef } = useChallengeKebab(setConfirmTransition)
  const { enrollLoading, enrollError, handleEnroll } = useChallengeEnroll(challenge.id)
  const { showActivityForm, setShowActivityForm, successState, handleFormSuccess, closeForm } = useActivityForm(setActiveTab)

  const admin = isAdmin(user.role)
  const isActive = challenge.status === "ACTIVE"
  const isDraft = challenge.status === "DRAFT"
  const canEdit = admin && (isDraft || isActive)
  const canPublish = admin && isDraft
  const canClose = admin && isActive
  const today = new Date().toISOString().slice(0, 10)
  const canLogActivity = isActive && isEnrolled && today >= challenge.startDate && today <= challenge.endDate

  // Honor `?action=record` from list page deep-link: open the activity modal once,
  // then strip the query params so refresh doesn't re-trigger.
  useEffect(() => {
    if (!router.isReady) return
    const action = router.query.action
    const tab = router.query.tab
    if (action === "record" && canLogActivity) {
      setShowActivityForm(true)
    }
    if (action !== undefined || tab !== undefined) {
      const cleaned = router.asPath.split("?")[0]
      router.replace(cleaned, undefined, { scroll: false, shallow: true })
    }
    // One-shot on mount; intentionally not depending on `router.query.*`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady])

  const activeCatalogItems = catalogItems.filter((i) => i.isActive)
  const userCatalogItems = activeCatalogItems.filter(
    (i) =>
      i.challengeId === challenge.id ||
      (i.challengeId === null &&
        (i.challengeType === challenge.type || i.challengeType === "BOTH"))
  )

  const sortedCatalogItems = useMemo(() => {
    const personalFreq = new Map<string, number>()
    for (const a of myActivities) {
      personalFreq.set(a.catalogItemId, (personalFreq.get(a.catalogItemId) ?? 0) + 1)
    }
    return [...userCatalogItems].sort((a, b) => {
      const personal = (personalFreq.get(b.id) ?? 0) - (personalFreq.get(a.id) ?? 0)
      if (personal !== 0) return personal
      return (challengeFreq[b.id] ?? 0) - (challengeFreq[a.id] ?? 0)
    })
  }, [myActivities, userCatalogItems, challengeFreq])

  const mergedFeed = useMemo<MergedFeedEntry[]>(() => {
    const actEntries: MergedFeedEntry[] = feedItems.map((item) => ({
      type: "activity",
      key: `act-${item.userId}-${item.createdAt}`,
      ts: item.createdAt,
      item,
    }))
    const achEntries: MergedFeedEntry[] = recentAchievements.map((item) => ({
      type: "achievement",
      key: `ach-${item.userId}-${item.earnedAt}`,
      ts: item.earnedAt,
      item,
    }))
    const enrollEntries: MergedFeedEntry[] = enrollmentEvents.map((item) => ({
      type: "enrollment",
      key: `enroll-${item.userId}-${item.enrolledAt}`,
      ts: item.enrolledAt,
      item,
    }))
    return [...actEntries, ...achEntries, ...enrollEntries].sort((a, b) => b.ts - a.ts)
  }, [feedItems, recentAchievements, enrollmentEvents])

  const visibleTabs = TABS.filter((t) => {
    if (t.id === "sprava") return admin
    if (t.id === "moje-aktivity") return isEnrolled
    return true
  })

  const formContent = successState ? (
    <ActivitySuccessView
      points={successState.points}
      partnerBonus={successState.partnerBonus}
      newlyEarnedBonuses={successState.newlyEarnedBonuses}
      challengeName={challenge.name}
      userTotalKm={userTotalKm}
      activityName={successState.activityName}
      activityEmoji={successState.activityEmoji}
      inputValue={successState.inputValue}
      inputUnit={successState.inputUnit}
      partnerNames={successState.partnerNames}
    />
  ) : (
    <ActivityForm
      mode="create"
      variant="pill"
      challengeId={challenge.id}
      startDate={challenge.startDate}
      endDate={challenge.endDate}
      catalogItems={sortedCatalogItems}
      enrolledParticipants={enrolledParticipants.filter((p) => p.id !== user.id)}
      partnerBonus={challenge.partnerBonus}
      onSuccess={handleFormSuccess}
      onCancel={closeForm}
    />
  )

  return (
    <AppLayout user={user} activeChallenge={activeChallengeForHeader}>
      <Head>
        <title>{challenge.name} – Jerryho Výzvy</title>
      </Head>
      <div className="max-w-[1280px] mx-auto px-3 md:px-7 py-8 md:pb-8 pb-32">
        {/* Hero */}
        <ChallengeHero
          challenge={challenge}
          participantCount={participantCount}
          userRank={isEnrolled ? userRank : null}
          userTotalKm={isEnrolled ? userTotalKm : null}
          gapToNextKm={gapToNextKm}
          totalChallengeKm={totalChallengeKm}
          dailyCumulativeKm={dailyCumulativeKm}
          onRankPillClick={() => setActiveTab("leaderboard")}
          topRowStart={
            <Link
              href="/challenges"
              className="inline-flex items-center gap-1 no-underline hover:opacity-100 transition-opacity"
              style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.6)", letterSpacing: "0.01em", opacity: 0.75 }}
            >
              <ArrowLeft size={14} />
              Výzvy
            </Link>
          }
          topRowEnd={admin ? (
            <ChallengeKebabMenu
              challenge={challenge}
              kebabOpen={kebabOpen}
              onToggle={() => setKebabOpen((v) => !v)}
              kebabRef={kebabRef}
              canEdit={canEdit}
              canPublish={canPublish}
              canClose={canClose}
              onPublish={() => { setConfirmTransition("ACTIVE"); setKebabOpen(false) }}
              onClose={() => { setConfirmTransition("CLOSED"); setKebabOpen(false) }}
            />
          ) : undefined}
          ctaRow={isActive && !isEnrolled ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleEnroll}
                  disabled={enrollLoading}
                  className="bg-white text-blue font-bold text-[14px] px-5 py-2 rounded-sm hover:bg-white/90 disabled:opacity-60 transition-colors"
                >
                  {enrollLoading ? "Registruji…" : "Zapojit se"}
                </button>
              </div>
              {enrollError && (
                <p className="text-[13px] font-semibold" style={{ color: "rgba(255,120,120,1)" }}>
                  {enrollError}
                </p>
              )}
            </div>
          ) : undefined}
          inlineCta={isActive && isEnrolled ? (
            <button
              onClick={() => setShowActivityForm(true)}
              className="inline-flex items-center gap-2 bg-white text-blue font-bold text-[14px] px-5 py-2.5 rounded-full shadow-md hover:bg-white/95 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              <Plus size={16} className="flex-shrink-0" />
              Zapsat aktivitu
            </button>
          ) : undefined}
        />

        {/* Tab strip */}
        <div className="flex items-center border-b-2 border-gray-border mb-6 overflow-x-auto scrollbar-hide" style={{ touchAction: "pan-x" }}>
          <div className="flex items-center flex-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id === "nastenska") setFeedPage(1) }}
                className={`text-[14px] font-bold py-[10px] px-[22px] border-b-[3px] mb-[-2px] transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? "text-blue border-blue"
                    : "text-gray-mid border-transparent hover:text-dark"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Nástěnka */}
        {activeTab === "nastenska" && (
          <NastenkaTab
            isEnrolled={isEnrolled}
            isActive={isActive}
            challenge={challenge}
            currentUserId={user.id}
            mergedFeed={mergedFeed}
            weeklyHighlights={weeklyHighlights}
            enrollLoading={enrollLoading}
            enrollError={enrollError}
            feedPage={feedPage}
            onLoadMore={() => setFeedPage((p) => p + 1)}
            onEnroll={handleEnroll}
          />
        )}

        {/* Tab: Moje aktivity */}
        {activeTab === "moje-aktivity" && isEnrolled && (
          <MojeAktivityTab
            bonusRulesProgress={bonusRulesProgress}
            myActivities={myActivities}
            challenge={challenge}
            sortedCatalogItems={sortedCatalogItems}
            isActive={isActive}
            enrolledParticipants={enrolledParticipants}
            currentUserId={user.id}
          />
        )}

        {/* Tab: Žebříček */}
        {activeTab === "leaderboard" && (
          <LeaderboardTab
            challengeId={challenge.id}
            currentUserId={user.id}
            initialLeaderboard={initialLeaderboard}
          />
        )}

        {/* Tab: Správa (admin only) */}
        {activeTab === "sprava" && admin && (
          <SpravTab
            challengeId={challenge.id}
            challengeStatus={challenge.status}
            startDate={challenge.startDate}
            endDate={challenge.endDate}
            catalogItems={catalogItems}
            enrolledParticipants={enrolledParticipants}
            partnerBonus={challenge.partnerBonus}
          />
        )}
      </div>

      {/* Desktop overlay (md+) */}
      <div className="hidden md:block">
        <ActivityOverlay
          isOpen={showActivityForm}
          onClose={closeForm}
          title={successState ? "Aktivita uložena" : "Zapsat aktivitu"}
        >
          {formContent}
        </ActivityOverlay>
      </div>

      {/* Mobile bottom sheet (< md) */}
      <div className="md:hidden">
        <BottomSheet
          isOpen={showActivityForm}
          onClose={closeForm}
          title={successState ? "Aktivita uložena" : "Zapsat aktivitu"}
        >
          {formContent}
        </BottomSheet>
      </div>

      {/* Mobile sticky CTA */}
      {isActive && isEnrolled && !showActivityForm && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4"
          style={{ background: "linear-gradient(to top, rgba(232,236,240,1) 70%, rgba(232,236,240,0))" }}
        >
          <button
            onClick={() => setShowActivityForm(true)}
            className="w-full flex items-center justify-center gap-2 text-white font-bold text-[14px] py-[13px] rounded-[14px]"
            style={{ background: "var(--gradient)" }}
          >
            <Plus size={16} className="flex-shrink-0" />
            Zapsat aktivitu
          </button>
        </div>
      )}

      {/* Publish/close confirmation modal — rendered via portal to escape hero overflow-hidden */}
      <Modal
        isOpen={confirmTransition !== null}
        onClose={() => { setConfirmTransition(null) }}
        title={confirmTransition === "ACTIVE" ? "Publikovat výzvu" : "Uzavřít výzvu"}
      >
        <p className="text-[14px] text-gray-mid mb-5">
          {confirmTransition === "ACTIVE"
            ? "Výzva bude viditelná pro všechny účastníky a bude možné se do ní přihlásit."
            : "Tato akce je nevratná — výzva bude uzavřena a nelze v ní dále zapisovat aktivity."}
        </p>
        {statusError && (
          <p className="text-[13px] font-semibold text-red mb-4">{statusError}</p>
        )}
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={() => { setConfirmTransition(null) }}
            className="text-[13px] text-gray-mid hover:text-dark px-3 py-1.5 transition-colors"
          >
            Zrušit
          </button>
          <button
            onClick={() => confirmTransition && transitionStatus(confirmTransition)}
            disabled={statusLoading}
            className="text-[13px] font-semibold text-white bg-blue hover:bg-blue/90 px-4 py-2 rounded-sm transition-colors disabled:opacity-60"
          >
            {statusLoading ? "…" : confirmTransition === "ACTIVE" ? "Publikovat" : "Uzavřít"}
          </button>
        </div>
      </Modal>
    </AppLayout>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const user = await getSessionUser(ctx)
  if (!user) return { redirect: { destination: "/login", permanent: false } }

  const { id: idOrSlug } = ctx.params as { id: string }

  const challenge = await db
    .select()
    .from(challenges)
    .where(or(eq(challenges.slug, idOrSlug), eq(challenges.id, idOrSlug)))
    .then((rows) => rows[0] ?? null)

  if (!challenge) return { notFound: true }
  if (challenge.status === "DRAFT" && !isAdmin(user.role)) return { notFound: true }

  if (challenge.slug && idOrSlug !== challenge.slug) {
    return { redirect: { destination: `/challenges/${challenge.slug}`, permanent: true } }
  }

  const id = challenge.id

  const [{ total }] = await db
    .select({ total: count() })
    .from(enrollments)
    .where(eq(enrollments.challengeId, id))

  const enrollment = await db
    .select({ userId: enrollments.userId })
    .from(enrollments)
    .where(and(eq(enrollments.userId, user.id), eq(enrollments.challengeId, id)))
    .then((r) => r[0] ?? null)

  const catalogTypeFilter = isAdmin(user.role)
    ? isNull(activityCatalog.challengeId)
    : and(
        isNull(activityCatalog.challengeId),
        or(
          eq(activityCatalog.challengeType, challenge.type),
          eq(activityCatalog.challengeType, "BOTH")
        )
      )

  const rawCatalog = await db
    .select()
    .from(activityCatalog)
    .where(or(eq(activityCatalog.challengeId, id), catalogTypeFilter))

  const catalogItems: CatalogItem[] = rawCatalog.map((item) => ({
    id: item.id,
    challengeId: item.challengeId,
    name: item.name,
    emoji: item.emoji,
    unit: item.unit,
    pointsPerUnit: item.pointsPerUnit,
    minValue: item.minValue,
    category: item.category,
    challengeType: item.challengeType,
    isActive: item.isActive,
    createdAt: item.createdAt.getTime(),
  }))

  let myActivities: ActivityEntry[] = []
  if (enrollment) {
    const rawActivities = await db
      .select({
        id: activities.id,
        catalogItemId: activities.catalogItemId,
        catalogName: activityCatalog.name,
        catalogEmoji: activityCatalog.emoji,
        catalogUnit: activityCatalog.unit,
        value: activities.value,
        points: activities.points,
        date: activities.date,
        note: activities.note,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .innerJoin(activityCatalog, eq(activities.catalogItemId, activityCatalog.id))
      .where(and(eq(activities.challengeId, id), eq(activities.userId, user.id)))
      .orderBy(desc(activities.date), desc(activities.createdAt))

    const activityIds = rawActivities.map((a) => a.id)
    const partnerRows = activityIds.length > 0
      ? await db
          .select({ activityId: activityPartners.activityId, userId: users.id, name: users.name })
          .from(activityPartners)
          .innerJoin(users, eq(activityPartners.userId, users.id))
          .where(inArray(activityPartners.activityId, activityIds))
      : []
    const partnerMap = new Map<string, { id: string; name: string }[]>()
    for (const r of partnerRows) {
      const list = partnerMap.get(r.activityId) ?? []
      list.push({ id: r.userId, name: r.name })
      partnerMap.set(r.activityId, list)
    }

    const rawCredited = await db
      .select({
        id: activities.id,
        catalogItemId: activities.catalogItemId,
        catalogName: activityCatalog.name,
        catalogEmoji: activityCatalog.emoji,
        catalogUnit: activityCatalog.unit,
        value: activities.value,
        points: activities.points,
        date: activities.date,
        note: activities.note,
        createdAt: activities.createdAt,
        actorId: activities.userId,
        actorName: users.name,
      })
      .from(activityPartners)
      .innerJoin(activities, eq(activityPartners.activityId, activities.id))
      .innerJoin(activityCatalog, eq(activities.catalogItemId, activityCatalog.id))
      .innerJoin(users, eq(activities.userId, users.id))
      .where(and(eq(activityPartners.userId, user.id), eq(activities.challengeId, id)))

    myActivities = [
      ...rawActivities.map((a) => {
        const partners = partnerMap.get(a.id) ?? []
        return {
          ...a,
          createdAt: a.createdAt.getTime(),
          partners,
          partnerBonus: partners.length > 0 ? challenge.partnerBonus : 0,
          viaPartner: undefined as { id: string; name: string } | undefined,
        }
      }),
      // Credited rows: tagged partner is credited with the actor's full points plus the partner
      // bonus — same total as the actor (matches what the leaderboard sums).
      ...rawCredited.map((a) => ({
        id: a.id,
        catalogItemId: a.catalogItemId,
        catalogName: a.catalogName,
        catalogEmoji: a.catalogEmoji,
        catalogUnit: a.catalogUnit,
        value: a.value,
        points: a.points,
        partnerBonus: challenge.partnerBonus,
        date: a.date,
        note: a.note,
        createdAt: a.createdAt.getTime(),
        partners: [] as { id: string; name: string }[],
        viaPartner: { id: a.actorId, name: a.actorName },
      })),
    ].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
  }

  const rawEnrolled = await db
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.userId, users.id))
    .where(eq(enrollments.challengeId, id))

  const enrolledParticipants: EnrolledParticipant[] = rawEnrolled

  let userRank: number | null = null
  let userTotalKm: number | null = null
  let gapToNextKm: number | null = null
  let initialLeaderboard: LeaderboardEntry[] = []
  if (enrollment) {
    const result = await fetchLeaderboardForChallenge(id, challenge.partnerBonus, rawEnrolled, user.id)
    userRank = result.userRank
    userTotalKm = result.userTotalKm
    gapToNextKm = result.gapToNextKm
    initialLeaderboard = result.initialLeaderboard
  }

  const rawFeed = await db
    .select({
      activityId: activities.id,
      userId: activities.userId,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
      catalogEmoji: activityCatalog.emoji,
      catalogName: activityCatalog.name,
      catalogUnit: activityCatalog.unit,
      value: activities.value,
      points: activities.points,
      date: activities.date,
      note: activities.note,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .innerJoin(activityCatalog, eq(activities.catalogItemId, activityCatalog.id))
    .where(eq(activities.challengeId, id))
    .orderBy(desc(activities.createdAt))
    .limit(40)

  const feedActivityIds = rawFeed.map((r) => r.activityId)
  const feedPartnerRows = feedActivityIds.length > 0
    ? await db
        .select({ activityId: activityPartners.activityId, name: users.name })
        .from(activityPartners)
        .innerJoin(users, eq(activityPartners.userId, users.id))
        .where(inArray(activityPartners.activityId, feedActivityIds))
    : []
  const feedPartnerMap = new Map<string, { name: string }[]>()
  for (const r of feedPartnerRows) {
    const list = feedPartnerMap.get(r.activityId) ?? []
    list.push({ name: r.name })
    feedPartnerMap.set(r.activityId, list)
  }

  const feedItems: FeedItem[] = rawFeed.map((r) => {
    const partners = feedPartnerMap.get(r.activityId) ?? []
    return {
      userId: r.userId,
      userName: r.userName,
      userAvatarUrl: r.userAvatarUrl,
      catalogEmoji: r.catalogEmoji,
      catalogName: r.catalogName,
      catalogUnit: r.catalogUnit,
      value: r.value,
      points: r.points,
      partnerBonus: partners.length > 0 ? challenge.partnerBonus : 0,
      date: r.date,
      note: r.note,
      createdAt: r.createdAt.getTime(),
      partners,
    }
  })

  const rawChallengeFreq = await db
    .select({ catalogItemId: activities.catalogItemId, n: count() })
    .from(activities)
    .where(eq(activities.challengeId, id))
    .groupBy(activities.catalogItemId)

  const challengeFreq: Record<string, number> = {}
  for (const r of rawChallengeFreq) {
    challengeFreq[r.catalogItemId] = r.n
  }

  // Collective km counts each participant's physical contribution per activity:
  // the actor once + every tagged partner once. Partner bonuses and bonus achievements
  // are gamification, not physical km, so they're excluded.
  const [ownDailyKm, partnerDailyKm] = await Promise.all([
    db
      .select({
        date: activities.date,
        km: sql<number>`sum(${activities.points})`.as("km"),
      })
      .from(activities)
      .where(eq(activities.challengeId, id))
      .groupBy(activities.date),
    db
      .select({
        date: activities.date,
        km: sql<number>`sum(${activities.points})`.as("km"),
      })
      .from(activityPartners)
      .innerJoin(activities, eq(activityPartners.activityId, activities.id))
      .where(eq(activities.challengeId, id))
      .groupBy(activities.date),
  ])

  const dailyKmMap = new Map<string, number>()
  for (const r of ownDailyKm) dailyKmMap.set(r.date, r.km)
  for (const r of partnerDailyKm) dailyKmMap.set(r.date, (dailyKmMap.get(r.date) ?? 0) + r.km)
  const todayStr = new Date().toISOString().slice(0, 10)
  const capDate = challenge.endDate < todayStr ? challenge.endDate : todayStr
  const dailyCumulativeKm: { date: string; km: number }[] = []
  let cumKm = 0
  const cur = new Date(challenge.startDate)
  while (true) {
    const dateStr = cur.toISOString().slice(0, 10)
    if (dateStr > capDate) break
    cumKm += dailyKmMap.get(dateStr) ?? 0
    dailyCumulativeKm.push({ date: dateStr, km: cumKm })
    cur.setDate(cur.getDate() + 1)
  }
  const totalChallengeKm = cumKm

  const activeChallengeForHeader =
    challenge.status === "ACTIVE"
      ? { id: challenge.id, slug: challenge.slug ?? null, name: challenge.name, type: challenge.type }
      : await getActiveChallenge()

  const rawAchievements = await db
    .select({
      userId: bonusAchievements.userId,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
      bonusName: bonusRules.name,
      bonusPoints: bonusAchievements.bonusPoints,
      earnedAt: bonusAchievements.earnedAt,
    })
    .from(bonusAchievements)
    .innerJoin(users, eq(bonusAchievements.userId, users.id))
    .innerJoin(bonusRules, eq(bonusAchievements.bonusRuleId, bonusRules.id))
    .where(eq(bonusAchievements.challengeId, id))
    .orderBy(desc(bonusAchievements.earnedAt))
    .limit(10)

  const recentAchievements: RecentAchievement[] = rawAchievements.map((r) => ({
    userId: r.userId,
    userName: r.userName,
    userAvatarUrl: r.userAvatarUrl,
    bonusName: r.bonusName,
    bonusPoints: r.bonusPoints,
    earnedAt: r.earnedAt.getTime(),
  }))

  const weeklyHighlights = await fetchWeeklyHighlights(id)

  const rawEnrollmentEvents = await db
    .select({
      userId: enrollments.userId,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
      enrolledAt: enrollments.enrolledAt,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.userId, users.id))
    .where(eq(enrollments.challengeId, id))
    .orderBy(desc(enrollments.enrolledAt))
    .limit(40)

  const enrollmentEvents: EnrollmentEvent[] = rawEnrollmentEvents.map((r) => ({
    userId: r.userId,
    userName: r.userName,
    userAvatarUrl: r.userAvatarUrl,
    enrolledAt: r.enrolledAt.getTime(),
  }))

  const bonusRulesProgress: BonusRuleProgress[] = enrollment
    ? await fetchBonusRulesProgress(id, user.id)
    : []

  return {
    props: {
      user,
      challenge: {
        id: challenge.id,
        slug: challenge.slug ?? null,
        name: challenge.name,
        type: challenge.type,
        status: challenge.status,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        partnerBonus: challenge.partnerBonus,
      },
      participantCount: total,
      catalogItems,
      isEnrolled: !!enrollment,
      myActivities,
      userRank,
      userTotalKm,
      feedItems,
      challengeFreq,
      enrolledParticipants,
      activeChallengeForHeader,
      bonusRulesProgress,
      gapToNextKm,
      recentAchievements,
      enrollmentEvents,
      weeklyHighlights,
      initialLeaderboard,
      totalChallengeKm,
      dailyCumulativeKm,
    },
  }
}

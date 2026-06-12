import type { GetServerSideProps } from "next"
import Head from "next/head"
import Link from "next/link"
import { Plus } from "lucide-react"
import { eq, desc, count } from "drizzle-orm"
import { getSessionUser, isAdmin, type SessionUser } from "@/lib/permissions"
import { db } from "@/lib/db"
import { challenges, enrollments } from "@/db/schema"
import { getActiveChallenge, type ActiveChallenge } from "@/lib/getActiveChallenge"
import { buildBatchLeaderboard } from "@/lib/leaderboardCalc"
import { AppLayout } from "@/components/layout/AppLayout"
import { ChallengeHeroB } from "@/components/challenges/ChallengeHeroB"
import { NoActiveCard } from "@/components/challenges/NoActiveCard"
import { DraftSection } from "@/components/challenges/DraftSection"
import { ArchiveSection, } from "@/components/challenges/ArchiveSection"
import { type ChallengeCardData } from "@/components/challenges/ChallengeCard"
import { type ArchiveChallengeData } from "@/components/challenges/ArchiveCard"

type ActiveHeroData = ChallengeCardData & { isEnrolled: boolean }

type Props = {
  user: SessionUser
  activeChallenge: ActiveChallenge | null
  activeItems: ActiveHeroData[]
  draftItems: ChallengeCardData[]
  archiveItems: ArchiveChallengeData[]
}

export default function ChallengesPage({ user, activeChallenge, activeItems, draftItems, archiveItems }: Props) {
  const admin = isAdmin(user.role)

  return (
    <AppLayout user={user} activeChallenge={activeChallenge}>
      <Head>
        <title>Výzvy – Jerryho Výzvy</title>
      </Head>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-7 py-6 sm:py-8">

        {/* Page title row */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h1 className="text-[22px] font-extrabold text-dark">Výzvy</h1>
            <p className="text-[13px] text-gray-mid mt-0.5">Všechny výzvy na jednom místě.</p>
          </div>
          {admin && (
            <Link
              href="/admin/challenges/new"
              className="inline-flex items-center gap-1.5 bg-blue hover:bg-blue-hover text-white font-bold text-[13px] px-4 py-2 rounded-sm no-underline"
            >
              <Plus size={14} />
              Nová výzva
            </Link>
          )}
        </div>

        {/* Active challenges */}
        {activeItems.length > 0 ? (
          <div className="flex flex-col gap-4">
            {activeItems.map(c => (
              <ChallengeHeroB key={c.id} challenge={c} currentUserId={user.id} isAdmin={admin} />
            ))}
          </div>
        ) : (
          <NoActiveCard isAdmin={admin} />
        )}

        {/* Draft challenges (admin only) */}
        {admin && draftItems.length > 0 && (
          <DraftSection drafts={draftItems} />
        )}

        {/* Archive */}
        {archiveItems.length > 0 ? (
          <ArchiveSection challenges={archiveItems} currentUserId={user.id} />
        ) : (
          <div className="mt-8 bg-white rounded-md border border-gray-border p-8 text-center">
            <p className="text-[32px] mb-2">🏁</p>
            <p className="text-[14px] font-bold text-dark">Archiv je zatím prázdný</p>
            <p className="text-[12px] text-gray-mid mt-1">Po skončení první výzvy se sem uloží výsledky.</p>
          </div>
        )}

        <div className="h-20" />
      </div>
    </AppLayout>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const user = await getSessionUser(ctx)
  if (!user) return { redirect: { destination: "/login", permanent: false } }

  const admin = isAdmin(user.role)

  const allChallenges = await db
    .select()
    .from(challenges)
    .orderBy(desc(challenges.startDate))

  const visible = admin ? allChallenges : allChallenges.filter(c => c.status !== "DRAFT")

  // Enrollment counts per challenge
  const countRows = await db
    .select({ challengeId: enrollments.challengeId, total: count() })
    .from(enrollments)
    .groupBy(enrollments.challengeId)
  const countMap: Record<string, number> = {}
  for (const row of countRows) countMap[row.challengeId] = row.total

  // Current user's enrolled challenge IDs
  const myEnrollRows = await db
    .select({ challengeId: enrollments.challengeId })
    .from(enrollments)
    .where(eq(enrollments.userId, user.id))
  const myEnrolledIds = new Set(myEnrollRows.map(e => e.challengeId))

  const now = Date.now()
  const toCard = (c: typeof visible[0]): ChallengeCardData => {
    const start = new Date(c.startDate + "T00:00:00").getTime()
    const end = new Date(c.endDate + "T23:59:59").getTime()
    const total = end - start
    const elapsed = Math.min(Math.max(now - start, 0), total)
    return {
      id: c.id,
      slug: c.slug ?? null,
      name: c.name,
      type: c.type,
      status: c.status,
      startDate: c.startDate,
      endDate: c.endDate,
      participantCount: countMap[c.id] ?? 0,
      progressPercent: total > 0 ? Math.round((elapsed / total) * 100) : 0,
    }
  }

  const activeItems: ActiveHeroData[] = visible
    .filter(c => c.status === "ACTIVE")
    .map(c => ({ ...toCard(c), isEnrolled: myEnrolledIds.has(c.id) }))

  const draftItems: ChallengeCardData[] = admin
    ? visible.filter(c => c.status === "DRAFT").map(toCard)
    : []

  // Batch top-3 leaderboard for archive podiums
  const archiveChallenges = visible.filter(c => c.status === "CLOSED" || c.status === "ARCHIVED")
  const archiveIds = archiveChallenges.map(c => c.id)
  const podiums = archiveIds.length > 0 ? await buildBatchLeaderboard(archiveIds, 3) : {}

  const archiveItems: ArchiveChallengeData[] = archiveChallenges.map(c => ({
    ...toCard(c),
    joined: myEnrolledIds.has(c.id),
    podium: podiums[c.id] ?? [],
  }))

  const activeChallenge = await getActiveChallenge()

  return { props: { user, activeChallenge, activeItems, draftItems, archiveItems } }
}

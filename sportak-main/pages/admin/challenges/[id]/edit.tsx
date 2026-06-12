import type { GetServerSideProps } from "next"
import Head from "next/head"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { eq, or, isNull } from "drizzle-orm"
import { getSessionUser, isAdmin, type SessionUser } from "@/lib/permissions"
import { db } from "@/lib/db"
import { challenges, bonusRules, activityCatalog } from "@/db/schema"
import type { BonusRule } from "@/db/schema"
import { AppLayout } from "@/components/layout/AppLayout"
import { ChallengeForm } from "@/components/admin/ChallengeForm"
import { BonusRulesTable } from "@/components/admin/BonusRulesTable"

type InitialValues = {
  name: string
  type: "WINTER" | "SUMMER"
  startDate: string
  endDate: string
  partnerBonus: number
}

type CatalogOption = { id: string; name: string }

type Props = {
  user: SessionUser
  challengeId: string
  challengeSlug: string | null
  initialValues: InitialValues
  bonusRulesList: BonusRule[]
  catalogItems: CatalogOption[]
}

export default function EditChallengePage({ user, challengeId, challengeSlug, initialValues, bonusRulesList, catalogItems }: Props) {
  return (
    <AppLayout user={user}>
      <Head>
        <title>Upravit {initialValues.name} – Jerryho Výzvy</title>
      </Head>
      <div className="max-w-[680px] mx-auto px-7 py-8">
        <Link
          href={`/challenges/${challengeSlug ?? challengeId}`}
          className="inline-flex items-center gap-1.5 text-[14px] text-gray-mid hover:text-dark transition-colors mb-6 no-underline"
        >
          <ArrowLeft size={16} />
          Zpět na výzvu
        </Link>

        <h1 className="text-[24px] font-extrabold text-dark mb-6">Upravit výzvu</h1>

        <div className="bg-white rounded-md border border-gray-border p-6">
          <ChallengeForm mode="edit" challengeId={challengeId} initialValues={initialValues} />
        </div>

        <div className="bg-white rounded-md border border-gray-border p-6 mt-6">
          <h2 className="text-[16px] font-bold text-dark mb-4">Bonusová pravidla</h2>
          <BonusRulesTable
            rules={bonusRulesList}
            challengeId={challengeId}
            catalogItems={catalogItems}
          />
        </div>
      </div>
    </AppLayout>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const user = await getSessionUser(ctx)
  if (!user) return { redirect: { destination: "/login", permanent: false } }
  if (!isAdmin(user.role)) return { redirect: { destination: "/challenges", permanent: false } }

  const { id: idOrSlug } = ctx.params as { id: string }

  const challenge = await db
    .select()
    .from(challenges)
    .where(or(eq(challenges.slug, idOrSlug), eq(challenges.id, idOrSlug)))
    .then((r) => r[0] ?? null)

  if (!challenge) return { notFound: true }

  const id = challenge.id

  // CLOSED and ARCHIVED challenges are fully immutable — redirect instead of showing the form
  if (challenge.status === "CLOSED" || challenge.status === "ARCHIVED") {
    return { redirect: { destination: `/challenges/${challenge.slug ?? id}`, permanent: false } }
  }

  const rawRules = await db
    .select()
    .from(bonusRules)
    .where(eq(bonusRules.challengeId, id))

  const rawCatalog = await db
    .select({ id: activityCatalog.id, name: activityCatalog.name })
    .from(activityCatalog)
    .where(or(eq(activityCatalog.challengeId, id), isNull(activityCatalog.challengeId)))

  return {
    props: {
      user,
      challengeId: id,
      challengeSlug: challenge.slug ?? null,
      initialValues: {
        name: challenge.name,
        type: challenge.type,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        partnerBonus: challenge.partnerBonus,
      },
      bonusRulesList: rawRules.map((r) => ({
        ...r,
        createdAt: r.createdAt instanceof Date ? (r.createdAt.getTime() as unknown as Date) : r.createdAt,
      })),
      catalogItems: rawCatalog,
    },
  }
}

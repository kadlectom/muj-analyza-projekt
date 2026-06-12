import type { GetServerSideProps } from "next"
import Head from "next/head"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { eq, or, isNull } from "drizzle-orm"
import { getSessionUser, isAdmin, type SessionUser } from "@/lib/permissions"
import { db } from "@/lib/db"
import { challenges, activityCatalog } from "@/db/schema"
import { AppLayout } from "@/components/layout/AppLayout"
import { CatalogTable, type CatalogItem } from "@/components/admin/CatalogTable"

type Props = {
  user: SessionUser
  challengeId: string
  challengeSlug: string | null
  challengeName: string
  challengeType: "WINTER" | "SUMMER"
  catalogItems: CatalogItem[]
}

export default function AdminCatalogPage({ user, challengeId, challengeSlug, challengeName, challengeType, catalogItems }: Props) {
  return (
    <AppLayout user={user}>
      <Head>
        <title>Katalog: {challengeName} – Jerryho Výzvy</title>
      </Head>
      <div className="max-w-[960px] mx-auto px-7 py-8">
        <Link
          href={`/challenges/${challengeSlug ?? challengeId}`}
          className="inline-flex items-center gap-1.5 text-[14px] text-gray-mid hover:text-dark transition-colors mb-6 no-underline"
        >
          <ArrowLeft size={16} />
          Zpět na výzvu
        </Link>

        <div className="flex items-baseline gap-3 mb-6">
          <h1 className="text-[24px] font-extrabold text-dark">Katalog aktivit</h1>
          <span className="text-[14px] text-gray-mid">{challengeName}</span>
        </div>

        <div className="bg-white rounded-md border border-gray-border p-6">
          <CatalogTable
            items={catalogItems}
            challengeId={challengeId}
            challengeType={challengeType}
            isAdmin={true}
          />
        </div>
      </div>
    </AppLayout>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const user = await getSessionUser(ctx)
  if (!user) return { redirect: { destination: "/login", permanent: false } }
  if (!isAdmin(user.role)) return { notFound: true }

  const { id: idOrSlug } = ctx.params as { id: string }

  const challenge = await db
    .select({ id: challenges.id, slug: challenges.slug, name: challenges.name, type: challenges.type })
    .from(challenges)
    .where(or(eq(challenges.slug, idOrSlug), eq(challenges.id, idOrSlug)))
    .then((r) => r[0] ?? null)

  if (!challenge) return { notFound: true }

  const id = challenge.id

  // Admin catalog page shows all global items regardless of challengeType
  // so admins can see and correct items that were set to the wrong type.
  const rawCatalog = await db
    .select()
    .from(activityCatalog)
    .where(
      or(
        eq(activityCatalog.challengeId, id),
        isNull(activityCatalog.challengeId)
      )
    )

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

  return {
    props: {
      user,
      challengeId: challenge.id,
      challengeSlug: challenge.slug ?? null,
      challengeName: challenge.name,
      challengeType: challenge.type,
      catalogItems,
    },
  }
}

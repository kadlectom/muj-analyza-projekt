import type { GetServerSideProps } from "next"
import Head from "next/head"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSessionUser, isAdmin, type SessionUser } from "@/lib/permissions"
import { AppLayout } from "@/components/layout/AppLayout"
import { ChallengeForm } from "@/components/admin/ChallengeForm"

type Props = { user: SessionUser }

export default function NewChallengePage({ user }: Props) {
  return (
    <AppLayout user={user}>
      <Head>
        <title>Nová výzva – Jerryho Výzvy</title>
      </Head>
      <div className="max-w-[680px] mx-auto px-7 py-8">
        <Link
          href="/challenges"
          className="inline-flex items-center gap-1.5 text-[14px] text-gray-mid hover:text-dark transition-colors mb-6 no-underline"
        >
          <ArrowLeft size={16} />
          Zpět na výzvy
        </Link>

        <h1 className="text-[24px] font-extrabold text-dark mb-6">Nová výzva</h1>

        <div className="bg-white rounded-md border border-gray-border p-6">
          <ChallengeForm mode="create" />
        </div>
      </div>
    </AppLayout>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const user = await getSessionUser(ctx)
  if (!user) return { redirect: { destination: "/login", permanent: false } }
  if (!isAdmin(user.role)) return { redirect: { destination: "/challenges", permanent: false } }
  return { props: { user } }
}

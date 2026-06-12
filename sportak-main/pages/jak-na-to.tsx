import type { GetServerSideProps } from "next"
import Head from "next/head"
import Link from "next/link"
import { Pencil } from "lucide-react"
import { getSessionUser, isAdmin, type SessionUser } from "@/lib/permissions"
import { getActiveChallenge, type ActiveChallenge } from "@/lib/getActiveChallenge"
import { getHowToContent } from "@/lib/getHowToContent"
import { type HowToSection } from "@/lib/howToContent"
import { AppLayout } from "@/components/layout/AppLayout"
import { RichText } from "@/components/ui/RichText"

type Props = {
  user: SessionUser
  sections: HowToSection[]
  admin: boolean
  activeChallenge: ActiveChallenge | null
}

export default function HowToPage({ user, sections, admin, activeChallenge }: Props) {
  return (
    <AppLayout user={user} activeChallenge={activeChallenge}>
      <Head>
        <title>Jak na to – Jerryho Výzvy</title>
      </Head>
      <div className="max-w-[820px] mx-auto px-7 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[24px] font-extrabold text-dark">Jak na to</h1>
          {admin && (
            <Link
              href="/admin/jak-na-to"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-blue bg-blue-light px-4 py-2 rounded-sm hover:opacity-80 transition-opacity no-underline"
            >
              <Pencil size={13} />
              Upravit
            </Link>
          )}
        </div>

        {sections.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-border shadow-sm p-10 text-center">
            <p className="text-[32px] mb-3">📘</p>
            <p className="text-[15px] font-bold text-dark mb-1">Obsah se připravuje</p>
            <p className="text-[13px] text-gray-mid">
              Pravidla a tipy budou brzy k dispozici.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((s) => (
              <section
                key={s.id}
                className="bg-white rounded-lg border border-gray-border shadow-sm p-6"
              >
                <h2 className="text-[16px] font-bold text-dark mb-3">{s.title}</h2>
                <div className="text-[13px] text-dark leading-relaxed">
                  <RichText source={s.body} />
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const user = await getSessionUser(ctx)
  if (!user) return { redirect: { destination: "/login", permanent: false } }

  const [content, activeChallenge] = await Promise.all([
    getHowToContent(),
    getActiveChallenge(),
  ])

  return {
    props: {
      user,
      sections: content.sections,
      admin: isAdmin(user.role),
      activeChallenge,
    },
  }
}

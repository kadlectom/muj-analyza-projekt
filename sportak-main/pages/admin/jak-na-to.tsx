import type { GetServerSideProps } from "next"
import Head from "next/head"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSessionUser, isAdmin, type SessionUser } from "@/lib/permissions"
import { getHowToContent } from "@/lib/getHowToContent"
import { type HowToSection } from "@/lib/howToContent"
import { AppLayout } from "@/components/layout/AppLayout"
import { HowToEditor } from "@/components/admin/HowToEditor"

type Props = {
  user: SessionUser
  sections: HowToSection[]
}

export default function AdminHowToPage({ user, sections }: Props) {
  return (
    <AppLayout user={user}>
      <Head>
        <title>Upravit Jak na to – Jerryho Výzvy</title>
      </Head>
      <div className="max-w-[820px] mx-auto px-7 py-8">
        <Link
          href="/jak-na-to"
          className="inline-flex items-center gap-1.5 text-[14px] text-gray-mid hover:text-dark transition-colors mb-6 no-underline"
        >
          <ArrowLeft size={16} />
          Zpět
        </Link>

        <h1 className="text-[24px] font-extrabold text-dark mb-1">Upravit Jak na to</h1>
        <p className="text-[13px] text-gray-mid mb-6">
          Sekce se zobrazí v pořadí níže. Změny platí okamžitě po uložení.
        </p>

        <HowToEditor initialSections={sections} />
      </div>
    </AppLayout>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const user = await getSessionUser(ctx)
  if (!user) return { redirect: { destination: "/login", permanent: false } }
  if (!isAdmin(user.role)) return { redirect: { destination: "/jak-na-to", permanent: false } }

  const content = await getHowToContent()
  return { props: { user, sections: content.sections } }
}

import type { GetServerSideProps } from "next"
import { getSessionUser } from "@/lib/permissions"
import { getActiveChallenge } from "@/lib/getActiveChallenge"

export default function RootPage() {
  return null
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getSessionUser(ctx)
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } }
  }
  const active = await getActiveChallenge()
  if (active) {
    return { redirect: { destination: `/challenges/${active.slug ?? active.id}`, permanent: false } }
  }
  return { redirect: { destination: "/challenges", permanent: false } }
}

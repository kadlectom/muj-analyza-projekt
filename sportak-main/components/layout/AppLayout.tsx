import type { ReactNode } from "react"
import { AppHeader } from "./AppHeader"
import type { SessionUser } from "@/lib/permissions"
import type { ActiveChallenge } from "@/lib/getActiveChallenge"

type Props = {
  user: SessionUser
  activeChallenge?: ActiveChallenge | null
  children: ReactNode
}

export function AppLayout({ user, activeChallenge, children }: Props) {
  return (
    <div className="min-h-dvh bg-[#e8ecf0]">
      <AppHeader user={user} activeChallenge={activeChallenge} />
      <main>{children}</main>
    </div>
  )
}

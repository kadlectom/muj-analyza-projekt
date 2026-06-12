import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/router"
import { signOut } from "next-auth/react"
import { ChevronDown, LogOut, Trophy, List, BookOpen, User } from "lucide-react"
import type { SessionUser } from "@/lib/permissions"
import { isAdmin } from "@/lib/permissions"
import type { ActiveChallenge } from "@/lib/getActiveChallenge"

function initials(name?: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export function AppHeader({
  user,
  activeChallenge,
}: {
  user: SessionUser
  activeChallenge?: ActiveChallenge | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  return (
    <header className="h-[60px] bg-white border-b border-gray-border flex items-center px-4 sm:px-7 gap-3 sm:gap-6">
      {/* Logo */}
      <Link href="/challenges" className="flex items-center gap-2.5 no-underline">
        <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-lg select-none" style={{ background: "var(--gradient)" }}>
          🏆
        </div>
        <span className="font-extrabold text-[16px] text-dark tracking-[-0.3px]">Jerryho Výzvy</span>
      </Link>

      {/* Nav links */}
      <nav className="hidden sm:flex gap-1 ml-4">
        {activeChallenge && (
          <Link
            href={`/challenges/${activeChallenge.slug ?? activeChallenge.id}`}
            className={`text-[14px] px-[14px] py-[6px] rounded-md font-medium transition-colors ${
              router.pathname === "/challenges/[id]"
                ? "bg-blue-light text-blue font-semibold"
                : "text-gray-dark hover:bg-gray-light active:bg-gray-light"
            }`}
          >
            {activeChallenge.name}
          </Link>
        )}
        <Link
          href="/challenges"
          className={`text-[14px] px-[14px] py-[6px] rounded-md font-medium transition-colors ${
            router.pathname === "/challenges"
              ? "bg-blue-light text-blue font-semibold"
              : "text-gray-dark hover:bg-gray-light active:bg-gray-light"
          }`}
        >
          Výzvy
        </Link>
        <Link
          href="/jak-na-to"
          className={`text-[14px] px-[14px] py-[6px] rounded-md font-medium transition-colors ${
            router.pathname === "/jak-na-to"
              ? "bg-blue-light text-blue font-semibold"
              : "text-gray-dark hover:bg-gray-light active:bg-gray-light"
          }`}
        >
          Jak na to
        </Link>
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {isAdmin(user.role) && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-[20px] text-white bg-[#006DFF]">
            Admin
          </span>
        )}

        {/* Profile dropdown */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={user.name ?? "Profil"}
            aria-expanded={open}
            className="flex items-center gap-2 px-2.5 py-1 rounded-[24px] border border-gray-border bg-white cursor-pointer text-[13px] text-gray-dark hover:bg-gray-light active:bg-gray-light transition-colors"
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? ""}
                width={36}
                height={36}
                className="rounded-full"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "var(--gradient)" }}
              >
                {initials(user.name)}
              </div>
            )}
            <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
            <ChevronDown
              size={12}
              className={`hidden sm:block text-gray-mid transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div
              className="absolute right-0 top-[calc(100%+8px)] w-[220px] bg-white rounded-md border border-gray-border shadow-md z-40"
              style={{ animation: "hero-enter 0.2s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              <div className="px-4 py-3 border-b border-gray-border">
                <p className="text-[13px] font-semibold text-dark truncate">{user.name}</p>
                {user.email && (
                  <p className="text-[12px] text-gray-mid truncate mt-0.5">{user.email}</p>
                )}
              </div>
              <div className="py-1 border-b border-gray-border">
                <Link
                  href={`/users/${user.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-dark hover:bg-gray-light active:bg-gray-light transition-colors no-underline"
                >
                  <User size={14} className="text-gray-mid" />
                  Můj profil
                </Link>
              </div>
              <div className="sm:hidden py-1 border-b border-gray-border">
                {activeChallenge && (
                  <Link
                    href={`/challenges/${activeChallenge.slug ?? activeChallenge.id}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] no-underline transition-colors ${
                      router.pathname === "/challenges/[id]"
                        ? "bg-blue-light text-blue font-semibold"
                        : "text-gray-dark hover:bg-gray-light active:bg-gray-light"
                    }`}
                  >
                    <Trophy size={14} className={router.pathname === "/challenges/[id]" ? "text-blue" : "text-gray-mid"} />
                    <span className="truncate">{activeChallenge.name}</span>
                  </Link>
                )}
                <Link
                  href="/challenges"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] no-underline transition-colors ${
                    router.pathname === "/challenges"
                      ? "bg-blue-light text-blue font-semibold"
                      : "text-gray-dark hover:bg-gray-light active:bg-gray-light"
                  }`}
                >
                  <List size={14} className={router.pathname === "/challenges" ? "text-blue" : "text-gray-mid"} />
                  Výzvy
                </Link>
                <Link
                  href="/jak-na-to"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] no-underline transition-colors ${
                    router.pathname === "/jak-na-to"
                      ? "bg-blue-light text-blue font-semibold"
                      : "text-gray-dark hover:bg-gray-light active:bg-gray-light"
                  }`}
                >
                  <BookOpen size={14} className={router.pathname === "/jak-na-to" ? "text-blue" : "text-gray-mid"} />
                  Jak na to
                </Link>
              </div>
              <div className="py-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-dark hover:bg-gray-light active:bg-gray-light transition-colors text-left"
                >
                  <LogOut size={14} className="text-gray-mid" />
                  Odhlásit se
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

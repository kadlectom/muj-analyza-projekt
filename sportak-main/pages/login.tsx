import { useState } from "react"
import type { GetServerSideProps } from "next"
import Head from "next/head"
import { signIn } from "next-auth/react"
import { useRouter } from "next/router"
import { getSessionUser } from "@/lib/permissions"
import { getActiveChallenge } from "@/lib/getActiveChallenge"
import { db } from "@/lib/db"
import { enrollments, activities } from "@/db/schema"
import { count } from "drizzle-orm"
import { sql } from "drizzle-orm"

type Props = {
  activeChallengeName: string | null
  activeChallengeId: string | null
  activeChallengeSlug: string | null
  activeChallengeType: "WINTER" | "SUMMER" | null
  participantCount: number
  totalKm: number
}

export default function LoginPage({ activeChallengeName, activeChallengeId, activeChallengeSlug, activeChallengeType, participantCount, totalKm }: Props) {
  const router = useRouter()
  const callbackUrl = activeChallengeId ? `/challenges/${activeChallengeSlug ?? activeChallengeId}` : "/challenges"
  const [loading, setLoading] = useState(false)
  const hasError = !!router.query.error

  return (
    <>
    <Head>
      <title>Přihlášení – Jerryho Výzvy</title>
    </Head>
    <div className="min-h-dvh grid md:grid-cols-2">
      {/* Left: brand gradient panel */}
      <div
        className="relative overflow-hidden flex flex-col justify-between p-12 min-h-[400px]"
        style={{ background: "var(--gradient)" }}
      >
        {/* Diagonal stripe texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, rgba(255,255,255,.06) 0, rgba(255,255,255,.06) 1px, transparent 0, transparent 40px)",
          }}
        />

        {/* Wordmark */}
        <div
          className="relative z-10 flex items-center gap-2.5"
          style={{ color: "rgba(255,255,255,.8)", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
        >
          <div
            style={{
              width: 26, height: 26, background: "rgba(255,255,255,.22)",
              borderRadius: 7, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff",
            }}
          >
            L
          </div>
          Lundegaard
        </div>

        {/* Main content */}
        <div className="relative z-10">
          <h1
            style={{
              fontSize: "clamp(38px, 4.5vw, 54px)", fontWeight: 800, color: "#fff",
              lineHeight: 1.04, letterSpacing: "-0.03em", marginBottom: 14,
              animation: "hero-enter 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both",
            }}
          >
            Každý<br />krok<br />se počítá.
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.72)", lineHeight: 1.6, marginBottom: 28, animation: "hero-enter 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}>
            Přidej se k výzvě a posouvej<br />ostatní — i sebe.
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-2" style={{ animation: "hero-enter 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s both" }}>
            {activeChallengeName && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.28)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 50 }}>
                {activeChallengeType === "SUMMER" ? "☀️" : "⛷️"} {activeChallengeName}
              </span>
            )}
            {participantCount > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.28)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 50 }}>
                👥 {participantCount} kolegů
              </span>
            )}
            {totalKm > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.28)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 50 }}>
                📍 {totalKm.toLocaleString("cs-CZ")} km celkem
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: white form panel */}
      <div className="bg-white flex items-center justify-center px-8 md:px-12 lg:px-16 pt-12 md:pt-16 pb-[max(3rem,env(safe-area-inset-bottom))]">
        <div style={{ width: "100%", maxWidth: 360, animation: "hero-enter 0.55s cubic-bezier(0.16,1,0.3,1) 0.15s both" }}>
          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 44 }}>
            <div
              style={{
                width: 36, height: 36,
                background: "var(--gradient)",
                borderRadius: 10, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 17,
              }}
            >
              🏆
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#1C1C2E", letterSpacing: "-0.02em" }}>
              Jerryho Výzvy
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1C1C2E", letterSpacing: "-0.03em", marginBottom: 8 }}>
            Vítej zpátky 👋
          </h1>
          <p style={{ fontSize: 14, color: "#8B909E", lineHeight: 1.6, marginBottom: 34 }}>
            Přihlas se přes firemní Slack<br />a zapoj se do výzvy.
          </p>

          {hasError && (
            <p style={{ marginBottom: 14, fontSize: 13, fontWeight: 600, color: "var(--red)", textAlign: "center" }}>
              Přihlášení se nezdařilo. Zkus to znovu.
            </p>
          )}

          <button
            onClick={() => { setLoading(true); signIn("slack", { callbackUrl }) }}
            disabled={loading}
            className="hover:-translate-y-[2px] hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none transition-[transform,box-shadow] duration-200 ease-out-quart"
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 12, background: "#fff", border: "1.5px solid #D0D5E0",
              color: "#1C1C2E", fontSize: 15, fontWeight: 700,
              padding: "15px 24px", borderRadius: 12, cursor: loading ? "default" : "pointer",
              boxShadow: "0 4px 20px rgba(28,28,46,.12)",
              fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: 20 }}>💬</span>
            {loading ? "Přihlašuji…" : "Přihlásit se přes Slack"}
          </button>

          <p style={{ marginTop: 18, fontSize: 12, color: "#8B909E", textAlign: "center" }}>
            Pouze pro zaměstnance Lundegaard
          </p>
        </div>
      </div>
    </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const user = await getSessionUser(ctx)
  if (user) {
    const active = await getActiveChallenge()
    const dest = active ? `/challenges/${active.slug ?? active.id}` : "/challenges"
    return { redirect: { destination: dest, permanent: false } }
  }

  const active = await getActiveChallenge()

  const [{ total: participantCount }] = await db
    .select({ total: count() })
    .from(enrollments)

  const [{ total: rawKm }] = await db
    .select({ total: sql<number>`coalesce(sum(${activities.points}), 0)` })
    .from(activities)

  return {
    props: {
      activeChallengeName: active?.name ?? null,
      activeChallengeId: active?.id ?? null,
      activeChallengeSlug: active?.slug ?? null,
      activeChallengeType: active?.type ?? null,
      participantCount: participantCount ?? 0,
      totalKm: Math.round((rawKm as number) ?? 0),
    },
  }
}

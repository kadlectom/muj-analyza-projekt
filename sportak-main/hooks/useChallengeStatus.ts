import { useState } from "react"
import { useRouter } from "next/router"

export function useChallengeStatus(challengeId: string) {
  const router = useRouter()
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [confirmTransition, setConfirmTransition] = useState<"ACTIVE" | "CLOSED" | null>(null)

  async function transitionStatus(newStatus: "ACTIVE" | "CLOSED") {
    setStatusLoading(true)
    setStatusError(null)
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setConfirmTransition(null)
        router.replace(router.asPath)
      } else {
        const data = await res.json().catch(() => ({}))
        setStatusError(data.error ?? "Změna stavu se nezdařila. Zkus to znovu.")
      }
    } catch {
      setStatusError("Nepodařilo se připojit k serveru.")
    } finally {
      setStatusLoading(false)
    }
  }

  return { statusLoading, statusError, confirmTransition, setConfirmTransition, transitionStatus }
}

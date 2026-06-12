import { useState } from "react"
import { useRouter } from "next/router"

export function useChallengeEnroll(challengeId: string) {
  const router = useRouter()
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)

  async function handleEnroll() {
    setEnrollLoading(true)
    setEnrollError(null)
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      })
      if (res.ok) {
        router.replace(router.asPath)
      } else {
        const data = await res.json().catch(() => ({}))
        setEnrollError(data.error ?? "Přihlášení se nezdařilo. Zkus to znovu.")
      }
    } catch {
      setEnrollError("Nepodařilo se připojit k serveru.")
    } finally {
      setEnrollLoading(false)
    }
  }

  return { enrollLoading, enrollError, handleEnroll }
}

import { useState } from "react"
import { useRouter } from "next/router"
import type { Tab } from "@/components/challenges/challengeDetail.types"

type SuccessPayload = {
  points: number
  partnerBonus: number
  newlyEarnedBonuses?: { name: string; bonusPoints: number }[]
  activityName: string
  activityEmoji: string | null
  inputValue: number
  inputUnit: string
  partnerNames: string[]
}

export function useActivityForm(setActiveTab: (tab: Tab) => void) {
  const router = useRouter()
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [successState, setSuccessState] = useState<SuccessPayload | null>(null)

  function handleFormSuccess(result?: SuccessPayload) {
    if (!result) {
      // Edit success — no celebration needed
      setSuccessState(null)
      setShowActivityForm(false)
      setActiveTab("moje-aktivity")
      router.replace(router.asPath, undefined, { scroll: false })
      return
    }
    setSuccessState(result)
    const delay = (result.newlyEarnedBonuses?.length ?? 0) > 0 ? 3500 : 2500
    setTimeout(() => {
      setSuccessState(null)
      setShowActivityForm(false)
      setActiveTab("moje-aktivity")
      router.replace(router.asPath, undefined, { scroll: false })
    }, delay)
  }

  function closeForm() {
    setSuccessState(null)
    setShowActivityForm(false)
  }

  return { showActivityForm, setShowActivityForm, successState, handleFormSuccess, closeForm }
}

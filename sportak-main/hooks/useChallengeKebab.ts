import { useState, useRef, useEffect, type Dispatch, type SetStateAction, type RefObject } from "react"

export function useChallengeKebab(
  setConfirmTransition: Dispatch<SetStateAction<"ACTIVE" | "CLOSED" | null>>,
): { kebabOpen: boolean; setKebabOpen: Dispatch<SetStateAction<boolean>>; kebabRef: RefObject<HTMLDivElement> } {
  const [kebabOpen, setKebabOpen] = useState(false)
  const kebabRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!kebabOpen) return
    function handleOutside(e: MouseEvent) {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setKebabOpen(false)
        setConfirmTransition(null)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setKebabOpen(false)
        setConfirmTransition(null)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [kebabOpen, setConfirmTransition])

  return { kebabOpen, setKebabOpen, kebabRef }
}

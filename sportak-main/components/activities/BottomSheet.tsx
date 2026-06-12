import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

type Props = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: Props) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 340)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  if (!mounted || typeof document === "undefined") return null

  return createPortal(
    <div
      className={`md:hidden fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-[280ms] ease-out-quart ${visible ? "opacity-100" : "opacity-0"}`}
      style={{ background: "rgba(0,0,0,.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white rounded-t-[24px] overflow-hidden flex flex-col transition-transform duration-[340ms] ease-out-expo ${visible ? "translate-y-0" : "translate-y-full"}`}
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-[4px] rounded-full bg-gray-border" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-border flex-shrink-0">
          <h2 className="text-[16px] font-extrabold text-dark">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Zavřít"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-light transition-colors text-gray-mid hover:text-dark"
          >
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

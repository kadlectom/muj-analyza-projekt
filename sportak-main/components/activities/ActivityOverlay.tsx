import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

type Props = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function ActivityOverlay({ isOpen, onClose, title, children }: Props) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      // Two rAFs ensure the element is in the DOM before transition begins
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 280)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!mounted || typeof document === "undefined") return null

  return createPortal(
    <div
      className={`hidden md:flex fixed inset-0 z-50 items-center justify-center p-4 transition-opacity duration-[220ms] ease-out-quart ${visible ? "opacity-100" : "opacity-0"}`}
      style={{ background: "rgba(0,0,0,.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white rounded-[20px] w-full overflow-hidden flex flex-col transition-[opacity,transform] duration-[300ms] ease-out-expo ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.96] translate-y-4"}`}
        style={{ maxWidth: 580, maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-border flex-shrink-0">
          <h2 className="text-[15px] font-extrabold text-dark">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Zavřít"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-light transition-colors text-gray-mid hover:text-dark"
          >
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

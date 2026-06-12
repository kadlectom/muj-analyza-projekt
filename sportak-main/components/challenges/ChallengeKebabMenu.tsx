import Link from "next/link"
import { Pencil, MoreVertical } from "lucide-react"
import type { RefObject } from "react"

type Props = {
  challenge: { id: string; slug: string | null }
  kebabOpen: boolean
  onToggle: () => void
  kebabRef: RefObject<HTMLDivElement>
  canEdit: boolean
  canPublish: boolean
  canClose: boolean
  onPublish: () => void
  onClose: () => void
}

export function ChallengeKebabMenu({ challenge, kebabOpen, onToggle, kebabRef, canEdit, canPublish, canClose, onPublish, onClose }: Props) {
  return (
    <div ref={kebabRef} className="relative">
      <button
        onClick={onToggle}
        aria-label="Správa výzvy"
        aria-expanded={kebabOpen}
        className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
        style={{ color: "rgba(255,255,255,.75)", background: kebabOpen ? "rgba(255,255,255,.2)" : "transparent" }}
        onMouseEnter={(e) => { if (!kebabOpen) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.15)" }}
        onMouseLeave={(e) => { if (!kebabOpen) (e.currentTarget as HTMLElement).style.background = "transparent" }}
      >
        <MoreVertical size={18} />
      </button>
      {kebabOpen && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] w-[210px] bg-white rounded-[10px] border border-gray-border shadow-lg z-50 overflow-hidden"
          style={{ animation: "hero-enter 0.18s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <Link
            href={`/admin/challenges/${challenge.slug ?? challenge.id}/catalog`}
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-dark hover:bg-gray-light transition-colors no-underline"
          >
            <span className="text-[13px] leading-none text-gray-mid flex-shrink-0">📋</span>
            Katalog aktivit
          </Link>
          {canEdit && (
            <Link
              href={`/admin/challenges/${challenge.slug ?? challenge.id}/edit`}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-dark hover:bg-gray-light transition-colors no-underline border-t border-gray-border"
            >
              <Pencil size={13} className="text-gray-mid flex-shrink-0" />
              Upravit výzvu
            </Link>
          )}
          {canPublish && (
            <button
              onClick={onPublish}
              className="w-full flex items-center px-4 py-2.5 text-[13px] text-gray-dark hover:bg-gray-light transition-colors text-left border-t border-gray-border"
            >
              Publikovat výzvu
            </button>
          )}
          {canClose && (
            <button
              onClick={onClose}
              className="w-full flex items-center px-4 py-2.5 text-[13px] text-red hover:bg-red/5 transition-colors text-left border-t border-gray-border"
            >
              Uzavřít výzvu
            </button>
          )}
        </div>
      )}
    </div>
  )
}

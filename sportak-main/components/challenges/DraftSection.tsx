import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { Pencil, Send } from "lucide-react"
import { StatusBadge } from "./StatusBadge"
import { formatDate } from "@/lib/formatDate"
import type { ChallengeCardData } from "./ChallengeCard"

type Props = { drafts: ChallengeCardData[] }

function DraftCard({ challenge: c }: { challenge: ChallengeCardData }) {
  const router = useRouter()
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function publish() {
    setPublishing(true)
    setError(null)
    try {
      const res = await fetch(`/api/challenges/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      })
      if (res.ok) {
        router.replace(router.asPath)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Publikování se nezdařilo.")
      }
    } catch {
      setError("Nepodařilo se připojit k serveru.")
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="bg-[#fffaf0] rounded-md border border-[#f6e1b6] p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-[10px] flex items-center justify-center bg-[#fef3c7] text-[22px] flex-shrink-0">
        {c.type === "SUMMER" ? "☀️" : "⛷️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-[15px] font-bold text-dark truncate">{c.name}</p>
          <StatusBadge status={c.status} />
        </div>
        <p className="text-[12.5px] text-gray-mid">
          {formatDate(c.startDate)} – {formatDate(c.endDate)}
        </p>
        {error && <p className="text-[12px] text-red mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
        <Link
          href={`/admin/challenges/${c.slug ?? c.id}/edit`}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-gray-dark bg-white border border-gray-border hover:bg-gray-light px-3 py-2 rounded-sm no-underline"
        >
          <Pencil size={12} />
          Upravit
        </Link>
        <button
          onClick={publish}
          disabled={publishing}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-white bg-green hover:opacity-90 disabled:opacity-60 px-3 py-2 rounded-sm"
        >
          <Send size={12} />
          {publishing ? "Publikuji…" : "Publikovat"}
        </button>
      </div>
    </div>
  )
}

export function DraftSection({ drafts }: Props) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-mid">Rozpracované návrhy</p>
        <span className="text-[11px] font-bold px-1.5 py-[1px] rounded-full bg-gray-light text-gray-dark">{drafts.length}</span>
        <p className="text-[11px] text-gray-mid">(viditelné pouze adminům)</p>
      </div>
      <div className="flex flex-col gap-2">
        {drafts.map(c => <DraftCard key={c.id} challenge={c} />)}
      </div>
    </div>
  )
}

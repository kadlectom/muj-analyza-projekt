import Link from "next/link"
import { Plus } from "lucide-react"

type Props = { isAdmin: boolean }

export function NoActiveCard({ isAdmin }: Props) {
  return (
    <section className="bg-white rounded-lg border-2 border-dashed border-gray-border p-8 text-center mb-6">
      <div
        className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3"
        style={{ background: "var(--gradient)" }}
      >
        <span className="text-2xl">🏁</span>
      </div>
      <p className="text-[18px] font-extrabold text-dark">Aktuálně neběží žádná výzva</p>
      <p className="text-[13px] text-gray-mid mt-1 max-w-[380px] mx-auto">
        Sleduj archiv níže — jakmile začne nová výzva, objeví se tady.
      </p>
      {isAdmin && (
        <Link
          href="/admin/challenges/new"
          className="mt-4 inline-flex items-center gap-2 bg-blue text-white font-bold text-[14px] px-5 py-2.5 rounded-sm hover:bg-blue-hover no-underline"
        >
          <Plus size={16} />
          Nová výzva
        </Link>
      )}
    </section>
  )
}

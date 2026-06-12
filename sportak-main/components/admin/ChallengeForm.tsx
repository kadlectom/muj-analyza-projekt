import { useState } from "react"
import { useRouter } from "next/router"

type FormValues = {
  name: string
  type: "WINTER" | "SUMMER" | ""
  startDate: string
  endDate: string
  partnerBonus: number
}

type CreateProps = { mode: "create" }
type EditProps = {
  mode: "edit"
  challengeId: string
  initialValues: Omit<FormValues, "type"> & { type: "WINTER" | "SUMMER" }
}
type Props = CreateProps | EditProps

const EMPTY: FormValues = { name: "", type: "", startDate: "", endDate: "", partnerBonus: 0 }

export function ChallengeForm(props: Props) {
  const router = useRouter()
  const [values, setValues] = useState<FormValues>(
    props.mode === "edit" ? props.initialValues : EMPTY
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function field(key: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!values.type) {
      setError("Vyberte typ výzvy")
      return
    }

    setLoading(true)
    try {
      const url =
        props.mode === "create"
          ? "/api/challenges"
          : `/api/challenges/${props.challengeId}`
      const method = props.mode === "create" ? "POST" : "PATCH"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Nepodařilo se uložit výzvu")
        return
      }

      if (props.mode === "create") {
        const data = await res.json()
        router.push(`/challenges/${data.slug ?? data.id}`)
      } else {
        router.push(`/challenges/${props.challengeId}`)
      }
    } catch {
      setError("Síťová chyba, zkuste to znovu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-[13px] font-semibold text-dark mb-1.5">
          Název výzvy <span className="text-red">*</span>
        </label>
        <input
          type="text"
          value={values.name}
          onChange={field("name")}
          required
          maxLength={120}
          placeholder="např. Zimní sportovní výzva 2025"
          className="w-full border border-gray-border rounded-sm px-3 py-2 text-base text-dark placeholder:text-gray-mid focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
        />
      </div>

      {/* Type pills */}
      <div>
        <label className="block text-[13px] font-semibold text-dark mb-1.5">
          Typ výzvy <span className="text-red">*</span>
        </label>
        <div className="flex gap-2">
          {(["WINTER", "SUMMER"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValues((prev) => ({ ...prev, type: t }))}
              className={`flex-1 py-2 rounded-sm text-[14px] font-semibold transition-colors ${
                values.type === t
                  ? "bg-blue text-white"
                  : "bg-[#f3f4f6] text-gray-dark hover:bg-gray-border"
              }`}
            >
              {t === "WINTER" ? "⛷️ Zimní" : "☀️ Letní"}
            </button>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[13px] font-semibold text-dark mb-1.5">
            Datum začátku <span className="text-red">*</span>
          </label>
          <input
            type="date"
            value={values.startDate}
            onChange={field("startDate")}
            required
            className="w-full border border-gray-border rounded-sm px-3 py-2 text-base text-dark focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
          />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-dark mb-1.5">
            Datum konce <span className="text-red">*</span>
          </label>
          <input
            type="date"
            value={values.endDate}
            onChange={field("endDate")}
            required
            className="w-full border border-gray-border rounded-sm px-3 py-2 text-base text-dark focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
          />
        </div>
      </div>

      {/* Partner bonus */}
      <div>
        <label className="block text-[13px] font-semibold text-dark mb-1.5">
          Bonus za partnera (km ekvivalent)
        </label>
        <input
          type="number"
          min={0}
          step={0.5}
          value={values.partnerBonus}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, partnerBonus: Math.max(0, parseFloat(e.target.value) || 0) }))
          }
          className="w-full border border-gray-border rounded-sm px-3 py-2 text-base text-dark focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
        />
        <p className="text-[12px] text-gray-mid mt-1">
          Přičte se každému účastníkovi aktivity (sobě i partnerovi) za každou společnou aktivitu.
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-[13px] text-red bg-red/10 rounded-sm px-3 py-2">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue text-white font-bold text-[14px] px-6 py-2.5 rounded-sm hover:bg-[#0056cc] disabled:opacity-60 transition-colors"
        >
          {loading ? "Ukládám…" : props.mode === "create" ? "Vytvořit výzvu" : "Uložit změny"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[14px] font-semibold text-gray-mid hover:text-dark transition-colors px-4"
        >
          Zrušit
        </button>
      </div>
    </form>
  )
}

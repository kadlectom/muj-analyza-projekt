import { useState } from "react"

export type CatalogItemFormValues = {
  name: string
  emoji: string
  unit: string
  pointsPerUnit: string
  minValue: string
  category: "sport" | "wellness" | "culture" | ""
  challengeType: "WINTER" | "SUMMER" | "BOTH"
}

type SerializedItem = {
  id: string
  name: string
  emoji: string | null
  unit: string
  pointsPerUnit: number
  minValue: number | null
  category: "sport" | "wellness" | "culture"
  challengeType: "WINTER" | "SUMMER" | "BOTH"
  challengeId: string | null
}

type CreateProps = { mode: "create"; challengeId: string; challengeType: "WINTER" | "SUMMER" }
type EditProps = { mode: "edit"; item: SerializedItem }
type Props = (CreateProps | EditProps) & {
  onSuccess: () => void
  onCancel: () => void
}

const EMPTY: CatalogItemFormValues = {
  name: "",
  emoji: "",
  unit: "",
  pointsPerUnit: "",
  minValue: "",
  category: "",
  challengeType: "BOTH",
}

const CATEGORIES: { value: "sport" | "wellness" | "culture"; label: string }[] = [
  { value: "sport", label: "Sport" },
  { value: "wellness", label: "Wellness" },
  { value: "culture", label: "Kultura" },
]

const CHALLENGE_TYPES: { value: "WINTER" | "SUMMER" | "BOTH"; label: string }[] = [
  { value: "WINTER", label: "⛷️ Zimní" },
  { value: "SUMMER", label: "☀️ Letní" },
  { value: "BOTH", label: "🏅 Obě" },
]

export function CatalogItemForm(props: Props) {
  const [values, setValues] = useState<CatalogItemFormValues>(
    props.mode === "edit"
      ? {
          name: props.item.name,
          emoji: props.item.emoji ?? "",
          unit: props.item.unit,
          pointsPerUnit: String(props.item.pointsPerUnit),
          minValue: props.item.minValue !== null ? String(props.item.minValue) : "",
          category: props.item.category,
          challengeType: props.item.challengeType,
        }
      : { ...EMPTY, challengeType: props.challengeType === "WINTER" ? "WINTER" : "SUMMER" }
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function setField(key: keyof CatalogItemFormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!values.category) {
      setError("Vyberte kategorii")
      return
    }

    const pointsNum = parseFloat(values.pointsPerUnit)
    if (isNaN(pointsNum) || pointsNum <= 0) {
      setError("Body za jednotku musí být kladné číslo")
      return
    }

    let minValueNum: number | null = null
    if (values.minValue.trim() !== "") {
      const parsed = parseFloat(values.minValue)
      if (isNaN(parsed) || parsed <= 0) {
        setError("Minimální hodnota musí být kladné číslo")
        return
      }
      minValueNum = parsed
    }

    setLoading(true)
    try {
      const url =
        props.mode === "create" ? "/api/catalog" : `/api/catalog/${props.item.id}`
      const method = props.mode === "create" ? "POST" : "PATCH"

      const body =
        props.mode === "create"
          ? {
              name: values.name.trim(),
              emoji: values.emoji.trim() || null,
              unit: values.unit.trim(),
              pointsPerUnit: pointsNum,
              minValue: minValueNum,
              category: values.category,
              challengeType: values.challengeType,
              challengeId: props.challengeId,
            }
          : {
              name: values.name.trim(),
              emoji: values.emoji.trim() || null,
              unit: values.unit.trim(),
              pointsPerUnit: pointsNum,
              minValue: minValueNum,
              category: values.category,
              challengeType: values.challengeType,
            }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Nepodařilo se uložit aktivitu")
        return
      }

      props.onSuccess()
    } catch {
      setError("Síťová chyba, zkuste to znovu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name + Emoji */}
      <div className="grid grid-cols-[1fr_80px] gap-3">
        <div>
          <label className="block text-[13px] font-semibold text-dark mb-1">
            Název aktivity <span className="text-red">*</span>
          </label>
          <input
            type="text"
            value={values.name}
            onChange={setField("name")}
            required
            maxLength={120}
            placeholder="např. Běh"
            className="w-full border border-gray-border rounded-sm px-3 py-2 text-base text-dark placeholder:text-gray-mid focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
          />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-dark mb-1">
            Emoji
          </label>
          <input
            type="text"
            value={values.emoji}
            onChange={setField("emoji")}
            maxLength={4}
            placeholder="🏃"
            className="w-full border border-gray-border rounded-sm px-3 py-2 text-base text-dark text-center placeholder:text-gray-mid focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
          />
        </div>
      </div>

      {/* Unit + Points */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[13px] font-semibold text-dark mb-1">
            Jednotka <span className="text-red">*</span>
          </label>
          <input
            type="text"
            value={values.unit}
            onChange={setField("unit")}
            required
            maxLength={30}
            placeholder="km, minuty, počet…"
            className="w-full border border-gray-border rounded-sm px-3 py-2 text-base text-dark placeholder:text-gray-mid focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
          />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-dark mb-1">
            Body / jednotka <span className="text-red">*</span>
          </label>
          <input
            type="number"
            value={values.pointsPerUnit}
            onChange={setField("pointsPerUnit")}
            required
            min="0.01"
            step="0.01"
            placeholder="10"
            className="w-full border border-gray-border rounded-sm px-3 py-2 text-base text-dark placeholder:text-gray-mid focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
          />
        </div>
      </div>

      {/* Min value */}
      <div>
        <label className="block text-[13px] font-semibold text-dark mb-1">
          Minimální hodnota{values.unit.trim() ? ` (${values.unit.trim()})` : ""} <span className="text-[12px] text-gray-mid font-normal">(volitelné)</span>
        </label>
        <input
          type="number"
          value={values.minValue}
          onChange={setField("minValue")}
          min="0"
          step="0.01"
          placeholder="např. 5"
          className="w-full border border-gray-border rounded-sm px-3 py-2 text-base text-dark placeholder:text-gray-mid focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
        />
        <p className="text-[11px] text-gray-mid mt-1">
          Pokud je vyplněno, uživatel musí zadat alespoň tuto hodnotu při zápisu aktivity.
        </p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-[13px] font-semibold text-dark mb-1">
          Kategorie <span className="text-red">*</span>
        </label>
        <select
          value={values.category}
          onChange={setField("category")}
          required
          className="w-full border border-gray-border rounded-sm px-3 py-2 text-base text-dark focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue bg-white"
        >
          <option value="">Vyberte kategorii…</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Challenge type */}
      <div>
        <label className="block text-[13px] font-semibold text-dark mb-1">
          Platí pro typ výzvy
        </label>
        <div className="flex gap-2">
          {CHALLENGE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setValues((prev) => ({ ...prev, challengeType: t.value }))}
              className={`flex-1 py-1.5 rounded-sm text-[13px] font-semibold transition-colors ${
                values.challengeType === t.value
                  ? "bg-blue text-white"
                  : "bg-[#f3f4f6] text-gray-dark hover:bg-gray-border"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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
          className="bg-blue text-white font-bold text-[14px] px-5 py-2 rounded-sm hover:bg-[#0056cc] disabled:opacity-60 transition-colors"
        >
          {loading ? "Ukládám…" : props.mode === "create" ? "Přidat aktivitu" : "Uložit změny"}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          className="text-[14px] font-semibold text-gray-mid hover:text-dark transition-colors px-3"
        >
          Zrušit
        </button>
      </div>
    </form>
  )
}

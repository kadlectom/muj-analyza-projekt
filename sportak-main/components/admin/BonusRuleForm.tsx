import { useState } from "react"
import type { BonusRule } from "@/db/schema"

type CatalogOption = { id: string; name: string }

type CreateProps = { mode: "create"; challengeId: string }
type EditProps = { mode: "edit"; rule: BonusRule }
type Props = (CreateProps | EditProps) & {
  catalogItems: CatalogOption[]
  onSuccess: () => void
  onCancel: () => void
}

type FormValues = {
  name: string
  conditionType: "COUNT_ACTIVITIES" | "TOTAL_POINTS" | ""
  threshold: string
  catalogItemIds: string[]
  windowStart: string
  windowEnd: string
  daysOfWeek: number[]
  bonusPoints: string
}

const DAYS = [
  { value: 1, label: "Po" },
  { value: 2, label: "Út" },
  { value: 3, label: "St" },
  { value: 4, label: "Čt" },
  { value: 5, label: "Pá" },
  { value: 6, label: "So" },
  { value: 0, label: "Ne" },
]

const inputClass =
  "w-full border border-gray-border rounded-sm px-3 py-2 text-base text-dark placeholder:text-gray-mid focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"

function ruleToValues(rule: BonusRule): FormValues {
  return {
    name: rule.name,
    conditionType: rule.conditionType,
    threshold: String(rule.threshold),
    catalogItemIds: rule.catalogItemIds ? (JSON.parse(rule.catalogItemIds) as string[]) : [],
    windowStart: rule.windowStart ?? "",
    windowEnd: rule.windowEnd ?? "",
    daysOfWeek: rule.daysOfWeek ? (JSON.parse(rule.daysOfWeek) as number[]) : [],
    bonusPoints: String(rule.bonusPoints),
  }
}

const EMPTY: FormValues = {
  name: "",
  conditionType: "",
  threshold: "",
  catalogItemIds: [],
  windowStart: "",
  windowEnd: "",
  daysOfWeek: [],
  bonusPoints: "",
}

export function BonusRuleForm(props: Props) {
  const [values, setValues] = useState<FormValues>(
    props.mode === "edit" ? ruleToValues(props.rule) : EMPTY
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function setField(key: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value }))
  }

  function toggleDay(day: number) {
    setValues((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }))
  }

  function toggleCatalogItem(id: string) {
    setValues((prev) => ({
      ...prev,
      catalogItemIds: prev.catalogItemIds.includes(id)
        ? prev.catalogItemIds.filter((i) => i !== id)
        : [...prev.catalogItemIds, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!values.conditionType) { setError("Vyberte typ podmínky"); return }

    const threshold = parseFloat(values.threshold)
    if (isNaN(threshold) || threshold <= 0) { setError("Práh musí být kladné číslo"); return }

    const bonusPoints = parseFloat(values.bonusPoints)
    if (isNaN(bonusPoints) || bonusPoints <= 0) { setError("Bonus km musí být kladné číslo"); return }

    setLoading(true)
    try {
      const body = {
        name: values.name.trim(),
        conditionType: values.conditionType,
        threshold,
        catalogItemIds: values.catalogItemIds.length > 0 ? values.catalogItemIds : null,
        windowStart: values.windowStart || null,
        windowEnd: values.windowEnd || null,
        daysOfWeek: values.daysOfWeek.length > 0 ? values.daysOfWeek : null,
        bonusPoints,
        ...(props.mode === "create" ? { challengeId: props.challengeId } : {}),
      }

      const url = props.mode === "create" ? "/api/bonus-rules" : `/api/bonus-rules/${props.rule.id}`
      const method = props.mode === "create" ? "POST" : "PATCH"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Nepodařilo se uložit bonus")
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
      {/* Název */}
      <div>
        <label className="block text-[13px] font-semibold text-dark mb-1">
          Název bonusu <span className="text-red">*</span>
        </label>
        <input
          type="text"
          value={values.name}
          onChange={setField("name")}
          required
          maxLength={120}
          placeholder="např. 5× běh za měsíc"
          className={inputClass}
        />
      </div>

      {/* Typ podmínky */}
      <div>
        <label className="block text-[13px] font-semibold text-dark mb-1">
          Typ podmínky <span className="text-red">*</span>
        </label>
        <div className="flex gap-2">
          {(["COUNT_ACTIVITIES", "TOTAL_POINTS"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValues((prev) => ({ ...prev, conditionType: t }))}
              className={`flex-1 py-1.5 rounded-sm text-[13px] font-semibold transition-colors ${
                values.conditionType === t
                  ? "bg-blue text-white"
                  : "bg-[#f3f4f6] text-dark hover:bg-gray-border"
              }`}
            >
              {t === "COUNT_ACTIVITIES" ? "Počet aktivit" : "Celkové km"}
            </button>
          ))}
        </div>
      </div>

      {/* Práh + Bonus km */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[13px] font-semibold text-dark mb-1">
            Práh{values.conditionType === "COUNT_ACTIVITIES" ? " (počet)" : " (km)"} <span className="text-red">*</span>
          </label>
          <input
            type="number"
            value={values.threshold}
            onChange={setField("threshold")}
            required
            min="0.01"
            step="any"
            placeholder={values.conditionType === "COUNT_ACTIVITIES" ? "5" : "100"}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-dark mb-1">
            Bonus km <span className="text-red">*</span>
          </label>
          <input
            type="number"
            value={values.bonusPoints}
            onChange={setField("bonusPoints")}
            required
            min="0.01"
            step="any"
            placeholder="50"
            className={inputClass}
          />
        </div>
      </div>

      {/* Filtr aktivit */}
      {props.catalogItems.length > 0 && (
        <div>
          <label className="block text-[13px] font-semibold text-dark mb-2">
            Omezit na aktivity <span className="text-[12px] font-normal text-gray-mid">(volitelné — výchozí: všechny)</span>
          </label>
          <div className="border border-gray-border rounded-sm max-h-44 overflow-y-auto">
            {props.catalogItems.map((c, i) => {
              const checked = values.catalogItemIds.includes(c.id)
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-light transition-colors ${
                    i < props.catalogItems.length - 1 ? "border-b border-gray-border" : ""
                  } ${checked ? "bg-blue-light" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCatalogItem(c.id)}
                    className="w-4 h-4 accent-blue"
                  />
                  <span className="text-[13px] text-dark">{c.name}</span>
                </label>
              )
            })}
          </div>
          {values.catalogItemIds.length > 0 && (
            <p className="text-[12px] text-blue font-semibold mt-1">
              Vybráno: {values.catalogItemIds.length} aktivit
            </p>
          )}
        </div>
      )}

      {/* Časové okno */}
      <div>
        <label className="block text-[13px] font-semibold text-dark mb-1">
          Časové okno <span className="text-[12px] font-normal text-gray-mid">(volitelné — výchozí: celá výzva)</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] text-gray-mid mb-1">Od</label>
            <input type="date" value={values.windowStart} onChange={setField("windowStart")} className={inputClass} />
          </div>
          <div>
            <label className="block text-[12px] text-gray-mid mb-1">Do</label>
            <input type="date" value={values.windowEnd} onChange={setField("windowEnd")} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Dny v týdnu */}
      <div>
        <label className="block text-[13px] font-semibold text-dark mb-2">
          Pouze ve dny <span className="text-[12px] font-normal text-gray-mid">(volitelné — výchozí: všechny)</span>
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {DAYS.map((d) => {
            const active = values.daysOfWeek.includes(d.value)
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`px-3 py-1.5 rounded-sm text-[13px] font-semibold transition-colors ${
                  active ? "bg-blue text-white" : "bg-[#f3f4f6] text-dark hover:bg-gray-border"
                }`}
              >
                {d.label}
              </button>
            )
          })}
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
          {loading ? "Ukládám…" : props.mode === "create" ? "Přidat bonus" : "Uložit změny"}
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

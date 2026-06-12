const DAY_NAMES = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"]

export function formatDaysOfWeek(days: number[]): string {
  return days.map((d) => DAY_NAMES[d]).join(", ")
}

export function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-")
  return `${parseInt(d)}. ${parseInt(m)}. ${y}`
}

export type BonusConditionRule = {
  conditionType: "COUNT_ACTIVITIES" | "TOTAL_POINTS"
  threshold: number
  catalogItemNames: string[] | null
  windowStart: string | null
  windowEnd: string | null
  daysOfWeek: number[] | null
}

export function formatBonusCondition(rule: BonusConditionRule): string {
  let main: string
  if (rule.conditionType === "COUNT_ACTIVITIES") {
    const what = rule.catalogItemNames?.length
      ? rule.catalogItemNames.join(" nebo ")
      : "jakoukoli aktivitu"
    main = `Zapiš ${rule.threshold}× ${what}`
  } else {
    const km = rule.threshold % 1 === 0 ? String(rule.threshold) : rule.threshold.toFixed(1)
    const what = rule.catalogItemNames?.length ? rule.catalogItemNames.join(" nebo ") : null
    main = what ? `Nahraj ${km} km v: ${what}` : `Nahraj celkem ${km} km`
  }

  const constraints: string[] = []
  if (rule.windowStart && rule.windowEnd) {
    constraints.push(`v období ${formatShortDate(rule.windowStart)}–${formatShortDate(rule.windowEnd)}`)
  } else if (rule.windowStart) {
    constraints.push(`od ${formatShortDate(rule.windowStart)}`)
  } else if (rule.windowEnd) {
    constraints.push(`do ${formatShortDate(rule.windowEnd)}`)
  }
  if (rule.daysOfWeek?.length) {
    constraints.push(`pouze v ${formatDaysOfWeek(rule.daysOfWeek)}`)
  }

  return constraints.length ? `${main} (${constraints.join(", ")})` : main
}

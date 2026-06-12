import type { WeeklyStats } from "@/lib/weeklyStats"

// Six template variants. D (milestone) is a priority gate that always wins
// when eligible. The remaining five rotate in a pool by ISO-week index;
// templates whose precondition fails fall through to the next candidate.
//
//   A — general weekly summary (fallback, always eligible)
//   B — variety + first-time activities
//   C — momentum (this week vs. previous)
//   D — milestone (just crossed, or upcoming within 500 km)   *** priority ***
//   E — bonuses earned this week
//   F — day-of-week rhythm
export type TemplateId = "A" | "B" | "C" | "D" | "E" | "F"

const ROTATION_POOL: readonly TemplateId[] = ["A", "B", "C", "E", "F"] as const

export function selectTemplate(stats: WeeklyStats, weekIndex: number): TemplateId {
  if (isEligible("D", stats)) return "D"

  const eligible = ROTATION_POOL.filter((id) => isEligible(id, stats))
  if (eligible.length === 0) return "A"
  return eligible[weekIndex % eligible.length]
}

export function isEligible(id: TemplateId, stats: WeeklyStats): boolean {
  switch (id) {
    case "A": return stats.activityCount > 0
    case "B": return stats.varietyCount >= 4
    case "C": return stats.prevWeekActivityCount > 0
    case "D": return stats.nearestMilestone !== null
    case "E": return stats.bonusesEarned.length >= 1
    case "F": return stats.mostActiveDay !== null
  }
}

export function renderTemplate(id: TemplateId, challengeName: string, stats: WeeklyStats): string {
  switch (id) {
    case "A": return renderA(challengeName, stats)
    case "B": return renderB(challengeName, stats)
    case "C": return renderC(challengeName, stats)
    case "D": return renderD(challengeName, stats)
    case "E": return renderE(challengeName, stats)
    case "F": return renderF(challengeName, stats)
  }
}

// ─── Renderers ───────────────────────────────────────────────────────────────

function renderA(name: string, s: WeeklyStats): string {
  return [
    `🏁 *Páteční ohlédnutí*`,
    ``,
    `Tento týden ve výzvě _${name}_:`,
    `• *${s.activityCount} ${pluralAktivita(s.activityCount)}* zaznamenáno · *+${fmt(s.totalKm)} km* k týmu`,
    s.topCatalogs.length > 0 ? `• Nejčastěji: ${formatTopCatalogs(s.topCatalogs)}` : null,
    `• Zapojilo se *${s.uniqueUserCount} ${pluralLide(s.uniqueUserCount)}*`,
    ``,
    closingLine(s),
    `Hezký víkend! 💪`,
  ].filter(Boolean).join("\n")
}

function renderB(name: string, s: WeeklyStats): string {
  const firstTimers = s.firstTimers.length > 0
    ? `• Poprvé tu zaznělo: ${s.firstTimers
        .slice(0, 3)
        .map((f) => `${f.catalogEmoji ?? "•"} *${f.catalogName}* (${f.userName})`)
        .join(", ")}`
    : null

  return [
    `🌈 *Páteční ohlédnutí — pestrý týden*`,
    ``,
    `Tento týden ve výzvě _${name}_:`,
    `• *${s.varietyCount} různých aktivit* napříč týmem`,
    firstTimers,
    `• Celkem *+${fmt(s.totalKm)} km* od *${s.uniqueUserCount} ${pluralLide(s.uniqueUserCount)}*`,
    ``,
    closingLine(s),
    `Hezký víkend! 🎯`,
  ].filter(Boolean).join("\n")
}

function renderC(name: string, s: WeeklyStats): string {
  const delta = s.totalKm - s.prevWeekTotalKm
  let deltaLine: string
  if (delta > 0.5) {
    deltaLine = `tedy *+${fmt(delta)} km* víc`
  } else if (delta < -0.5) {
    deltaLine = `klidnější o *${fmt(-delta)} km*`
  } else {
    deltaLine = `stejný objem`
  }

  return [
    `📈 *Páteční ohlédnutí — momentum*`,
    ``,
    `Tento týden ve výzvě _${name}_:`,
    `• *+${fmt(s.totalKm)} km* (minulý týden ${fmt(s.prevWeekTotalKm)} km, ${deltaLine})`,
    `• *${s.activityCount} ${pluralAktivita(s.activityCount)}* od *${s.uniqueUserCount} ${pluralLide(s.uniqueUserCount)}*`,
    s.topCatalogs[0] ? `• Hit týdne: ${formatCatalog(s.topCatalogs[0])}` : null,
    ``,
    closingLine(s),
    `Hezký víkend!`,
  ].filter(Boolean).join("\n")
}

function renderD(name: string, s: WeeklyStats): string {
  const m = s.nearestMilestone! // guaranteed by selector
  if (m.justCrossed) {
    return [
      `🎉 *Páteční ohlédnutí — překonali jsme ${m.value} km!*`,
      ``,
      `Ve výzvě _${name}_ jste tento týden přidali *+${fmt(s.totalKm)} km* —`,
      `celkem už *${fmt(s.cumulativeKm)} km* a milník *${m.value}* je za námi. 🎉`,
      ``,
      s.topCatalogs[0] ? `Hit týdne: ${formatCatalog(s.topCatalogs[0])}` : null,
      `Do konce zbývá *${s.daysRemaining} ${pluralDen(s.daysRemaining)}*. Hezký víkend! 🚀`,
    ].filter(Boolean).join("\n")
  }

  return [
    `🎯 *Páteční ohlédnutí — blížíme se k ${m.value} km*`,
    ``,
    `Tento týden ve výzvě _${name}_:`,
    `• Přidali jsme *+${fmt(s.totalKm)} km* — celkem už *${fmt(s.cumulativeKm)} km*`,
    `• Do *${m.value} km* zbývá *${fmt(m.remaining)} km*`,
    s.topCatalogs[0] ? `• Hit týdne: ${formatCatalog(s.topCatalogs[0])}` : null,
    ``,
    `Do konce výzvy zbývá *${s.daysRemaining} ${pluralDen(s.daysRemaining)}*. Hezký víkend! 🚀`,
  ].filter(Boolean).join("\n")
}

function renderE(name: string, s: WeeklyStats): string {
  const totalBonusKm = s.bonusesEarned.reduce((sum, b) => sum + b.bonusPoints, 0)
  let bonusLine: string

  if (s.bonusesEarned.length === 1) {
    const b = s.bonusesEarned[0]
    bonusLine = `• *${b.userName}* splnil/a bonus *${b.ruleName}* (+${fmt(b.bonusPoints)} km)`
  } else if (s.bonusesEarned.length <= 3) {
    const items = s.bonusesEarned
      .map((b) => `*${b.ruleName}* (${b.userName}, +${fmt(b.bonusPoints)} km)`)
      .join(", ")
    bonusLine = `• Splněné bonusy: ${items}`
  } else {
    bonusLine = `• *${s.bonusesEarned.length} splněných bonusů* — společně *+${fmt(totalBonusKm)} km* navíc`
  }

  return [
    `🏆 *Páteční ohlédnutí — bonusy padají*`,
    ``,
    `Tento týden ve výzvě _${name}_:`,
    bonusLine,
    `• Celkem *${s.activityCount} ${pluralAktivita(s.activityCount)}*, *+${fmt(s.totalKm)} km*`,
    s.topCatalogs[0] ? `• Hit týdne: ${formatCatalog(s.topCatalogs[0])}` : null,
    ``,
    closingLine(s),
    `Hezký víkend! 🎁`,
  ].filter(Boolean).join("\n")
}

function renderF(name: string, s: WeeklyStats): string {
  const day = s.mostActiveDay! // guaranteed by selector
  return [
    `📅 *Páteční ohlédnutí — rytmus týdne*`,
    ``,
    `Tento týden ve výzvě _${name}_:`,
    `• Nejaktivnější den: *${day.name}* (${day.count} ${pluralZapis(day.count)})`,
    s.topCatalogs.length > 0 ? `• ${formatTopCatalogs(s.topCatalogs)} — favorité` : null,
    `• Celkem *${s.activityCount} ${pluralAktivita(s.activityCount)}* a *+${fmt(s.totalKm)} km* od *${s.uniqueUserCount} ${pluralLide(s.uniqueUserCount)}*`,
    ``,
    closingLine(s),
    `Hezký víkend! 💪`,
  ].filter(Boolean).join("\n")
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function closingLine(s: WeeklyStats): string {
  return `Celkem máme *${fmt(s.cumulativeKm)} km* · do konce zbývá *${s.daysRemaining} ${pluralDen(s.daysRemaining)}*.`
}

function formatCatalog(c: { name: string; emoji: string | null; count: number }): string {
  const emoji = c.emoji ? `${c.emoji} ` : ""
  return `${emoji}*${c.name}* (${c.count}×)`
}

function formatTopCatalogs(top: { name: string; emoji: string | null; count: number }[]): string {
  return top.slice(0, 2).map(formatCatalog).join(" · ")
}

function fmt(n: number): string {
  if (Number.isInteger(n)) return n.toString()
  return n.toFixed(1).replace(/\.0$/, "")
}

// Czech plural by count: returns 1 / 2-4 / 5+ form.
function pluralForm(n: number, forms: [string, string, string]): string {
  if (n === 1) return forms[0]
  if (n >= 2 && n <= 4) return forms[1]
  return forms[2]
}
function pluralAktivita(n: number) { return pluralForm(n, ["aktivita", "aktivity", "aktivit"]) }
function pluralDen(n: number)      { return pluralForm(n, ["den", "dny", "dní"]) }
function pluralLide(n: number)     { return n === 1 ? "člověk" : "lidí" }
function pluralZapis(n: number)    { return pluralForm(n, ["zápis", "zápisy", "zápisů"]) }

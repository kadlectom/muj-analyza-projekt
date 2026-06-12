/** Formats an ISO date string "YYYY-MM-DD" to Czech display format "D. M. YYYY" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${+d}. ${+m}. ${y}`
}

const MONTHS_GEN = ["ledna","února","března","dubna","května","června","července","srpna","září","října","listopadu","prosince"]

/** Formats ISO date to Czech: "Dnes, 31. března" or "31. března" */
export function formatDateCzech(iso: string): string {
  const today = new Date().toISOString().slice(0, 10)
  const [, m, d] = iso.split("-")
  const display = `${+d}. ${MONTHS_GEN[+m - 1]}`
  return iso === today ? `Dnes, ${display}` : display
}

/** Formats a ms timestamp to Czech relative time */
export function formatRelativeTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return "právě teď"
  if (mins < 60) return `před ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `před ${hours} hod`
  const days = Math.floor(hours / 24)
  if (days === 1) return "včera"
  if (days < 7) return `před ${days} dny`
  return new Date(ts).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })
}

export function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "právě teď"
  if (diffMin < 60) return `před ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `před ${diffH} h`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return "včera"
  const dayLabel = diffD >= 5 ? "dní" : "dny"
  return `před ${diffD} ${dayLabel}`
}

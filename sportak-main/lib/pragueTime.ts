// Returns true iff the current Prague-local clock hour equals the given hour
// (0–23). Handles CET/CEST automatically via the IANA tz database, so crons
// scheduled at multiple UTC times can gate on the actual Prague hour and only
// fire the one that matches year-round.
export function isPragueHour(hour: number): boolean {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Prague",
    hour: "2-digit",
    hour12: false,
  })
  return parseInt(fmt.format(new Date()), 10) === hour
}

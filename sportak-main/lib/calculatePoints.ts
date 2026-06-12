/**
 * Calculate km equivalents for an activity entry.
 * Pure function — safe to use on both server and client.
 */
export function calculatePoints(value: number, pointsPerUnit: number): number {
  return value * pointsPerUnit
}

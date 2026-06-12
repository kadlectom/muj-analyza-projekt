/** Deterministic color for a userId — used for avatar fallback backgrounds */
export function avatarColor(userId: string): string {
  const colors = ["#006DFF", "#18C872", "#f59e0b", "#e03131", "#06b6d4", "#F97316"]
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0
  return colors[Math.abs(hash) % colors.length]
}

export function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
}

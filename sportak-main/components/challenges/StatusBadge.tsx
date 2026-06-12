type Status = "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED"

const CONFIG: Record<Status, { classes: string; label: string }> = {
  ACTIVE:   { classes: "bg-[#d1fae5] text-[#065f46]", label: "Aktivní" },
  DRAFT:    { classes: "bg-[#fef3c7] text-[#92400e]", label: "Návrh" },
  CLOSED:   { classes: "bg-[#f3f4f6] text-[#939393]", label: "Uzavřena" },
  ARCHIVED: { classes: "bg-[#f3f4f6] text-[#939393]", label: "Archivována" },
}

export function StatusBadge({ status }: { status: Status }) {
  const { classes, label } = CONFIG[status]
  return (
    <span className={`${classes} text-[11px] font-bold px-[10px] py-[3px] rounded-[20px] uppercase tracking-[0.06em]`}>
      {label}
    </span>
  )
}

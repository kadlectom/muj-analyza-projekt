import { AdminActivityTable } from "@/components/admin/AdminActivityTable"
import type { CatalogItem } from "@/components/admin/CatalogTable"
import type { EnrolledParticipant } from "@/components/challenges/challengeDetail.types"

type Props = {
  challengeId: string
  challengeStatus: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED"
  startDate: string
  endDate: string
  catalogItems: CatalogItem[]
  enrolledParticipants: EnrolledParticipant[]
  partnerBonus: number
}

export function SpravTab({ challengeId, challengeStatus, startDate, endDate, catalogItems, enrolledParticipants, partnerBonus }: Props) {
  return (
    <div className="bg-white rounded-[12px] border border-gray-border p-6">
      <h2 className="text-[16px] font-bold text-dark mb-5">Správa aktivit</h2>
      <AdminActivityTable
        challengeId={challengeId}
        challengeStatus={challengeStatus}
        startDate={startDate}
        endDate={endDate}
        catalogItems={catalogItems}
        enrolledParticipants={enrolledParticipants}
        partnerBonus={partnerBonus}
      />
    </div>
  )
}

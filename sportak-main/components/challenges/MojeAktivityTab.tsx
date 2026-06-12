import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { ActivityList, type ActivityEntry } from "@/components/activities/ActivityList"
import { formatBonusCondition } from "@/lib/formatBonusCondition"
import type { BonusRuleProgress, EnrolledParticipant } from "@/components/challenges/challengeDetail.types"
import type { CatalogItem } from "@/components/admin/CatalogTable"

type Props = {
  bonusRulesProgress: BonusRuleProgress[]
  myActivities: ActivityEntry[]
  challenge: {
    id: string
    startDate: string
    endDate: string
    partnerBonus: number
  }
  sortedCatalogItems: CatalogItem[]
  isActive: boolean
  enrolledParticipants: EnrolledParticipant[]
  currentUserId: string
}

function BonusCard({ rule }: { rule: BonusRuleProgress }) {
  const pts = rule.bonusPoints % 1 === 0 ? rule.bonusPoints : rule.bonusPoints.toFixed(1)
  const progress = Math.min(100, (rule.currentValue / rule.threshold) * 100)
  return (
    <div className={`bg-white rounded-[12px] border p-3 flex flex-col gap-2 h-full ${rule.earned ? "border-[#d1fae5]" : "border-gray-border"}`}>
      <div className="flex items-start gap-2.5">
        <span className="text-[20px] leading-none flex-shrink-0 mt-0.5">{rule.earned ? "🏆" : "🎯"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-extrabold text-dark leading-tight">{rule.name}</p>
          <p className="text-[11px] text-gray-mid mt-0.5 leading-snug">{formatBonusCondition(rule)}</p>
        </div>
        {rule.earned ? (
          <span className="inline-block bg-[#d1fae5] text-[#065f46] text-[10px] font-bold px-2 py-0.5 rounded-sm flex-shrink-0">Splněno</span>
        ) : (
          <span className="text-[13px] font-extrabold flex-shrink-0" style={{ color: "#18C872" }}>+{pts} km</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: rule.earned ? "#18C872" : "var(--gradient)" }}
          />
        </div>
        <span className="text-[11px] font-bold text-dark num flex-shrink-0">
          {rule.conditionType === "COUNT_ACTIVITIES"
            ? `${rule.currentValue} / ${rule.threshold} aktivit`
            : `${rule.currentValue.toFixed(1)} / ${rule.threshold} km`}
        </span>
      </div>
    </div>
  )
}

export function MojeAktivityTab({ bonusRulesProgress, myActivities, challenge, sortedCatalogItems, isActive, enrolledParticipants, currentUserId }: Props) {
  const [earnedExpanded, setEarnedExpanded] = useState(false)
  const [bonusesExpanded, setBonusesExpanded] = useState(false)

  return (
    <div className="space-y-4">
      {bonusRulesProgress.length > 0 && (() => {
        const activeBonuses = bonusRulesProgress.filter((r) => !r.earned)
        const earnedBonuses = bonusRulesProgress.filter((r) => r.earned)
        const totalEarnedKm = earnedBonuses.reduce((s, r) => s + r.bonusPoints, 0)
        const allEarned = activeBonuses.length === 0

        const earnedStrip = earnedBonuses.length > 0 && (
          <div className="bg-white rounded-[12px] border border-gray-border overflow-hidden">
            <button
              type="button"
              onClick={() => setEarnedExpanded((v) => !v)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="text-[18px] leading-none flex-shrink-0">🏆</span>
              <span className="text-[13px] font-semibold text-dark flex-1">
                {earnedBonuses.length === 1 ? "1 bonus splněn" : `${earnedBonuses.length} bonusy splněny`}
                {" · "}
                <span style={{ color: "#18C872" }}>+{totalEarnedKm % 1 === 0 ? totalEarnedKm : totalEarnedKm.toFixed(1)} km</span>
              </span>
              {earnedExpanded || allEarned
                ? <ChevronUp size={14} className="text-gray-mid flex-shrink-0" />
                : <ChevronDown size={14} className="text-gray-mid flex-shrink-0" />}
            </button>
            {(earnedExpanded || allEarned) && (
              <div className="border-t border-gray-border">
                {earnedBonuses.map((rule) => (
                  <div key={rule.ruleId} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-border last:border-b-0">
                    <span className="text-[13px] font-bold text-[#065f46] flex-shrink-0">✓</span>
                    <span className="text-[13px] font-semibold text-dark flex-1 truncate">{rule.name}</span>
                    <span className="text-[13px] font-bold flex-shrink-0" style={{ color: "#18C872" }}>
                      +{rule.bonusPoints % 1 === 0 ? rule.bonusPoints : rule.bonusPoints.toFixed(1)} km
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

        const sharedContent = (
          <div className="space-y-2">
            {activeBonuses.map((rule) => <BonusCard key={rule.ruleId} rule={rule} />)}
            {earnedStrip}
          </div>
        )

        const mobileSummary = `${activeBonuses.length > 0 ? `${activeBonuses.length} ${activeBonuses.length === 1 ? "bonus" : "bonusy"} probíhají` : ""}${activeBonuses.length > 0 && earnedBonuses.length > 0 ? " · " : ""}${earnedBonuses.length > 0 ? `${earnedBonuses.length} splněn${earnedBonuses.length === 1 ? "" : earnedBonuses.length < 5 ? "y" : "o"}` : ""}`

        return (
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-mid px-1">Bonusy</p>
            <div className="hidden md:block">{sharedContent}</div>
            <div className="md:hidden bg-white rounded-[12px] border border-gray-border overflow-hidden">
              <button
                type="button"
                onClick={() => setBonusesExpanded((v) => !v)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className="text-[18px] leading-none flex-shrink-0">📊</span>
                <span className="text-[13px] font-semibold text-dark flex-1">{mobileSummary}</span>
                {bonusesExpanded
                  ? <ChevronUp size={14} className="text-gray-mid flex-shrink-0" />
                  : <ChevronDown size={14} className="text-gray-mid flex-shrink-0" />}
              </button>
              {bonusesExpanded && (
                <div className="border-t border-gray-border px-3 py-3">
                  {sharedContent}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      <div className="bg-white rounded-[12px] border border-gray-border p-6">
        <div className="mb-5">
          <h2 className="text-[16px] font-bold text-dark">Záznamy aktivit</h2>
        </div>
        <ActivityList
          activities={myActivities}
          challengeId={challenge.id}
          startDate={challenge.startDate}
          endDate={challenge.endDate}
          catalogItems={sortedCatalogItems}
          isActive={isActive}
          enrolledParticipants={enrolledParticipants.filter((p) => p.id !== currentUserId)}
          partnerBonus={challenge.partnerBonus}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  )
}

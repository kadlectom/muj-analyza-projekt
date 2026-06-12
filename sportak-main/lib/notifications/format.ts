// Pure formatters for outbound Slack notifications. No I/O, no DB, no env reads
// — keep these trivially testable and reusable across notification types.

import { formatBonusCondition, type BonusConditionRule } from "@/lib/formatBonusCondition"

export type PartnerTaggedMessageInput = {
  actorName:    string
  activityName: string   // catalog item display name, e.g. "Běh"
  unit:         string   // catalog item unit, e.g. "km"
  value:        number   // raw value the actor logged
  pointsTotal:  number   // points credited to the partner (incl. partner bonus)
  challengeUrl: string   // absolute URL to the challenge detail page
}

export function formatPartnerTaggedMessage(input: PartnerTaggedMessageInput): string {
  const value  = formatNumber(input.value)
  const points = formatNumber(input.pointsTotal)
  return (
    `🤝 *${input.actorName}* tě označil/a u aktivity *${input.activityName}* ` +
    `(${value} ${input.unit}) — připsáno *${points} km*.\n` +
    `Pokud to nesedí, řekni mu/jí. Detail: ${input.challengeUrl}`
  )
}

// Drop trailing zeros from a decimal so "5.0" → "5" but "12.5" stays "12.5".
function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toString()
  return n.toFixed(2).replace(/\.?0+$/, "")
}

export type BonusStartMessageInput = {
  challengeName: string
  challengeUrl:  string
  ruleName:      string
  bonusPoints:   number
  condition:     BonusConditionRule
}

export function formatBonusStartMessage(input: BonusStartMessageInput): string {
  const points = formatNumber(input.bonusPoints)
  const condition = formatBonusCondition(input.condition)
  return (
    `🎁 *Nový bonus startuje dnes — ${input.ruleName}*\n` +
    `${condition} → *+${points} km*\n` +
    `Výzva: <${input.challengeUrl}|${input.challengeName}>`
  )
}

export type OnboardingNudgeMessageInput = {
  challengeName: string
  challengeUrl:  string
}

export function formatOnboardingNudgeMessage(input: OnboardingNudgeMessageInput): string {
  return (
    `👋 Ahoj!\n\n` +
    `Před pár dny ses připojil/a do výzvy *${input.challengeName}*, ale zatím jsi nic nezapsal/a. ` +
    `Začít je snadné — i procházka nebo wellness se počítá.\n\n` +
    `➜ <${input.challengeUrl}|Zapsat první aktivitu>`
  )
}

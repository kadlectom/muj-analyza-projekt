import Link from "next/link"
import { avatarColor, getInitials } from "@/lib/avatarColor"
import { formatDate } from "@/lib/formatDate"
import { relativeTime } from "@/lib/relativeTime"
import { ActivityScoreBlock } from "@/components/activities/ActivityScoreBlock"
import type { MergedFeedEntry, WeeklyHighlights } from "@/components/challenges/challengeDetail.types"

function fmtValue(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

const FEED_PAGE_SIZE = 20

type Props = {
  isEnrolled: boolean
  isActive: boolean
  challenge: { id: string }
  currentUserId: string
  mergedFeed: MergedFeedEntry[]
  weeklyHighlights: WeeklyHighlights
  enrollLoading: boolean
  enrollError: string | null
  feedPage: number
  onLoadMore: () => void
  onEnroll: () => void
}

function HighlightAvatar({ h }: { h: { userId: string; userName: string; userAvatarUrl: string | null } }) {
  return h.userAvatarUrl ? (
    <img src={h.userAvatarUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
  ) : (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
      style={{ backgroundColor: avatarColor(h.userId) }}
    >
      {getInitials(h.userName)}
    </div>
  )
}

export function NastenkaTab({ isEnrolled, isActive, challenge, currentUserId, mergedFeed, weeklyHighlights, enrollLoading, enrollError, feedPage, onLoadMore, onEnroll }: Props) {
  const hasHighlights = weeklyHighlights.biggestActivity || weeklyHighlights.biggestWeeklyGain || weeklyHighlights.mostActiveUser

  const sidebarEl = hasHighlights && (
    <div className="flex flex-col gap-2.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-gray-mid">Tento týden</p>
      {weeklyHighlights.biggestActivity && (() => {
        const h = weeklyHighlights.biggestActivity!
        const km = h.points % 1 === 0 ? h.points : h.points.toFixed(1)
        return (
          <div className="bg-white rounded-[12px] border border-gray-border px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-gray-mid mb-2">⚡ Největší aktivita</p>
            <p className="text-[24px] font-black leading-none mb-2.5 num" style={{ color: "#18C872", fontFamily: "var(--font-display)" }}>+{km} km</p>
            <div className="flex items-center gap-2">
              <HighlightAvatar h={h} />
              <Link href={`/users/${h.userId}?from=${challenge.id}`} className="text-[13px] font-semibold text-dark hover:text-blue transition-colors truncate">
                {h.userName}
              </Link>
            </div>
            {h.catalogEmoji || h.catalogName ? (
              <p className="text-[11px] text-gray-mid mt-1">{h.catalogEmoji && `${h.catalogEmoji} `}{h.catalogName}</p>
            ) : null}
          </div>
        )
      })()}
      {weeklyHighlights.biggestWeeklyGain && (() => {
        const h = weeklyHighlights.biggestWeeklyGain!
        const km = h.totalKm % 1 === 0 ? h.totalKm : h.totalKm.toFixed(1)
        return (
          <div className="bg-white rounded-[12px] border border-gray-border px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-gray-mid mb-2">📈 Největší přírůstek</p>
            <p className="text-[24px] font-black leading-none mb-2.5 num" style={{ color: "#18C872", fontFamily: "var(--font-display)" }}>+{km} km</p>
            <div className="flex items-center gap-2">
              <HighlightAvatar h={h} />
              <Link href={`/users/${h.userId}?from=${challenge.id}`} className="text-[13px] font-semibold text-dark hover:text-blue transition-colors truncate">
                {h.userName}
              </Link>
            </div>
          </div>
        )
      })()}
      {weeklyHighlights.mostActiveUser && (() => {
        const h = weeklyHighlights.mostActiveUser!
        return (
          <div className="bg-white rounded-[12px] border border-gray-border px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-gray-mid mb-2">🔥 Nejvíce aktivit</p>
            <p className="text-[24px] font-black leading-none mb-2.5 num" style={{ color: "#18C872", fontFamily: "var(--font-display)" }}>{h.activityCount}×</p>
            <div className="flex items-center gap-2">
              <HighlightAvatar h={h} />
              <Link href={`/users/${h.userId}?from=${challenge.id}`} className="text-[13px] font-semibold text-dark hover:text-blue transition-colors truncate">
                {h.userName}
              </Link>
            </div>
          </div>
        )
      })()}
    </div>
  )

  const visibleFeed = mergedFeed.slice(0, feedPage * FEED_PAGE_SIZE)
  const hasMore = mergedFeed.length > visibleFeed.length

  const feedEl = (
    <div className="flex flex-col gap-2.5">
      {mergedFeed.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-[28px] mb-2">🏃</p>
          <p className="text-[14px] font-bold text-dark mb-0.5">Závod teprve začíná!</p>
          <p className="text-[12px] text-gray-mid">Buď první, kdo rozhýbá závod!</p>
        </div>
      ) : visibleFeed.map((entry, i) => {
        const isMe = entry.item.userId === currentUserId
        const delay = `${i * 0.03}s`

        if (entry.type === "enrollment") {
          const e = entry.item
          return (
            <div
              key={entry.key}
              className="flex items-center gap-2.5 py-1.5 px-1"
              style={{ animation: "row-enter 0.2s ease-out both", animationDelay: delay }}
            >
              {e.userAvatarUrl ? (
                <img src={e.userAvatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: avatarColor(e.userId) }}
                >
                  {getInitials(e.userName)}
                </div>
              )}
              <p className="flex-1 text-[12px] text-gray-mid">
                <Link
                  href={`/users/${e.userId}?from=${challenge.id}`}
                  className="font-semibold text-dark hover:text-blue transition-colors"
                >
                  {e.userName}
                </Link>
                {isMe && <span className="ml-1 text-[10px] font-bold text-blue bg-blue-light px-1.5 py-0.5 rounded">Já</span>}
                {" se přidal/a do výzvy 🎉"}
              </p>
              <span className="text-[11px] text-gray-mid flex-shrink-0">{relativeTime(e.enrolledAt)}</span>
            </div>
          )
        }

        if (entry.type === "achievement") {
          const a = entry.item
          return (
            <div
              key={entry.key}
              className="bg-white rounded-[16px] border border-gray-border overflow-hidden"
              style={{ animation: "row-enter 0.2s ease-out both", animationDelay: delay }}
            >
              <div className="flex items-center gap-2.5 px-4 py-3.5">
                {a.userAvatarUrl ? (
                  <img src={a.userAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0"
                    style={{ backgroundColor: avatarColor(a.userId) }}
                  >
                    {getInitials(a.userName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-dark">
                    <Link
                      href={`/users/${a.userId}?from=${challenge.id}`}
                      className="hover:text-blue transition-colors"
                    >
                      {a.userName}
                    </Link>
                    {isMe && <span className="text-[10px] font-bold text-blue bg-blue-light px-1.5 py-0.5 rounded">Já</span>}
                  </div>
                </div>
                <span className="text-[11px] text-gray-mid flex-shrink-0">{relativeTime(a.earnedAt)}</span>
              </div>
              <div className="h-px bg-gray-border mx-4" />
              <div className="px-4 pb-4 pt-3">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-dark leading-snug truncate">
                      🏆 {a.bonusName}
                    </p>
                    <p className="text-[12px] text-gray-mid mt-0.5">Bonus splněn</p>
                  </div>
                  <div className="flex items-baseline gap-1 flex-shrink-0">
                    <span
                      className="text-[30px] font-extrabold leading-none num"
                      style={{ color: "#18C872", letterSpacing: "-0.02em", fontFamily: "var(--font-display)" }}
                    >
                      +{a.bonusPoints % 1 === 0 ? a.bonusPoints : a.bonusPoints.toFixed(1)}
                    </span>
                    <span className="text-[13px] font-semibold text-gray-mid">km</span>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        const f = entry.item
        return (
          <div
            key={entry.key}
            className="bg-white rounded-[16px] border border-gray-border overflow-hidden"
            style={{ animation: "row-enter 0.2s ease-out both", animationDelay: delay }}
          >
            <div className="flex items-center gap-2.5 px-4 py-3.5">
              {f.userAvatarUrl ? (
                <img src={f.userAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0"
                  style={{ backgroundColor: avatarColor(f.userId) }}
                >
                  {getInitials(f.userName)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-dark">
                  <Link href={`/users/${f.userId}?from=${challenge.id}`} className="hover:text-blue transition-colors">
                    {f.userName}
                  </Link>
                  {isMe && <span className="text-[10px] font-bold text-blue bg-blue-light px-1.5 py-0.5 rounded">Já</span>}
                </div>
              </div>
              <span className="text-[11px] text-gray-mid flex-shrink-0">{relativeTime(f.createdAt)}</span>
            </div>
            <div className="h-px bg-gray-border mx-4" />
            <div className="px-4 pb-4 pt-3">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-dark leading-snug truncate">
                    {f.catalogEmoji && <span className="mr-1">{f.catalogEmoji}</span>}{f.catalogName}
                    <span className="ml-1.5 text-[13px] font-normal text-gray-dark">
                      · {fmtValue(f.value)} {f.catalogUnit}
                    </span>
                  </p>
                  <p className="text-[12px] text-gray-mid mt-0.5">{formatDate(f.date)}</p>
                </div>
                <ActivityScoreBlock basePoints={f.points} partnerBonus={f.partnerBonus} size="lg" />
              </div>
              {f.note && (
                <p className="text-[12px] text-gray-mid mt-2 truncate">
                  💬 {f.note}
                </p>
              )}
              {f.partners && f.partners.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-light text-blue">
                    🤝 s {f.partners.map((p) => p.name).join(", ")}
                    {f.partnerBonus > 0 && (
                      <span style={{ color: "#d97706" }}>· +{fmtValue(f.partnerBonus)} km</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
      {hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full text-[13px] font-semibold text-gray-mid hover:text-dark py-3 rounded-[12px] border border-gray-border bg-white transition-colors"
        >
          Načíst další
        </button>
      )}
    </div>
  )

  return (
    <div>
      {!isEnrolled && isActive && (
        <div
          className="flex items-center justify-between gap-5 rounded-[12px] p-[18px_22px] mb-5"
          style={{
            background: "linear-gradient(135deg, rgba(24,200,114,.07), rgba(0,109,255,.07))",
            border: "1.5px solid rgba(24,200,114,.28)",
          }}
        >
          <div>
            <p className="text-[15px] font-extrabold text-dark mb-1">Zapoj se do výzvy!</p>
            <p className="text-[13px] text-gray-mid">Přidej se a začni sbírat kilometry.</p>
          </div>
          <button
            onClick={onEnroll}
            disabled={enrollLoading}
            className="inline-flex items-center gap-1.5 text-white text-[14px] font-bold px-5 py-2.5 rounded-sm disabled:opacity-60 flex-shrink-0"
            style={{ background: "var(--gradient)" }}
          >
            {enrollLoading ? "Registruji…" : "Zapojit se"}
          </button>
        </div>
      )}
      {enrollError && <p className="text-[13px] font-semibold text-red mb-4">{enrollError}</p>}

      <div className="md:hidden">
        {feedEl}
      </div>

      <div className="hidden md:block">
        {hasHighlights ? (
          <div className="grid grid-cols-[1fr_260px] gap-5 items-start">
            <div>{feedEl}</div>
            <div className="sticky top-4">{sidebarEl}</div>
          </div>
        ) : (
          <div>{feedEl}</div>
        )}
      </div>
    </div>
  )
}

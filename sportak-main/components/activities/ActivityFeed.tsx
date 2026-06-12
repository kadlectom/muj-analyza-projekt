import Link from "next/link"
import { avatarColor, getInitials } from "@/lib/avatarColor"
import { relativeTime } from "@/lib/relativeTime"
import { ActivityScoreBlock } from "@/components/activities/ActivityScoreBlock"

export type FeedItem = {
  userId: string
  userName: string
  userAvatarUrl: string | null
  catalogEmoji: string | null
  catalogName: string
  catalogUnit: string
  value: number
  points: number
  partnerBonus: number
  date: string
  note: string | null
  createdAt: number
  partners?: { name: string }[]
}

function fmtValue(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

type Props = {
  items: FeedItem[]
  currentUserId: string
  challengeId: string
}

export function ActivityFeed({ items, currentUserId, challengeId }: Props) {
  return (
    <div>
      <div className="px-5 py-4 border-b border-gray-border">
        <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-gray-mid">Nedávné aktivity</p>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-[28px] mb-2">🏃</p>
          <p className="text-[14px] font-bold text-dark mb-0.5">Zatím nikdo nezačal!</p>
          <p className="text-[12px] text-gray-mid">Přidej aktivitu a rozhýbej žebříček!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-border">
          {items.map((item, i) => {
            const isMe = item.userId === currentUserId
            return (
              <div
                key={`${item.userId}-${item.createdAt}`}
                className={`flex items-center gap-3 px-5 py-4 ${isMe ? "bg-blue-light" : ""}`}
                style={{ animation: "row-enter 0.2s ease-out both", animationDelay: `${i * 0.03}s` }}
              >
                {item.userAvatarUrl ? (
                  <img
                    src={item.userAvatarUrl}
                    alt=""
                    loading="lazy"
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0"
                    style={{ backgroundColor: avatarColor(item.userId) }}
                  >
                    {getInitials(item.userName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-mid truncate leading-snug">
                    <Link
                      href={`/users/${item.userId}?from=${challengeId}`}
                      className="hover:text-blue transition-colors"
                    >
                      {item.userName}
                    </Link>
                    {isMe && (
                      <span className="ml-1.5 text-[10px] font-bold text-blue bg-blue/10 px-1.5 py-0.5 rounded">
                        Já
                      </span>
                    )}
                  </p>
                  <p className="text-[15px] font-bold text-dark truncate leading-snug mt-0.5">
                    {item.catalogEmoji && (
                      <span className="mr-1">{item.catalogEmoji}</span>
                    )}
                    {item.catalogName}
                    <span className="ml-1.5 text-[13px] font-normal text-gray-dark">
                      · {fmtValue(item.value)} {item.catalogUnit}
                    </span>
                    {item.partners && item.partners.length > 0 && (
                      <span className="ml-1.5 text-[13px] font-normal text-gray-mid">
                        🤝 {item.partners.map((p) => p.name).join(", ")}
                        {item.partnerBonus > 0 && (
                          <span className="ml-1 font-semibold" style={{ color: "#d97706" }}>· +{fmtValue(item.partnerBonus)} km</span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <ActivityScoreBlock basePoints={item.points} partnerBonus={item.partnerBonus} />
                  <p className="text-[11px] text-gray-mid leading-snug mt-0.5">{relativeTime(item.createdAt)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

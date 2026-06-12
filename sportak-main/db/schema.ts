import { sqliteTable, text, integer, real, primaryKey, unique } from "drizzle-orm/sqlite-core"

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id:        text("id").primaryKey(),
  slackId:   text("slack_id").notNull().unique(),
  name:      text("name").notNull(),
  email:     text("email"),
  avatarUrl: text("avatar_url"),
  role:      text("role", { enum: ["participant", "admin"] }).notNull().default("participant"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

// ─── Challenges ───────────────────────────────────────────────────────────────

export const challenges = sqliteTable("challenges", {
  id:        text("id").primaryKey(),
  slug:      text("slug").unique(),         // URL-friendly identifier; generated from name
  name:      text("name").notNull(),
  type:      text("type", { enum: ["WINTER", "SUMMER"] }).notNull(),
  status:    text("status", { enum: ["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"] }).notNull().default("DRAFT"),
  startDate: text("start_date").notNull(), // ISO date YYYY-MM-DD
  endDate:   text("end_date").notNull(),
  partnerBonus: real("partner_bonus").notNull().default(0), // bonus km per activity logged with a partner
  createdAt:    integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt:    integer("updated_at", { mode: "timestamp" }).notNull(),
})

// ─── Activity catalog ─────────────────────────────────────────────────────────
// Admin-managed. Each item belongs to a specific challenge type (or BOTH).

export const activityCatalog = sqliteTable("activity_catalog", {
  id:             text("id").primaryKey(),
  challengeId:    text("challenge_id").references(() => challenges.id), // null = shared across all
  name:           text("name").notNull(),
  unit:           text("unit").notNull(),           // e.g. "km", "minutes", "count"
  pointsPerUnit:  real("points_per_unit").notNull(),
  minValue:       real("min_value"),                 // null = no minimum; otherwise value >= minValue is enforced on create/edit
  category:       text("category", { enum: ["sport", "wellness", "culture"] }).notNull(),
  challengeType:  text("challenge_type", { enum: ["WINTER", "SUMMER", "BOTH"] }).notNull().default("BOTH"),
  emoji:          text("emoji"),
  isActive:       integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt:      integer("created_at", { mode: "timestamp" }).notNull(),
})

// ─── Enrollments ──────────────────────────────────────────────────────────────

export const enrollments = sqliteTable("enrollments", {
  userId:      text("user_id").notNull().references(() => users.id),
  challengeId: text("challenge_id").notNull().references(() => challenges.id),
  enrolledAt:  integer("enrolled_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.challengeId] }),
}))

// ─── Activities ───────────────────────────────────────────────────────────────

export const activities = sqliteTable("activities", {
  id:            text("id").primaryKey(),
  userId:        text("user_id").notNull().references(() => users.id),
  challengeId:   text("challenge_id").notNull().references(() => challenges.id),
  catalogItemId: text("catalog_item_id").notNull().references(() => activityCatalog.id),
  value:         real("value").notNull(),           // distance, duration, or count
  points:        real("points").notNull(),           // pre-calculated at insert time
  date:          text("date").notNull(),             // ISO date YYYY-MM-DD (the activity date, may be in the past)
  note:          text("note"),
  createdAt:     integer("created_at", { mode: "timestamp" }).notNull(),
  createdById:   text("created_by_id").notNull().references(() => users.id), // actor (may differ from userId when admin acts)
})

// ─── Activity partners ────────────────────────────────────────────────────────
// Which users were tagged as partners on a given activity.
// Both actor and each partner receive challenge.partnerBonus km on the leaderboard.

export const activityPartners = sqliteTable("activity_partners", {
  activityId: text("activity_id").notNull().references(() => activities.id),
  userId:     text("user_id").notNull().references(() => users.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.activityId, t.userId] }),
}))

// ─── Audit log ────────────────────────────────────────────────────────────────
// Written only when an admin modifies another user's data.
// Immutable — no update/delete operations on this table.

export const auditLog = sqliteTable("audit_log", {
  id:           text("id").primaryKey(),
  actorId:      text("actor_id").notNull().references(() => users.id),
  action:       text("action", { enum: ["CREATE", "UPDATE", "DELETE"] }).notNull(),
  targetType:   text("target_type", { enum: ["activity", "challenge", "catalog", "user"] }).notNull(),
  targetId:     text("target_id").notNull(),
  challengeId:  text("challenge_id").references(() => challenges.id), // denormalized for per-challenge queries
  targetUserId: text("target_user_id").references(() => users.id),    // whose data was touched (survives row deletion)
  diff:         text("diff"),   // JSON string — { before, after }
  createdAt:    integer("created_at", { mode: "timestamp" }).notNull(),
})

// ─── Bonus rules ──────────────────────────────────────────────────────────────
// Admin-defined conditions per challenge. Users earn bonus km once they satisfy a rule.

export const bonusRules = sqliteTable("bonus_rules", {
  id:            text("id").primaryKey(),
  challengeId:   text("challenge_id").notNull().references(() => challenges.id),
  name:          text("name").notNull(),
  conditionType: text("condition_type", { enum: ["COUNT_ACTIVITIES", "TOTAL_POINTS"] }).notNull(),
  threshold:     real("threshold").notNull(),
  catalogItemIds: text("catalog_item_ids"), // JSON array of catalog item IDs, null = all activities
  windowStart:   text("window_start"),   // ISO date YYYY-MM-DD or null
  windowEnd:     text("window_end"),     // ISO date YYYY-MM-DD or null
  daysOfWeek:    text("days_of_week"),   // JSON "[0,6]" (Sun=0, Sat=6) or null = all days
  bonusPoints:   real("bonus_points").notNull(),
  createdAt:     integer("created_at", { mode: "timestamp" }).notNull(),
})

// ─── Bonus achievements ───────────────────────────────────────────────────────
// Immutable record of when a user earned a bonus. One row per (rule, user).

export const bonusAchievements = sqliteTable("bonus_achievements", {
  id:          text("id").primaryKey(),
  bonusRuleId: text("bonus_rule_id").notNull().references(() => bonusRules.id),
  userId:      text("user_id").notNull().references(() => users.id),
  challengeId: text("challenge_id").notNull().references(() => challenges.id),
  bonusPoints: real("bonus_points").notNull(), // snapshot at time of award
  earnedAt:    integer("earned_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  uniq: unique().on(t.bonusRuleId, t.userId),
}))

// ─── App content ──────────────────────────────────────────────────────────────
// Singleton-style key/value store for globally-editable content.
// Known keys: "how_to" — admin-managed "Jak na to" page sections.

export const appContent = sqliteTable("app_content", {
  key:       text("key").primaryKey(),
  data:      text("data").notNull(),                                      // JSON
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  updatedBy: text("updated_by").references(() => users.id),
})

// ─── Notification log ─────────────────────────────────────────────────────────
// Idempotency record for outbound Slack messages. The unique constraint stops
// the same notification from being sent twice (e.g. retry, edit-then-add same
// partner back). `refId` meaning is per-type — for partner_tagged it's the
// activity id; for monday_summary it's a year-week string; etc.

export const notificationLog = sqliteTable("notification_log", {
  id:     text("id").primaryKey(),
  type:   text("type").notNull(),
  refId:  text("ref_id").notNull(),
  userId: text("user_id").references(() => users.id), // null for channel broadcasts
  sentAt: integer("sent_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  uniq: unique().on(t.type, t.refId, t.userId),
}))

// ─── Types ────────────────────────────────────────────────────────────────────

export type User                = typeof users.$inferSelect
export type Challenge           = typeof challenges.$inferSelect
export type ActivityCatalogItem = typeof activityCatalog.$inferSelect
export type Enrollment          = typeof enrollments.$inferSelect
export type Activity            = typeof activities.$inferSelect
export type ActivityPartner     = typeof activityPartners.$inferSelect
export type AuditLogEntry       = typeof auditLog.$inferSelect
export type BonusRule           = typeof bonusRules.$inferSelect
export type BonusAchievement    = typeof bonusAchievements.$inferSelect
export type AppContentRow       = typeof appContent.$inferSelect
export type NotificationLogEntry = typeof notificationLog.$inferSelect

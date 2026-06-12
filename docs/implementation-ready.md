# Implementation-Ready Documentation

## Purpose
This document consolidates the PRD analysis, the imported `sportak-main` implementation findings, and the MVP-oriented documentation into a single handoff package for a new GitHub repository.

## 1. Product scope
- Internal web application for company sports challenges
- Slack OAuth only
- Active and historical challenges
- Activity logging in active challenges only
- Leaderboard and audit trail
- Admin management for challenges and activity catalog

## 2. Core user flows
1. Sign in with Slack
2. Open dashboard with active and archived challenges
3. Open challenge detail and leaderboard
4. Log an activity in an active challenge
5. Review historical read-only results
6. Use admin features for management and audit

## 3. Core entities
- User
- Challenge
- ActivityCatalogItem
- ActivityEntry
- Enrollment
- AuditLog

## 4. Technical baseline
- Next.js 14 (Pages Router)
- TypeScript
- NextAuth.js v4 with Slack OAuth
- Drizzle ORM
- SQLite for local development / Turso for production
- Tailwind CSS

## 5. MVP scope
Must include:
- Slack login
- Dashboard
- Challenge detail
- Activity logging
- Leaderboard
- Historical read-only archive
- Basic admin panel

Out of scope for first minimal release:
- Partner bonus logic
- Advanced notification system
- Heavy analytics and reporting
- Full mobile-first refinements

## 6. Recommended implementation order
1. Auth and session
2. Challenge and activity catalog APIs
3. Activity logging and points calculation
4. Leaderboard
5. Admin panel
6. Audit log
7. Hardening and tests

## 7. Acceptance checklist
- Users can sign in with Slack
- Dashboard shows active and historical challenges
- Activity entry works only for active challenges
- Leaderboard updates correctly
- Historical challenges are read-only
- Admin actions are logged

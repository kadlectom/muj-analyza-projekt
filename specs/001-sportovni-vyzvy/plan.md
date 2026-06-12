# Implementation Plan: Firemní sportovní výzvy

**Branch**: `001-sportovni-vyzvy` | **Date**: 2026-06-12 | **Spec**: `specs/001-sportovni-vyzvy/spec.md`

## Summary

This plan implements the MVP for the company sports challenge app based on the PRD and the imported sportak-main project. The implementation uses a Next.js-based monorepo-style approach with Slack OAuth, challenge management, activity logging, leaderboard generation, and admin/audit features.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Next.js 14, NextAuth.js v4, Drizzle ORM, Tailwind CSS

**Storage**: SQLite for local development, Turso for production-compatible deployment

**Testing**: Jest

**Target Platform**: Web application

**Project Type**: Web application

**Performance Goals**: Standard internal company application usage

**Constraints**: Slack OAuth requires HTTPS in development; historical challenges must remain read-only.

## Constitution Check

- Must align with PRD-based business rules
- Must support Slack-only authentication
- Must preserve immutable historical data
- Must support participant and admin roles

## Project Structure

### Documentation (this feature)

```text
specs/001-sportovni-vyzvy/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
sportak-main/
├── pages/
│   ├── index.tsx
│   ├── login.tsx
│   └── challenges/
├── api/
│   ├── auth/
│   ├── challenges/
│   ├── activities/
│   ├── enrollments/
│   ├── leaderboard/
│   ├── catalog/
│   └── audit/
├── db/
├── lib/
└── components/
```

**Structure Decision**: Use the imported sportak-main application as the primary implementation baseline, while documenting the feature in Spec Kit structure.

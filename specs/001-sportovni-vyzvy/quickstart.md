# Quickstart: Firemní sportovní výzvy

## Run locally

1. Open the imported project in `sportak-main`.
2. Install dependencies with `npm install`.
3. Copy `.env.local.example` to `.env.local` and fill Slack OAuth values.
4. Run `npm run db:generate` and `npm run db:migrate`.
5. Start the app with `npm run dev`.

## What to validate

- Slack login works.
- Dashboard shows active and archived challenges.
- Activity entry is possible only in active challenge periods.
- Leaderboard updates after valid activity submission.
- Admin users can access admin features and audit log.

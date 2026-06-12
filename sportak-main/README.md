# Firemní sportovní výzvy

Internal web app for company sports challenges at Lundegaard. Employees log in via Slack OAuth, record activities, and compete on a leaderboard.

## Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript (strict)
- **Auth**: NextAuth.js v4 — Slack OAuth
- **ORM**: Drizzle ORM
- **Database (dev)**: SQLite (`dev.db`)
- **Database (prod)**: Turso (hosted libSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel

## Running locally

```bash
npm install
cp .env.local.example .env.local
# Fill in SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, NEXTAUTH_SECRET, SLACK_TEAM_ID

npm run db:generate
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Slack OAuth requires HTTPS. Use ngrok: `ngrok http 3000` and set `NEXTAUTH_URL` accordingly.

## Database

```bash
npm run db:generate   # generate migrations from schema changes
npm run db:migrate    # apply pending migrations
npm run db:studio     # open Drizzle Studio
```

## Tests

```bash
npm test
```

95 tests covering API routes and lib utilities.

## Roles

- `participant` — default on first login
- `admin` — set via `ADMIN_SLACK_IDS=U123,U456` env var (first login only); managed via admin panel after that

## Reference files

- `PRD_Sportovni_vyzvy.md` — product requirements
- `design-mockup.html` — visual design reference (open in browser)
- `index.html` + `app.js` + `styles.css` — original HTML prototype (kept for reference)

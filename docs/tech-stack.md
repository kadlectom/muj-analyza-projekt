# Tech Stack Návrh

## Cílová architektura
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Data: PostgreSQL (nebo SQLite pro MVP)
- Auth: Slack OAuth 2.0
- API: REST
- Deployment: Vercel / Netlify (frontend), Render / Railway / Azure App Service (backend)

## Důvody pro volbu
- React + Vite je rychle nasaditelné a vhodné pro MVP.
- Express je jednoduchý a přehledný pro interní aplikaci.
- TypeScript zvyšuje bezpečnost a čitelnost.
- Slack OAuth je v souladu s PRD.

## Doporučený MVP stack
- Frontend: React, TypeScript, Vite, React Router
- Backend: Express, TypeScript, Zod (validace), Prisma (volitelné)
- DB: PostgreSQL
- Auth: Slack OAuth 2.0
- Testing: Vitest + Supertest

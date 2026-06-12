# Porovnání sportak-main vs. dokumentace v docs/

## Shrnutí
Importovaná složka [muj-analyza-projekt/sportak-main](muj-analyza-projekt/sportak-main) je výrazně bohatší a konkrétnější než naše generická MVP dokumentace v [muj-analyza-projekt/docs](muj-analyza-projekt/docs). Většina rozdílů není v samotném PRD, ale v úrovni implementačního detailu a rozsahu funkcionality.

## Klíčové rozdíly

### 1. Tech stack
- Naše dokumentace v [muj-analyza-projekt/docs/tech-stack.md](muj-analyza-projekt/docs/tech-stack.md) navrhuje:
  - React + TypeScript + Vite
  - Express + TypeScript
  - PostgreSQL
- Složka [muj-analyza-projekt/sportak-main](muj-analyza-projekt/sportak-main) skutečně používá:
  - Next.js 14 (Pages Router)
  - TypeScript
  - NextAuth.js v4 + Slack OAuth
  - Drizzle ORM
  - SQLite / Turso

Důsledek: sportak-main je implementačně mnohem blíže plnohodnotné Next.js aplikaci než náš původní jednoduchý split frontend/backend návrh.

### 2. Architektura
- Naše dokumentace předpokládá oddělený frontend a backend.
- sportak-main má monolitický Next.js projekt s API routes v jednom repu.

Důsledek: řešení v sportak-main je výkonnější pro rychlý prototyp, ale méně odpovídá původnímu „frontend + backend“ plánu.

### 3. Datový model
Naše dokumentace popisovala základní entity:
- User
- Challenge
- ActivityType
- ActivityEntry
- LeaderboardEntry
- AuditLog

sportak-main v [muj-analyza-projekt/sportak-main/db/schema.ts](muj-analyza-projekt/sportak-main/db/schema.ts) má navíc:
- `enrollments`
- `activity_catalog`
- `activity_partners`
- `bonus_rules`
- `bonus_achievements`
- `app_content`
- `notification_log`

Důsledek: sportak-main řeší i bonusové pravidla, partnerství a notifikace, což v naší MVP analýze chybělo.

### 4. Role a přístupová práva
Naše dokumentace jen obecně uváděla role `participant` a `admin`.

sportak-main v [muj-analyza-projekt/sportak-main/CLAUDE.md](muj-analyza-projekt/sportak-main/CLAUDE.md) rozšiřuje:
- role jsou vždy čteny z DB
- první adminové jsou určeni přes `ADMIN_SLACK_IDS`
- role se po prvním přihlášení nastavují automaticky
- admin může spravovat role i přes admin panel

Důsledek: řešení je bezpečnější a detailnější než naše stručná dokumentace.

### 5. Bodování a pravidla
Naše dokumentace mluvila o výpočtu bodů a validaci aktivit.

sportak-main má navíc:
- předpočítané `points` ukládané v DB
- bonus km za partnerství (`partnerBonus`)
- bonus pravidla (`bonus_rules`)
- vlastní logiku pro výpočet bodů v `calculatePoints.ts`

Důsledek: sportak-main implementuje obchodní logiku výrazně hlouběji, než bylo v analýze zakomponováno.

### 6. Stav výzev a immutable režim
Naše dokumentace označovala archiv jako read-only.

sportak-main v [muj-analyza-projekt/sportak-main/CLAUDE.md](muj-analyza-projekt/sportak-main/CLAUDE.md) uvádí:
- `DRAFT`, `ACTIVE`, `CLOSED`, `ARCHIVED`
- `CLOSED` a `ARCHIVED` jsou plně immutable
- ani admin nesmí zapisovat do uzavřených/archivních výzev

Důsledek: sportak-main má přísnější pravidlo než naše původní dokumentace.

### 7. Admin funkce
Naše dokumentace navrhovala pouze základní admin panel.

sportak-main obsahuje explicitně:
- CRUD pro výzvy
- CRUD pro katalog aktivit
- bonus rules
- user role management
- audit log

Důsledek: rozsah admin funkcionality je v imported projektu významně vyšší než v našem MVP návrhu.

## Co se shoduje
- PRD základ je stejný: Slack OAuth, výzvy, leaderboard, archiv, audit.
- Hlavní user workflow je podobný: přihlášení → výzvy → detail → zápis aktivity → leaderboard.
- Cíl aplikace je v obou případech stejný: nahradit Excel/Confluence přehledy sportovních výzev.

## Co naše dokumentace neobsahovala dostatečně
1. Next.js / Pages Router architekturu
2. Drizzle ORM a SQLite/Turso datový layer
3. bonus rules a partner bonus
4. enrollments a activity partners
5. strict immutable rules pro CLOSED / ARCHIVED
6. detailní admin role management
7. notifikace / Slack message log

## Závěr
sportak-main je v podstatě „rozšířená implementační verze“ našeho analytického návrhu, ne jen jednoduchý prototyp. Rozdíl je hlavně v rozsahu, obchodní logice a úrovni detailu, ne v základním zadání z PRD.

## Doporučení pro další práci
- Pokud chceš držet MVP, lze z sportak-main vybrat pouze jádro: challenge list, activity logging, leaderboard, admin panel.
- Pokud chceš zachovat současnou implementaci, pak je potřeba ji považovat za pokročilejší variantu než naše původní docs.

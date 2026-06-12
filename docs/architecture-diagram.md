# Stručný architektonický diagram

## Přehled

```text
+-------------------+        +---------------------------+
| React + Vite      |        | Express + TypeScript      |
| Frontend          |<-----> | Backend API               |
| (Dashboard, Admin)|        | (Auth, Challenges, Audit) |
+-------------------+        +---------------------------+
            |                                 |
            | HTTPS                           | SQL / DB
            v                                 v
      +-------------------+           +-------------------+
      | Slack OAuth        |           | PostgreSQL / DB    |
      | Auth provider      |           | Challenge, Entry,  |
      +-------------------+           | Audit, User data   |
                                      +-------------------+
```

## Základní tok
1. Uživatel se přihlásí přes Slack.
2. Frontend volá REST API v backendu.
3. Backend načítá a ukládá data do databáze.
4. Leaderboard a body jsou počítány na backendu.
5. Administrátor má přístup k CRUD a audit logu.

## Rozdělení odpovědností
- Frontend: prezentace, formuláře, navigace, leaderboard
- Backend: business rules, bodování, role, audit
- DB: persistent data storage

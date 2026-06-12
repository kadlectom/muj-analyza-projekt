# Implementation Plan po jednotlivých issuech

## Issue 1 – Projektová kostra
- Vytvořit frontend a backend strukturu
- Nastavit TypeScript, routing a základní API klient
- Ověřit, že obě části běží lokálně

## Issue 2 – Auth a uživatel
- Implementovat přihlášení přes Slack
- Vytvořit endpoint /auth/me
- Zajistit základní session a role

## Issue 3 – Výzvy a katalog aktivit
- Implementovat /challenges a /challenges/{id}
- Implementovat /activity-types
- Napojit dashboard a detail výzvy na API

## Issue 4 – Zápis aktivit a bodování
- Implementovat /challenges/{id}/entries
- Vypočítat body podle typu aktivity a indexu
- Ošetřit validaci povolených aktivit

## Issue 5 – Leaderboard
- Implementovat /challenges/{id}/leaderboard
- Přepočítat pořadí a skóre
- Zobrazit leaderboard na frontend

## Issue 6 – Archiv a read-only režim
- Ošetřit historické výzvy jako read-only
- Zajistit, že editace je blokována pro archiv

## Issue 7 – Admin panel
- Vytvořit základní admin rozhraní
- Implementovat CRUD pro výzvy a typy aktivit
- Přidat import historických dat

## Issue 8 – Audit log
- Ukládat změny do audit logu
- Zobrazit audit log v administraci

## Issue 9 – Quality pass
- Přidat validation, error handling a testy
- Ověřit hlavní user flow
- Příprava na první release

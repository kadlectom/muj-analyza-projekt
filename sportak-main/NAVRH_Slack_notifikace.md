# Návrh Slack notifikací

Komplexní přehled notifikací pro zvýšení engagementu v aktivních výzvách. Status: **návrh**, čeká na schválení priorit.

---

## Klíčové principy

### 1. Slack DM jako kanál
Rozhodnuto v květnu 2026 (viz [memory](.claude/projects/.../memory/project_notifications.md)): Web Push i email zamítnuty. Slack máme z OAuth, 100 % dosah, žádný permission prompt.

### 2. Inkluzivní statistiky > top umístění
Veřejné kanálové zprávy **defaultně neukazují žebříček**. Demotivuje to lidi na spodních příčkách. Místo toho:
- Hit aktivity týdne, počet zápisů, kolektivní km, pestrost, „poprvé vyzkoušel"
- Žebříček jen občas — neutrálně formulovaný (souboje na hraně, ne hierarchie)
- Spodek tabulky se nikdy nejmenuje

Ranking framing je OK v DM (adresné, soukromé) — ne v kanále.

### 3. Kanál vs. DM

| | Kanál (např. `#vyzvy`) | DM |
|---|---|---|
| Účel | Společenský pocit, FOMO, rituál | Osobní motivace bez veřejného tlaku |
| Tón | Veselý, oslavný | Tykání, krátké, akční |
| Riziko | Hluk → mute kanálu | Pocit nag → opt-out |

---

## TIER 1 — postavit první

### 1. Pondělní rozcvička — kanál

- **Trigger:** cron Po 8:30, jen pokud výzva ACTIVE
- **Cap:** 1× týdně
- **Formát:** 4 rotující šablony podle fáze výzvy

**A1. Aktivita týdne (default)**
> 🏔️ **Týden 6 v zimní výzvě**
> 📊 **52 aktivit** zaznamenáno · **+340 km** k týmu
> 🏊 Hit týdne: **plavání** (14×) · 🏃 hned za ním běh (11×)
> 👥 Zapojilo se **18 lidí**
> Společně máme **1 580 km** · do konce **23 dní**

**A2. Pestrost & objevy** (warmup týdny + občas v půli)
> 🌈 **12 různých aktivit tento týden**
> Top trojka: 🏊 plavání · 🏃 běh · 🧗 lezení
> Poprvé v rámci výzvy: **wellness** (Marek), **otužování** (Klára)
> Tři nejaktivnější dny: úterý, čtvrtek, neděle

**A3. Cesta k milestonu** (vybrat když se blíží 1000/2500/5000 km)
> 🎯 **Chybí už jen 47 km do 2 000 km**
> Tento týden jsme přidali +340. Stačí jeden parádní víkend.
> Tip: **wellness** dává 5 km za návštěvu — i odpočinek se počítá

**A4. Stav hry** (jen v posledních ~14 dnech, ne dřív)
> 🏁 **Posledních 12 dní výzvy — žebříček zhuštěný do 11 km**
> 🥇 Honza · 🥈 Eva · 🥉 Tom — všechny tři pozice se ještě dají obrátit
> Souboj o 5. místo: Klára vs. Petr (4 km)

---

### 2. Předběhl/a tě — DM

- **Trigger:** event po POST `/api/activities`, když aktivita posunula někoho přes uživatele v ranku
- **Cap:** max 1× za 24 h pro stejnou dvojici (uživatel × kdo ho přeskočil)

> ⚡ **Eva tě právě předběhla** o 3 km — teď jsi 5.
> Stačí 4 km a vrátíš se zpátky. [Zapsat aktivitu →]

**Páka:** nejsilnější soutěžní páka v app. Adresná a soukromá → demotivace nehrozí.
**Pozn:** vyžaduje recompute leaderboardu po každé aktivitě + porovnání před/po.

---

### 3. Otagoval tě parťák — DM

- **Trigger:** event po INSERT do `activityPartners`, kde target ≠ logger
- **Cap:** žádný (přirozeně limitované počtem tagů)

> 🤝 **Honza tě označil u 5 km běhu** (12,5 km bodů)
> Aktivita ti byla přičtena. Pokud to nesedí, řekni mu/jí. [Detail výzvy →]

**Páka:** transparentnost, řeší existující UX problém („kdo mi to tam dal?").

---

### 4. Bonus splněn — DM

- **Trigger:** event po úspěšném `bonus_achievements` insertu v `evaluateBonuses.ts`
- **Cap:** 1× per (user, bonusRule) — vynucené unique constraintem v DB

> 🏆 **Splněno: 5× plavání** — bonus +20 km připsán
> Aktuálně máš 184 km. [Žebříček →]

**Páka:** okamžitá odměna ihned po akci, dopamin loop.
**Pozn:** triviální implementace — jeden hook v existujícím kódu.

---

### 5. Bonus startuje dnes — kanál

- **Trigger:** cron denně 8:30, vybírá `bonusRules WHERE windowStart = today() AND challenge.status = 'ACTIVE'`
- **Cap:** idempotency přes `notification_log` (1× per bonusRule.id)

**COUNT_ACTIVITIES s filtrem:**
> 🎁 **Nový bonus startuje dnes — Týden plavce**
> Zaplav **5×** od dnešního pondělí do neděle a získej **+30 km bonus**.
> Aktivita: 🏊 plavání · Dny: po–ne

**TOTAL_POINTS bez filtru:**
> 🎁 **Bonus aktivován — Stovka**
> Nasbírej **100 km** mezi **12.–18. 5.** a získej **+50 km**. Platí pro všechny aktivity.

**Edge cases:**
| Situace | Doporučení |
|---|---|
| `windowStart = null` (aktivní celou výzvu) | Oznámit při startu výzvy (DRAFT → ACTIVE), ne v cronu |
| Více bonusů začíná stejný den | Sloučit do jedné zprávy |
| Admin přidá bonus s `windowStart` v minulosti | Neposílat zpětně (filtr `windowStart === today()`) |

---

## TIER 2 — přidat až Tier 1 šlape

### 6. Páteční předehra — kanál

- **Trigger:** cron Pá 14:00, jen pokud do konce výzvy ≥2 dny
- **Cap:** 1× týdně
- **Formát:** 4 rotující šablony

**E1. Pohyb se nabízí (default)**
> ☀️ **Páteční přehled**
> Tento týden jsme zatím přidali **+280 km** · pětka nejaktivnějších dnů sezóny: úterý
> 🏊 Plavání frčí (14×), kolo se málo používá (jen 2×) — třeba dnes?
> Tip na víkend: **vysokohorská turistika** — 1,5× index za km chůze

**E2. Kolektivní cíl**
> 🎯 **Do 2 000 km zbývá 47 km · ideální víkendová meta**
> Jeden den na sjezdovkách = 30 km · 2 hodiny lezení = 30 km · víkend chození = klidně 40 km

**E3. Souboje na hraně** (mid-late, neutrálně, libovolné dvojice)
> ⚔️ **Tři nejtěsnější souboje v top 10**
> 1. místo: rozdíl 5 km · 4. místo: 8 km · 7. místo: 2 km
> Víkend rozhoduje. Žádná pozice teď není jistá.

**E4. Poslední víkend** (jen jednou, na konci)
> 🏁 **Poslední víkend výzvy — co teď neuděláš, nedohoníš**

**Pozn:** komplementární k pondělní rozcvičce (Po retrospektivní, Pá prospektivní).

---

### 7. Blízko dalšímu místu — DM

- **Trigger:** cron Čt večer, pro každého enrolovaného: spočti rozdíl k uživateli o 1 výš
- **Filtr:** rozdíl ≤ 10 km
- **Cap:** max 1× týdně per user

> 🎯 Jsi **6.** — stačí ti **7 km** a předběhneš Toma.
> Zbývají 3 dny. [Zapsat aktivitu →]

**Páka:** mikrocíl + deadline = akce. Osobní/DM kanál → ranking framing OK.

---

### 8. 7 dní bez aktivity — DM

- **Trigger:** cron Po 18:00, uživatel enrolled + ACTIVE výzva + žádná aktivita >7 dní
- **Cap:** max 1× per výzva per user

> 👋 Není pondělí trochu nuda? Zápis ti zabere 10 sekund. [Zapsat →]

**Páka:** revival neaktivních.
**Pozn:** nejcitlivější ze všech — povinný opt-out, nízká frekvence.

---

### 9. Kolektivní milestone — kanál

- **Trigger:** event po POST `/api/activities`, když celkový součet překročí 500/1000/2500/5000 km
- **Cap:** 1× per (challenge, milestone) přes `notification_log`

> 🎉 Společně jsme překonali **1 000 km!** První na 1 000. metru: Petr B.

**Páka:** sdílená radost, pocit „we did it".

---

### 10. Poslední 3 dny výzvy — kanál

- **Trigger:** cron když `endDate - today() = 3`
- **Cap:** 1× per výzva

> ⏳ **Výzva končí v neděli.** Top 3: Honza (218), Eva (213), Tom (197). Žádné z umístění není jisté.

**Pozn:** žebříček zde výjimečně OK — finále je jiný kontext než průběh.

---

### 11. Bonus končí zítra — kanál

- **Trigger:** cron denně 9:00, vybírá `bonusRules WHERE windowEnd = today() + 1`
- **Cap:** 1× per bonusRule přes `notification_log`

> ⏳ **Poslední den na bonus „Týden plavce"** — splnili: Eva, Tom. Stačí ti 2 plavání.

**Páka:** loss aversion (silnější než reward).

---

## TIER 3 — nice-to-have, experimentální

### 12. Onboard po enrollu — DM
- **Trigger:** cron 24 h po `enrolled_at`, když 0 aktivit od enrollu
- **Cap:** 1× per (user, challenge)
- **Obsah:** 3 „rychlé výhry" z katalogu (vyšší body za den), odkaz na detail

### 13. První aktivita — DM
- **Trigger:** event po první POST `/api/activities` daného uživatele v rámci výzvy
- **Obsah:** pochvala + tip na partnerský tagging + odkaz na žebříček

### 14. Nová výzva startuje — kanál
- **Trigger:** event při `DRAFT → ACTIVE`
- **Obsah:** název, datum, pravidla, „Zapojit se" link, případně bonusy bez `windowStart`

### 15. Vyhlášení vítězů — kanál
- **Trigger:** event při `ACTIVE → CLOSED`
- **Obsah:** top 3 + nejvyšší jednotlivá aktivita + nejaktivnější (počet zápisů) + kolektivní km

### 16. Dramatický rank shift — kanál
- **Trigger:** event po POST aktivity, když uživatel poskočil o **≥3 místa najednou**
- **Cap:** max 1/den agregát do kanálu
> 🚀 **Petr právě poskočil z 8. na 3. místa** — co se stalo?

**Pozn:** zatím nezařazeno do Tier 1 — riziko, že se to bude dít často a unaví.

---

## Frekvenční pravidla

| Typ | Strop |
|---|---|
| Kanálové cron zprávy | max 2/týden (Po + Pá) |
| Event do kanálu (milestone, finále) | max 1/den agregát |
| DM eventy (předběhnutí, partner, bonus) | max 3/den per user |
| DM cron (rozcvička, blízko, neaktivní) | max 1/týden per user |

---

## Rotace šablon — logika výběru

| Fáze výzvy | Po (rozcvička) | Pá (předehra) |
|---|---|---|
| Týden 1–2 | A2 (pestrost) | E1 (pohyb se nabízí) |
| Střed výzvy | A1 default, A3 když blízko milestonu | E1 default, E2 když blízko milestonu |
| Posledních 14 dní | A1 nebo A4 (ranking jen občas) | E3 → E4 |

Implementace: pure funkce `selectMondayTemplate(challenge, weekStats)` / `selectFridayTemplate(...)` — testovatelné.

---

## Společná infrastruktura

### Schema změny
- `users.notificationsEnabled BOOLEAN DEFAULT 1` (opt-out per user)
- Nová tabulka `notification_log`:
  ```sql
  notification_log (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL,      -- 'bonus_start', 'milestone_1000', 'monday_summary_2026w19', ...
    refId       TEXT,               -- bonusRule.id, challenge.id, week-string, ...
    userId      TEXT,               -- nullable, set jen pro DM
    sentAt      INTEGER NOT NULL,
    UNIQUE(type, refId, userId)
  )
  ```

### Helpers
- `lib/slack.ts` — wrapper nad `chat.postMessage`
  - DM: target = Slack user ID (`@U...`)
  - Channel: target = channel ID
  - Strukturované Block Kit messages
- `lib/weeklyStats.ts` — pure funkce nad raw SQL agregaty
  - `topActivityThisWeek(challengeId)`, `weeklyKmDelta`, `varietyCount`, „first time" detekce
  - Reusable i pro hero / Nástěnku
- `lib/formatBonusRule.ts` — pure funkce: `BonusRule → { headline, conditionLine, rewardLine }`
- `lib/leaderboardCalc.ts` — rozšířit o `weeklyDelta` variantu

### Cron endpoints
- `pages/api/cron/monday-summary.ts`
- `pages/api/cron/friday-teaser.ts`
- `pages/api/cron/daily-bonus-announce.ts`
- `pages/api/cron/daily-bonus-ending.ts`
- `pages/api/cron/almost-overtaken.ts`
- `pages/api/cron/inactive-revival.ts`
- `pages/api/cron/last-3-days.ts`

Všechny chráněné `CRON_SECRET` headerem.

### Vercel cron config (`vercel.json`)
```json
{
  "crons": [
    { "path": "/api/cron/monday-summary",       "schedule": "30 8 * * 1" },
    { "path": "/api/cron/friday-teaser",        "schedule": "0 14 * * 5" },
    { "path": "/api/cron/daily-bonus-announce", "schedule": "30 8 * * *" },
    { "path": "/api/cron/daily-bonus-ending",   "schedule": "0 9 * * *" },
    { "path": "/api/cron/almost-overtaken",     "schedule": "0 18 * * 4" },
    { "path": "/api/cron/inactive-revival",     "schedule": "0 18 * * 1" },
    { "path": "/api/cron/last-3-days",          "schedule": "0 9 * * *" }
  ]
}
```

### Slack setup
- Rozšířit existující Slack OAuth app o scope `chat:write`
- `SLACK_BOT_TOKEN` do Vercel env
- Pro kanálové zprávy: dedikovaný kanál (např. `#vyzvy`) → `SLACK_CHANNEL_ID` env

### Opt-out flow
- Uživatel pošle „stop" v DM → bot zachytí (Slack Events API) → `notificationsEnabled = false`
- Případně admin UI s toggle

---

## Implementační pořadí

1. **Infrastruktura** (~3 h): `lib/slack.ts`, `notification_log` migrace, `users.notificationsEnabled`, env vars, cron secret
2. **#4 Bonus splněn** (~30 min): nejmenší kus, ověří kompletní cestu end-to-end
3. **#5 Bonus startuje** (~2 h): první cron, ověří `notification_log` idempotency, otestuje formátování bonusu
4. **#1 Pondělní rozcvička** (~3 h): vyžaduje `lib/weeklyStats.ts` — největší společný základ pro další zprávy
5. **#3 Otagoval tě parťák** (~30 min): triviální event
6. **#2 Předběhl/a tě** (~2 h): vyžaduje rank-before/rank-after porovnání
7. **#6 Páteční předehra** (~2 h): reuse weeklyStats, jen jiná šablona
8. **Zbytek Tier 2** podle vyhodnocení dopadu prvních

**Celkem Tier 1: ~11 h** end-to-end (s testy a manual QA na devu).

---

## Otevřené otázky

- **Jaký kanál pro broadcast?** `#vyzvy` existuje, nebo vytvořit nový? Smí bot postnout do existujícího bez ruční pozvánky?
- **Time zone pro cron?** Vercel běží v UTC. Pondělí 8:30 lokálně = 7:30 UTC v zimě, 6:30 v létě. Buď napevno UTC s vědomím posunu, nebo dynamický recompute.
- **Opt-out granularita?** Jeden boolean, nebo per typ (jen DM vypnout, kanál nechat)?
- **Co když je víc paralelních ACTIVE výzev?** Schema povoluje, business pravidlo zatím ne. Pondělní rozcvička pak posílá zprávu per výzva, nebo jednu sloučenou?
- **A/B test inkluzivních vs. soutěžních formátů?** Bylo by hezké změřit, zda inkluzivní rotace skutečně drží engagement výš než pure leaderboard. Vyžaduje analytiku.

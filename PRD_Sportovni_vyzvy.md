# Product Requirements Document (PRD)
## Aplikace pro firemní sportovní výzvy

---

## 1. Přehled produktu
**Název projektu:** Firemní sportovní výzvy  
**Typ produktu:** Interní webová aplikace  
**Cíloví uživatelé:** Zaměstnanci společnosti

Cílem aplikace je transparentní, férové a dlouhodobě udržitelné pořádání sportovních výzev (zimní / letní) včetně archivace historických výsledků. Aplikace nahrazuje Excel tabulky a Confluence stránky s pravidly.

---

## 2. Základní principy
- Každý zaměstnanec se může přihlásit přes firemní Slack
- Každý přihlášený uživatel vidí aktuální i historické výzvy a jejich výsledky
- Účast ve výzvě je dobrovolná
- Historické výzvy jsou pouze pro čtení (read-only)
- Aktuální výzva umožňuje zápis aktivit a administrátorské zásahy

---

## 3. Přihlášení a autentizace
### 3.1 Přihlášení
- Přihlášení probíhá výhradně přes **Sign in with Slack**
- Podporován je jeden firemní Slack workspace
- Nový uživatel se přihlásí přes Slack a zvolí workspace
- Opakovaný uživatel je automaticky přihlášen (aktivní session)

### 3.2 Role uživatelů
- **Účastník** – výchozí role
- **Administrátor** – rozšířená role

Role jsou řízeny aplikací, nikoli Slackem.

---

## 4. Typy výzev a jejich stav
### 4.1 Typy výzev
- Zimní výzva
- Letní výzva

### 4.2 Stav výzvy
- Draft – připravovaná
- Active – probíhající
- Closed – ukončená (výsledky uzamčeny)
- Archived – historická

---

## 5. Uživatelský flow
### 5.1 Základní flow
Přihlášení → Přehled výzev → Detail výzvy → Přihlášení do výzvy → Zápis aktivit → Leaderboard

### 5.2 Chování uživatele
- Uživatel vždy vidí aktuální i historické výzvy
- Do aktivní výzvy se lze připojit kdykoliv během jejího trvání
- Pokud se uživatel do výzvy nezapojí, vidí pouze výsledky
- U výzvy je vždy uveden start, konec a počet zbývajících dní

---

## 6. Katalog aktivit
### 6.1 Zimní výzva
- Obsahuje všechny aktivity definované v historickém Excelu
- Excel je zdroj pravdy pro seznam aktivit, indexy a validační pravidla
- Zahrnuje zimní sporty, cvičení, wellness a kulturní aktivity včetně otužování

### 6.2 Letní výzva
**Sportovní aktivity:**
- Silniční kolo
- MTB (horské kolo)
- Brusle
- Turistika
- Vysokohorská turistika
- Lezení
- Vodní sporty
- Běh
- Plavání
- Týmový sport
- Cvičení – nízká intenzita
- Cvičení – střední intenzita
- Cvičení – vysoká intenzita
- Tanec

**Wellness a kultura:**
- Shodné se zimní výzvou, kromě otužování

Aktivity nepovolené pro daný typ výzvy nelze zapsat.

---

## 7. Zápis aktivit
### 7.1 Pravidla
- Aktivitu lze zapisovat pouze v období, kdy výzva běží
- Aktivitu lze zapsat i zpětně, ale pouze v rámci dat trvání výzvy
- Do historických výzev nelze zapisovat

### 7.2 Vysvětlivka bodování
Každý zápis obsahuje vysvětlení:
- typ aktivity
- zadanou hodnotu
- použitý index
- výsledný počet bodů
- případná omezení

---

## 8. Leaderboard
- Leaderboard se přepočítává automaticky
- Zobrazuje pořadí, skóre a avatar uživatele
- Historické leaderboardy jsou neměnné

---

## 9. Administrátorská oprávnění
Administrátor může:
- spravovat výzvy
- upravovat katalog aktivit
- vkládat, upravovat a mazat aktivity účastníků v aktuální výzvě
- importovat historická data

Administrátor nemůže upravovat historické výzvy.

---

## 10. Auditní stopa
- U každé aktivity je vidět autor a čas vytvoření
- U admin zásahů je vidět kdo, kdy a co změnil
- Auditní záznamy jsou needitovatelné a viditelné uživatelům

---

## 11. Archiv výzev
- Přehled výzvy
- Pravidla platná v daném roce
- Finální leaderboard
- Detail účastníků

Archiv je read-only.

---

## 12. Nefunkční požadavky
- Transparentnost výpočtů
- Konzistence dat
- Ochrana historických výsledků
- Možnost rozšíření o další výzvy

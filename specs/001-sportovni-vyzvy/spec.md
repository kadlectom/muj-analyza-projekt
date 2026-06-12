# Feature Specification: Firemní sportovní výzvy

**Feature Branch**: `001-sportovni-vyzvy`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Interní webová aplikace pro firemní sportovní výzvy. Uživatelé se přihlásí přes Slack, uvidí aktuální i historické výzvy, zapisují aktivity, sledují leaderboard a administrátoři spravují výzvy, katalog aktivit a audit log."

## User Scenarios & Testing

### User Story 1 - Uživatel se přihlásí a otevře přehled výzev (Priority: P1)

Uživatel se přihlásí přes Slack a vidí aktuální i historické výzvy s jejich stavem a daty.

**Why this priority**: Tohle je hlavní hodnota aplikace a vstupní uživatelský scénář.

**Independent Test**: Uživatel se přihlásí, otevře dashboard a ověří, že vidí aktivní i archivní výzvy.

**Acceptance Scenarios**:
1. Given uživatel má platnou Slack session, When otevře aplikaci, Then je přesměrován na dashboard výzev.
2. Given existují aktivní i historické výzvy, When uživatel otevře dashboard, Then vidí oba typy výzev.
3. Given uživatel není přihlášen, When otevře chráněnou stránku, Then je přesměrován na přihlášení.

---

### User Story 2 - Uživatel zapíše aktivitu do aktivní výzvy (Priority: P1)

Uživatel může zapsat svoji aktivitu a získat body podle pravidel výzvy.

**Why this priority**: Zápis aktivit je hlavní obchodní funkce aplikace.

**Independent Test**: Uživatel otevře detail výzvy, vyplní aktivitu a ověří, že systém spočítá body.

**Acceptance Scenarios**:
1. Given výzva je ve stavu ACTIVE, When uživatel přidá aktivitu, Then je záznam uložen a připočten do leaderboardu.
2. Given aktivita není povolena pro typ výzvy, When uživatel ji chce uložit, Then systém zobrazí chybu.
3. Given výzva je ARCHIVED nebo CLOSED, When uživatel chce přidat aktivitu, Then zápis není povolen.

---

### User Story 3 - Administrátor spravuje výzvy a audit log (Priority: P2)

Administrátor může spravovat výzvy, katalog aktivit a sledovat auditní záznamy.

**Why this priority**: Tohle rozšiřuje produktovou hodnotu, ale není nutné pro základní MVP.

**Independent Test**: Administrátor otevře admin panel a provede úpravu výzvy nebo katalogu aktivit.

**Acceptance Scenarios**:
1. Given administrátor má roli admin, When otevře admin panel, Then může spravovat výzvy a katalog aktivit.
2. Given dojde k úpravě cizího záznamu, When akce proběhne, Then je vytvořen audit log.
3. Given historická výzva je read-only, When administrátor chce upravit záznam, Then je akce zamítnuta.

---

### Edge Cases

- Co se stane, když uživatel přidá aktivitu mimo období výzvy?
- Jak systém reaguje na neplatný typ aktivity nebo neplatnou hodnotu?
- Jak se zachází s historickými výzvami v admin rozhraní?

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow users to sign in only via Slack OAuth.
- **FR-002**: System MUST display active and historical challenges on the dashboard.
- **FR-003**: System MUST allow users to open a detailed challenge view and view leaderboard.
- **FR-004**: System MUST allow users to record activities only within an active challenge period.
- **FR-005**: System MUST calculate and store points for each recorded activity.
- **FR-006**: System MUST prevent writes to CLOSED and ARCHIVED challenges.
- **FR-007**: System MUST support participant and admin roles.
- **FR-008**: System MUST provide admin tools for challenge and activity catalog management.
- **FR-009**: System MUST record audit entries for admin interventions.

### Key Entities

- **User**: Authenticated employee with role participant or admin.
- **Challenge**: Sports challenge with type, status, start date and end date.
- **ActivityCatalogItem**: Scoreable activity definition used in calculations.
- **ActivityEntry**: Logged activity performed by a participant.
- **LeaderboardEntry**: Derived ranking of participants by points.
- **AuditLog**: Immutable record of admin actions.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can sign in and open the dashboard in under 2 minutes.
- **SC-002**: Users can record and save an activity in the active challenge flow without manual support.
- **SC-003**: Leaderboard updates reflect the latest valid activity entries.
- **SC-004**: Admin actions are logged and visible in the admin audit log.

## Assumptions

- Slack workspace is preconfigured for the company.
- Admin users are assigned by configuration or admin management flow.
- Historical challenges are read-only by design.
- The first implementation focuses on the MVP core flow, not on advanced notifications.

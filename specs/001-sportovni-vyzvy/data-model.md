# Data Model: Firemní sportovní výzvy

## Core entities

- User
  - id
  - slackId
  - name
  - email
  - role
  - avatarUrl

- Challenge
  - id
  - slug
  - name
  - type
  - status
  - startDate
  - endDate
  - partnerBonus

- ActivityCatalogItem
  - id
  - challengeId
  - name
  - unit
  - pointsPerUnit
  - category
  - challengeType

- ActivityEntry
  - id
  - userId
  - challengeId
  - catalogItemId
  - value
  - points
  - date
  - note
  - createdById

- Enrollment
  - userId
  - challengeId
  - enrolledAt

- AuditLog
  - id
  - actorId
  - action
  - targetType
  - targetId
  - challengeId
  - targetUserId
  - diff
  - createdAt

## Notes

The imported project adds richer entities such as bonus rules, activity partners, and notification logs. These are optional extensions and can be documented later if the project grows beyond MVP.

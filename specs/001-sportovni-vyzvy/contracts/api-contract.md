# API Contract: Firemní sportovní výzvy

## Endpoints

- GET /api/auth/me
- GET /api/challenges
- GET /api/challenges/active
- GET /api/challenges/archive
- GET /api/challenges/:id
- GET /api/activity-types
- GET /api/challenges/:id/entries
- POST /api/challenges/:id/entries
- PATCH /api/entries/:id
- GET /api/challenges/:id/leaderboard
- POST /api/admin/challenges
- POST /api/admin/activity-types
- GET /api/admin/audit

## Notes

This contract mirrors the imported project structure in `sportak-main`, while remaining aligned with the PRD.

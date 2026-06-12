# Repo Handoff for New GitHub Repository

## Recommended repository structure

```text
backend/ or api/
  src/
    routes/
    controllers/
    services/
    db/

frontend/
  src/
    pages/
    components/
    services/

specs/
  001-sportovni-vyzvy/
    spec.md
    plan.md
    research.md
    data-model.md
    quickstart.md
    contracts/
    tasks.md
```

## What to carry over from sportak-main
- Slack OAuth integration
- Challenge and activity domain model
- Admin + audit concepts
- Immutable historical challenge behavior
- Existing sample data and seed logic

## What to simplify for MVP
- Keep the core challenge flow only
- Avoid over-expanding the bonus-rule and notification systems in v1
- Use the imported project as a reference, not as a mandatory full stack copy

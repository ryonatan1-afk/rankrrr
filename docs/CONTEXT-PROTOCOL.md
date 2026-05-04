# Context Update Protocol

When the user asks "should we update context?", evaluate using these triggers:

| Trigger | Action |
|---------|--------|
| Current task changed | Update STATE.md → Current Task |
| Feature shipped or broke | Update STATE.md → System Status |
| Architectural decision made | Update docs/ARCHITECTURE.md |
| System-critical lesson learned | Update docs/LESSONS.md |
| Info in STATE.md is outdated | Remove it |
| New domain became complex enough | Create docs/[DOMAIN].md |

## Rules
- Never update context files without user request.
- Every entry must be a pointer or a decision, not a description.
- Never summarise code that can be read from file paths.
- When suggesting updates, be specific: quote what to add/remove/change.
- STATE.md must stay under 80 lines. If growing, prune or move to docs/.

## What Makes a Good Entry
Bad pointer: `Auth → /src/auth/`
Good pointer: `Auth (email+password, Google OAuth, role: user/admin) → /src/auth/`

Bad entry: `We use Neon for the database and it handles connections`
Good entry: `DB: Neon serverless PostgreSQL (chose over PlanetScale — Postgres dialect, better free tier) → /src/db/`

## After Evaluation
Present changes as a checklist:
```
Context updates:
- [ ] STATE.md: Update current task to "..."
- [ ] STATE.md: Mark [feature] as ✅ Live
- [ ] docs/ARCHITECTURE.md: Add decision about [X]
- [ ] No other changes needed
```

Wait for user approval before making any changes.

# Rankr — Architecture

## What We're Building
A full-stack web app. Users sign up, browse or create categories, vote in 1v1 matchups, and see crowd-aggregated leaderboards. Admins manage categories and users. AI generates new categories on demand.

---

## Stack Decisions

### Frontend Framework
**Decision: Next.js (React)**
- Rationale: Prototype is already React. Next.js adds routing, server-side rendering, and API routes in one package. Industry standard, huge community, easy to hire for.
- Alternative considered: Vite + React SPA — simpler but no server-side rendering (bad for SEO if Rankr pages become shareable/indexable).

### Hosting
**Status: TBD — budget-sensitive**

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| Vercel | Free hobby / $20 pro | Best Next.js DX, instant deploys | Pro plan needed for team features |
| Railway | ~$5/month usage-based | Hosts both app + DB in one place | Less mature than Vercel |
| Render | Free tier / $7+ | Simple, reliable | Slower cold starts on free |
| Fly.io | Free tier | Full control, global edge | More DevOps complexity |

**Recommendation:** Start on Vercel free tier. Migrate if costs become an issue at scale.

### Database
**Status: TBD — Supabase free tier already maxed out**

| Option | Type | Cost | Pros | Cons |
|--------|------|------|------|------|
| Neon | Serverless PostgreSQL | Free tier generous | Scales to zero, branchable DBs | Slightly higher latency on cold start |
| PlanetScale | Serverless MySQL | Free tier deprecated | Battle-tested at scale | MySQL dialect (not Postgres) |
| Railway PostgreSQL | Managed Postgres | ~$5/mo | Simple, co-located with app | Cost adds up |
| Turso | SQLite (edge) | Generous free | Ultra-fast edge reads | SQLite limits (no complex joins) |

**Recommendation:** Neon — PostgreSQL dialect, generous free tier, works well with Next.js + Prisma ORM.

### ORM
**Decision: Prisma**
- Rationale: Type-safe queries, automatic migration history, works with any PostgreSQL-compatible DB. Easy to switch DB providers if needed.
- Schema lives at `prisma/schema.prisma`. Migrations live at `prisma/migrations/`.

### Authentication
**Status: TBD**

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| Clerk | Free up to 10k MAU | Best DX, pre-built UI components, roles built-in | Vendor lock-in |
| NextAuth v5 | Free (self-hosted) | Full control, no vendor | More setup, you manage sessions |
| Lucia | Free (self-hosted) | Lightweight, modern | Newer, smaller community |

**Recommendation:** Clerk for speed — handles email, Google, magic links, and role management out of the box. Switch to NextAuth if budget becomes an issue.

### AI Category Generation
**Decision: Anthropic API (Claude)**
- Called server-side only (Next.js API route or Server Action) — API key never exposed to browser.
- Model: `claude-haiku-4-5-20251001` for generation tasks (fast + cheap). Upgrade to Sonnet if quality is insufficient.
- Prompt: generates 6–8 items with name, emoji, description for any topic.

### Key Architectural Principles
- **Votes are per-user** — each user runs their own bracket. Leaderboard is aggregate across all users.
- **Categories are global** — created by users, visible to all, moderated by admins.
- **Roles:** `user` (default), `admin`, `superadmin` — enforced server-side, never trust client.
- **Geo support** — categories can have an optional `location` tag (city, country) for local ranking use cases (restaurants, etc.).

---

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-04 | Next.js as framework | React prototype + server-side needs |
| 2026-05-04 | Prisma as ORM | Type safety + DB portability |
| 2026-05-04 | Anthropic API for AI | Already used in prototype, server-side safe |
| 2026-05-04 | Neon as database | Serverless PostgreSQL, generous free tier, works with Prisma |
| 2026-05-04 | Clerk for auth | Free to 10k MAU, roles built-in, Show/UserButton components |
| 2026-05-04 | Vercel for hosting | Best Next.js DX, free hobby tier |
| 2026-05-04 | proxy.ts not middleware.ts | Next.js 16 renamed middleware convention |

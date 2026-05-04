<!-- This file must stay under 80 lines. If it grows, prune or move content to docs/. -->
# Rankr — Current State
Last updated: 2026-05-04

## Project Summary
Rankr is a crowd-powered ranking game where users rank anything (NBA players, Tel Aviv restaurants, movies) using 1v1 bracket matchups. Anyone can create and share categories. The wisdom of the crowd surfaces the best items. Monetisation target: local/geo-based business rankings.

## Current Task
**Goal:** Port prototype UI into Next.js — categories page, vote page, leaderboard
**Done when:** A user can browse categories, start a 1v1 vote session, and see a leaderboard — all wired to the real DB

## System Status
| Component | Status | Notes |
|-----------|--------|-------|
| HTML prototype | ✅ Done | Preserved in `prototype/` — use as design spec |
| Tech stack decision | ✅ Done | Next.js 16 + Neon + Clerk + Vercel |
| Project scaffold | ✅ Done | TypeScript + Tailwind + App Router, no warnings |
| Clerk auth | ✅ Done | Sign up/in working, `<Show>` header, `proxy.ts` middleware |
| Prisma schema | ✅ Done | User/Category/Item/Vote/UserSession with indexes |
| DB migration | ✅ Done | `init` migration applied to Neon (eu-west-2) |
| AI generation module | ✅ Done | `lib/ai/generate-category.ts` — Anthropic SDK, server-side only |
| Categories page | ⬜ Planned | |
| Vote page (1v1 matchup) | ⬜ Planned | Core experience — port from prototype |
| Leaderboard page | ⬜ Planned | |
| Seed default categories | ⬜ Planned | Travel / Food / Movies from prototype |
| Admin panel | ⬜ Planned | |
| Hosting / deployment | ⬜ Planned | Vercel free tier |

## Key File Locations
| What | Where |
|------|-------|
| Design spec (prototype) | `prototype/Rankr.html` |
| DB client singleton | `lib/db/index.ts` |
| AI category generator | `lib/ai/generate-category.ts` |
| Auth middleware | `proxy.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Env template | `.env.example` |

## Next Up
1. Build `/categories` page — grid of category cards, browseable by all
2. Build category creation form — name, emoji, description, optional AI generation
3. Build `/vote/[categoryId]` — port 1v1 matchup UI from prototype, save votes to DB
4. Build `/leaderboard/[categoryId]` — aggregate results from votes table
5. Seed DB with 3 default categories (Travel, Food, Movies)

## Known Issues
| Issue | Severity | Notes |
|-------|----------|-------|
| Port 3000 in use | Low | Dev server runs on 3001/3002 — unrelated process on 3000 |

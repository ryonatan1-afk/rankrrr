# Overnight Fix Pass — Changes

## Shipped

### P0 — Ship-blockers

**1. Killed the "All done!" / "halfway there" contradiction**
- Bracket 1 completion screen now reads "Bracket 1 complete" with "Top of Bracket 1: [Winner]"
- Only Bracket 2 completion shows "All done!" with the celebratory framing
- Removed the "Hold on — you're only halfway there" banner entirely
- Replaced with a clear "Continue to Bracket 2 →" primary CTA + "View leaderboard so far" secondary link
- Added "Bracket 1 of 2" / "Bracket 2 of 2" pill in the vote page header (both parts)

**2. Killed emojis for items and categories**
- Voting cards now show colored initials avatar (2-letter monogram in the item's accent color) instead of emoji
- Category progress rings show first letter of category name instead of emoji
- Category headers (vote page, leaderboard, categories list) show name only — no emoji
- BracketTree slots show text-only names
- Leaderboard ranked list uses colored initials tiles instead of emoji boxes
- CategoryLink (homepage) removed emoji display
- Emojis remain in the DB for potential future use; only the display layer changed

**4. Bracket visualization overflow fixed**
- Desktop (>620px): horizontal bracket with tighter card widths (130px vs 170px), fits without scroll on ≥900px
- Mobile (≤620px): responsive vertical "round by round" view replaces the horizontal bracket entirely — no horizontal scroll on any viewport ≥360px
- Champion card simplified, no longer cut off at the right edge

### P1 — High-impact UX

**5. Round labeling fixed**
- Removed the redundant "Round X of 3" framing
- New format: "Bracket 1 of 2 · Quarter-finals — Match 2 of 4"
- Match position increments correctly within each round, giving users real progress feedback

**6. "You vs. the crowd" reveal added**
- Appears on every bracket completion screen (Bracket 1 and Bracket 2)
- Shows user's bracket winner and their crowd ranking (#N in crowd rankings)
- Shows "✓ Crowd agrees" badge when user's pick matches crowd's #1
- Shows "↕ You diverge from crowd" + "Crowd's current #1: [Name]" when different
- Feeds from real vote data; hidden if no crowd votes exist yet

**7. Leaderboard Elo explanation added**
- Added explanation bar above the ranked list: "Ratings are Elo-based (start 1200, ±~15 per matchup). ▲▼ = change since last vote. Sparkline = last 10 ratings."
- Sparkline stroke weight bumped from 1.75 to 2.25 (P3 #15 bundled in)
- Non-top-3 sparkline color raised from `rgba(255,255,255,0.2)` to `rgba(255,255,255,0.45)` — visibly distinct now

**8. Two-bracket structure communicated**
- "Bracket X of 2" pill persists in the vote page header throughout both brackets
- "How it works" info banner appears on the very first matchup of Bracket 1 (fresh session only), disappears after first vote
- No localStorage needed — uses initial bracket state to determine freshness

### P2 — Copy + flow polish

**10. Hero copy third line added**
- Fetches the most-voted matchup pair from live data (min 5 votes), shows "Right now: X% prefer A over B"
- Falls back to "Start voting to see what the crowd thinks" if data is insufficient

**11. AI generator placeholder rotates**
- Replaced the niche Israeli startups example with 5 broadly-relatable examples that rotate randomly on each page load
- Examples: "90s sitcoms", "Pixar films", "hip-hop albums from the 2000s", "Italian pasta dishes", "Premier League clubs"

**12. Copy nits**
- "crowd votes" → "votes" everywhere (CategoryLink, categories list)
- "↺ Redo" on AI preview screen → "↺ Regenerate" (clarifies it re-runs AI)
- "Rank the next 8 →" replaced by "Continue to Bracket 2 →"
- "Which do you prefer?" already in sentence case (done in previous session)
- Generator description updated: "Claude builds 16 items across 2 brackets"

**14. Keyboard hints on first matchup**
- ← and → key hints appear as subtle overlays on the voting cards during the user's first matchup
- Disappear permanently after first vote is cast
- No localStorage — session-scoped via React state

### P3 — Polish

**15. Sparkline contrast** — Bundled with #7 above

**16. Bracket viz on mobile** — Bundled with #4 above (vertical layout)

**17. Share: WhatsApp only**
- Removed Twitter/X and "Copy link" buttons
- Single green WhatsApp button with personalized copy: "I picked [Winner] as the best in [Category] — what's yours?"
- Only shows on Bracket 2 completion (the true "done" moment)

---

## Deferred

**Category name fixes in DB** (P2 #12 partial)
- "Top Models" → "Supermodels" or "Top Fashion Models" — requires a direct DB update or re-seed
- "Sports GOATs" → "Greatest Athletes" — same
- These are data changes, not code changes. Recommend a one-time DB query or re-seed with corrected TOPICS array

**"You vs. crowd" after each individual matchup** (P1 #6 lower-friction version)
- Showing "You picked X — 64% agree" momentarily after each vote would require real-time crowd tallies per pair
- Current implementation shows the aggregate on the completion screen, which is meaningful and non-blocking
- The per-matchup reveal can be added later with a separate `getPairStats` action

---

## Decisions that diverged from the brief

**#2 (Kill emojis)** — Emojis are still stored in the DB and generated by the AI prompt (no prompt change). Only the display layer strips them. Kept DB storage in case the design direction reverses; the decision to show/hide is purely UI.

**#4 (Bracket overflow)** — Chose a dual-layout approach (horizontal desktop / vertical mobile) over a pure SVG approach. SVG with preserveAspectRatio would have required re-implementing the connector math in SVG coordinates — the CSS dual-layout achieves the same outcome with far less risk of regression.

**#6 (You vs. crowd timing)** — Brief suggested "between matchups OR on bracket-complete screen." Chose bracket-complete only. Per-matchup interrupts the 1v1 flow, which the brief explicitly says not to slow down. Bracket-complete is the natural pause point.

**#10 (Hero copy)** — Brief suggested interpolating the category name ("in [Category]"). Omitted for cleanliness; the stat stands alone without needing the category attribution.

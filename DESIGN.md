---
name: Rankrrr
description: Crowd-powered 1v1 bracket voting that settles debates with data.
colors:
  abyss: "#0A0A0F"
  consensus-indigo: "#6366F1"
  indigo-soft: "#818CF8"
  verdict-green: "#34D399"
  eliminated-red: "#F87171"
  text-primary: "#FFFFFF"
  text-muted: "#FFFFFF66"
  surface-whisper: "#FFFFFF06"
  border-subtle: "#FFFFFF12"
  terminal-green: "#00FF41"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "72px"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.06em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.6
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.1em"
  mono:
    fontFamily: "Geist Mono, Courier New, monospace"
    fontSize: "26px"
    fontWeight: 700
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  xl: "22px"
  pill: "99px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.consensus-indigo}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.indigo-soft}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 28px"
  button-ghost:
    backgroundColor: "{colors.surface-whisper}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  matchup-card:
    backgroundColor: "{colors.surface-whisper}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "28px 22px"
  matchup-card-hover:
    backgroundColor: "rgba(99,102,241,0.07)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "28px 22px"
  matchup-card-selected:
    backgroundColor: "rgba(52,211,153,0.05)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "28px 22px"
  category-card:
    backgroundColor: "{colors.surface-whisper}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
---

# Design System: Rankrrr

## 1. Overview

**Creative North Star: "The Judgment Chamber"**

A dark arena where opinion is submitted to scrutiny and the crowd's aggregate is the only authority. Votes enter; verdicts emerge. The design exists to serve that moment: the reveal where you see how your picks compare to everyone else's. Every visual decision either supports that arc or gets cut.

Design density is high-contrast on a near-null base. The Void (#0A0A0F) removes all ambient noise so the voting cards command full attention. Color enters only where it carries meaning: Consensus Indigo (#6366F1) on interactive states, Verdict Green (#34D399) on winners, Eliminated Red (#F87171) on losers. At rest, surfaces are barely-there opacity lifts. The reveal is earned, not decorated.

This system explicitly rejects the SaaS dashboard aesthetic (corporate chrome, metric grids, arbitrary navy palettes), badge-and-streak gamification (achievement overlays, XP bars, progress incentives), and anything that buries the data behind decoration. The numbers are the product. The interface gets out of the way.

**Key Characteristics:**
- Dark arena: near-null base, high-contrast surfaces, color locked to state
- Glow-first elevation: depth via scale transform + glow ring, no traditional drop shadows at rest
- State-locked color: green = winner, red = loser, indigo = action — never decorative
- Negative letter-spacing on all heading-weight type for typographic confidence
- One retro component (VoteCounter) with fully isolated visual language

## 2. Colors: The Judgment Palette

Four functional roles, nothing spare. Indigo carries all interaction. Green and red are locked to outcome. The Void floor makes every color rare enough to mean something.

### Primary
- **Consensus Indigo** (#6366F1 / oklch(55% 0.22 270)): All interactive states — hover borders, active glows, primary buttons, focus rings, the hero icon gradient, and bracket-progression CTAs. The only color the user "chooses" with.
- **Indigo Soft** (#818CF8 / oklch(66% 0.18 270)): Secondary interactive text — part badges, "Generate with AI" CTA label, lower-hierarchy interactive elements. Quieter version of the accent, same hue family.

### Secondary
- **Verdict Green** (#34D399 / oklch(78% 0.17 162)): Winner states exclusively. Selected card borders, champion text, complete-state progress rings, the final bracket result header. Never decorative.
- **Eliminated Red** (#F87171 / oklch(70% 0.17 20)): Loser states. Applied to losing card opacity-fade context. Never repurposed for form error messages.

### Tertiary
- **Retro Terminal** (#00FF41): Isolated to the VoteCounter component. Neon LED green for the retro digit display, scanlines, and containment glow. Never used outside that component. If it appears elsewhere, it reads as broken.

### Neutral
- **The Void** (#0A0A0F / oklch(5% 0.006 270)): The arena floor. Base background for the entire application.
- **Whisper Surface** (#FFFFFF06 / rgba(255,255,255,0.025)): Card and container backgrounds. Barely-there tonal lift from the base — present enough to contain, invisible enough to stay out of the way.
- **Border Subtle** (#FFFFFF12 / rgba(255,255,255,0.07)): All resting borders. Card outlines, container dividers, input strokes.
- **Text Primary** (#FFFFFF): Headings, card titles, primary copy. All foreground content.
- **Text Muted** (#FFFFFF66 / rgba(255,255,255,0.4)): Secondary text, metadata, vote counts, supporting labels. Dimmer variations (0.25, 0.15) for tertiary context like keyboard hints and section dividers.

**The State-Lock Rule.** Green means winner. Red means loser. Indigo means action. These roles are fixed and exclusive. Never use Verdict Green for success toasts, Eliminated Red for form errors, or Consensus Indigo as decoration. Reuse dilutes the signal.

**The Rarity Rule.** At rest, surfaces are near-transparent on near-black. Color enters only in response to state. A screen covered in color is a screen where nothing is saying anything.

## 3. Typography

**Display/Body Font:** Geist (with system-ui, sans-serif fallback)
**Mono Font:** Geist Mono (with Courier New, monospace fallback — VoteCounter only)

**Character:** A single sans-serif family at full range. No serif, no expressive script. The analytical nerd who reads box scores doesn't want calligraphy. Geist's geometric neutrality lets tight letter-spacing and weight contrast carry all the hierarchy. The numbers do the decorating.

### Hierarchy
- **Display** (800, 72px, -0.06em, line-height 0.95): The "Rankr" hero title only. Tight tracking, sub-1 line-height, fills the viewport vertically. Appears once per session.
- **Headline** (700, 26px, -0.04em, line-height 1.2): Completion screens, winner reveals, major section titles. Confident and final.
- **Title** (700, 22px, -0.03em, line-height 1.2): Voting card item names — the thing you're choosing. The most-read type on any voting screen.
- **Body** (500, 14px, normal tracking, line-height 1.6): Supporting text, descriptions, secondary copy. Max 65–70ch line length. No negative tracking.
- **Label** (700, 11px, +0.1em, uppercase): Section markers, round names, category chips, stat headings. Always uppercase and tracked out. The only context where positive tracking is correct.
- **Mono** (700, 26px, Geist Mono): Vote counter digits only. Scoped to the retro display. Not for code, not for other data contexts.

**The Tight Title Rule.** All type at 700+ weight uses negative letter-spacing (minimum -0.02em). Positive tracking belongs exclusively to label/uppercase utility text. Mixing them in the same element is prohibited.

**The Scale Ratio Rule.** Adjacent hierarchy levels maintain at least a 1.3× size ratio. No flat type scales where multiple levels sit within 1–2px of each other.

## 4. Elevation

The system is glow-first flat. No traditional box shadows exist at rest on any surface. Depth is expressed through three mechanisms only:

1. **Tonal layers:** The Void base → Whisper Surface containers → content above. Three altitude levels defined by opacity, not shadow distance.
2. **Glow rings on interaction:** Voting cards lift via `transform: scale(1.025)` combined with `box-shadow: 0 0 0 1px rgba(99,102,241,0.6), 0 8px 48px rgba(99,102,241,0.2)`. The glow is the elevation; the scale confirms the lift.
3. **Outcome glows:** Selection state uses `box-shadow: 0 0 0 1px #34D399, 0 8px 48px rgba(52,211,153,0.25)`. The color of the glow signals the result.

### Shadow Vocabulary
- **Resting card** (`0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.3)`): Subtle containment. No perceived lift.
- **Hover glow** (`0 0 0 1px rgba(99,102,241,0.6), 0 8px 48px rgba(99,102,241,0.2)`): Indigo ring + diffuse radiance. Signals interactive affordance.
- **Selection glow** (`0 0 0 1px #34D399, 0 8px 48px rgba(52,211,153,0.25)`): Green ring + radiance. Signals that the verdict is in.
- **CTA glow** (`0 4px 24px rgba(99,102,241,0.45)` or `rgba(99,102,241,0.4)`): Primary action buttons only. Directs attention downward in the flow.
- **Retro containment** (`0 0 40px rgba(0,255,65,0.05), inset 0 0 30px rgba(0,0,0,0.5)`): VoteCounter only. Scoped and non-transferable.

**The Glow-State Rule.** Shadows exist only in response to state: hover, selection, focus, or primary CTA. Nothing glows at rest on a card, container, or heading. If a surface glows for no functional reason, remove it.

## 5. Components

The matchup card is the stage. Everything else is infrastructure.

### Buttons
- **Shape:** Gently rounded (12px) for all product buttons. One exception: the Sign Up nav button uses a pill (99px) to signal the auth entry point — intentional and non-generalizable.
- **Primary:** Consensus Indigo fill (#6366F1), white text, `padding: 12px 28px`. CTA glow on hover (`0 4px 20px rgba(99,102,241,0.4)`). Transition: `background 0.15s ease, box-shadow 0.15s ease`.
- **Gradient variant:** Used for bracket-progression CTAs only (`linear-gradient(135deg, #6366F1, #8B5CF6)`). Same shape, stronger glow (`0 4px 24px rgba(99,102,241,0.45)`). Not a general-purpose button style.
- **Ghost:** `rgba(255,255,255,0.05)` fill, 1px `rgba(255,255,255,0.08)` border, muted text (`rgba(255,255,255,0.4)`). `padding: 10px 18px`. Used for Back, Categories, and Rankings navigation actions.
- **Dashed CTA:** 1px dashed `rgba(99,102,241,0.35)` border, transparent fill, indigo-soft text. Reserved for the AI generator entry point — communicates "generative" rather than navigational.

### Matchup Cards
The hero component. Two cards fill the available width with a VS separator between them on desktop, and stack vertically on mobile (≤480px).

- **Resting:** `rgba(255,255,255,0.03)` fill, 1px `rgba(255,255,255,0.08)` border, 22px radius, scale 1. Shadow: `0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.3)`.
- **Hover (idle only):** Indigo tint fill (`rgba(99,102,241,0.07)`), indigo border (`rgba(99,102,241,0.7)`), scale 1.025, hover glow. Inner radial gradient from top center (`#6366F118` → transparent, pointer-events none).
- **Selected/winner:** Green tint fill (`rgba(52,211,153,0.05)`), green border (`#34D399`), scale 1.04, selection glow. Inner radial gradient (`#34D39918` → transparent). Winner badge: 10px/700/uppercase pill, green on green-tinted background, top-right corner.
- **Loser:** Near-invisible border (`rgba(255,255,255,0.04)`), scale 0.95, opacity 0.35. Recedes without disappearing.
- **Ripple:** 8px circle (`rgba(99,102,241,0.4)`) at click point, scales to 22× in 0.55s ease-out. Clears after 600ms.
- **Transition:** `transform 0.25s cubic-bezier(.34,1.56,.64,1)` (slight overshoot on the scale), `opacity 0.28s ease`, `box-shadow 0.22s ease`, `border-color 0.18s ease, background 0.18s ease`.
- **Content:** 88×88px image slot (16px radius, subtle border at rest), 22px/700/-0.03em title below.

### Category Cards
Compact list items for the homepage featured categories and the full category browser.

- **Resting:** `rgba(255,255,255,0.02)` fill, 1px `rgba(255,255,255,0.06)` border, 14px radius, `padding: 12px 14px`.
- **Hover:** Indigo tint fill (`rgba(99,102,241,0.07)`), indigo border (`rgba(99,102,241,0.4)`). `transition: all 0.15s ease`.
- **Content:** 16px/600/-0.02em name left-aligned; 12px muted vote count + 15px muted chevron right-aligned.

### Inputs / Fields
No standalone input design exists yet in the product (the AI generator uses a textarea). When adding inputs: stroke style with `rgba(255,255,255,0.07)` border, `rgba(255,255,255,0.025)` background, 12px radius. Focus: indigo glow ring (`0 0 0 2px rgba(99,102,241,0.4)`), border shifts to `rgba(99,102,241,0.5)`.

### Navigation
- **Header:** Sticky top, `backdrop-filter: blur(12px)`, `background: rgba(10,10,15,0.7)`. 48px height (12px vertical padding, 24px horizontal). The base color at 70% opacity creates scroll context without a hard line.
- **Logo mark:** Lightning bolt SVG (fill `#fb923c`) inside an indigo-to-violet gradient rounded-xl pill (`linear-gradient(135deg, #7c3aed, #4f46e5)`). Hidden on the homepage — appears on all inner routes to orient the user.
- **Sign in:** Text-only, `rgba(255,255,255,0.5)` → `#ffffff` on hover. Minimum friction.
- **Sign up:** Indigo solid fill, pill shape (99px), shadow `0 4px 16px rgba(99,102,241,0.2)`. The conversion CTA.

### Progress Bar (Voting Flow)
- **Track:** 3px height, `rgba(255,255,255,0.06)`, 99px radius.
- **Fill:** `linear-gradient(90deg, #6366F1, #34D399)` — transitions from indigo (in progress) to green (complete). `transition: width 0.4s cubic-bezier(.4,0,.2,1)`.

### Progress Ring (Categories Page)
SVG circle 48×48, 20px radius, 2.5px stroke. Background stroke `rgba(255,255,255,0.06)`; progress stroke Consensus Indigo (in progress) or Verdict Green (complete). Rotated -90° so fill starts from the top. `transition: stroke-dashoffset 0.4s ease`.

### Retro Vote Counter
Isolated component with fully self-contained visual language. Terminal Green (#00FF41) only. Monospace LED-style digit boxes (32×44px, 6px radius, green text glow: `0 0 8px #00ff41, 0 0 20px rgba(0,255,65,0.4)`). Scanline overlay via `repeating-linear-gradient`. Flicker keyframe at 6s interval. This component exists as a single moment of personality; its visual rules do not extend to any other surface.

## 6. Do's and Don'ts

### Do:
- **Do** use Consensus Indigo (#6366F1) for all interactive affordances: buttons, hover states, focus rings, active borders, and selection glows.
- **Do** reserve Verdict Green (#34D399) for winner/completion states only. Its scarcity is the signal.
- **Do** apply negative letter-spacing (-0.02em minimum) to all type at 700+ weight.
- **Do** express depth through glow rings and scale transforms, not drop shadows. State drives elevation.
- **Do** use the full 22px radius on matchup cards. Smaller surfaces scale down: 16px for containers, 14px for category cards, 12px for buttons.
- **Do** size interactive targets generously: minimum 44px tap target on mobile, clear visual affordance at rest.
- **Do** keep body text below 65–70ch line length.
- **Do** label all utility text (round names, section markers, stat headings) at 11px/700/uppercase/+0.1em. It is the only context for positive tracking.
- **Do** use ease-out cubic-bezier easing for all state transitions. The matchup card uses a slight overshoot (`cubic-bezier(.34,1.56,.64,1)`) intentionally for the scale transform — do not generalize the bounce to other elements.

### Don't:
- **Don't** design like a SaaS dashboard. No metric grids, no KPI card layouts, no corporate navy or enterprise chrome. Numbers here are rankings and verdicts, not business reports.
- **Don't** add badge or streak mechanics. No achievement overlays, "3-day streak" banners, XP bars, or points systems. Gamification for engagement's sake buries the actual crowd data, which is the product.
- **Don't** use side-stripe borders (border-left or border-right greater than 1px as a colored accent on cards, callouts, or list items). Use full borders, background tints, or nothing.
- **Don't** use gradient text outside the existing "Rankr" hero wordmark. The wordmark is a pre-existing exception. All new type uses a solid color.
- **Don't** use Retro Terminal green (#00FF41) outside the VoteCounter component. On any other surface it reads as a broken UI element.
- **Don't** add decorative glows at rest. Glow rings appear in response to hover, selection, or focus — never as ambient decoration on a resting surface.
- **Don't** use glassmorphism decoratively. Backdrop blur exists on the sticky nav header for a functional reason (scroll context). Anywhere else it is a default, not a decision.
- **Don't** arrange category listings as an identical card grid. The category list is a compact flow with varying vote counts and state — not a uniform icon-heading-text grid.
- **Don't** reach for a modal as a first thought. The bracket reveal and crowd comparison are inline. Interrupting the user mid-flow with a modal breaks the arc the whole experience builds toward.
- **Don't** apply positive letter-spacing to body or heading text. Tracking out is for labels and uppercase utility text only.

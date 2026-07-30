<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->

---
name: Onyx Digital Client Portal
description: Cyber compliance and insurance-readiness portal for regulated financial and medical services firms
colors:
  primary: "#3f3fc1"
  primary-deep: "#1818ac"
typography:
  display:
    fontFamily: "\"Shree Devanagari 714\", sans-serif"
  body:
    fontFamily: "\"Shree Devanagari 714\", sans-serif"
---

# Design System: Onyx Digital Client Portal

## Overview

This is a brand-token seed, not a full visual-world decision. It carries the confirmed brand assets — colors, typeface, and logo usage — from `brand/`. Layout, elevation, shapes, and components have not been decided yet and are intentionally left unresolved rather than invented; they should be established during actual surface design (e.g. via `/impeccable shape` or `new-work`) and this file regenerated from real code via `/impeccable document`.

The one confirmed directional constraint from `CLAUDE.md` is tone: **Clarity-First** — calm, plain-language, competent without being loud, the deliberate opposite of fear-based/red-dashboard/jargon-heavy cybersecurity vendor design. Future visual-world decisions must honor this, not contradict it.

**Key Characteristics:**
- Two confirmed brand blues (indigo family), no confirmed neutrals yet
- Brand typeface: Shree Devanagari 714 (Latin glyphs used for UI text, per brand direction)
- Calm, non-alarming register — no red/amber danger-styling as a default UI language

## Colors

Only two colors are confirmed. Do not invent additional palette colors (backgrounds, grays, semantic success/warning/error colors) without confirming with the user first — see `brand/README.md`.

### Primary
- **Onyx Indigo** (`#3f3fc1`): the lighter of the two confirmed brand blues. Treated as the base primary/accent color pending further direction.

### Secondary
- **Onyx Indigo Deep** (`#1818ac`): the darker of the two confirmed brand blues. Relationship to Primary (hover/active state vs. an independent secondary accent) is not yet confirmed — treat as a closely related deep variant until specified otherwise.

### Neutral
[to be resolved during implementation — no background, text, or border neutrals have been confirmed]

## Typography

**Display Font:** "Shree Devanagari 714" (with sans-serif fallback)
**Body Font:** "Shree Devanagari 714" (with sans-serif fallback)

**Character:** Confirmed as the brand typeface, used for Latin (English) UI text via its bundled Latin glyph set, not just its native Devanagari design. Weight/size hierarchy, letter-spacing, and line-height are not yet established.

### Hierarchy
[to be resolved during implementation — display/headline/title/body/label sizes, weights, and line-heights have not been confirmed]

## Do's and Don'ts

### Do:
- **Do** use `#3f3fc1` and `#1818ac` as the only confirmed brand colors until more are established.
- **Do** use `brand/logos/tri-bunny-white-transparent.png` on dark surfaces and `brand/logos/tri-bunny-logo-onyx-digital.png` (full color) on light surfaces.
- **Do** use `brand/logos/onyx-digital-text-logo-with-bunnies-transparent.png` for wordmark + mark lockups, and `brand/logos/onyx-digital-logo-banner.png` for wide banner placements.
- **Do** use "Shree Devanagari 714" for UI text per confirmed brand direction.
- **Do** keep the Clarity-First tone (calm, plain-language) in mind for any future color, motion, or component decisions layered onto these tokens.

### Don't:
- **Don't** invent additional palette colors (neutrals, semantic colors, extra accents) without confirming with the user.
- **Don't** recolor, recompose, stretch, or distort the logo lockups in `brand/logos/`.
- **Don't** use `brand/ui-reference/` images as literal specs to clone — they're direction/craft references only, reconciled with Clarity-First tone.
- **Don't** treat this file as complete — Layout, Elevation & Depth, Shapes, and Components are unresolved and must not be fabricated here.

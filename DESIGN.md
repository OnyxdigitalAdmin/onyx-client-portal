<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->

---
name: Onyx Digital Client Portal
description: Cyber compliance and insurance-readiness portal for regulated financial and medical services firms
colors:
  primary: "#3f3fc1"
  primary-dark: "#1818ac"
  background: "#FAFAFC"
  text: "#1E1B3A"
  border: "#E2E1F0"
  complete: "#2F9E6E"
  attention: "#C68A2E"
  error: "#B84C4C"
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

These tokens are the full approved palette and typeface for the build — they apply to every screen, including Onboarding Mode and Management Mode when they're built. Token names (`primary`, `primary-dark`, `background`, `text`, `border`, `complete`, `attention`, `error`) are chosen to map 1:1 onto future Tailwind theme colors (`bg-primary`, `text-attention`, etc.) once the app is scaffolded; no Tailwind config exists yet, so this file is the source of truth to wire in at that point.

**Key Characteristics:**
- Full 8-color palette confirmed: two brand blues, three neutrals (background/text/border), three status colors (complete/attention/error)
- Shree Devanagari 714 confirmed and approved as the typeface across the entire build — checked and renders standard Latin/English lettering correctly; no substitution needed
- Calm, non-alarming register: status colors are deliberately muted (amber, not red, for "attention"; a muted red, not harsh, for "error") — this is not an alarm-based system

## Colors

Full approved palette. Supersedes any earlier partial version of this file.

### Primary
- **Onyx Indigo** (`#3f3fc1`): buttons, links, active states.
- **Onyx Indigo Dark** (`#1818ac`): headers, emphasis.

### Neutral
- **Background** (`#FAFAFC`): page background.
- **Text** (`#1E1B3A`): body copy.
- **Border** (`#E2E1F0`): dividers, card edges.

### Status
- **Complete** (`#2F9E6E`): status = 100% / done.
- **Attention** (`#C68A2E`): status = in progress / open items.
- **Error** (`#B84C4C`): real errors only (e.g. failed login).

### Named Rules
**The No-Alarm Rule.** Attention is amber, not red — an open item or in-progress state is normal, not a warning. Error is a muted red, not a harsh one, and is reserved for actual failures (e.g. failed login), never for routine incomplete/in-progress status. Status color choice must never make a normal, expected state look like a system alarm.

## Typography

**Typeface:** "Shree Devanagari 714" (with sans-serif fallback), for both display and body text.

**Character:** Confirmed and approved as the typeface for the entire build — checked and renders standard Latin/English lettering correctly. No substitution or fallback-face decision needed.

### Hierarchy
[to be resolved during implementation — display/headline/title/body/label sizes, weights, and line-heights have not been confirmed]

## Do's and Don'ts

### Do:
- **Do** use the full approved 8-color palette above (`primary`, `primary-dark`, `background`, `text`, `border`, `complete`, `attention`, `error`) on every screen, including Onboarding Mode and Management Mode.
- **Do** use `brand/logos/tri-bunny-white-transparent.png` on dark surfaces and `brand/logos/tri-bunny-logo-onyx-digital.png` (full color) on light surfaces.
- **Do** use `brand/logos/onyx-digital-text-logo-with-bunnies-transparent.png` for wordmark + mark lockups, and `brand/logos/onyx-digital-logo-banner.png` for wide banner placements.
- **Do** use "Shree Devanagari 714" across the entire build — it's approved, not scoped to specific parts.
- **Do** keep status colors muted (amber for attention, muted red for error) per the No-Alarm Rule — never substitute a harsher red or urgent styling.
- **Do**, once the app is scaffolded, wire these exact token names into Tailwind's theme colors so components reference `bg-primary`, `text-attention`, etc. instead of hardcoded hex values.

### Don't:
- **Don't** invent additional palette colors beyond this approved set without confirming with the user.
- **Don't** recolor, recompose, stretch, or distort the logo lockups in `brand/logos/`.
- **Don't** use `brand/ui-reference/` images as literal specs to clone — they're direction/craft references only, reconciled with Clarity-First tone.
- **Don't** use a bright/harsh red for errors or use red/orange for routine "in progress" status — that violates the No-Alarm Rule.
- **Don't** hardcode hex values in component code once Tailwind theme colors exist — reference tokens by name.
- **Don't** treat this file as complete — Layout, Elevation & Depth, Shapes, and Components are unresolved and must not be fabricated here.

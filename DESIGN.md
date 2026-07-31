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
    fontFamily: "\"Shree Devanagari 714\", ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0"
  headline:
    fontFamily: "\"Shree Devanagari 714\", ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.333
    letterSpacing: "-0.06em"
  title:
    fontFamily: "\"Shree Devanagari 714\", ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.06em"
  lead:
    fontFamily: "\"Shree Devanagari 714\", ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.556
    letterSpacing: "-0.06em"
  body:
    fontFamily: "\"Shree Devanagari 714\", ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  label:
    fontFamily: "\"Shree Devanagari 714\", ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "-0.015em"
rounded:
  note: "0.75rem"
  dialog: "1rem"
  card: "1.5rem"
  pill: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1.25rem"
  lg: "1.5rem"
  xl: "1.75rem"
  xxl: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.5rem"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "rgb(63 63 193 / 0.85)"
    textColor: "#FFFFFF"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "rgb(255 255 255 / 0.7)"
    padding: "0.25rem 0"
    typography: "{typography.label}"
  input-field:
    backgroundColor: "transparent"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.25rem"
    typography: "{typography.body}"
  card-auth:
    backgroundColor: "rgb(255 255 255 / 0.04)"
    textColor: "#FFFFFF"
    rounded: "{rounded.card}"
    padding: "1.75rem"
    width: "26rem"
  note-error:
    backgroundColor: "{colors.background}"
    textColor: "{colors.error}"
    rounded: "{rounded.note}"
    padding: "0.75rem 1rem"
    typography: "{typography.label}"
  note-neutral:
    backgroundColor: "rgb(255 255 255 / 0.06)"
    textColor: "rgb(255 255 255 / 0.8)"
    rounded: "{rounded.note}"
    padding: "0.75rem 1rem"
    typography: "{typography.label}"
  dialog-session:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.dialog}"
    padding: "1.75rem"
    width: "26rem"
  progress-track:
    backgroundColor: "rgb(255 255 255 / 0.2)"
    rounded: "{rounded.pill}"
    height: "2px"
    width: "22.5rem"
  progress-fill:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    height: "2px"
---

# Design System: Onyx Digital Client Portal

## Overview

**Creative North Star: "Clarity-First"**

Clarity-First is an internal name — it belongs in this file and in code comments, never in the UI or in anything a client reads. It describes a system whose whole job is to lower the temperature of a subject that the category normally raises: a regulated firm's exposure, its audit posture, its insurability. Every decision here is made against the question "does this add load or remove it?"

The system is deliberately quiet. It runs on one typeface at one weight, an eight-color palette, a single centred column, and one shadow in the entire build. Hierarchy is carried by size, opacity, and space rather than by weight, rule lines, or color — so when color does appear (an amber countdown, a muted red failure note) it means something. The pre-auth sequence is a single field of `primary-dark` with the tri-bunny mark pinned in place across four screens; moving through it reads as text changing rather than pages swapping, because nothing but the text does change.

Its confirmed anti-reference is its own category: fear-based cybersecurity vendor design — red dashboards, alarm styling, jargon, urgency as a persuasion device. Motion is a second anti-reference for now. Phase 1 shipped with no animation of any kind beyond a loading bar that tracks real work and CSS color transitions on interactive states; the earlier brand-intro video was removed from the build entirely.

**Key Characteristics:**
- One typeface, one weight: Shree Devanagari 714 at 400 carries every role from the 1.875rem company name to the 0.75rem footnote
- One shadow in the system (the session-timeout dialog); every other surface is flat, layered tonally
- Pill-first form language — buttons, inputs and the loading bar are fully round; containers are large soft radii; nothing is square
- Two surfaces only: the `primary-dark` field (everything pre-auth) and the `background` page (everything post-auth)
- Depth and hierarchy on the dark field come from white at measured opacities, with published contrast floors
- Calm status register: amber for attention, muted red reserved for genuine failure

## Colors

Two brand indigos, three neutrals, three status colors. Eight total, and the set is closed.

### Primary
- **Onyx Indigo** (`primary`): buttons, links, active states, focus rings on light surfaces. The lighter of the two blues; white on it clears 7.8:1.
- **Onyx Indigo Dark** (`primary-dark`): the full-bleed field behind the entire pre-auth sequence, and the hover state for primary buttons on light surfaces. It is also baked into the tri-bunny mark's own background, which is why the mark composites onto the field with no visible edge.

### Neutral
- **Background** (`background`): the page surface for everything after sign-in, the dialog surface, and the plate under a light note sitting on the indigo field.
- **Text** (`text`): body copy on light surfaces. Also the dialog scrim at 65%.
- **Border** (`border`): hairline dividers and card edges on light surfaces.

### Status
- **Complete** (`complete`): 100% / done states in the readiness and posture trackers.
- **Attention** (`attention`): in-progress and open items, and the idle-session countdown.
- **Error** (`error`): real failures only — a rejected sign-in, a rejected code, an unlinked account.

### The white ladder (on `primary-dark`)

The dark field has no second background color. Everything on it is white at a fixed set of opacities, and those values are contrast floors rather than taste:

- **100%** — primary content: headings, input text, the company name, the progress fill.
- **85%** — input labels.
- **80% / 75% / 70% / 65%** — supporting copy, the "Authenticating…" and "Welcome aboard," lines, quiet actions, disclosure summaries.
- **60%** — the floor for any text, including placeholders and fine print. Clears 4.5:1.
- **45%** — the floor for a control boundary (the input rule). Clears 3:1.
- **25% / 20%** — card and disclosure borders, the progress track.
- **6% / 4%** — the only fills: the neutral notice panel and the auth card.

### Named Rules

**The No-Alarm Rule.** Attention is amber, not red — an open item or in-progress state is normal, not a warning. Error is a muted red, not a harsh one, and is reserved for actual failures, never for routine incomplete or in-progress status. An expected event (an idle sign-out, an unfinished onboarding stage) must never be styled as a system alarm.

**The Opacity Floor Rule.** On `primary-dark`, white/60 is the floor for text and white/45 is the floor for a control boundary. Lowering either fails WCAG on this background. These are not stylistic dials.

**The Light Plate Rule.** `error` reaches only ~2.4:1 against `primary-dark` and cannot be used as text on it. An error on the indigo field is rendered as a light `background` plate carrying `error` text — 4.8:1 — never as bare red type.

## Typography

**Typeface:** "Shree Devanagari 714" (fallbacks `ui-sans-serif`, `system-ui`, `sans-serif`), for display and body alike. Regular (400) and Bold (700) ship as `public/fonts/ShreeDevanagari714-{Regular,Bold}.woff2`, extracted from the `.ttc` collection in `brand/fonts/` because browsers cannot load a collection via `@font-face`.

**Character:** Warm, slightly wide, and optically loose at UI sizes — which is why the system tightens it globally by `-0.015em` on `body` and pins two exceptions explicitly rather than letting tracking drift per-component.

### Hierarchy

- **Display** (400, 1.875rem, 1.2, tracking `0`): the client's company name on the welcome screen. The only role at normal tracking, because it is user data.
- **Headline** (400, 1.5rem, 1.333, tracking `-0.06em`): the title of an auth card — "Sign in", "Set up your authenticator", "Verification code".
- **Title** (400, 1.25rem, 1.4, tracking `-0.06em`): the session-timeout dialog heading.
- **Lead** (400, 1.125rem, 1.556, tracking `-0.06em`): the single line of fixed brand copy on a full brand field — "Authenticating…", "Welcome aboard,".
- **Body** (400, 1rem, 1.5, tracking `-0.015em`): the default. Input values sit here.
- **Label** (400, 0.875rem, 1.43): field labels, supporting paragraphs, notes, quiet actions. Paragraphs at this size take `1.625` line-height when they run to multiple lines and `1.375` when they are a compact note. A 0.75rem step exists for one thing only: the fine print beneath the sign-in card.

Two monospace-substitute treatments exist, both wide-tracked rather than a second family: the 6-digit code input (1.5rem, centred, `0.4em`) and the TOTP setup key (0.875rem, `0.16em`, grouped in fours). The countdown digits use `tabular-nums` so the timer does not jitter.

### Named Rules

**The One Weight Rule.** Every role in the system is 400. Hierarchy comes from size, opacity, and space — never from weight. The Bold face is loaded for the browser's benefit; reaching for it to make something feel more important is a defect, not an option.

**The Fixed-Copy Tracking Rule.** `tracking-brand` (`-0.06em`) belongs to designed, fixed copy — wordmark-like text the build authored. User data never receives it: the company name is explicitly reset to `tracking-normal`. Tightening someone's firm name is a typographic opinion applied to a fact.

## Layout

Every surface built so far is a single centred column on a full-viewport (`min-h-dvh`) field. There is no grid, no sidebar, no header chrome, and no multi-column behavior anywhere in Phase 1.

**The column.** Content is capped at `26rem` and centred, with `1.5rem` gutters and `4rem` of vertical breathing room above and below the centred stack. The session dialog uses the same cap with a viewport-aware floor (`min(26rem, 100vw - 2rem)`), so it never reaches the screen edge on a small handset.

**Rhythm.** Spacing runs on a coarse ladder — `0.5rem` between a label and its input, `0.75rem` for a tight follow-on, `1.25rem` between form fields, `1.5rem` between a heading block and what follows it, `1.75rem` before a form or a section break, `2.5rem` between the brand mark and the card beneath it. Card padding is `1.75rem`, opening to `2.25rem` at the `sm` breakpoint.

**Responsive behavior.** One breakpoint is in use — `sm` (40rem) — and it does exactly two things: it grows card padding and it lowers the pinned footer slightly. Everything else is fluid by construction. The brand mark is sized with `clamp()` (`300px`–`460px` full, `180px`–`220px` compact) rather than stepped at breakpoints. Layout is not device-branched; only capability is: the MFA screen swaps its QR code for an `otpauth://` handoff button on a handheld, because you cannot scan the screen you are holding.

**The pinned footer.** The launch screen's progress bar sits outside the centred column, absolutely pinned to the bottom of the field (`3.5rem` from it, `4rem` at `sm`) and capped at `22.5rem`. This keeps the mark optically centred rather than pushed up by content beneath it.

### Named Rules

**The 26rem Rule.** Pre-auth content never exceeds `26rem`. A wider column would let the sign-in card compete with the mark for the centre of the field.

**The Optical Box Rule.** The tri-bunny mark's artwork occupies only the middle 43.8% × 35.2% of its 2500px square; the rest is same-colored padding. `BrandField` cancels that bleed with negative margins so ordinary spacing utilities measure from the visible bunnies. Never place the raw image and then hand-tune the gap beneath it — spacing lands roughly 120px low.

## Elevation & Depth

The system is flat. Depth is tonal: a card is a 4% white wash with a 20% white hairline on the indigo field, and that is the entire elevation vocabulary for every surface except one.

The exception is the session-timeout dialog, which is the only true overlay in the build. It carries `shadow-xl` (`0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`) over a `text`-at-65% backdrop scrim. It is also the only element that interrupts the user, so the shadow is doing semantic work: it marks the one thing in the system that sits above everything else.

### Named Rules

**The One Shadow Rule.** There is exactly one shadow in this design system, and it belongs to the modal dialog. Any new surface that wants a shadow should be asked whether it is really a modal. If it is not, it gets a hairline border and a tonal fill instead.

## Shapes

The form language is pills and soft rectangles, with a strict split: **anything interactive is fully round; anything that contains is softly rounded.**

- **Pill** (`9999px`): buttons, text inputs, the handheld authenticator link, the progress bar and its track.
- **Card** (`1.5rem`): the auth card on the indigo field — the largest radius in the system, and reserved for the primary content container.
- **Dialog** (`1rem`): the session-timeout dialog.
- **Note** (`0.75rem`): inline notices, the error plate, and the white plate behind the QR code.

Borders are always hairlines (1px) and always low-contrast: `white/20` on a card, `white/45` on an input rule, `white/25` on a neutral notice, `border` on light surfaces, `error/35` on an error plate. There are no heavy rules, no dividers with weight, and no square corners anywhere except the full-bleed field itself.

### Named Rules

**The Pill Rule.** If a user can click, type in, or watch it fill, it is fully round. A square-cornered button or input is out of system, no matter what it does.

**The No Nested Card Rule.** A bordered panel inside a card reads as a second card and flattens the hierarchy the card just established. Content that needs distinction inside a card gets a top rule and spacing, or sits directly on the card surface — as the TOTP setup key does.

## Components

### Buttons

- **Shape:** fully round (`9999px`), `0.75rem 1.5rem` padding.
- **Primary (on the indigo field):** `primary` fill, white text — 7.8:1. Hover drops the fill to 85% opacity. It uses the lighter indigo, not `primary-dark`, precisely because the field behind it is `primary-dark`.
- **Primary (on light surfaces):** same fill and radius, but hover deepens to `primary-dark` instead of thinning, since there is no dark field to blend into.
- **Quiet:** no fill, no padding beyond `0.25rem` vertical — 0.875rem text at white/70, underlined with `0.25rem` offset, resolving to full white on hover.
- **Focus:** a 2px ring at white/60 with a 2px offset in the field color. Never suppressed.
- **Disabled:** 55% opacity, `not-allowed` cursor, hover suppressed. Submit buttons carry their own progress copy ("Signing in…") rather than a spinner.

### Inputs / Fields

- **Style:** pill, transparent fill, 1px white/45 rule, `0.75rem 1.25rem` padding, white text, white/60 placeholder. The label sits above at 0.875rem white/85 with `0.5rem` between them.
- **Hover:** the rule lifts to white/70.
- **Focus:** the rule goes to solid white and a 2px white/40 ring appears. Two signals, because a border shift alone is easy to miss on this field.
- **Disabled:** 55% opacity.
- **Error:** field-level error styling does not exist. Failures surface as a note above the form (see Notes), and the offending value is cleared. This is deliberate: the auth screens fail as a unit, and per-field error styling would imply which half was wrong.

### Cards / Containers

- **Corner Style:** `1.5rem`.
- **Background:** white at 4% on the indigo field.
- **Border:** 1px white/20.
- **Shadow Strategy:** none. See Elevation & Depth.
- **Internal Padding:** `1.75rem`, opening to `2.25rem` at `sm`.
- **Width:** capped at `26rem`.

### Notes

Two registers, and choosing between them is a design decision, not a styling one:

- **Neutral notice** (`0.75rem` radius, white/6 fill, white/25 border, white/80 text): expected, non-failure information — "You were signed out after 5 minutes of inactivity."
- **Error note** (`0.75rem` radius, `background` plate, `error/35` border, `error` text, `role="alert"`): genuine failure only. It is a light plate on a dark field by necessity, per the Light Plate Rule.

An inactivity sign-out never renders as an error, and the two never appear at once.

### Dialog

- **Style:** native `<dialog>` at `1rem` radius on `background`, `1.75rem` padding, 1px `border` edge, `shadow-xl`, over a `text`/65 backdrop.
- **Behavior:** `showModal()` supplies the focus trap and inert background; `Escape` is suppressed so the only exit is the explicit "Stay signed in" button. The countdown runs in `attention` amber with `tabular-nums`, and announces to screen readers every 15 seconds rather than every tick.

### Disclosure

Used once, for "Can't scan? Enter this code manually". A native `<details>` with the marker removed, its summary at 0.875rem white/70, separated by a top hairline (`white/20`) and `1.25rem` of space. It resolves to full white on hover and on focus.

### BrandField (signature component)

The identity of the pre-auth sequence, and the reason it holds together. A full-viewport `primary-dark` field with the tri-bunny mark centred, offered in two sizes (full, and a `compact` variant for screens that also carry a form), with an optional slot for content beneath the mark and an optional pinned footer.

Four screens render it — launch, MFA, authenticating, welcome — and they differ **only in the text they pass in**. The mark's position is guaranteed identical because it is one component, so moving between screens reads as copy changing rather than a page loading. There is no motion in it anywhere.

### Progress bar

A 2px pill, capped at `22.5rem`, white/20 track with a solid white fill, pinned to the bottom of the launch field with the correct `role="progressbar"` and live `aria-valuenow`. It tracks real work — font loading, the mark's bitmap decode, and session restoration — against an elapsed-time floor, not a fake timer. Under `prefers-reduced-motion` it still fills, because it is an indicator rather than decoration; it just stops easing between values.

## Do's and Don'ts

### Do:
- **Do** use the full approved 8-color palette (`primary`, `primary-dark`, `background`, `text`, `border`, `complete`, `attention`, `error`) on every screen, including Onboarding Mode and Management Mode.
- **Do** reference Tailwind theme tokens (`bg-primary-dark`, `text-attention`, `border-border`) in component code. They are wired in `src/index.css` via `@theme`, and `DESIGN.md` is the canonical source those values come from.
- **Do** use `brand/logos/tri-bunny-white-transparent.png` on dark surfaces, and `brand/logos/tri-bunny-logo-onyx-digital.png` (full color) on light surfaces. **Exception:** the launch, MFA, authenticating, and welcome screens use the full-color `tri-bunny-logo-onyx-digital.png` on their dark field, because that file's baked-in background is exactly `#1818ac` (`primary-dark`) and composites seamlessly with no visible edge at any size. The white/transparent variant remains the default rule for every other dark surface.
- **Do** use `brand/logos/onyx-digital-text-logo-with-bunnies-transparent.png` for wordmark + mark lockups, and `brand/logos/onyx-digital-logo-banner.png` for wide banner placements.
- **Do** use "Shree Devanagari 714" at weight 400 across the entire build, per the One Weight Rule.
- **Do** keep status colors muted (amber for attention, muted red for error) per the No-Alarm Rule — never substitute a harsher red or urgent styling.
- **Do** give every interactive element a `focus-visible` ring with a 2px offset whose offset color matches the surface behind it (`primary-dark` on the field, `background` on light surfaces).
- **Do** hold the same surface across a transition rather than flashing white — a screen that is still resolving renders `BrandField` with no content.
- **Do** honor `prefers-reduced-motion` by removing easing, not by removing information.

### Don't:
- **Don't** invent additional palette colors beyond the approved set without confirming with the user.
- **Don't** use font weight to create hierarchy. Use size, opacity, and space.
- **Don't** drop white below 60% for text or 45% for a control boundary on `primary-dark` — those are contrast floors, not preferences (the Opacity Floor Rule).
- **Don't** render `error` as text directly on `primary-dark`; it only reaches ~2.4:1. Use the light plate.
- **Don't** add a shadow to anything that is not a modal (the One Shadow Rule).
- **Don't** put a bordered panel inside a card (the No Nested Card Rule).
- **Don't** apply `tracking-brand` to user data such as a company name.
- **Don't** recolor, recompose, stretch, or distort the logo lockups in `brand/logos/`, or lay the mark out without cancelling its optical bleed (the Optical Box Rule).
- **Don't** use `brand/ui-reference/` images as literal specs to clone — they're direction/craft references only, reconciled with the Clarity-First tone.
- **Don't** add motion, video, or animated bunnies to the launch/login sequence. It is fully static by decision, and a motion designer will be engaged separately in a later phase.

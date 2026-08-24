# Onyx Digital — Client Portal

## What this is
A cyber-compliance and insurance-readiness client portal for Onyx Digital Security LLC, a boutique MSSP/managed compliance provider in Greater Boston. NOT a generic project tracker — it exists specifically to track a client's path to cyber-insurance readiness and regulatory compliance.

## Users
- Clients: regulated firms — RIA/wealth advisory, CPA/tax accounting (current verticals), medical practices (future). They log in to see their compliance status.
- Onyx staff (the founder + one technician): manage/update client status. Staff do NOT use this portal's UI for their own work — they update data via the Supabase dashboard directly or through n8n automations.

## Tone & design philosophy — "Clarity-First" (internal name only, never expose this term to end users or in the UI)
Calm, plain-language, competent without being loud. The deliberate opposite of typical cybersecurity vendor design (fear-based, red dashboards, jargon-heavy). Every screen should reduce cognitive load, not add to it.

## Brand assets — use these everywhere, do not invent alternatives
Canonical brand assets live in `brand/` at the project root (logos, font, color palette, UI/UX references). See `brand/README.md` and `DESIGN.md` (the impeccable-owned design system file) for the full inventory. Key facts:
- Full approved color palette (applies to every screen, including Onboarding Mode and Management Mode): `primary` `#3f3fc1`, `primary-dark` `#1818ac`, `background` `#FAFAFC`, `text` `#1E1B3A`, `border` `#E2E1F0`, `complete` `#2F9E6E`, `attention` `#C68A2E` (amber, not red — not an alarm state), `error` `#B84C4C` (muted, real errors only). See `DESIGN.md` for the canonical, structured version.
- `brand/fonts/Shree714.ttc` ("Shree Devanagari 714") is confirmed and approved as the typeface across the entire build — checked and renders standard Latin/English lettering correctly. No substitution needed.
- Logo lockups: `brand/logos/` (use the white/transparent variant on dark surfaces, full-color/wordmark variants elsewhere).
- `brand/ui-reference/landing-page-reference.png` and `brand/ui-reference/web-form-reference.png` are direction/craft references, not literal specs — reconcile with Clarity-First tone above.
- Once the app is scaffolded, these tokens must be wired into Tailwind's theme colors so components reference `bg-primary`, `text-attention`, etc. — never hardcoded hex values.

## Two modes — this is the core structure of the app
1. Onboarding Mode — shown before a client is fully onboarded. Only a milestone tracker is visible; everything else stays greyed out/locked, unlocking section by section as onboarding_stage advances.
2. Management Mode — shown once onboarding is complete. Contains: Insurance Readiness Tracker (25/50/75/100%), Compliance Posture Indicator (e.g. "72% SEC compliant" + open items list if under 100%), a document library, and an evidence vault that generates a password-protected, expiring link for auditors/insurers.

## Stack
- Frontend: Vite + React + TypeScript + Tailwind CSS
- Backend: Supabase (Postgres database, Auth, Storage)
- Automation glue: n8n — syncs data between GoHighLevel (Onyx's separate CRM) and Supabase. Not built yet.
- Hosting: Netlify, auto-deploys from the GitHub main branch
- Source control: GitHub, OnyxdigitalAdmin/onyx-client-portal (private)
- Design skill: Impeccable (installed) — use /impeccable commands for UI polish
- Code-minimalism skill: Ponytail (installed, https://github.com/DietrichGebert/ponytail) — pushes toward the leanest working solution (YAGNI → stdlib → native → existing dep → one-liner) to cut token/build bloat. **Active by default at `full` intensity**, enforced by the `SessionStart` hook in `.claude/settings.json`, which injects `.claude/skills/ponytail/SKILL.md` into context at the start of every session. This is the real mechanism: the upstream `PONYTAIL_DEFAULT_MODE` env var and `~/.config/ponytail/config.json` documented in `ponytail-help` belong to the plugin distribution, which ships a runtime to read them — this repo vendored the bare skill files, so nothing here would ever read either one. Change the standing level by editing the hook's `SKILL.md` path or the injected preamble; change it for one session with `/ponytail [lite|full|ultra]`, and turn it off for one session with "stop ponytail" or "normal mode". Companion one-shot commands: `/ponytail-review` (diff-only over-engineering review), `/ponytail-audit` (whole-repo bloat scan), `/ponytail-debt` (lists deliberate `ponytail:` shortcut comments), `/ponytail-help`, `/ponytail-gain`.
- Motion/video: Hyperframes and the bunny hop animation are DEFERRED / ON HOLD — not in current scope. A motion graphics designer will be engaged separately for this in a future phase. The Hyperframes skill stays installed in case it is useful once real assets exist later. Do not build video or motion work in this project in the meantime.

## Shipping — confirm the push landed before calling anything done
Netlify auto-deploys from GitHub `main`, so **local commits change nothing that anyone can see.** A commit that was never pushed means the live site keeps serving stale code while the repo looks correct — this project has hit that exact bug twice, most recently a font fix that sat unpushed while every client-facing 400-weight role silently fell back to the Bold face in production.

At the end of any session where changes were committed, verifying the gap is closed is a **required last step, not an optional courtesy**:

```
git fetch origin
git rev-parse HEAD origin/main     # the two hashes must be identical
git log --oneline origin/main..HEAD # must print nothing
```

- Do this even when the session's own commits were pushed — earlier unpushed commits from a previous session can still be sitting in front of them, which is precisely how this happened.
- Never report work as complete, shipped, live, or deployed on the strength of a commit alone. "Committed" and "deployed" are different claims; only make the second one after the hashes match.
- If they don't match, say so plainly and push (this repo commits straight to `main` — no branches, no PRs), or state clearly that the work is committed but NOT live.

## Launch/login sequence — fully static
The launch/login sequence is now fully static. No video, and no animated bunnies anywhere in the current build.
- Mark: `brand/logos/tri-bunny-logo-onyx-digital.png` — the bunnies-only mark, no wordmark — used as a plain static image.
- Field: solid `#1818ac` (`primary-dark`) background behind it.
- The same mark on the same background is reused across three screens: the launch/loading screen, the "Authenticating..." screen, and the "Welcome aboard" screen. They differ only in the text shown — never in motion.

## Database schema (already built and RLS-tested in Supabase — do not recreate)
- clients — one row per client company. Key fields: vertical (RIA/CPA/Medical), package (Assess/Management/Leadership — Assess only ever reaches stage 3), onboarding_stage (1-6), questionnaire_due_date (a plain `date`, not a timestamp), questionnaire_submitted_at, questionnaire_approved_at, ghl_contact_id. **compliance_score and insurance_readiness_pct no longer exist** — both percentages are computed live from compliance_open_items, never read from a column.
- client_users — links a Supabase auth.users row to a client_id. This is what Row-Level Security checks against.
- documents — one row per document. There is no title column: `doc_type` IS the display name, and Onboarding Mode groups the types into its four library sections. status is pending_signature or current; pending rows carry signed_count / signatures_required. last_updated is a timestamptz.
- compliance_open_items — open tasks driving the two trackers. category is insurance or compliance; status is open/in_progress/complete.
- All four tables have Row-Level Security ON, restricting each client user to rows linked to their own client_id. This isolation has been manually tested and confirmed working.
- stage_events — one row per completed stage: `stage` (integer) and `completed_at` (timestamptz). Drives the completion dates in the milestone tracker. A client can legitimately have zero rows.
- Two more tables (evidence vault links, activity log) are planned for Phase 3, not yet built.

## Auth
- Password + required TOTP authenticator app MFA (free, native Supabase feature). Do not implement SMS/phone MFA — evaluated and rejected: costs $75/mo extra and is less secure against SIM-swap attacks than TOTP.
- Session timeout: 5 minutes idle, then a 90-second countdown warning, then auto logout.
- Account creation: Onyx staff provisions client accounts at kickoff. No public self-serve signup, ever.

## Environments
Building Phases 1-3 in a single Supabase project — no real client data exists yet, so no isolation risk. A second, clean production Supabase project gets created right before Phase 4 go-live. Do not build a second environment before then unless explicitly asked.

## Current status
Phase 0 (backend/environment setup): COMPLETE. Phase 1 (static launch page + login sequence): COMPLETE — the full sequence is built and polished: launch screen with a real loading bar, login form, TOTP verify + first-time enrollment, "Authenticating…", "Welcome aboard," and the idle-session timeout, plus placeholder pages for both modes. The earlier Hyperframes intro animation has been removed from the build entirely (video, poster, player component and the `videos/onyx-brand-intro/` project are all gone) — see "Launch/login sequence — fully static" above for what replaces it. Phase 2 is PART DONE: **Onboarding Mode is built** (`src/routes/Onboarding.tsx`) — header, questionnaire card, six-stage milestone tracker, live progress indicator and the four-section document library, reading real data from `clients`, `documents`, `compliance_open_items` and `stage_events`. It is UI-only: no writes, automations or integrations. Management Mode is still the placeholder. Do not build ahead of the current phase without being asked.

### Phase 1 implementation notes
- Routing is `react-router-dom`. `src/routes/` holds the screens, `src/components/` the shared UI, `src/hooks/` the idle timeout and handheld detection, `src/lib/` the Supabase/MFA/client-context helpers.
- `PortalLayout` guards everything after sign-in: it checks the session, resolves the company once via `client_users` → `clients`, and runs the idle timeout. Screens beneath it read the company with `usePortal()`.
- Real column names (confirmed against the live database): `clients.company_name`, `clients.onboarding_stage`, `client_users.auth_user_id`, `client_users.client_id`.
- The typeface ships as `public/fonts/ShreeDevanagari714-{Regular,Bold}.woff2`, extracted from `brand/fonts/Shree714.ttc` — browsers cannot load a `.ttc` collection via `@font-face`. Re-extract with `scripts/extract-brand-fonts.py`, never by copying the source tables verbatim: Apple ships this collection with a malformed `cmap` (rangeShift 55 where the spec says 20) and a `gasp` table missing its 0xFFFF sentinel, which CoreText tolerates but OTS — the validator Chrome and Firefox run on every downloaded font — rejects with "Failed to decode downloaded font". The filenames are correct despite reading as Devanagari: all four faces in the collection are dual-script Latin+Devanagari, and faces 0 and 1 are the Regular and Bold we ship. There is no Latin-only face. Validate any regenerated file with `ots-sanitize` (pip `opentype-sanitizer`), not a glyph count — a glyph count passes fonts the browser refuses to load.
- `BrandField` compensates for the mark's padding: the bunnies occupy only the middle 43.8% × 35.2% of the PNG, so the raw image box overshoots what you can see by ~120px. Spacing utilities beneath it would otherwise be badly wrong.
- `public/_redirects` gives Netlify the SPA rewrite, without which a refresh on `/login` 404s.
- Password reset is deliberately absent: accounts are staff-provisioned, so a locked-out client contacts Onyx.

### Phase 2 implementation notes — Onboarding Mode
- `src/lib/onboarding.ts` holds every derivation (stage states, questionnaire state, live percentages, document grouping) and deliberately has **no runtime imports**, so `npm test` exercises it under plain Node with no browser or database. `src/lib/onboarding.test.ts` covers the five seed clients as cases. Tests are typechecked by `tsconfig.node.json`, not the app config.
- `src/routes/Onboarding.tsx` is the screen: the default export loads data, `OnboardingView` renders it from already-resolved props.
- **`questionnaire_due_date` is a plain `date`, not a timestamp.** Never put it through `new Date()` — that reads it as UTC midnight and renders the day before in Boston. `formatDateOnly` builds it from its parts, and `isPastDue` compares local calendar days.
- The document library's Reports section is the **remainder** bucket, not a fixed list of three types: anything whose `doc_type` the Assessment/Governance/Evidence sections don't name surfaces there, so a new or renamed type is never silently dropped.
- Empty-state precedence: a client with zero documents gets the single calm line, which wins over the Assess "Included with Management" tiles.
- Percentages are always computed from `compliance_open_items`; there is no stored column to read, and Onboarding Mode never uses regulator-compliance phrasing ("X% SEC compliant") — that is Management Mode's language.
- `/questionnaire` and `/reports` are intentional dead links; those flows are not built.

## Hard constraints — do not assume otherwise
- The document library IS core in-scope functionality, not optional.
- Billing/invoicing is NOT in scope for this app.
- This is not a generic dashboard template — every design and UX decision should reflect the compliance/insurance-readiness purpose above.

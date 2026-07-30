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
- Motion/video: Hyperframes and the bunny hop animation are DEFERRED / ON HOLD — not in current scope. A motion graphics designer will be engaged separately for this in a future phase. The Hyperframes skill stays installed in case it is useful once real assets exist later. Do not build video or motion work in this project in the meantime.

## Launch/login sequence — fully static
The launch/login sequence is now fully static. No video, and no animated bunnies anywhere in the current build.
- Mark: `brand/logos/tri-bunny-logo-onyx-digital.png` — the bunnies-only mark, no wordmark — used as a plain static image.
- Field: solid `#1818ac` (`primary-dark`) background behind it.
- The same mark on the same background is reused across three screens: the launch/loading screen, the "Authenticating..." screen, and the "Welcome aboard" screen. They differ only in the text shown — never in motion.

## Database schema (already built and RLS-tested in Supabase — do not recreate)
- clients — one row per client company. Key fields: vertical (RIA/CPA/Medical), onboarding_stage (1-6), compliance_score, insurance_readiness_pct, ghl_contact_id.
- client_users — links a Supabase auth.users row to a client_id. This is what Row-Level Security checks against.
- documents — one row per document. doc_type is one of: WISP, IR Plan, Assessment, Security Controls Evidence, Monthly Report, Vuln Scan. status is pending_signature or current.
- compliance_open_items — open tasks driving the two trackers. category is insurance or compliance; status is open/in_progress/complete.
- All four tables have Row-Level Security ON, restricting each client user to rows linked to their own client_id. This isolation has been manually tested and confirmed working.
- Two more tables (evidence vault links, activity log) are planned for Phase 3, not yet built.

## Auth
- Password + required TOTP authenticator app MFA (free, native Supabase feature). Do not implement SMS/phone MFA — evaluated and rejected: costs $75/mo extra and is less secure against SIM-swap attacks than TOTP.
- Session timeout: 5 minutes idle, then a 90-second countdown warning, then auto logout.
- Account creation: Onyx staff provisions client accounts at kickoff. No public self-serve signup, ever.

## Environments
Building Phases 1-3 in a single Supabase project — no real client data exists yet, so no isolation risk. A second, clean production Supabase project gets created right before Phase 4 go-live. Do not build a second environment before then unless explicitly asked.

## Current status
Phase 0 (backend/environment setup): COMPLETE. Phase 1 (static launch page + login sequence): COMPLETE — the full sequence is built and polished: launch screen with a real loading bar, login form, TOTP verify + first-time enrollment, "Authenticating…", "Welcome aboard," and the idle-session timeout, plus placeholder pages for both modes. The earlier Hyperframes intro animation has been removed from the build entirely (video, poster, player component and the `videos/onyx-brand-intro/` project are all gone) — see "Launch/login sequence — fully static" above for what replaces it. Phase 2 (the real Onboarding Mode and Management Mode screens) is NOT started. Do not build ahead of the current phase without being asked.

### Phase 1 implementation notes
- Routing is `react-router-dom`. `src/routes/` holds the screens, `src/components/` the shared UI, `src/hooks/` the idle timeout and handheld detection, `src/lib/` the Supabase/MFA/client-context helpers.
- `PortalLayout` guards everything after sign-in: it checks the session, resolves the company once via `client_users` → `clients`, and runs the idle timeout. Screens beneath it read the company with `usePortal()`.
- Real column names (confirmed against the live database): `clients.company_name`, `clients.onboarding_stage`, `client_users.auth_user_id`, `client_users.client_id`.
- The typeface ships as `public/fonts/ShreeDevanagari714-{Regular,Bold}.woff2`, extracted from `brand/fonts/Shree714.ttc` — browsers cannot load a `.ttc` collection via `@font-face`. Re-extract with fontTools if the source font ever changes.
- `BrandField` compensates for the mark's padding: the bunnies occupy only the middle 43.8% × 35.2% of the PNG, so the raw image box overshoots what you can see by ~120px. Spacing utilities beneath it would otherwise be badly wrong.
- `public/_redirects` gives Netlify the SPA rewrite, without which a refresh on `/login` 404s.
- Password reset is deliberately absent: accounts are staff-provisioned, so a locked-out client contacts Onyx.

## Hard constraints — do not assume otherwise
- The document library IS core in-scope functionality, not optional.
- Billing/invoicing is NOT in scope for this app.
- This is not a generic dashboard template — every design and UX decision should reflect the compliance/insurance-readiness purpose above.

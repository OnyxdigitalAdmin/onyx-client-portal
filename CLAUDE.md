# Onyx Digital — Client Portal

## What this is
A cyber-compliance and insurance-readiness client portal for Onyx Digital Security LLC, a boutique MSSP/managed compliance provider in Greater Boston. NOT a generic project tracker — it exists specifically to track a client's path to cyber-insurance readiness and regulatory compliance.

## Users
- Clients: regulated firms — RIA/wealth advisory, CPA/tax accounting (current verticals), medical practices (future). They log in to see their compliance status.
- Onyx staff (the founder + one technician): manage/update client status. Staff do NOT use this portal's UI for their own work — they update data via the Supabase dashboard directly or through n8n automations.

## Tone & design philosophy — "Clarity-First" (internal name only, never expose this term to end users or in the UI)
Calm, plain-language, competent without being loud. The deliberate opposite of typical cybersecurity vendor design (fear-based, red dashboards, jargon-heavy). Every screen should reduce cognitive load, not add to it.

## Brand assets — use these everywhere, do not invent alternatives
Canonical brand assets live in `brand/` at the project root (logos, font, color palette, UI/UX references). See `brand/README.md` for the full inventory. Key facts:
- Core brand colors: `#3f3fc1` (lighter indigo/periwinkle) and `#1818ac` (darker indigo/blue), sampled from `brand/color-palette/color-palette.png`. Do not invent additional palette colors (backgrounds, grays, semantic colors) without confirming with the user.
- Brand typeface: `brand/fonts/Shree714.ttc`.
- Logo lockups: `brand/logos/` (use the white/transparent variant on dark surfaces, full-color/wordmark variants elsewhere).
- `brand/ui-reference/landing-page-reference.png` and `brand/ui-reference/web-form-reference.png` are direction/craft references, not literal specs — reconcile with Clarity-First tone above.

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
- Motion/video: Hyperframes — ONLY for the Phase 1 pre-rendered launch/intro animation. It renders video, not interactive UI. Never use it for Mode 1 or Mode 2 screens.

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
Phase 0 (backend/environment setup): COMPLETE. Phase 1 (animated launch page + login sequence): IN PROGRESS — app scaffolded, login screen not yet built. Do not build ahead of the current phase without being asked.

## Hard constraints — do not assume otherwise
- The document library IS core in-scope functionality, not optional.
- Billing/invoicing is NOT in scope for this app.
- This is not a generic dashboard template — every design and UX decision should reflect the compliance/insurance-readiness purpose above.

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript + Tailwind CSS. Supabase for auth, database, and storage. Deployed on Netlify. GitHub is the source of truth.

## Users

Two audiences share the portal with different roles/permissions:
- **Clients**: regulated financial and medical services firms — RIA/wealth advisory, CPA/tax accounting, and eventually medical practices — who log in to track their cyber compliance and cyber-insurance-readiness status.
- **Internal Onyx staff**, who manage and update that status on clients' behalf.

## Product Purpose

A cyber compliance and cyber-insurance-readiness portal — not a generic project tracker. It gives regulated firms a clear, ongoing picture of where they stand on compliance and insurability, and gives Onyx staff a way to manage that status for each client.

Two modes:
- **Onboarding Mode**: a milestone tracker, with sections locked/unlocked as the client progresses.
- **Management Mode**: an Insurance Readiness tracker at 25/50/75/100%; a Compliance Posture indicator (e.g. "72% SEC compliant") with open items listed; a document library for WISP, IR Plan, Assessment, Security Controls Evidence, and Monthly Reports; and a password-protected evidence link generator for auditors/insurers.

Document/file exchange (the document library) is core in-scope functionality, not optional.

## Positioning

Onyx Digital's "Clarity-First" philosophy: calm, plain-language, competent without being loud. The explicit opposite of typical fear-based, red-dashboard, jargon-heavy cybersecurity vendor design. Security-forward, never alarming — a neighboring cybersecurity vendor could not truthfully copy this calm posture while keeping their category's fear-based conventions.

## Operating Context

- Clients are regulated financial and medical services firms (RIA/wealth advisory, CPA/tax accounting, eventually medical practices) — an audience for whom compliance status and audit-readiness are recurring, high-stakes concerns.
- Evidence generated in the portal (document library contents, evidence links) is consumed by third parties: auditors and insurers.
- Client progress moves through two distinct phases (onboarding, then ongoing management), each with a different primary view.

## Capabilities and Constraints

- Onboarding Mode: milestone tracker with progressive section locking/unlocking.
- Management Mode: Insurance Readiness tracker (25/50/75/100%), Compliance Posture indicator with percentage and listed open items, document library (WISP, IR Plan, Assessment, Security Controls Evidence, Monthly Reports), password-protected evidence link generator for external auditors/insurers.
- Auth: password + required TOTP authenticator app MFA.
- Session: 5-minute idle timeout, with a 90-second countdown warning before logout.
- Role-based access distinguishes client users from internal Onyx staff.

## Brand Commitments

"Clarity-First" identity: calm, plain-language, competent tone. Explicitly rejects fear-based/red-dashboard/jargon-heavy cybersecurity design conventions.

## Evidence on Hand

None yet. No existing code, visual assets, or content were found in the repository at time of writing.

## Product Principles

- Clarity over alarm: status and risk are communicated calmly and in plain language, never through fear-based cues.
- Security-forward, never alarming: security posture is visible and taken seriously without red/urgent styling as the default register.
- Progress is legible: onboarding and readiness/compliance status are always presented as clear, current state (percentages, open items, locked/unlocked sections) rather than buried in narrative.
- Evidence is trustworthy by design: anything shared externally (document library, evidence links) must read as credible to auditors and insurers, not just to the client.
- Two audiences, one system: the same data serves clients tracking their own status and staff managing it on their behalf, without duplicating the underlying model.

## Accessibility & Inclusion

[No product-specific requirement established yet.]

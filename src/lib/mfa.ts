import { supabase } from './supabaseClient'

/**
 * TOTP is the only supported second factor. SMS/phone MFA was evaluated and
 * rejected (cost, and SIM-swap exposure) — see CLAUDE.md.
 */
export type MfaSetup =
  /** A verified authenticator already exists: just ask for a code. */
  | { kind: 'verify'; factorId: string }
  /** First login ever: the user has to add the portal to an authenticator. */
  | { kind: 'enroll'; factorId: string; qrSvg: string; secret: string; uri: string }

const FRIENDLY_NAME = 'Onyx Client Portal'

/** True once the session has cleared the second factor. */
export async function hasSatisfiedMfa(): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || !data) return false
  return data.currentLevel === 'aal2'
}

/**
 * Works out whether this user is verifying an existing authenticator or
 * enrolling a new one, and returns everything the screen needs to render.
 */
export async function prepareMfa(): Promise<MfaSetup> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error

  const verified = data.totp.find((factor) => factor.status === 'verified')
  if (verified) return { kind: 'verify', factorId: verified.id }

  // Clear out factors left behind by an abandoned enrollment. The one-time
  // secret from those is long gone, so they can't be resumed — and leaving
  // them in place makes enroll() collide on the friendly name.
  for (const factor of data.all) {
    if (factor.status === 'unverified') {
      await supabase.auth.mfa.unenroll({ factorId: factor.id })
    }
  }

  const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: FRIENDLY_NAME,
    issuer: 'Onyx Digital',
  })
  if (enrollError) throw enrollError

  return {
    kind: 'enroll',
    factorId: enrolled.id,
    qrSvg: enrolled.totp.qr_code,
    secret: enrolled.totp.secret,
    uri: enrolled.totp.uri,
  }
}

/**
 * Verifies a 6-digit code. Succeeding here also confirms a freshly enrolled
 * factor, which is why enrollment needs no separate completion step.
 */
export async function verifyMfaCode(factorId: string, code: string): Promise<void> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
  if (error) throw error
}

/** Groups the manual setup key into 4-character blocks so it can be typed. */
export function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim()
}

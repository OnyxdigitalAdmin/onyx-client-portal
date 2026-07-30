import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthenticatingScreen } from '../components/AuthenticatingScreen'
import { BrandField } from '../components/BrandField'
import { Button } from '../components/Button'
import { ErrorNote } from '../components/ErrorNote'
import { Field } from '../components/Field'
import { useIsHandheld } from '../hooks/useIsHandheld'
import type { MfaSetup } from '../lib/mfa'
import { formatSecret, hasSatisfiedMfa, prepareMfa, verifyMfaCode } from '../lib/mfa'
import { supabase } from '../lib/supabaseClient'

const CODE_LENGTH = 6

type Phase = 'preparing' | 'ready' | 'verifying'

/**
 * The second factor, shown only once a password has succeeded.
 *
 * Enrolment and verification share this screen because they end the same way:
 * a correct 6-digit code. Supabase treats verifying a freshly enrolled factor
 * as confirming it, so a first-time user needs no extra step to finish.
 */
export default function Mfa() {
  const navigate = useNavigate()
  const handheld = useIsHandheld()

  const [phase, setPhase] = useState<Phase>('preparing')
  const [setup, setSetup] = useState<MfaSetup | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function prepare() {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return

      if (!data.session) {
        navigate('/login', { replace: true })
        return
      }

      // A session that already cleared MFA (a returning browser) skips
      // straight through rather than being asked for a second code.
      if (await hasSatisfiedMfa()) {
        if (!cancelled) navigate('/welcome', { replace: true })
        return
      }

      try {
        const prepared = await prepareMfa()
        if (cancelled) return
        setSetup(prepared)
        setPhase('ready')
      } catch {
        if (cancelled) return
        setBlocked('We couldn’t start two-factor authentication. Please try signing in again.')
        setPhase('ready')
      }
    }

    void prepare()
    return () => {
      cancelled = true
    }
  }, [navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!setup || phase === 'verifying' || code.length !== CODE_LENGTH) return

    setPhase('verifying')
    setError(null)

    try {
      await verifyMfaCode(setup.factorId, code)
      navigate('/welcome', { replace: true })
    } catch {
      setError(
        setup.kind === 'enroll'
          ? 'That code didn’t match. Check your authenticator app and enter the current code.'
          : 'That code isn’t right. Codes change every 30 seconds — enter the current one.',
      )
      setCode('')
      setPhase('ready')
    }
  }

  const copySecret = useCallback(async () => {
    if (!setup || setup.kind !== 'enroll') return
    try {
      await navigator.clipboard.writeText(setup.secret)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused; the key is on screen to type anyway.
    }
  }, [setup])

  if (phase === 'verifying') return <AuthenticatingScreen />
  // Compact, matching the card screen that follows, so the mark doesn't
  // visibly resize the moment the factors come back.
  if (phase === 'preparing') return <BrandField compact />

  if (blocked) {
    return (
      <BrandField compact>
        <div className="mt-10 w-full max-w-[26rem]">
          <ErrorNote>{blocked}</ErrorNote>
          <Button
            type="button"
            className="mt-6 w-full"
            onClick={() => {
              void supabase.auth.signOut().then(() => navigate('/login', { replace: true }))
            }}
          >
            Back to sign in
          </Button>
        </div>
      </BrandField>
    )
  }

  const enrolling = setup?.kind === 'enroll'

  return (
    <BrandField compact>
      <div className="mt-10 w-full max-w-[26rem]">
        <div className="rounded-3xl border border-white/20 bg-white/[0.04] p-7 sm:p-9">
          <h1 className="text-2xl tracking-brand text-white">
            {enrolling ? 'Set up your authenticator' : 'Verification code'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            {enrolling
              ? 'Onyx requires an authenticator app on every account. Add the portal to yours, then enter the code it shows.'
              : 'Enter the 6-digit code from your authenticator app.'}
          </p>

          {setup?.kind === 'enroll' ? (
            <EnrollmentAid
              setup={setup}
              handheld={handheld}
              copied={copied}
              onCopy={copySecret}
            />
          ) : null}

          {error ? (
            <div className="mt-6">
              <ErrorNote>{error}</ErrorNote>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
            <CodeInput value={code} onChange={setCode} />
            <Button type="submit" disabled={code.length !== CODE_LENGTH} className="w-full">
              {enrolling ? 'Confirm and continue' : 'Verify'}
            </Button>
          </form>
        </div>
      </div>
    </BrandField>
  )
}

function CodeInput({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <Field
      label="6-digit code"
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={CODE_LENGTH}
      autoFocus
      required
      placeholder="000000"
      className="text-center text-2xl tracking-[0.4em] placeholder:tracking-[0.4em]"
    />
  )
}

type EnrollmentAidProps = {
  setup: Extract<MfaSetup, { kind: 'enroll' }>
  handheld: boolean
  copied: boolean
  onCopy: () => void
}

/**
 * How the user gets the secret into their authenticator.
 *
 * On a handheld there is no point rendering a QR code — you can't scan a
 * screen with the device displaying it — so it offers the otpauth:// link,
 * which hands off to the authenticator app in one tap. The manual key is
 * available on every device as the fallback for both paths.
 */
function EnrollmentAid({ setup, handheld, copied, onCopy }: EnrollmentAidProps) {
  return (
    <div className="mt-7">
      {handheld ? (
        <a
          href={setup.uri}
          className={[
            'flex w-full items-center justify-center rounded-full bg-primary px-6 py-3',
            'text-white transition-colors outline-none hover:bg-primary/85',
            'focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2',
            'focus-visible:ring-offset-primary-dark',
          ].join(' ')}
        >
          Open in authenticator app
        </a>
      ) : (
        <div className="flex justify-center">
          <img
            src={setup.qrSvg}
            alt="QR code for adding the Onyx client portal to your authenticator app"
            width={176}
            height={176}
            className="size-44 rounded-xl bg-white p-3"
          />
        </div>
      )}

      <details className="mt-6 border-t border-white/20 pt-5">
        <summary
          className={[
            'cursor-pointer list-none text-sm text-white/70 transition-colors',
            'hover:text-white focus-visible:text-white focus-visible:outline-none',
          ].join(' ')}
        >
          Can’t scan? Enter this code manually
        </summary>

        <div className="mt-4">
          {/* Set on the card surface rather than in a box of its own — a
              bordered panel inside a card is a nested card. Grouping the key
              in fours is what makes it transcribable. */}
          <p
            className="text-sm leading-relaxed tracking-[0.16em] text-white select-all"
            aria-label={`Setup key: ${setup.secret.split('').join(' ')}`}
          >
            {formatSecret(setup.secret)}
          </p>
          <button
            type="button"
            onClick={onCopy}
            className={[
              'mt-3 text-sm text-white/70 underline underline-offset-4 transition-colors',
              'hover:text-white focus-visible:text-white focus-visible:outline-none',
            ].join(' ')}
          >
            {copied ? 'Copied' : 'Copy setup key'}
          </button>
        </div>
      </details>
    </div>
  )
}

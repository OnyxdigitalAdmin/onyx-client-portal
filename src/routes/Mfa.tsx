import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthenticatingScreen } from '../components/AuthenticatingScreen'
import { Button } from '../components/Button'
import { CODE_LENGTH, CodeInput } from '../components/CodeInput'
import { ErrorNote } from '../components/ErrorNote'
import { LoginShell, StepCard } from '../components/LoginShell'
import { useIsHandheld } from '../hooks/useIsHandheld'
import type { MfaSetup } from '../lib/mfa'
import { formatSecret, hasSatisfiedMfa, prepareMfa, verifyMfaCode } from '../lib/mfa'
import { supabase } from '../lib/supabaseClient'

type Phase = 'preparing' | 'ready' | 'verifying'

/**
 * Step three of three: the second factor.
 *
 * Enrolment and verification share this screen because they end the same way:
 * a correct 6-digit code. Supabase treats verifying a freshly enrolled factor
 * as confirming it, so a first-time user needs no extra step to finish.
 *
 * A session that has already cleared MFA never renders this at all — it is
 * redirected below — which is why the step indicator can safely say three.
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
  // The panel is held exactly as it will look, so nothing moves the moment
  // the factors come back.
  if (phase === 'preparing') return <LoginShell step={3} />

  if (blocked) {
    return (
      <LoginShell step={3}>
        <div className="mt-5 max-w-[360px]">
          {/* Not an ErrorNote: enrolment failing to start is a systems problem,
              not a rejected attempt. It gets stated plainly on the field rather
              than plated in red — the wrong code still gets the Error note. */}
          <p aria-live="polite" className="text-[1.375rem] leading-snug text-white">
            {blocked}
          </p>
          <Button
            type="button"
            className="mt-6 w-full sm:w-40"
            onClick={() => {
              void supabase.auth.signOut().then(() => navigate('/login', { replace: true }))
            }}
          >
            Back to sign in
          </Button>
        </div>
      </LoginShell>
    )
  }

  const enrolling = setup?.kind === 'enroll'

  return (
    <LoginShell step={3}>
      <StepCard
        title={enrolling ? 'Set up your authenticator.' : 'Verification code'}
        blurb={
          enrolling
            ? 'Onyx requires an authenticator app on every account. Add the portal to yours, then enter the code it shows.'
            : 'Enter the 6-digit code from your authenticator app.'
        }
      >
        {setup?.kind === 'enroll' ? (
          <EnrollmentAid setup={setup} handheld={handheld} copied={copied} onCopy={copySecret} />
        ) : null}

        {error ? (
          <div className="mt-5">
            <ErrorNote>{error}</ErrorNote>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-[18px]">
          <CodeInput label="6-digit code" value={code} onChange={setCode} />
          <Button type="submit" disabled={code.length !== CODE_LENGTH} className="w-full sm:w-40">
            {enrolling ? 'Confirm and continue' : 'Verify'}
          </Button>
        </form>
      </StepCard>
    </LoginShell>
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
    <div className="mt-6">
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
            width={118}
            height={118}
            className="size-[118px] rounded-[10px] bg-white p-[9px]"
          />
        </div>
      )}

      <details className="mt-[22px] border-t border-white/25 pt-[18px]">
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

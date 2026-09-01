import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import bunnyArt from '../assets/login-tribunny.png'
import brandWordmark from '../../brand/logos/onyx-digital-text-logo-with-bunnies-transparent.png'
import { Button } from '../components/Button'
import { ErrorNote } from '../components/ErrorNote'
import { Field } from '../components/Field'
import { LoginCarousel } from '../components/LoginCarousel'
import { supabase } from '../lib/supabaseClient'

/**
 * Router state carried in from a sign-out.
 *
 * `notice` and `error` are deliberately separate: being signed out for
 * inactivity is expected and gets calm neutral text, while a broken account
 * link is a real failure and gets the Error treatment (the No-Alarm Rule).
 */
export type LoginState = { notice?: string; error?: string }

/**
 * Sign-in: an email address, and nothing else.
 *
 * There is no password field. Submitting mails a one-time code, which the
 * verify screen takes, and the authenticator step then follows exactly as
 * before. `shouldCreateUser: false` is the load-bearing option — accounts are
 * provisioned by Onyx at kickoff, and there is no self-serve signup, ever.
 */
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const handoff = (location.state ?? null) as LoginState | null

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(handoff?.error ?? null)
  const [submitting, setSubmitting] = useState(false)

  const notice = error ? null : (handoff?.notice ?? null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const address = email.trim()
    setSubmitting(true)
    setError(null)

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: false },
    })

    if (otpError) {
      // Deliberately not "no such account" — that would confirm whether an
      // address belongs to a client of ours.
      setError('We couldn’t send a code to that address. Please check it and try again.')
      setSubmitting(false)
      return
    }

    navigate('/verify', { state: { email: address } })
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,30rem)_1fr]">
      <div className="relative isolate flex flex-col overflow-hidden bg-primary-dark px-6 py-10 sm:px-10">
        {/* Pinned to the foot of the panel and heavily faded, so it never sits
            behind the form. Deliberately wider than the panel: the right-hand
            bunnies are meant to clip at the fold, which is what the panel's
            overflow-hidden and isolate above are for. */}
        <img
          src={bunnyArt}
          alt=""
          aria-hidden="true"
          className={[
            'pointer-events-none absolute -left-[6%] -bottom-[2%] -z-10 w-[132%] max-w-none',
            'opacity-[0.28] select-none lg:-bottom-[4%] lg:w-[124%]',
          ].join(' ')}
        />

        <img
          src={brandWordmark}
          alt="Onyx Digital"
          draggable={false}
          className="w-[clamp(200px,60%,260px)] select-none"
        />

        {/* Centred in the panel on a handset, where the form is the whole
            screen; anchored below the wordmark once the carousel appears. */}
        <div className="flex flex-1 items-center lg:mt-16 lg:flex-none lg:items-start">
          <div className="w-full max-w-[26rem]">
            {/* The one headline in the system that takes Bold and normal tracking
                — a named exception to the One Weight and Fixed-Copy Tracking
                rules, recorded in DESIGN.md. It is the front door, not a pattern. */}
            <h1 className="text-2xl font-bold tracking-normal text-white">Sign in</h1>

            {/* An inactivity sign-out is expected, not a failure, so it stays in
                the calm neutral register rather than the Error one. */}
            {notice ? (
              <p className="mt-6 rounded-xl border border-white/25 bg-white/[0.06] px-4 py-3 text-sm leading-snug text-white/80">
                {notice}
              </p>
            ) : null}

            {error ? (
              <div className="mt-6">
                <ErrorNote>{error}</ErrorNote>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-6" noValidate>
              {/* Full white at body size, not the 0.875rem/85% card label: this
                  label sits alone on the field with nothing around it to borrow
                  legibility from. White on primary-dark clears 11.9:1. */}
              <Field
                label="Email"
                labelClassName="text-base text-white"
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                autoFocus
                disabled={submitting}
                placeholder="you@yourfirm.com"
              />

              <Button type="submit" disabled={submitting} className="w-full sm:w-40">
                {submitting ? 'Sending…' : 'Log in'}
              </Button>
            </form>

            {/* Accounts are provisioned by Onyx at kickoff — there is no
                self-serve signup, so the way back in is a person. */}
            <p className="mt-10 text-xs leading-relaxed text-white">
              Accounts are set up by Onyx Digital. If you’re locked out, contact{' '}
              <a
                href="mailto:info@onyxdigitalsecurity.com"
                className={[
                  'rounded text-inherit no-underline underline-offset-2 transition-all hover:underline',
                  'outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark',
                ].join(' ')}
              >
                info@onyxdigitalsecurity.com
              </a>
              </p>
          </div>
        </div>
      </div>

      {/* Desktop only. On a handset the panel would be a second screenful
          below the form, which nobody scrolls to before signing in. */}
      <div className="hidden lg:block">
        <LoginCarousel />
      </div>
    </div>
  )
}

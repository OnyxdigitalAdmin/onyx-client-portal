import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { ErrorNote } from '../components/ErrorNote'
import { Field } from '../components/Field'
import { LoginShell } from '../components/LoginShell'
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
 * Step one of three: an email address, and nothing else.
 *
 * There is no password field. Submitting mails a one-time code, which the
 * verify screen takes, and the authenticator step then follows exactly as
 * before. `shouldCreateUser: false` is the load-bearing option — accounts are
 * provisioned by Onyx at kickoff, and there is no self-serve signup, ever.
 *
 * The front door is bare on the field rather than on a step card: starting is
 * not the same act as resuming.
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
    <LoginShell step={1}>
      <div className="mt-5">
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
      </div>
    </LoginShell>
  )
}

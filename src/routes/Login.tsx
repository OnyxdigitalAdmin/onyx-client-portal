import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BrandField } from '../components/BrandField'
import { Button } from '../components/Button'
import { ErrorNote } from '../components/ErrorNote'
import { Field } from '../components/Field'
import { supabase } from '../lib/supabaseClient'

/**
 * Router state carried in from a sign-out.
 *
 * `notice` and `error` are deliberately separate: being signed out for
 * inactivity is expected and gets calm neutral text, while a broken account
 * link is a real failure and gets the Error treatment (the No-Alarm Rule).
 */
export type LoginState = { notice?: string; error?: string }

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const handoff = (location.state ?? null) as LoginState | null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(handoff?.error ?? null)
  const [submitting, setSubmitting] = useState(false)

  const notice = error ? null : (handoff?.notice ?? null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      // Deliberately does not say which half was wrong — that would confirm
      // whether an address belongs to a client of ours.
      setError('That email or password isn’t right. Please try again.')
      setPassword('')
      setSubmitting(false)
      return
    }

    navigate('/mfa', { replace: true })
  }

  return (
    <BrandField compact mark="wordmark">
      <div className="mt-10 w-full max-w-[26rem]">
        <div className="rounded-3xl border border-white/20 bg-white/[0.04] p-7 sm:p-9">
          {/* The one headline in the system that takes Bold and normal tracking
              — a named exception to the One Weight and Fixed-Copy Tracking
              rules, recorded in DESIGN.md. It is the front door, not a pattern. */}
          <h1 className="text-2xl font-bold tracking-normal text-white">Log In.</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            Your compliance and insurance-readiness portal.
          </p>

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

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5" noValidate>
            <Field
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              disabled={submitting}
              placeholder="you@yourfirm.com"
            />

            <Field
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={submitting}
            />

            <Button type="submit" disabled={submitting} className="mt-1 w-full">
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        {/* Accounts are provisioned by Onyx at kickoff — there is no self-serve
            signup and no self-serve reset, so the way back in is a person, and
            the address has to be legible: full white rather than the fine-print
            60%. The link inherits its colour so it reads identically at rest. */}
        <p className="mt-6 px-2 text-center text-xs leading-relaxed text-white">
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
    </BrandField>
  )
}

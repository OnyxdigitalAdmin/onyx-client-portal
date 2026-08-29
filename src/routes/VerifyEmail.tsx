import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthenticatingScreen } from '../components/AuthenticatingScreen'
import { BrandField } from '../components/BrandField'
import { Button } from '../components/Button'
import { CODE_LENGTH, CodeInput } from '../components/CodeInput'
import { ErrorNote } from '../components/ErrorNote'
import { supabase } from '../lib/supabaseClient'

/**
 * The emailed sign-in code, between the email field and the authenticator.
 *
 * Passwordless sign-in makes this the first factor rather than an extra step:
 * the code proves the address, and the authenticator screen that follows
 * proves the person. The card is the authenticator screen's card, unchanged,
 * so the two read as one sequence.
 */
export default function VerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resent, setResent] = useState(false)

  // Arriving here without an address (a refresh, a bookmark) means there is no
  // code in flight to verify — start again rather than ask for one blindly.
  if (!email) return <Navigate to="/login" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || code.length !== CODE_LENGTH) return

    setSubmitting(true)
    setError(null)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email as string,
      token: code,
      type: 'email',
    })

    if (verifyError) {
      setError('That code isn’t right, or it has expired. Check the latest email and try again.')
      setCode('')
      setSubmitting(false)
      return
    }

    navigate('/mfa', { replace: true })
  }

  async function resend() {
    setResent(false)
    setError(null)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email as string,
      options: { shouldCreateUser: false },
    })
    if (otpError) setError('We couldn’t send another code just now. Please try again in a moment.')
    else setResent(true)
  }

  if (submitting) return <AuthenticatingScreen />

  return (
    <BrandField compact>
      <div className="mt-10 w-full max-w-[26rem]">
        <div className="rounded-3xl border border-white/20 bg-white/[0.04] p-7 sm:p-9">
          <h1 className="text-2xl tracking-brand text-white">Check your email.</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            We sent a 6-digit code to {email}. Enter it below to continue.
          </p>

          {error ? (
            <div className="mt-6">
              <ErrorNote>{error}</ErrorNote>
            </div>
          ) : null}

          {resent && !error ? (
            <p className="mt-6 rounded-xl border border-white/25 bg-white/[0.06] px-4 py-3 text-sm leading-snug text-white/80">
              A new code is on its way.
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
            <CodeInput label="6-digit code" value={code} onChange={setCode} />
            <Button type="submit" disabled={code.length !== CODE_LENGTH} className="w-full">
              Continue
            </Button>
          </form>

          <button
            type="button"
            onClick={() => void resend()}
            className={[
              'mt-6 text-sm text-white/70 underline underline-offset-4 transition-colors',
              'hover:text-white focus-visible:text-white focus-visible:outline-none',
            ].join(' ')}
          >
            Send another code
          </button>
        </div>
      </div>
    </BrandField>
  )
}

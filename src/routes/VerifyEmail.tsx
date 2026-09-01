import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthenticatingScreen } from '../components/AuthenticatingScreen'
import { Button } from '../components/Button'
import { CODE_LENGTH, CodeInput } from '../components/CodeInput'
import { ErrorNote } from '../components/ErrorNote'
import { LoginShell, StepCard } from '../components/LoginShell'
import { supabase } from '../lib/supabaseClient'

/** This step's own low-emphasis actions, beneath its form. */
const stepLink = [
  'rounded text-sm text-white/80 underline underline-offset-4 transition-colors',
  'hover:text-white focus-visible:text-white focus-visible:outline-none',
  'focus-visible:ring-2 focus-visible:ring-white/60',
].join(' ')

/**
 * Step two of three: the emailed sign-in code.
 *
 * Passwordless sign-in makes this the first factor rather than an extra step:
 * the code proves the address, and the authenticator screen that follows
 * proves the person. It renders in the same panel as the email step, beside
 * the same carousel, so the three read as one sequence rather than three
 * screens — but it stays its own route, which is what keeps the guard below,
 * the back button and a refresh all behaving.
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

    // A rejected code holds this step rather than advancing it. The step only
    // moves on a verified one.
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
    <LoginShell step={2}>
      <StepCard
        title="Check your email."
        blurb={`We sent a 6-digit code to ${email}. Enter it below to continue.`}
      >
        {error ? (
          <div className="mt-5">
            <ErrorNote>{error}</ErrorNote>
          </div>
        ) : null}

        {resent && !error ? (
          <p className="mt-5 rounded-xl border border-white/25 bg-white/[0.06] px-4 py-3 text-sm leading-snug text-white/80">
            A new code is on its way.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-[26px] flex flex-col gap-[18px]">
          <CodeInput label="6-digit code" value={code} onChange={setCode} />
          <Button type="submit" disabled={code.length !== CODE_LENGTH} className="w-full sm:w-40">
            Continue
          </Button>
        </form>

        <div className="mt-[22px] flex flex-wrap gap-5">
          <button type="button" onClick={() => void resend()} className={stepLink}>
            Send another code
          </button>
          {/* Replaces rather than pushes: the way back to step one is this
              link, and leaving a dead /verify entry behind it only gives the
              back button somewhere useless to go. */}
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className={stepLink}
          >
            Use a different email
          </button>
        </div>
      </StepCard>
    </LoginShell>
  )
}

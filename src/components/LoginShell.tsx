import type { ReactNode } from 'react'
import bunnyArt from '../assets/login-tribunny.png'
import brandWordmark from '../../brand/logos/onyx-digital-text-logo-with-bunnies-transparent.png'
import { LoginCarousel } from './LoginCarousel'

/** Email, then the emailed code, then the authenticator. */
const AUTH_STEPS = 3

/**
 * The sign-in frame, shared by all three steps of getting in.
 *
 * The three steps stay three routes — /login, /verify, /mfa — so the guards,
 * the back button, a refresh and an emailed link all keep working exactly as
 * they did. What changed is only what each route *renders*: one panel, one
 * carousel, and a step indicator, with the step itself passed in. Nothing
 * about the auth logic moved.
 *
 * The carousel never changes and never resizes between steps, which is the
 * point — the right half of the screen is a fixed thing you are signing in
 * beside, not part of the form.
 */
export function LoginShell({ step, children }: { step: number; children?: ReactNode }) {
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
            <StepDots step={step} />

            {children}

            {/* Present on every step, not just the first: being stuck is most
                likely at the code, which is the step furthest from this note.
                Accounts are provisioned by Onyx at kickoff — there is no
                self-serve signup, so the way back in is a person. */}
            <p className="mt-8 text-xs leading-[1.7] text-white">
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

/**
 * Where you are in the sequence.
 *
 * Always three, never a dynamic count: a session that has already cleared its
 * second factor is redirected away before this renders, so a step the client
 * can actually see is never skipped.
 */
function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2.5">
      {Array.from({ length: AUTH_STEPS }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`block h-1 w-8 rounded-full ${index < step ? 'bg-white' : 'bg-white/30'}`}
        />
      ))}
      {/* The words carry the state; the pills are decoration on top of them. */}
      <span className="ms-1.5 text-xs text-white/70">
        Step {step} of {AUTH_STEPS}
      </span>
    </div>
  )
}

/**
 * A step that asks for something rather than starting something.
 *
 * The email step is bare on the field — it is the front door. The two code
 * steps sit on this slightly lifted panel instead, which is what separates
 * "begin" from "you are part-way through".
 */
export function StepCard({ title, blurb, children }: { title: string; blurb: string; children: ReactNode }) {
  return (
    <div className="mt-4 max-w-[360px] rounded-[14px] bg-step-card p-[18px] sm:p-[22px]">
      <h1 className="text-xl tracking-[-0.04em] text-white">{title}</h1>
      <p className="mt-2 text-[13px] leading-[1.55] text-white/72">{blurb}</p>
      {children}
    </div>
  )
}

import { useEffect, useRef } from 'react'

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

type SessionTimeoutModalProps = {
  secondsLeft: number
  onStaySignedIn: () => void
}

/**
 * The idle-session warning.
 *
 * The countdown uses Attention amber, not Error red: an idle session about to
 * end is an expected state, not a failure (the No-Alarm Rule in DESIGN.md).
 * Native <dialog> gives the focus trap and inert background for free; Escape
 * is suppressed so the only way out is the explicit button.
 */
export function SessionTimeoutModal({ secondsLeft, onStaySignedIn }: SessionTimeoutModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => event.preventDefault()}
      aria-labelledby="session-timeout-title"
      className={[
        'm-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-border',
        'bg-background p-7 text-text shadow-xl',
        'backdrop:bg-text/65',
      ].join(' ')}
    >
      <h2 id="session-timeout-title" className="text-xl tracking-brand">
        Still there?
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-text/75">
        You&rsquo;ve been idle for a while. For your security we&rsquo;ll sign you out in{' '}
        <span className="tabular-nums text-attention" aria-hidden="true">
          {formatCountdown(secondsLeft)}
        </span>
        <span className="sr-only">{secondsLeft} seconds</span>.
      </p>

      {/* Announces roughly every 15s rather than every tick, so screen readers
          aren't flooded by a 90-second countdown. */}
      <span aria-live="polite" className="sr-only">
        {secondsLeft % 15 === 0 && secondsLeft > 0
          ? `Signing out in ${secondsLeft} seconds`
          : ''}
      </span>

      <button
        type="button"
        autoFocus
        onClick={onStaySignedIn}
        className={[
          'mt-6 w-full rounded-full bg-primary px-6 py-3 text-white',
          'transition-colors outline-none hover:bg-primary-dark',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'focus-visible:ring-offset-background',
        ].join(' ')}
      >
        Stay signed in
      </button>
    </dialog>
  )
}
